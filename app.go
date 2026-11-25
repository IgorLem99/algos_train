package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

// App — веб-приложение: API + статика.
type App struct {
	cfg        Config
	store      *Store
	exec       Executor
	content    *contentCache
	static     *staticFiles
	sessions   *sessionCache
	authLimit  *rateLimiter // регистрация/вход с одного IP
	loginLimit *rateLimiter // попытки входа на один email
	runLimit   *rateLimiter // запуски решений одним пользователем
	running    sync.Map     // userID → идёт проверка (не больше одной на пользователя)
}

func NewApp(cfg Config, store *Store, ex Executor, cfs contentFS, static *staticFiles) *App {
	a := &App{
		cfg:        cfg,
		store:      store,
		exec:       ex,
		static:     static,
		sessions:   &sessionCache{m: map[string]cachedSession{}},
		authLimit:  newRateLimiter(20, 10),
		loginLimit: newRateLimiter(10, 10),
		runLimit:   newRateLimiter(cfg.RunsPerMinute, max(5, cfg.RunsPerMinute/2)),
	}
	a.content = &contentCache{fsys: cfs, store: store}
	return a
}

func (a *App) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", a.handleHealth)

	mux.HandleFunc("GET /api/content", a.handleContent)
	mux.HandleFunc("POST /api/auth/register", a.handleRegister)
	mux.HandleFunc("POST /api/auth/login", a.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", a.handleLogout)
	mux.HandleFunc("GET /api/me", a.handleMe)
	mux.HandleFunc("PATCH /api/me", a.auth(a.handleUpdateMe))

	mux.HandleFunc("GET /api/progress", a.auth(a.handleGetProgress))
	mux.HandleFunc("PUT /api/progress", a.auth(a.handlePutProgress))
	mux.HandleFunc("GET /api/drafts/{id}", a.auth(a.handleGetDraft))
	mux.HandleFunc("PUT /api/drafts/{id}", a.auth(a.handlePutDraft))
	mux.HandleFunc("POST /api/run/{id}", a.auth(a.handleRun))
	mux.HandleFunc("GET /api/submissions", a.auth(a.handleListSubmissions))
	mux.HandleFunc("GET /api/submissions/summary", a.auth(a.handleSubmissionSummary))
	mux.HandleFunc("GET /api/submissions/{sid}", a.auth(a.handleGetSubmission))
	mux.HandleFunc("POST /api/problems", a.admin(a.handleAddProblem))
	mux.HandleFunc("DELETE /api/problems/{id}", a.admin(a.handleDeleteProblem))
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) { httpErr(w, 404, "нет такого метода API") })

	mux.Handle("/", a.static)
	return a.middleware(mux)
}

// ---------- middleware ----------

const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
	"connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"

type statusWriter struct {
	http.ResponseWriter
	code int
}

func (w *statusWriter) WriteHeader(c int) { w.code = c; w.ResponseWriter.WriteHeader(c) }

func (a *App) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, code: 200}
		defer func() {
			if p := recover(); p != nil {
				if p == http.ErrAbortHandler {
					panic(p)
				}
				slog.Error("panic", "path", r.URL.Path, "err", p, "stack", string(debug.Stack()))
				httpErr(sw, 500, "внутренняя ошибка сервера")
			}
			if strings.HasPrefix(r.URL.Path, "/api/") {
				lvl := slog.LevelDebug
				if sw.code >= 500 {
					lvl = slog.LevelError
				} else if r.Method != "GET" || sw.code >= 400 {
					lvl = slog.LevelInfo
				}
				slog.Log(r.Context(), lvl, "http", "method", r.Method, "path", r.URL.Path, "status", sw.code,
					"ms", time.Since(start).Milliseconds(), "ip", a.clientIP(r))
			}
		}()
		h := sw.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "same-origin")
		h.Set("Content-Security-Policy", csp)
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			h.Set("Cache-Control", "no-store")
			// CSRF: изменяющие запросы принимаются только от нашего фронтенда — браузер не
			// отправит кастомный заголовок на чужой сайт без CORS, а CORS мы не разрешаем.
			if r.Method != "GET" && r.Method != "HEAD" && r.Header.Get("X-Requested-With") != "AlgoTrain" {
				httpErr(sw, 403, "запрос отклонён (CSRF)")
				return
			}
			r = a.authenticate(r)
		}
		next.ServeHTTP(sw, r)
	})
}

