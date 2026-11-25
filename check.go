package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// Проверка, что все эталонные решения на Go компилируются.
// Каждый блок кода кладётся в отдельный пакет; ListNode и TreeNode
// объявляются автоматически (если код не объявляет их сам), импорты
// стандартной библиотеки подставляются по использованию.
//
//	go run . -check            — все задачи
//	go run . -check two-sum    — только задачи, id которых начинается с префикса
var stdImports = []struct{ path, re string }{
	{"sort", `\bsort\.`},
	{"strings", `\bstrings\.`},
	{"strconv", `\bstrconv\.`},
	{"math", `\bmath\.`},
	{"math/bits", `\bbits\.`},
	{"math/big", `\bbig\.(NewInt|Int|NewFloat|Float|NewRat|Rat)\b`},
	{"math/rand", `\brand\.`},
	{"container/heap", `\bheap\.(Init|Push|Pop|Fix|Remove|Interface)\b`},
	{"container/list", `\blist\.(New|List|Element)\b`},
	{"slices", `\bslices\.`},
	{"maps", `\bmaps\.`},
	{"fmt", `\bfmt\.`},
	{"unicode", `\bunicode\.`},
	{"bytes", `\bbytes\.`},
	{"reflect", `\breflect\.`},
	{"errors", `\berrors\.(New|Is|As|Join|Unwrap)\b`},
	{"unicode/utf8", `\butf8\.`},
}

const predeclListNode = "type ListNode struct {\n\tVal  int\n\tNext *ListNode\n}\n"
const predeclTreeNode = "type TreeNode struct {\n\tVal   int\n\tLeft  *TreeNode\n\tRight *TreeNode\n}\n"

func runCheck(root, prefix string) int {
	c := LoadContent(newContentFS(filepath.Join(root, "content"), true))
	for _, e := range c.Errors {
		fmt.Println("CONTENT:", e)
	}
	dir, err := os.MkdirTemp("", "algotrain-check-")
	if err != nil {
		fmt.Println(err)
		return 2
	}
	defer os.RemoveAll(dir)
	os.WriteFile(filepath.Join(dir, "go.mod"), []byte("module check\n\ngo 1.22\n"), 0o644)

	where := map[string]string{}
	for _, p := range c.Problems {
		if prefix != "" && !strings.HasPrefix(p.ID, prefix) {
			continue
		}
		for i, s := range p.Solutions {
			if s.Lang != "go" || strings.TrimSpace(s.Code) == "" {
				continue
			}
			pkg := fmt.Sprintf("s_%s_%d", strings.ReplaceAll(p.ID, "-", "_"), i+1)
			where[pkg] = fmt.Sprintf("%s → %q (%s)", p.ID, s.Title, p.File)
			var b strings.Builder
			b.WriteString("package " + pkg + "\n\n")
			code := s.Code
			var imps []string
			for _, im := range stdImports {
				if regexp.MustCompile(im.re).MatchString(code) && !strings.Contains(code, `"`+im.path+`"`) {
					imps = append(imps, im.path)
				}
			}
			sort.Strings(imps)
			if len(imps) > 0 && !strings.Contains(code, "import") {
				b.WriteString("import (\n")
				for _, im := range imps {
					b.WriteString("\t\"" + im + "\"\n")
				}
				b.WriteString(")\n\n")
			}
			if !regexp.MustCompile(`type\s+ListNode\b`).MatchString(code) {
				b.WriteString(predeclListNode)
			}
			if !regexp.MustCompile(`type\s+TreeNode\b`).MatchString(code) {
				b.WriteString(predeclTreeNode)
			}
			b.WriteString("var _ *ListNode\nvar _ *TreeNode\n\n")
			b.WriteString(code + "\n")
			pd := filepath.Join(dir, pkg)
			os.MkdirAll(pd, 0o755)
			os.WriteFile(filepath.Join(pd, "sol.go"), []byte(b.String()), 0o644)
		}
	}
	fmt.Printf("Проверяю %d решений…\n", len(where))
	cmd := exec.Command("go", "vet", "./...")
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err == nil {
		fmt.Println("OK: все решения компилируются и проходят go vet")
		return 0
	}
	fails := map[string]bool{}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "vet: ")
		pkg := strings.SplitN(strings.TrimPrefix(filepath.ToSlash(line), "./"), "/", 2)[0]
		if w, ok := where[pkg]; ok {
			fails[pkg] = true
			fmt.Printf("FAIL %s\n     %s\n", w, line)
		} else {
			fmt.Println(line)
		}
	}
	fmt.Printf("\nОшибок в %d решениях из %d\n", len(fails), len(where))
	return 1
}
