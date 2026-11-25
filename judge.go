package main

import (
	"bufio"
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ---------- тесты задач (content/judge/*.md) ----------

// JudgeSpec — заготовка кода и тесты задачи.
type JudgeSpec struct {
	Starter string // показывается пользователю в редакторе
	Types   string // объявления типов (Node, Interval…), добавляются, если их не объявил пользователь
	File    string
	Tests   string // Go-код с func judgeTests(t *Judge); на клиент не отдаётся
}

// parseJudgeDoc достаёт из тела документа блоки ```go starter и ```go tests.
func parseJudgeDoc(body string) JudgeSpec {
	var js JudgeSpec
	var cur *string
	var buf strings.Builder
	for _, line := range strings.Split(body, "\n") {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "```") {
			if cur != nil {
				*cur = strings.TrimRight(buf.String(), "\n")
				cur = nil
				buf.Reset()
				continue
			}
			info := strings.Fields(strings.TrimPrefix(t, "```"))
			for _, w := range info {
				switch w {
				case "starter":
					cur = &js.Starter
				case "tests":
					cur = &js.Tests
				case "types":
					cur = &js.Types
				}
			}
			if cur == nil {
				cur = new(string) // посторонний блок — пропускаем
			}
			continue
		}
		if cur != nil {
			buf.WriteString(line + "\n")
		}
	}
	return js
}

// LoadJudge читает content/judge/**/*.md. Ключ — id задачи.
func LoadJudge(fsys contentFS) (map[string]JudgeSpec, []string) {
	out := map[string]JudgeSpec{}
	var errs []string
	files := fsys.glob("judge/*.md", "judge/*/*.md")
	for _, f := range files {
		b, err := fsys.read(f)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		for _, d := range parseDocs(string(b)) {
			id := d.meta["id"]
			if id == "" {
				errs = append(errs, fmt.Sprintf("%s:%d: нет id", f, d.line))
				continue
			}
			if _, dup := out[id]; dup {
				errs = append(errs, fmt.Sprintf("%s:%d: тесты для %q уже есть", f, d.line, id))
				continue
			}
			js := parseJudgeDoc(d.body)
			if strings.TrimSpace(js.Tests) == "" {
				errs = append(errs, fmt.Sprintf("%s:%d: у %q нет блока ```go tests", f, d.line, id))
				continue
			}
			js.File = f
			out[id] = js
		}
	}
	return out, errs
}

// ---------- подготовка исходников ----------

//go:embed judgekit/prelude.go
var preludeSrc string

var (
	reListDecl = regexp.MustCompile(`type\s+ListNode\s+struct`)
	reTreeDecl = regexp.MustCompile(`type\s+TreeNode\s+struct`)
	rePkg      = regexp.MustCompile(`^\s*package\s+[A-Za-z_]\w*\s*;?\s*$`)
	reImpRes   = func() []*regexp.Regexp {
		out := make([]*regexp.Regexp, len(stdImports))
		for i, im := range stdImports {
			out[i] = regexp.MustCompile(im.re)
		}
		return out
	}()
)

// stripCode убирает комментарии и строковые литералы — чтобы автоимпорт
// не срабатывал на "sort." в комментарии.
func stripCode(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c == '/' && i+1 < len(s) && s[i+1] == '/':
			for i < len(s) && s[i] != '\n' {
				i++
			}
			b.WriteByte('\n')
		case c == '/' && i+1 < len(s) && s[i+1] == '*':
			i += 2
			for i+1 < len(s) && !(s[i] == '*' && s[i+1] == '/') {
				if s[i] == '\n' {
					b.WriteByte('\n')
				}
				i++
			}
			i++
		case c == '"' || c == '\'' || c == '`':
			q := c
			i++
			for i < len(s) && s[i] != q {
				if s[i] == '\\' && q != '`' {
					i++
				}
				i++
			}
			b.WriteString(`""`)
		default:
			b.WriteByte(c)
		}
	}
	return b.String()
}

// autoImports — пакеты стандартной библиотеки, которые код использует, но не импортирует.
func autoImports(code string) []string {
	bare := stripCode(code)
	var imps []string
	for i, im := range stdImports {
		if reImpRes[i].MatchString(bare) && !strings.Contains(code, `"`+im.path+`"`) {
			imps = append(imps, im.path)
		}
	}
	sort.Strings(imps)
	return imps
}