func (a *App) auth(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if currentUser(r) == nil {
			httpErr(w, 401, "нужно войти")
			return
		}
		h(w, r)
	}
}

func (a *App) admin(h http.HandlerFunc) http.HandlerFunc {
	return a.auth(func(w http.ResponseWriter, r *http.Request) {
		if !currentUser(r).Admin {
			httpErr(w, 403, "только для администратора")
			return
		}
		h(w, r)
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func httpErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func (a *App) fail(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, context.Canceled) {
		return
	}
	slog.Error("ошибка", "path", r.URL.Path, "err", err)
	httpErr(w, 500, "внутренняя ошибка сервера")
}

func readJSON(w http.ResponseWriter, r *http.Request, v any, limit int64) bool {
	r.Body = http.MaxBytesReader(w, r.Body, limit)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(v); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			httpErr(w, 413, "слишком большой запрос")
		} else {
			httpErr(w, 400, "некорректный JSON: "+err.Error())
		}
		return false
	}
	return true
}

func (a *App) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := a.store.Ping(ctx); err != nil {
		httpErr(w, 503, "db: "+err.Error())
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// ---------- контент ----------

// contentCache хранит собранный JSON контента (и его gzip) в памяти.
// Пересборка — когда изменились файлы (локальная разработка) или задачи в БД.
type contentCache struct {
	fsys  contentFS
	store *Store

	mu        sync.RWMutex
	data      *Content
	judge     map[string]JudgeSpec
	raw, gz   []byte
	etag      string
	stamp     string
	customVer string
	checked   time.Time
	rebuildMu sync.Mutex
}

func (c *contentCache) get(ctx context.Context) (*contentCache, error) {
	every := 20 * time.Second
	if c.fsys.disk {
		every = 2 * time.Second
	}
	c.mu.RLock()
	fresh := c.data != nil && time.Since(c.checked) < every
	c.mu.RUnlock()
	if fresh {
		return c, nil
	}
	c.rebuildMu.Lock()
	defer c.rebuildMu.Unlock()
	c.mu.RLock()
	fresh = c.data != nil && time.Since(c.checked) < every
	c.mu.RUnlock()
	if fresh {
		return c, nil
	}
	stamp := ""
	if c.fsys.disk {
		stamp = c.fsys.stamp()
	}
	ver, err := c.store.CustomProblemsVersion(ctx)
	if err != nil {
		if c.data != nil {
			return c, nil // БД моргнула — отдаём то, что есть
		}
		return nil, err
	}
	if c.data != nil && stamp == c.stamp && ver == c.customVer {
		c.mu.Lock()
		c.checked = time.Now()
		c.mu.Unlock()
		return c, nil
	}
	return c, c.rebuild(ctx, stamp, ver)
}

func (c *contentCache) invalidate() {
	c.mu.Lock()
	c.checked = time.Time{}
	c.mu.Unlock()
}

func (c *contentCache) rebuild(ctx context.Context, stamp, ver string) error {
	customs, err := c.store.ListCustomProblems(ctx)
	if err != nil {
		return err
	}
	data := LoadContent(c.fsys, customs...)
	judge, errs := LoadJudge(c.fsys)
	data.Errors = append(data.Errors, errs...)
	for _, cd := range customs {
		if js := parseJudgeDoc(cd.Judge); strings.TrimSpace(js.Tests) != "" {
			js.File = "db:" + cd.ID
			judge[cd.ID] = js
		}
	}
	ids := map[string]bool{}
	for i := range data.Problems {
		p := &data.Problems[i]
		ids[p.ID] = true
		if js, ok := judge[p.ID]; ok {
			p.Starter, p.HasTests = js.Starter, true
		}
	}
	for id, js := range judge {
		if !ids[id] {
			data.Errors = append(data.Errors, fmt.Sprintf("%s: тесты для неизвестной задачи %q", js.File, id))
		}
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}
	var gz bytes.Buffer
	zw, _ := gzip.NewWriterLevel(&gz, gzip.BestCompression)
	zw.Write(raw)
	zw.Close()
	sum := sha256.Sum256(raw)
	c.mu.Lock()
	c.data, c.judge, c.raw, c.gz = data, judge, raw, gz.Bytes()
	c.etag = `"` + hex.EncodeToString(sum[:12]) + `"`
	c.stamp, c.customVer, c.checked = stamp, ver, time.Now()
	c.mu.Unlock()
	slog.Info("контент собран", "problems", len(data.Problems), "tests", len(judge), "algorithms", len(data.Algorithms), "kb", len(raw)>>10)
	for _, e := range data.Errors {
		slog.Warn("контент", "err", e)
	}
	return nil
}

func (c *contentCache) spec(id string) (Problem, JudgeSpec, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	js, ok := c.judge[id]
	if !ok {
		return Problem{}, js, false
	}
	for _, p := range c.data.Problems {
		if p.ID == id {
			return p, js, true
		}
	}
	return Problem{}, js, false
}

func (c *contentCache) hasProblem(id string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	for _, p := range c.data.Problems {
		if p.ID == id {
			return true
		}
	}
	return false
}

func (a *App) handleContent(w http.ResponseWriter, r *http.Request) {
	c, err := a.content.get(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	c.mu.RLock()
	raw, gz, etag := c.raw, c.gz, c.etag
	c.mu.RUnlock()
	serveBytes(w, r, raw, gz, etag, "application/json; charset=utf-8", "no-cache")
}

func serveBytes(w http.ResponseWriter, r *http.Request, raw, gz []byte, etag, ctype, cache string) {
	h := w.Header()
	h.Set("ETag", etag)
	h.Set("Cache-Control", cache)
	h.Set("Vary", "Accept-Encoding")
	if inm := r.Header.Get("If-None-Match"); inm != "" && strings.Contains(inm, etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	h.Set("Content-Type", ctype)
	body := raw
	if gz != nil && strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		h.Set("Content-Encoding", "gzip")
		body = gz
	}
	h.Set("Content-Length", strconv.Itoa(len(body)))
	if r.Method == "HEAD" {
		return
	}
	w.Write(body)
}

// ---------- прогресс ----------

func (a *App) handleGetProgress(w http.ResponseWriter, r *http.Request) {
	data, _, err := a.store.GetProgress(r.Context(), currentUser(r).ID)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	io.WriteString(w, data)
}

func (a *App) handlePutProgress(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<20)
	b, err := io.ReadAll(r.Body)
	if err != nil {
		httpErr(w, 413, "прогресс слишком большой")
		return
	}
	var obj map[string]json.RawMessage
	if json.Unmarshal(b, &obj) != nil {
		httpErr(w, 400, "прогресс должен быть JSON-объектом")
		return
	}
	upd, err := a.store.PutProgress(r.Context(), currentUser(r).ID, string(b))
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "updatedAt": upd})
}

