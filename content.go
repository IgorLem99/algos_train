package main

import (
	"bufio"
	"fmt"
	"io/fs"
	"os"
	"path"
	"sort"
	"strconv"
	"strings"
)

// Solution — один эталонный вариант решения задачи.
type Solution struct {
	Title       string `json:"title"`
	Explanation string `json:"explanation"` // markdown
	Code        string `json:"code"`
	Lang        string `json:"lang"`
}

// Problem — задача из списка (NeetCode 150 или пользовательская).
type Problem struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Difficulty  string     `json:"difficulty"`
	Category    string     `json:"category"`
	LeetCode    int        `json:"leetcode,omitempty"`
	URL         string     `json:"url"`
	Lists       []string   `json:"lists"`
	Algorithms  []string   `json:"algorithms"`
	Order       int        `json:"order"`
	Description string     `json:"description"` // markdown
	Solutions   []Solution `json:"solutions"`
	File        string     `json:"file"`
	Starter     string     `json:"starter,omitempty"` // заготовка для редактора
	HasTests    bool       `json:"hasTests"`
	Custom      bool       `json:"custom,omitempty"` // добавлена через интерфейс (хранится в БД)
}

// Algorithm — статья об алгоритме/паттерне.
type Algorithm struct {
	ID    string   `json:"id"`
	Title string   `json:"title"`
	Short string   `json:"short"`
	Group string   `json:"group"`
	Icon  string   `json:"icon"`
	Order int      `json:"order"`
	Viz   []string `json:"viz"`
	Body  string   `json:"body"` // markdown
	File  string   `json:"file"`
}

type Content struct {
	Problems   []Problem   `json:"problems"`
	Algorithms []Algorithm `json:"algorithms"`
	Categories []string    `json:"categories"`
	Errors     []string    `json:"errors,omitempty"`
}

// doc — один блок "front matter + тело" внутри .md файла.
type doc struct {
	meta map[string]string
	body string
	line int
}

// parseDocs разбирает файл, в котором может быть несколько блоков вида
//
//	---
//	key: value
//	---
//	markdown тело
//
// Разделители `---` внутри ```код``` блоков игнорируются.
func parseDocs(text string) []doc {
	var docs []doc
	sc := bufio.NewScanner(strings.NewReader(strings.ReplaceAll(text, "\r\n", "\n")))
	sc.Buffer(make([]byte, 1024*1024), 16*1024*1024)
	var cur *doc
	var body strings.Builder
	inFence, inMeta := false, false
	lineNo := 0
	flush := func() {
		if cur != nil {
			cur.body = strings.TrimSpace(body.String())
			docs = append(docs, *cur)
		}
		body.Reset()
	}
	for sc.Scan() {
		lineNo++
		line := sc.Text()
		trimmed := strings.TrimSpace(line)
		if inMeta {
			if trimmed == "---" {
				inMeta = false
				continue
			}
			if k, v, ok := strings.Cut(line, ":"); ok {
				cur.meta[strings.TrimSpace(strings.ToLower(k))] = strings.TrimSpace(v)
			}
			continue
		}
		if strings.HasPrefix(trimmed, "```") {
			inFence = !inFence
		}
		if !inFence && trimmed == "---" {
			flush()
			cur = &doc{meta: map[string]string{}, line: lineNo}
			inMeta = true
			continue
		}
		if cur != nil {
			body.WriteString(line)
			body.WriteByte('\n')
		}
	}
	flush()
	return docs
}

func splitList(s string) []string {
	out := []string{} // не nil: в JSON должен быть [], а не null
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// splitSolutions отделяет описание задачи (до первого "### ") от решений.
// Каждое решение — секция "### Название", текст-пояснение и блок кода.
func splitSolutions(body string) (string, []Solution) {
	lines := strings.Split(body, "\n")
	var desc strings.Builder
	sols := []Solution{}
	var cur *Solution
	var expl, code strings.Builder
	inCode := false
	finish := func() {
		if cur != nil {
			cur.Explanation = strings.TrimSpace(expl.String())
			cur.Code = strings.TrimRight(code.String(), "\n")
			sols = append(sols, *cur)
		}
		expl.Reset()
		code.Reset()
	}
	for _, line := range lines {
		t := strings.TrimSpace(line)
		if !inCode && strings.HasPrefix(line, "### ") {
			finish()
			cur = &Solution{Title: strings.TrimSpace(strings.TrimPrefix(line, "### ")), Lang: "go"}
			continue
		}
		if cur == nil {
			desc.WriteString(line + "\n")
			continue
		}
		if strings.HasPrefix(t, "```") {
			if !inCode {
				inCode = true
				if l := strings.TrimPrefix(t, "```"); l != "" {
					cur.Lang = l
				}
			} else {
				inCode = false
			}
			continue
		}
		if inCode {
			code.WriteString(line + "\n")
		} else {
			expl.WriteString(line + "\n")
		}
	}
	finish()
	return strings.TrimSpace(desc.String()), sols
}

// contentFS — папка content: с диска (локальная разработка, правки видны сразу)
// или встроенная в бинарник (продакшен).
type contentFS struct {
	fsys fs.FS
	disk bool
	root string
}

func newContentFS(root string, disk bool) contentFS {
	return contentFS{fsys: os.DirFS(root), disk: disk, root: root}
}

func (c contentFS) glob(patterns ...string) []string {
	var out []string
	for _, p := range patterns {
		m, _ := fs.Glob(c.fsys, p)
		out = append(out, m...)
	}
	sort.Strings(out)
	return out
}

func (c contentFS) read(name string) ([]byte, error) { return fs.ReadFile(c.fsys, name) }

// stamp — отпечаток файлов (имена+размеры+время), чтобы понять, что контент изменился.
func (c contentFS) stamp() string {
	var b strings.Builder
	_ = fs.WalkDir(c.fsys, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		if info, err := d.Info(); err == nil {
			fmt.Fprintf(&b, "%s:%d:%d;", p, info.Size(), info.ModTime().UnixNano())
		}
		return nil
	})
	return b.String()
}