// withHeader добавляет `package main` и недостающие импорты, не сдвигая строки
// пользовательского кода, если в нём уже есть package. Возвращает исходник и
// смещение строк (сколько строк добавлено сверху).
func withHeader(code string) (string, int) {
	code = strings.ReplaceAll(code, "\r\n", "\n")
	header := "package main"
	if imps := autoImports(code); len(imps) > 0 {
		q := make([]string, len(imps))
		for i, p := range imps {
			q[i] = strconv.Quote(p)
		}
		header += "; import (" + strings.Join(q, "; ") + ")"
	}
	lines := strings.Split(code, "\n")
	for i, l := range lines {
		t := strings.TrimSpace(l)
		if t == "" || strings.HasPrefix(t, "//") {
			continue
		}
		if rePkg.MatchString(l) {
			lines[i] = header
			return strings.Join(lines, "\n") + "\n", 0
		}
		break
	}
	return header + "\n" + code + "\n", 1
}

var reTypeStart = regexp.MustCompile(`(?m)^type\s+([A-Za-z_]\w*)`)

// extraTypes возвращает объявления из блока types, кроме тех типов, которые
// пользователь объявил сам (на LeetCode такие типы, как Node, предопределены).
func extraTypes(types, userCode string) string {
	if strings.TrimSpace(types) == "" {
		return ""
	}
	bare := stripCode(userCode)
	locs := reTypeStart.FindAllStringSubmatchIndex(types, -1)
	var b strings.Builder
	b.WriteString("\n")
	for i, l := range locs {
		end := len(types)
		if i+1 < len(locs) {
			end = locs[i+1][0]
		}
		name := types[l[2]:l[3]]
		if regexp.MustCompile(`\btype\s+` + name + `\b`).MatchString(bare) {
			continue
		}
		b.WriteString(types[l[0]:end])
		b.WriteString("\n")
	}
	return b.String()
}

func buildPrelude(userCode string) string {
	src := strings.Replace(preludeSrc, "//go:build ignore", "", 1)
	bare := stripCode(userCode) // объявление в комментарии-подсказке не считается
	if !reListDecl.MatchString(bare) {
		src += "\n" + predeclListNode
	}
	if !reTreeDecl.MatchString(bare) {
		src += "\n" + predeclTreeNode
	}
	return src
}

// ---------- запуск ----------

// RunRequest — задание на проверку решения.
type RunRequest struct {
	Code      string `json:"code"`
	Tests     string `json:"tests"`
	Types     string `json:"types,omitempty"`
	Limit     int    `json:"limit"`     // 0 — все тесты
	TimeoutMs int    `json:"timeoutMs"` // лимит на выполнение (без компиляции)
}

type CaseResult struct {
	I     int     `json:"i"`
	Input string  `json:"input"`
	Want  string  `json:"want"`
	Got   string  `json:"got"`
	OK    bool    `json:"ok"`
	Err   string  `json:"err,omitempty"`
	Ms    float64 `json:"ms"`
}

// Статусы проверки.
const (
	StAccepted     = "accepted"
	StWrong        = "wrong_answer"
	StCompileError = "compile_error"
	StRuntimeError = "runtime_error"
	StTimeLimit    = "time_limit"
	StInternal     = "internal_error"
)

type RunResult struct {
	Status    string       `json:"status"`
	Passed    int          `json:"passed"`
	Total     int          `json:"total"`
	Cases     []CaseResult `json:"cases"`
	Compile   string       `json:"compile,omitempty"`
	Error     string       `json:"error,omitempty"`
	Stdout    string       `json:"stdout,omitempty"`
	TimeMs    int          `json:"timeMs"`
	CompileMs int          `json:"compileMs"`
}

// Executor выполняет проверку: локально (LocalExecutor) или через сервис-раннер.
type Executor interface {
	Run(ctx context.Context, req RunRequest) (*RunResult, error)
}

// ErrBusy — очередь раннера переполнена.
var ErrBusy = errors.New("проверяющий сервер перегружен, попробуйте через несколько секунд")

// LocalExecutor компилирует и запускает решения на этой машине.
// В Linux под root каждое решение выполняется от отдельного непривилегированного
// пользователя с лимитами (см. sandbox_linux.go); иначе — от текущего пользователя.
type LocalExecutor struct {
	goBin     string
	goVersion string // "1.27"
	workRoot  string
	slots     chan int // свободные слоты = максимум параллельных проверок
	maxQueue  int
	queued    chan struct{}
	cacheMu   sync.RWMutex // сборки держат RLock, очистка кэша — Lock
	gocache   string
	sandbox   bool
}

