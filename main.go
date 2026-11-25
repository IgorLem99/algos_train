// AlgoTrain — тренажёр алгоритмов с интервальным повторением, редактором кода
// и автоматической проверкой решений на Go.
//
// Локально:   go run .                      (http://127.0.0.1:7341, SQLite в data/)
// Продакшен:  docker compose up -d          (см. DEPLOY.md)
//
// Режимы:
//
//	algotrain                    веб-приложение
//	algotrain -mode runner       сервис проверки решений (запускать в изолированном контейнере)
//	algotrain -check [id]        все эталонные решения компилируются
//	algotrain -check-judge [id]  все эталонные решения проходят тесты
package main

import (
	"context"
	"embed"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

//go:embed web content
var embedded embed.FS

// Config — настройки из переменных окружения (флаги переопределяют часть из них).
type Config struct {
	Mode           string
	Addr           string
	DatabaseURL    string
	RunnerURL      string
	RunnerToken    string
	RunnerWorkers  int
	GoCacheLimitMB int
	CookieSecure   bool
	TrustProxy     bool
	AllowSignup    bool
	AdminEmails    map[string]bool
	RunsPerMinute  int
	Root           string
}

func envStr(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func envBool(k string, def bool) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(k))) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	}
	return def
}

func loadConfig() Config {
	c := Config{
		Mode:           envStr("MODE", "app"),
		Addr:           envStr("ADDR", ""),
		DatabaseURL:    envStr("DATABASE_URL", "sqlite://data/algotrain.db"),
		RunnerURL:      strings.TrimRight(envStr("RUNNER_URL", ""), "/"),
		RunnerToken:    envStr("RUNNER_TOKEN", ""),
		RunnerWorkers:  envIntDef("RUNNER_WORKERS", 0),
		GoCacheLimitMB: envIntDef("GOCACHE_LIMIT_MB", 2048),
		CookieSecure:   envBool("COOKIE_SECURE", false),
		TrustProxy:     envBool("TRUST_PROXY", false),
		AllowSignup:    envBool("ALLOW_SIGNUP", true),
		RunsPerMinute:  envIntDef("RUNS_PER_MINUTE", 20),
		AdminEmails:    map[string]bool{},
		Root:           ".",
	}
	for _, e := range strings.Split(os.Getenv("ADMIN_EMAILS"), ",") {
		if e = normEmail(e); e != "" {
			c.AdminEmails[e] = true
		}
	}
	return c
}

func main() {
	cfg := loadConfig()
	flag.StringVar(&cfg.Mode, "mode", cfg.Mode, "app | runner")
	flag.StringVar(&cfg.Addr, "addr", cfg.Addr, "адрес HTTP-сервера (по умолчанию 127.0.0.1:7341, раннер — :8081)")
	flag.StringVar(&cfg.Root, "root", cfg.Root, "корень проекта: если там есть content/ и web/, они читаются с диска")
	flag.StringVar(&cfg.DatabaseURL, "db", cfg.DatabaseURL, "postgres://… или sqlite://путь")
	check := flag.Bool("check", false, "проверить, что все Go-решения компилируются (аргумент — префикс id)")
	checkJudge := flag.Bool("check-judge", false, "прогнать эталонные решения через тесты (аргумент — префикс id или файл тестов)")
	healthcheck := flag.Bool("healthcheck", false, "проверить /healthz запущенного сервера (для Docker HEALTHCHECK)")
	flag.Parse()
	if *healthcheck {
		os.Exit(runHealthcheck(cfg.Addr))
	}

	var lh slog.Handler
	if envStr("LOG_FORMAT", "text") == "json" {
		lh = slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: logLevel()})
	} else {
		lh = slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: logLevel()})
	}
	slog.SetDefault(slog.New(lh))

	switch {
	case *checkJudge:
		os.Exit(runJudgeCheck(cfg.Root, flag.Arg(0)))
	case *check:
		os.Exit(runCheck(cfg.Root, flag.Arg(0)))
	}
	var err error
	if cfg.Mode == "runner" {
		if cfg.Addr == "" {
			cfg.Addr = ":8081"
		}
		err = runRunner(cfg)
	} else {
		if cfg.Addr == "" {
			cfg.Addr = "127.0.0.1:7341"
		}
		err = runApp(cfg)
	}
	if err != nil {
		slog.Error("завершение с ошибкой", "err", err)
		os.Exit(1)
	}
}

