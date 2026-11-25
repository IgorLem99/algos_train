package main

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// ---------- клиент раннера ----------

// RemoteExecutor отправляет решения на отдельный сервис-раннер (`algotrain -mode runner`).
// Так недоверенный код пользователей выполняется в изолированном контейнере без
// доступа к БД и секретам приложения.
type RemoteExecutor struct {
	url    string
	token  string
	client *http.Client
}

func NewRemoteExecutor(url, token string) *RemoteExecutor {
	return &RemoteExecutor{url: url, token: token, client: &http.Client{
		Timeout: 120 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
	}}
}

func (e *RemoteExecutor) Run(ctx context.Context, req RunRequest) (*RunResult, error) {
	body, _ := json.Marshal(req)
	hr, err := http.NewRequestWithContext(ctx, "POST", e.url+"/run", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	hr.Header.Set("Content-Type", "application/json")
	hr.Header.Set("Authorization", "Bearer "+e.token)
	resp, err := e.client.Do(hr)
	if err != nil {
		return nil, fmt.Errorf("раннер недоступен: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests {
		return nil, ErrBusy
	}
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("раннер: %s: %s", resp.Status, bytes.TrimSpace(b))
	}
	var res RunResult
	if err := json.NewDecoder(io.LimitReader(resp.Body, 8<<20)).Decode(&res); err != nil {
		return nil, fmt.Errorf("раннер: %w", err)
	}
	return &res, nil
}

// ---------- сервис раннера ----------

func runRunner(cfg Config) error {
	if cfg.RunnerToken == "" {
		return errors.New("нужен RUNNER_TOKEN — общий секрет приложения и раннера")
	}
	ex, err := NewLocalExecutor(cfg.RunnerWorkers)
	if err != nil {
		return err
	}
	slog.Info("раннер", "addr", cfg.Addr, "info", ex.Info())
	if err := ex.warmup(); err != nil {
		slog.Warn("прогрев кэша сборки", "err", err)
	}
	go ex.cacheJanitor(cfg.GoCacheLimitMB)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]any{"ok": true, "busy": len(ex.queued), "workers": cap(ex.slots)})
	})
	mux.HandleFunc("POST /run", func(w http.ResponseWriter, r *http.Request) {
		got := []byte(r.Header.Get("Authorization"))
		want := []byte("Bearer " + cfg.RunnerToken)
		if subtle.ConstantTimeCompare(got, want) != 1 {
			httpErr(w, 401, "unauthorized")
			return
		}
		var req RunRequest
		if !readJSON(w, r, &req, 1<<20) {
			return
		}
		res, err := ex.Run(r.Context(), req)
		if errors.Is(err, ErrBusy) {
			httpErr(w, 503, err.Error())
			return
		}
		if err != nil {
			slog.Error("run", "err", err)
			httpErr(w, 500, err.Error())
			return
		}
		writeJSON(w, 200, res)
	})
	return serve(cfg.Addr, mux, 90*time.Second)
}

// warmup собирает программу со всеми типовыми импортами, чтобы стандартная
// библиотека оказалась в кэше сборки до первого пользователя.
func (e *LocalExecutor) warmup() error {
	code := `func warm() {
	_ = sort.Ints; _ = strings.Builder{}; _ = strconv.Itoa; _ = math.MaxInt; _ = bits.OnesCount
	_ = big.NewInt; _ = rand.Intn; _ = heap.Init; _ = list.New
	s := []int{2, 1}; slices.Sort(s); m := map[int]int{}; _ = maps.Clone(m)
	_ = fmt.Sprint; _ = unicode.IsLetter; _ = bytes.Buffer{}; _ = errors.New; _ = utf8.RuneLen
}`
	t0 := time.Now()
	res, err := e.Run(context.Background(), RunRequest{Code: code, Tests: "func judgeTests(t *Judge) { warm() }", TimeoutMs: 20000})
	if err != nil {
		return err
	}
	if res.Status == StCompileError {
		return errors.New(res.Compile)
	}
	slog.Info("кэш сборки прогрет", "ms", time.Since(t0).Milliseconds(), "status", res.Status)
	return nil
}

// cacheJanitor не даёт кэшу сборки расти бесконечно: каждая проверка добавляет
// в него объектные файлы. При превышении лимита кэш очищается и прогревается заново.
func (e *LocalExecutor) cacheJanitor(limitMB int) {
	if limitMB <= 0 || e.gocache == "" {
		return
	}
	for range time.Tick(10 * time.Minute) {
		size := dirSize(e.gocache)
		if size < int64(limitMB)<<20 {
			continue
		}
		slog.Info("очистка кэша сборки", "mb", size>>20)
		e.cacheMu.Lock()
		cmd := exec.Command(e.goBin, "clean", "-cache")
		cmd.Dir = e.workRoot
		cmd.Env = e.buildEnv(e.workRoot)
		if out, err := cmd.CombinedOutput(); err != nil {
			slog.Warn("go clean -cache", "err", err, "out", string(out))
			_ = os.RemoveAll(e.gocache)
		}
		_ = e.prepareSandbox()
		e.cacheMu.Unlock()
		_ = e.warmup()
	}
}

func dirSize(root string) int64 {
	var n int64
	_ = filepath.WalkDir(root, func(_ string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			if info, err := d.Info(); err == nil {
				n += info.Size()
			}
		}
		return nil
	})
	return n
}