func NewLocalExecutor(workers int) (*LocalExecutor, error) {
	if workers <= 0 {
		workers = runtime.NumCPU()
	}
	goBin, err := exec.LookPath("go")
	if err != nil {
		return nil, fmt.Errorf("не найден Go toolchain (go в PATH): %w", err)
	}
	root := os.Getenv("RUNNER_WORKDIR")
	if root == "" {
		root = filepath.Join(os.TempDir(), "algotrain-jobs")
	}
	if err := os.MkdirAll(root, 0o711); err != nil {
		return nil, err
	}
	e := &LocalExecutor{
		goBin:    goBin,
		workRoot: root,
		slots:    make(chan int, workers),
		maxQueue: workers * 16,
		gocache:  os.Getenv("GOCACHE"),
	}
	e.queued = make(chan struct{}, e.maxQueue)
	for i := 0; i < workers; i++ {
		e.slots <- i
	}
	// версия Go — из пустой папки, чтобы не сработало переключение toolchain по go.mod проекта
	cmd := exec.Command(goBin, "env", "GOVERSION")
	cmd.Dir = root
	cmd.Env = append(os.Environ(), "GOTOOLCHAIN=local")
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("go env: %w", err)
	}
	v := strings.TrimPrefix(strings.TrimSpace(string(out)), "go")
	if p := strings.SplitN(v, ".", 3); len(p) >= 2 {
		v = p[0] + "." + strings.TrimRightFunc(p[1], func(r rune) bool { return r < '0' || r > '9' })
	}
	e.goVersion = v
	e.sandbox = sandboxAvailable()
	if e.gocache == "" {
		cmd := exec.Command(goBin, "env", "GOCACHE")
		cmd.Dir = root
		if out, err := cmd.Output(); err == nil {
			e.gocache = strings.TrimSpace(string(out))
		}
	}
	if err := e.prepareSandbox(); err != nil {
		return nil, err
	}
	return e, nil
}

func (e *LocalExecutor) Info() string {
	mode := "без песочницы (только для локальной разработки!)"
	if e.sandbox {
		mode = "песочница: отдельные uid, rlimits"
	}
	return fmt.Sprintf("go %s, %d воркеров, %s", e.goVersion, cap(e.slots), mode)
}

func (e *LocalExecutor) Run(ctx context.Context, req RunRequest) (*RunResult, error) {
	select {
	case e.queued <- struct{}{}:
	default:
		return nil, ErrBusy
	}
	defer func() { <-e.queued }()
	var slot int
	wait := time.NewTimer(30 * time.Second)
	defer wait.Stop()
	select {
	case slot = <-e.slots:
	case <-wait.C:
		return nil, ErrBusy
	case <-ctx.Done():
		return nil, ctx.Err()
	}
	defer func() { e.slots <- slot }()
	return e.run(ctx, slot, req)
}

const (
	maxCode      = 64 << 10
	maxOutput    = 32 << 10
	buildTimeout = 60 * time.Second
)