// customDoc — задача, добавленная через интерфейс (хранится в БД).
type customDoc struct {
	ID    string
	Doc   string // markdown с front matter, как в файлах content/problems
	Judge string // markdown с блоками ```go starter / ```go tests (может быть пустым)
}

func LoadContent(fsys contentFS, custom ...customDoc) *Content {
	c := &Content{Problems: []Problem{}, Algorithms: []Algorithm{}, Categories: []string{}}
	catOrder := map[string]int{}

	type srcDoc struct {
		rel    string
		text   string
		custom bool
	}
	var srcs []srcDoc
	for _, f := range fsys.glob("problems/*/*.md", "problems/*.md") {
		b, err := fsys.read(f)
		if err != nil {
			c.Errors = append(c.Errors, err.Error())
			continue
		}
		srcs = append(srcs, srcDoc{f, string(b), false})
	}
	for _, cd := range custom {
		srcs = append(srcs, srcDoc{"db:" + cd.ID, cd.Doc, true})
	}
	seen := map[string]string{}
	for _, src := range srcs {
		rel := src.rel
		for _, d := range parseDocs(src.text) {
			m := d.meta
			id := m["id"]
			if id == "" {
				c.Errors = append(c.Errors, fmt.Sprintf("%s:%d: нет id", rel, d.line))
				continue
			}
			if prev, ok := seen[id]; ok {
				c.Errors = append(c.Errors, fmt.Sprintf("%s:%d: дубликат id %q (уже в %s)", rel, d.line, id, prev))
				continue
			}
			seen[id] = rel
			p := Problem{
				ID:         id,
				Title:      m["title"],
				Difficulty: m["difficulty"],
				Category:   m["category"],
				URL:        m["url"],
				Lists:      splitList(m["lists"]),
				Algorithms: splitList(m["algorithms"]),
				File:       rel,
				Custom:     src.custom,
			}
			p.LeetCode, _ = strconv.Atoi(m["leetcode"])
			p.Order, _ = strconv.Atoi(m["order"])
			if p.Order == 0 {
				p.Order = 10000 + len(c.Problems)
			}
			if p.Category == "" {
				p.Category = "Другое"
			}
			if p.URL == "" && p.LeetCode > 0 {
				p.URL = "https://leetcode.com/problems/" + id + "/"
			}
			p.Description, p.Solutions = splitSolutions(d.body)
			if _, ok := catOrder[p.Category]; !ok {
				catOrder[p.Category] = p.Order
			} else if p.Order < catOrder[p.Category] {
				catOrder[p.Category] = p.Order
			}
			c.Problems = append(c.Problems, p)
		}
	}
	sort.SliceStable(c.Problems, func(i, j int) bool { return c.Problems[i].Order < c.Problems[j].Order })
	for cat := range catOrder {
		c.Categories = append(c.Categories, cat)
	}
	sort.Slice(c.Categories, func(i, j int) bool { return catOrder[c.Categories[i]] < catOrder[c.Categories[j]] })

	for _, f := range fsys.glob("algorithms/*.md") {
		b, err := fsys.read(f)
		if err != nil {
			c.Errors = append(c.Errors, err.Error())
			continue
		}
		rel := f
		for _, d := range parseDocs(string(b)) {
			m := d.meta
			a := Algorithm{
				ID: m["id"], Title: m["title"], Short: m["short"], Group: m["group"],
				Icon: m["icon"], Viz: splitList(m["viz"]), Body: d.body, File: path.Clean(rel),
			}
			a.Order, _ = strconv.Atoi(m["order"])
			if a.ID == "" {
				c.Errors = append(c.Errors, fmt.Sprintf("%s:%d: нет id", rel, d.line))
				continue
			}
			c.Algorithms = append(c.Algorithms, a)
		}
	}
	sort.SliceStable(c.Algorithms, func(i, j int) bool { return c.Algorithms[i].Order < c.Algorithms[j].Order })

	known := map[string]bool{}
	for _, a := range c.Algorithms {
		known[a.ID] = true
	}
	for _, p := range c.Problems {
		for _, a := range p.Algorithms {
			if !known[a] {
				c.Errors = append(c.Errors, fmt.Sprintf("%s: задача %s ссылается на неизвестный алгоритм %q", p.File, p.ID, a))
			}
		}
	}
	return c
}