// ---------- черновики ----------

func (a *App) handleGetDraft(w http.ResponseWriter, r *http.Request) {
	code, upd, err := a.store.GetDraft(r.Context(), currentUser(r).ID, r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		writeJSON(w, 200, map[string]any{"code": nil})
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"code": code, "updatedAt": upd})
}

func (a *App) handlePutDraft(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		Code string `json:"code"`
	}
	if !readJSON(w, r, &req, maxCode+4096) {
		return
	}
	if _, err := a.content.get(r.Context()); err != nil || !a.content.hasProblem(id) {
		httpErr(w, 404, "нет такой задачи")
		return
	}
	if err := a.store.PutDraft(r.Context(), currentUser(r).ID, id, req.Code); err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

// ---------- запуск решений ----------

const sampleCases = 3 // «Запустить» гоняет первые тесты (примеры из условия)

func (a *App) handleRun(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	id := r.PathValue("id")
	var req struct {
		Code string `json:"code"`
		Mode string `json:"mode"` // run | submit
	}
	if !readJSON(w, r, &req, maxCode+4096) {
		return
	}
	if len(req.Code) > maxCode {
		httpErr(w, 413, "код слишком длинный (максимум 64 КБ)")
		return
	}
	if strings.TrimSpace(req.Code) == "" {
		httpErr(w, 400, "пустой код")
		return
	}
	if _, err := a.content.get(r.Context()); err != nil {
		a.fail(w, r, err)
		return
	}
	_, spec, ok := a.content.spec(id)
	if !ok {
		httpErr(w, 404, "для этой задачи пока нет тестов")
		return
	}
	if !a.runLimit.allow(strconv.FormatInt(u.ID, 10)) {
		httpErr(w, 429, "слишком часто — подождите немного перед следующим запуском")
		return
	}
	if _, busy := a.running.LoadOrStore(u.ID, true); busy {
		httpErr(w, 429, "предыдущая проверка ещё идёт")
		return
	}
	defer a.running.Delete(u.ID)

	// черновик сохраняем при каждом запуске
	if err := a.store.PutDraft(r.Context(), u.ID, id, req.Code); err != nil {
		slog.Warn("draft", "err", err)
	}
	rr := RunRequest{Code: req.Code, Tests: spec.Tests, Types: spec.Types, TimeoutMs: 10000}
	if req.Mode != "submit" {
		rr.Limit, rr.TimeoutMs = sampleCases, 6000
	}
	res, err := a.exec.Run(r.Context(), rr)
	if errors.Is(err, ErrBusy) {
		w.Header().Set("Retry-After", "5")
		httpErr(w, 503, err.Error())
		return
	}
	if err != nil {
		if r.Context().Err() != nil {
			return
		}
		slog.Error("run", "err", err, "problem", id)
		httpErr(w, 502, "не удалось проверить решение: "+err.Error())
		return
	}
	out := map[string]any{"result": res}
	if req.Mode == "submit" {
		stored := *res
		if len(stored.Stdout) > 8<<10 {
			stored.Stdout = stored.Stdout[:8<<10] + "\n…"
		}
		rb, _ := json.Marshal(stored)
		sub := &Submission{ProblemID: id, Code: req.Code, Status: res.Status, Passed: res.Passed,
			Total: res.Total, TimeMs: res.TimeMs, Result: string(rb)}
		if err := a.store.AddSubmission(r.Context(), u.ID, sub); err != nil {
			a.fail(w, r, err)
			return
		}
		sub.Code = ""
		out["submission"] = sub
	}
	writeJSON(w, 200, out)
}