func (e *LocalExecutor) run(ctx context.Context, slot int, req RunRequest) (*RunResult, error) {
	if len(req.Code) > maxCode {
		return &RunResult{Status: StCompileError, Compile: "код слишком длинный (максимум 64 КБ)"}, nil
	}
	timeout := time.Duration(req.TimeoutMs) * time.Millisecond
	if timeout <= 0 || timeout > 30*time.Second {
		timeout = 6 * time.Second
	}
	dir, err := os.MkdirTemp(e.workRoot, "job-")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(dir)

	sol, offset := withHeader(req.Code)
	tests, _ := withHeader(req.Tests)
	files := map[string]string{
		"go.mod":         "module solution\n\ngo " + e.goVersion + "\n",
		"solution.go":    sol,
		"judge_tests.go": tests,
		"judge_main.go":  buildPrelude(req.Code) + extraTypes(req.Types, req.Code),
	}
	for name, body := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(body), 0o644); err != nil {
			return nil, err
		}
	}
	if err := os.Mkdir(filepath.Join(dir, ".tmp"), 0o700); err != nil {
		return nil, err
	}
	if err := e.chownJob(dir); err != nil {
		return nil, err
	}

	res := &RunResult{Cases: []CaseResult{}}
	// --- сборка ---
	bin := filepath.Join(dir, "prog")
	if runtime.GOOS == "windows" {
		bin += ".exe"
	}
	t0 := time.Now()
	e.cacheMu.RLock()
	bctx, cancel := context.WithTimeout(ctx, buildTimeout)
	cmd := exec.CommandContext(bctx, e.goBin, "build", "-trimpath", "-ldflags=-s -w", "-o", bin, ".")
	cmd.Dir = dir
	cmd.Env = e.buildEnv(dir)
	e.buildCred(cmd)
	var bout limitedBuffer
	bout.max = maxOutput
	cmd.Stdout, cmd.Stderr = &bout, &bout
	err = cmd.Run()
	cancel()
	e.cacheMu.RUnlock()
	res.CompileMs = int(time.Since(t0).Milliseconds())
	if err != nil {
		if bctx.Err() == context.DeadlineExceeded {
			res.Status, res.Compile = StCompileError, "компиляция заняла слишком много времени"
			return res, nil
		}
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		res.Status = StCompileError
		res.Compile = cleanCompile(bout.String(), dir, offset)
		return res, nil
	}

	// --- запуск ---
	outFile := filepath.Join(dir, "results.jsonl")
	if err := os.WriteFile(outFile, nil, 0o600); err != nil {
		return nil, err
	}
	if err := e.prepareExec(dir, bin, outFile, slot); err != nil {
		return nil, err
	}
	rctx, rcancel := context.WithTimeout(ctx, timeout)
	defer rcancel()
	cmd = e.execCommand(rctx, bin, slot, timeout)
	cmd.Dir = dir
	cmd.Env = e.execEnv(outFile, req.Limit)
	var sout, serr limitedBuffer
	sout.max, serr.max = maxOutput, maxOutput
	cmd.Stdout, cmd.Stderr = &sout, &serr
	t1 := time.Now()
	runErr := cmd.Run()
	res.TimeMs = int(time.Since(t1).Milliseconds())
	e.cleanupSlot(slot)
	timedOut := rctx.Err() == context.DeadlineExceeded
	if ctx.Err() != nil && !timedOut {
		return nil, ctx.Err()
	}
	res.Stdout = sout.String()

	// --- разбор результатов ---
	raw, _ := os.ReadFile(outFile)
	started, done, startedInput := -1, false, ""
	sc := bufio.NewScanner(bytes.NewReader(raw))
	sc.Buffer(make([]byte, 64<<10), 4<<20)
	for sc.Scan() {
		var m struct {
			Start *int `json:"start"`
			Done  bool `json:"done"`
			CaseResult
		}
		if json.Unmarshal(sc.Bytes(), &m) != nil {
			continue
		}
		switch {
		case m.Done:
			done = true
		case m.Start != nil:
			started, startedInput = *m.Start, m.Input
		default:
			m.CaseResult.Err = fixLines(m.CaseResult.Err, offset)
			res.Cases = append(res.Cases, m.CaseResult)
		}
	}
	for _, c := range res.Cases {
		if c.OK {
			res.Passed++
		}
	}
	res.Total = len(res.Cases)
	stderr := fixLines(strings.TrimSpace(serr.String()), offset)
	switch {
	case done && res.Passed == res.Total && res.Total > 0:
		res.Status = StAccepted
	case done:
		res.Status = StWrong
		for _, c := range res.Cases {
			if !c.OK && c.Err != "" {
				res.Status = StRuntimeError
				break
			}
		}
	case timedOut:
		res.Status = StTimeLimit
		res.Error = fmt.Sprintf("превышен лимит времени %.1f с", timeout.Seconds())
		res.Cases = append(res.Cases, CaseResult{I: started, Input: startedInput, Err: "тест не завершился за отведённое время (бесконечный цикл или слишком медленный алгоритм)"})
		res.Total++
	default:
		res.Status = StRuntimeError
		msg := describeCrash(stderr, runErr)
		res.Error = msg
		if started >= len(res.Cases) {
			res.Cases = append(res.Cases, CaseResult{I: started, Input: startedInput, Err: msg})
			res.Total++
		}
	}
	if res.Status == StRuntimeError && res.Error == "" && stderr != "" {
		res.Error = stderr
	}
	return res, nil
}

