// AlgoTrain — локальный тренажёр алгоритмов с интервальным повторением.
//
// Запуск:  go run .            (http://127.0.0.1:7341)
//
//	go run . -addr :9000 -root .
//	go run . -check            — проверить, что все Go-решения компилируются
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

type server struct {
	root     string
	mu       sync.Mutex
	progress string
}

func main() {
	addr := flag.String("addr", "127.0.0.1:7341", "адрес HTTP-сервера")
	root := flag.String("root", ".", "корень проекта (папки web/, content/, data/)")
	check := flag.Bool("check", false, "проверить, что все Go-решения компилируются (аргумент — префикс id)")
	flag.Parse()
	if *check {
		os.Exit(runCheck(*root, flag.Arg(0)))
	}

	s := &server{root: *root, progress: filepath.Join(*root, "data", "progress.json")}
	if err := os.MkdirAll(filepath.Join(*root, "data"), 0o755); err != nil {
		log.Fatal(err)
	}

	c := LoadContent(filepath.Join(*root, "content"))
	log.Printf("контент: %d задач, %d алгоритмов", len(c.Problems), len(c.Algorithms))
	for _, e := range c.Errors {
		log.Printf("  предупреждение: %s", e)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/content", s.handleContent)
	mux.HandleFunc("GET /api/progress", s.handleGetProgress)
	mux.HandleFunc("PUT /api/progress", s.handlePutProgress)
	mux.HandleFunc("POST /api/problems", s.handleAddProblem)
	mux.Handle("/", noCache(http.FileServer(http.Dir(filepath.Join(*root, "web")))))

	log.Printf("AlgoTrain: http://%s", strings.Replace(*addr, "0.0.0.0", "localhost", 1))
	log.Fatal(http.ListenAndServe(*addr, mux))
}

func noCache(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		h.ServeHTTP(w, r)
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

// Контент перечитывается с диска на каждый запрос — можно править .md файлы
// и просто обновлять страницу.
func (s *server) handleContent(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, LoadContent(filepath.Join(s.root, "content")))
}

func (s *server) handleGetProgress(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, err := os.ReadFile(s.progress)
	if errors.Is(err, os.ErrNotExist) {
		b = []byte(`{}`)
	} else if err != nil {
		httpErr(w, 500, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Write(b)
}

func (s *server) handlePutProgress(w http.ResponseWriter, r *http.Request) {
	b, err := io.ReadAll(io.LimitReader(r.Body, 32<<20))
	if err != nil {
		httpErr(w, 400, err.Error())
		return
	}
	if !json.Valid(b) {
		httpErr(w, 400, "невалидный JSON")
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	// раз в день сохраняем резервную копию предыдущей версии
	if old, err := os.ReadFile(s.progress); err == nil {
		bak := filepath.Join(filepath.Dir(s.progress), "backup", "progress-"+time.Now().Format("2006-01-02")+".json")
		if _, err := os.Stat(bak); errors.Is(err, os.ErrNotExist) {
			_ = os.MkdirAll(filepath.Dir(bak), 0o755)
			_ = os.WriteFile(bak, old, 0o644)
		}
	}
	if err := writeAtomic(s.progress, b); err != nil {
		httpErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func writeAtomic(path string, data []byte) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

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
	Overwrite bool `json:"overwrite"`
}

var slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,80}$`)

func oneLine(s string) string {
	return strings.TrimSpace(strings.NewReplacer("\n", " ", "\r", " ").Replace(s))
}

// handleAddProblem сохраняет новую задачу в content/problems/custom/<id>.md
func (s *server) handleAddProblem(w http.ResponseWriter, r *http.Request) {
	var p newProblem
	if err := json.NewDecoder(io.LimitReader(r.Body, 4<<20)).Decode(&p); err != nil {
		httpErr(w, 400, err.Error())
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
	c := LoadContent(filepath.Join(s.root, "content"))
	path := filepath.Join(s.root, "content", "problems", "custom", p.ID+".md")
	for _, ex := range c.Problems {
		if ex.ID == p.ID && !(p.Overwrite && ex.File == "problems/custom/"+p.ID+".md") {
			httpErr(w, 409, "задача с таким id уже есть: "+ex.File)
			return
		}
	}
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
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		httpErr(w, 500, err.Error())
		return
	}
	if err := writeAtomic(path, []byte(b.String())); err != nil {
		httpErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]string{"ok": "true", "file": "content/problems/custom/" + p.ID + ".md"})
}