func logLevel() slog.Level {
	switch strings.ToLower(os.Getenv("LOG_LEVEL")) {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	}
	return slog.LevelInfo
}

func isDir(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.IsDir()
}

func runApp(cfg Config) error {
	ctx := context.Background()
	// контент и фронтенд: с диска, если запускаемся из папки проекта (правки видны
	// сразу), иначе — встроенные в бинарник
	var cfs contentFS
	if d := filepath.Join(cfg.Root, "content"); isDir(d) {
		cfs = newContentFS(d, true)
	} else {
		sub, _ := fs.Sub(embedded, "content")
		cfs = contentFS{fsys: sub}
	}
	webDisk := ""
	if d := filepath.Join(cfg.Root, "web"); isDir(d) {
		webDisk = d
	}
	webFS, _ := fs.Sub(embedded, "web")
	static, err := newStaticFiles(webFS, webDisk)
	if err != nil {
		return err
	}

	store, err := OpenStore(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer store.Close()

	var ex Executor
	if cfg.RunnerURL != "" {
		ex = NewRemoteExecutor(cfg.RunnerURL, cfg.RunnerToken)
		slog.Info("проверка решений через раннер", "url", cfg.RunnerURL)
	} else {
		le, err := NewLocalExecutor(cfg.RunnerWorkers)
		if err != nil {
			slog.Warn("проверка решений недоступна", "err", err)
			ex = unavailableExecutor{err}
		} else {
			if !le.sandbox && !isLoopback(cfg.Addr) {
				slog.Warn("ВНИМАНИЕ: решения выполняются без изоляции, а сервер слушает внешний адрес. " +
					"В интернете используйте отдельный раннер (RUNNER_URL), см. DEPLOY.md")
			}
			slog.Info("проверка решений локально", "info", le.Info())
			ex = le
		}
	}

	app := NewApp(cfg, store, ex, cfs, static)
	if _, err := app.content.get(ctx); err != nil {
		return err
	}
	go func() {
		for range time.Tick(time.Hour) {
			if n, err := store.DeleteExpiredSessions(context.Background()); err == nil && n > 0 {
				slog.Info("удалены истёкшие сессии", "n", n)
			}
		}
	}()
	slog.Info("AlgoTrain запущен", "url", "http://"+strings.Replace(cfg.Addr, "0.0.0.0", "localhost", 1),
		"db", store.Kind(), "content_from_disk", cfs.disk, "web_from_disk", webDisk != "")
	return serve(cfg.Addr, app.Handler(), 120*time.Second)
}

func isLoopback(addr string) bool {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return false
	}
	ip := net.ParseIP(host)
	return host == "localhost" || (ip != nil && ip.IsLoopback())
}

type unavailableExecutor struct{ err error }

func (u unavailableExecutor) Run(context.Context, RunRequest) (*RunResult, error) {
	return nil, fmt.Errorf("проверка решений не настроена: %w", u.err)
}

// ---------- добавление задач через интерфейс (только администратор) ----------

type newProblem struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Difficulty  string   `json:"difficulty"`
	Category    string   `json:"category"`
	URL         string   `json:"url"`
	LeetCode    int      `json:"leetcode"`
	Lists       []string `json:"lists"`
	Algorithms  []string `json:"algorithms"`
	Description string   `json:"description"`
	Solutions   []struct {
		Title       string `json:"title"`
		Explanation string `json:"explanation"`
		Code        string `json:"code"`
	} `json:"solutions"`
	Starter   string `json:"starter"`
	Tests     string `json:"tests"`
	Overwrite bool   `json:"overwrite"`
}

var slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,80}$`)

func oneLine(s string) string {
	return strings.TrimSpace(strings.NewReplacer("\n", " ", "\r", " ").Replace(s))
}

func (a *App) handleAddProblem(w http.ResponseWriter, r *http.Request) {
	var p newProblem
	if !readJSON(w, r, &p, 1<<20) {
		return
	}
	if !slugRe.MatchString(p.ID) {
		httpErr(w, 400, "id должен быть slug: строчные латинские буквы, цифры и дефисы")
		return
	}
	if strings.TrimSpace(p.Title) == "" {
		httpErr(w, 400, "нужно название")
		return
	}
	c, err := a.content.get(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	c.mu.RLock()
	for _, ex := range c.data.Problems {
		if ex.ID == p.ID && !(p.Overwrite && ex.Custom) {
			c.mu.RUnlock()
			httpErr(w, 409, "задача с таким id уже есть")
			return
		}
	}
	c.mu.RUnlock()
	var b strings.Builder
	b.WriteString("---\n")
	fmt.Fprintf(&b, "id: %s\n", p.ID)
	fmt.Fprintf(&b, "title: %s\n", oneLine(p.Title))
	fmt.Fprintf(&b, "difficulty: %s\n", oneLine(p.Difficulty))
	fmt.Fprintf(&b, "category: %s\n", oneLine(p.Category))
	if p.LeetCode > 0 {
		fmt.Fprintf(&b, "leetcode: %d\n", p.LeetCode)
	}
	if p.URL != "" {
		fmt.Fprintf(&b, "url: %s\n", oneLine(p.URL))
	}
	fmt.Fprintf(&b, "lists: %s\n", oneLine(strings.Join(p.Lists, ", ")))
	fmt.Fprintf(&b, "algorithms: %s\n", oneLine(strings.Join(p.Algorithms, ", ")))
	b.WriteString("---\n")
	b.WriteString(strings.TrimSpace(p.Description) + "\n")
	for _, sol := range p.Solutions {
		if strings.TrimSpace(sol.Code) == "" && strings.TrimSpace(sol.Explanation) == "" {
			continue
		}
		title := oneLine(sol.Title)
		if title == "" {
			title = "Решение"
		}
		fmt.Fprintf(&b, "\n### %s\n", title)
		if e := strings.TrimSpace(sol.Explanation); e != "" {
			b.WriteString(e + "\n")
		}
		b.WriteString("\n```go\n" + strings.TrimRight(sol.Code, "\n ") + "\n```\n")
	}
	judge := ""
	if strings.TrimSpace(p.Tests) != "" {
		judge = "```go starter\n" + strings.TrimRight(p.Starter, "\n ") + "\n```\n\n```go tests\n" + strings.TrimRight(p.Tests, "\n ") + "\n```\n"
	}
	err = a.store.PutCustomProblem(r.Context(), customDoc{ID: p.ID, Doc: b.String(), Judge: judge}, currentUser(r).ID, p.Overwrite)
	if errors.Is(err, ErrExists) {
		httpErr(w, 409, "задача с таким id уже есть")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	a.content.invalidate()
	writeJSON(w, 200, map[string]string{"ok": "true", "id": p.ID})
}

func (a *App) handleDeleteProblem(w http.ResponseWriter, r *http.Request) {
	if err := a.store.DeleteCustomProblem(r.Context(), r.PathValue("id")); err != nil {
		a.fail(w, r, err)
		return
	}
	a.content.invalidate()
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func runHealthcheck(addr string) int {
	if addr == "" {
		addr = ":8080"
	}
	_, port, err := net.SplitHostPort(addr)
	if err != nil {
		return 1
	}
	c := &http.Client{Timeout: 4 * time.Second}
	resp, err := c.Get("http://127.0.0.1:" + port + "/healthz")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	resp.Body.Close()
	if resp.StatusCode != 200 {
		return 1
	}
	return 0
}