func describeCrash(stderr string, err error) string {
	switch {
	case strings.Contains(stderr, "goroutine stack exceeds") || strings.Contains(stderr, "runtime.newstack"):
		return "переполнение стека — вероятно, бесконечная рекурсия"
	case strings.Contains(stderr, "out of memory") || strings.Contains(stderr, "cannot allocate memory"):
		return "превышен лимит памяти"
	case strings.Contains(stderr, "all goroutines are asleep"):
		return "deadlock: все горутины заблокированы"
	}
	var ee *exec.ExitError
	if errors.As(err, &ee) {
		if stderr != "" {
			return firstLines(stderr, 12)
		}
		return "программа завершилась с кодом " + strconv.Itoa(ee.ExitCode()) + " (os.Exit или сигнал)"
	}
	if err != nil {
		return err.Error()
	}
	if stderr != "" {
		return firstLines(stderr, 12)
	}
	return "программа завершилась до окончания тестов (os.Exit?)"
}

func firstLines(s string, n int) string {
	l := strings.SplitN(s, "\n", n+1)
	if len(l) > n {
		l = l[:n]
		l = append(l, "…")
	}
	return strings.Join(l, "\n")
}

var reSolLine = regexp.MustCompile(`solution\.go:(\d+)`)

// fixLines пересчитывает номера строк solution.go с учётом добавленного заголовка.
func fixLines(s string, offset int) string {
	if offset == 0 || s == "" {
		return s
	}
	return reSolLine.ReplaceAllStringFunc(s, func(m string) string {
		n, _ := strconv.Atoi(m[len("solution.go:"):])
		if n-offset < 1 {
			n = 1 + offset
		}
		return "solution.go:" + strconv.Itoa(n-offset)
	})
}