func (a *App) handleListSubmissions(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	subs, err := a.store.ListSubmissions(r.Context(), currentUser(r).ID, r.URL.Query().Get("problem"), limit)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, subs)
}

func (a *App) handleGetSubmission(w http.ResponseWriter, r *http.Request) {
	sid, err := strconv.ParseInt(r.PathValue("sid"), 10, 64)
	if err != nil {
		httpErr(w, 400, "некорректный id")
		return
	}
	s, err := a.store.GetSubmission(r.Context(), currentUser(r).ID, sid)
	if errors.Is(err, ErrNotFound) {
		httpErr(w, 404, "отправка не найдена")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, map[string]any{"submission": s, "result": json.RawMessage(s.Result)})
}

func (a *App) handleSubmissionSummary(w http.ResponseWriter, r *http.Request) {
	m, err := a.store.SubmissionSummary(r.Context(), currentUser(r).ID)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, 200, m)
}

// ---------- запуск сервера ----------

// serve запускает HTTP-сервер с таймаутами и корректным завершением по SIGTERM:
// новые соединения перестают приниматься, текущие запросы дорабатывают.
func serve(addr string, h http.Handler, writeTimeout time.Duration) error {
	srv := &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    64 << 10,
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	errc := make(chan error, 1)
	go func() { errc <- srv.ListenAndServe() }()
	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
	}
	slog.Info("останавливаюсь…")
	sctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	return srv.Shutdown(sctx)
}