func cleanCompile(out, dir string, offset int) string {
	out = strings.ReplaceAll(out, dir+string(os.PathSeparator), "")
	out = strings.ReplaceAll(out, filepath.ToSlash(dir)+"/", "")
	var keep []string
	for _, l := range strings.Split(out, "\n") {
		t := strings.TrimSpace(l)
		if t == "" || strings.HasPrefix(t, "# ") {
			continue
		}
		l = strings.TrimPrefix(strings.TrimPrefix(l, "./"), `.\`)
		keep = append(keep, l)
	}
	return fixLines(strings.Join(keep, "\n"), offset)
}

// limitedBuffer хранит не больше max байт, остальное отбрасывает.
type limitedBuffer struct {
	buf   bytes.Buffer
	max   int
	extra int
}

func (b *limitedBuffer) Write(p []byte) (int, error) {
	if room := b.max - b.buf.Len(); room > 0 {
		if len(p) > room {
			b.buf.Write(p[:room])
			b.extra += len(p) - room
		} else {
			b.buf.Write(p)
		}
	} else {
		b.extra += len(p)
	}
	return len(p), nil
}

func (b *limitedBuffer) String() string {
	if b.extra > 0 {
		return b.buf.String() + fmt.Sprintf("\n… (обрезано ещё %d байт)", b.extra)
	}
	return b.buf.String()
}

func (e *LocalExecutor) buildEnv(dir string) []string {
	base := []string{
		"GOTOOLCHAIN=local", "GOFLAGS=-mod=mod", "GOPROXY=off", "GOSUMDB=off",
		"CGO_ENABLED=0", "GOWORK=off", "GOTELEMETRY=off", "GO111MODULE=on",
	}
	if e.gocache != "" {
		base = append(base, "GOCACHE="+e.gocache)
	}
	if e.sandbox {
		return append(base, "PATH=/usr/local/go/bin:/usr/bin:/bin", "HOME="+dir, "GOPATH="+filepath.Join(dir, ".gopath"), "TMPDIR="+filepath.Join(dir, ".tmp"), "GOTMPDIR="+filepath.Join(dir, ".tmp"))
	}
	return append(os.Environ(), base...)
}

func (e *LocalExecutor) execEnv(outFile string, limit int) []string {
	env := []string{
		"JUDGE_OUT=" + outFile,
		"JUDGE_LIMIT=" + strconv.Itoa(limit),
		"GOMEMLIMIT=384MiB",
		"GOMAXPROCS=2",
		"GOTRACEBACK=single",
	}
	if !e.sandbox {
		for _, k := range []string{"SystemRoot", "PATH", "TEMP", "TMP"} {
			if v := os.Getenv(k); v != "" {
				env = append(env, k+"="+v)
			}
		}
	}
	return env
}

// ---------- проверка тестов эталонными решениями ----------

// runJudgeCheck прогоняет каждое эталонное решение через тесты задачи:
// все должны пройти. Заготовка (starter) должна компилироваться.
//
//	go run . -check-judge [префикс id]
func runJudgeCheck(root, prefix string) int {
	fsys := newContentFS(filepath.Join(root, "content"), true)
	c := LoadContent(fsys)
	specs, errs := LoadJudge(fsys)
	for _, e := range errs {
		fmt.Println("JUDGE:", e)
	}
	workers := envIntDef("JUDGE_WORKERS", runtime.NumCPU())
	ex, err := NewLocalExecutor(workers)
	if err != nil {
		fmt.Println(err)
		return 2
	}
	fmt.Println("Раннер:", ex.Info())
	type job struct {
		p    Problem
		name string
		code string
	}
	var jobs []job
	missing := 0
	for _, p := range c.Problems {
		js, ok := specs[p.ID]
		if strings.HasSuffix(prefix, ".md") {
			// фильтр по файлу тестов: -check-judge 07-trees.md
			if !ok || path.Base(js.File) != prefix {
				continue
			}
		} else if prefix != "" && !strings.HasPrefix(p.ID, prefix) {
			continue
		}
		if !ok {
			missing++
			continue
		}
		jobs = append(jobs, job{p, "starter", js.Starter})
		for i, s := range p.Solutions {
			if s.Lang == "go" && strings.TrimSpace(s.Code) != "" {
				jobs = append(jobs, job{p, fmt.Sprintf("решение %d «%s»", i+1, s.Title), s.Code})
			}
		}
	}
	fmt.Printf("Проверяю %d прогонов (%d задач без тестов)…\n", len(jobs), missing)
	var mu sync.Mutex
	fails := 0
	var wg sync.WaitGroup
	ch := make(chan job)
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range ch {
				r, err := ex.Run(context.Background(), RunRequest{Code: j.code, Tests: specs[j.p.ID].Tests, Types: specs[j.p.ID].Types, TimeoutMs: 10000})
				var msg string
				switch {
				case err != nil:
					msg = err.Error()
				case j.name == "starter":
					// пустые функции без return — нормально для заготовки
					if r.Status == StCompileError {
						for _, l := range strings.Split(r.Compile, "\n") {
							if !strings.Contains(l, "missing return") {
								msg = "заготовка не компилируется:\n" + r.Compile
								break
							}
						}
					}
				case r.Status != StAccepted:
					msg = describeResult(r)
				}
				mu.Lock()
				if msg != "" {
					fails++
					fmt.Printf("FAIL %s → %s (%s)\n%s\n\n", j.p.ID, j.name, j.p.File, indent(msg))
				}
				mu.Unlock()
			}
		}()
	}
	for _, j := range jobs {
		ch <- j
	}
	close(ch)
	wg.Wait()
	if fails == 0 {
		fmt.Printf("OK: все %d прогонов прошли\n", len(jobs))
		return 0
	}
	fmt.Printf("Ошибок: %d из %d\n", fails, len(jobs))
	return 1
}

func describeResult(r *RunResult) string {
	var b strings.Builder
	fmt.Fprintf(&b, "статус %s, пройдено %d/%d", r.Status, r.Passed, r.Total)
	if r.Compile != "" {
		b.WriteString("\n" + r.Compile)
	}
	if r.Error != "" {
		b.WriteString("\n" + r.Error)
	}
	n := 0
	for _, c := range r.Cases {
		if c.OK {
			continue
		}
		if n++; n > 3 {
			break
		}
		fmt.Fprintf(&b, "\n#%d %s\n   ожидалось: %s\n   получено:  %s", c.I+1, c.Input, c.Want, c.Got)
		if c.Err != "" {
			b.WriteString("\n   " + c.Err)
		}
	}
	return b.String()
}

func envIntDef(k string, def int) int {
	if v, err := strconv.Atoi(os.Getenv(k)); err == nil && v > 0 {
		return v
	}
	return def
}

func indent(s string) string {
	return "    " + strings.ReplaceAll(s, "\n", "\n    ")
}
