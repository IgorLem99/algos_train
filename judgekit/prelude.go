//go:build ignore

// Этот файл не компилируется вместе с сервером: он подкладывается в каждую
// сборку пользовательского решения (см. judge.go). Здесь — тестовый движок
// и хелперы, которыми пользуются тесты задач (content/judge/*.md).
//
// Все имена начинаются с J/j, чтобы не конфликтовать с кодом пользователя.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"reflect"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"time"
)

// Judge — контекст тестов. Тесты задачи объявляют func judgeTests(t *Judge).
type Judge struct {
	idx   int
	limit int
	out   *os.File
}

// JOpt — опции сравнения в Case.
type JOpt int

const (
	JAnyOrder     JOpt = 1 << iota // порядок элементов верхнего уровня не важен
	JAnyOrderDeep                  // порядок не важен на всех уровнях вложенности
	JFloat                         // числа сравниваются с точностью 1e-5
)

func main() {
	debug.SetMaxStack(128 << 20) // 128 МБ: глубокая рекурсия до ~10^6 уровней, при этом укладываемся в лимит памяти
	out, err := os.OpenFile(os.Getenv("JUDGE_OUT"), os.O_WRONLY|os.O_APPEND, 0)
	if err != nil {
		fmt.Fprintln(os.Stderr, "judge: нет файла результатов:", err)
		os.Exit(3)
	}
	limit, _ := strconv.Atoi(os.Getenv("JUDGE_LIMIT"))
	t := &Judge{limit: limit, out: out}
	judgeTests(t)
	t.emit(map[string]any{"done": true, "count": t.idx})
}

func (t *Judge) emit(v map[string]any) {
	b, _ := json.Marshal(v)
	t.out.Write(append(b, '\n'))
}

func (t *Judge) skip() bool { return t.limit > 0 && t.idx >= t.limit }

// Case — тест с ожидаемым значением. run вызывает решение и возвращает результат.
// *ListNode сравнивается как список значений, *TreeNode — как массив в порядке
// обхода в ширину (как на LeetCode), nil-срез равен пустому.
func (t *Judge) Case(input string, want any, run func() any, opts ...JOpt) {
	if t.skip() {
		return
	}
	var o JOpt
	for _, x := range opts {
		o |= x
	}
	w := jNorm(want, o)
	ws := jShow(w)
	t.exec(input, ws, func() (string, bool) {
		g := jNorm(run(), o)
		gs := jShow(g)
		if o&JFloat != 0 {
			return gs, jFloatEq(w, g)
		}
		return gs, ws == gs
	})
}

// Check — тест с произвольной проверкой (когда правильных ответов несколько).
// want — словесное описание ожидаемого; run возвращает полученное значение и вердикт.
func (t *Judge) Check(input, want string, run func() (got any, ok bool)) {
	if t.skip() {
		return
	}
	t.exec(input, want, func() (string, bool) {
		got, ok := run()
		return jShow(jNorm(got, 0)), ok
	})
}

func (t *Judge) exec(input, want string, f func() (string, bool)) {
	i := t.idx
	t.idx++
	t.emit(map[string]any{"start": i, "input": jCut(input, 2000)})
	res := map[string]any{"i": i, "input": jCut(input, 2000), "want": jCut(want, 4000)}
	start := time.Now()
	func() {
		defer func() {
			if r := recover(); r != nil {
				res["err"] = fmt.Sprint("panic: ", r) + jStack()
				res["ok"] = false
			}
		}()
		got, ok := f()
		res["got"], res["ok"] = jCut(got, 4000), ok
	}()
	res["ms"] = float64(time.Since(start).Microseconds()) / 1000
	t.emit(res)
}

// jStack оставляет из стека только кадры кода пользователя (solution.go).
func jStack() string {
	lines := strings.Split(string(debug.Stack()), "\n")
	var b strings.Builder
	for i := 1; i < len(lines); i++ {
		l := strings.TrimSpace(lines[i])
		p := strings.Index(l, "solution.go:")
		if p < 0 {
			continue
		}
		loc := l[p:]
		if sp := strings.IndexByte(loc, ' '); sp > 0 {
			loc = loc[:sp]
		}
		fn := strings.TrimSpace(lines[i-1])
		if k := strings.LastIndexByte(fn, '('); k > 0 {
			fn = fn[:k]
		}
		fn = strings.TrimPrefix(fn, "main.")
		fmt.Fprintf(&b, "\n    в %s (%s)", fn, loc)
	}
	return b.String()
}

func jCut(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

// ---------- нормализация и печать значений ----------

var (
	jListType = reflect.TypeOf((*ListNode)(nil))
	jTreeType = reflect.TypeOf((*TreeNode)(nil))
)

func jNorm(v any, o JOpt) any {
	r := jGen(reflect.ValueOf(v), 0)
	if o&JAnyOrderDeep != 0 {
		r = jSortDeep(r)
	} else if o&JAnyOrder != 0 {
		r = jSortTop(r)
	}
	return r
}

type jRaw string // уже отформатированное значение (структуры и т.п.)

func jGen(v reflect.Value, depth int) any {
	if !v.IsValid() {
		return nil
	}
	if depth > 64 {
		return jRaw("…")
	}
	switch v.Type() {
	case jListType:
		vals := JListVals(v.Interface().(*ListNode))
		out := make([]any, len(vals))
		for i, x := range vals {
			out[i] = int64(x)
		}
		return out
	case jTreeType:
		return JTreeVals(v.Interface().(*TreeNode))
	}
	switch v.Kind() {
	case reflect.Interface, reflect.Pointer:
		if v.IsNil() {
			return nil
		}
		return jGen(v.Elem(), depth+1)
	case reflect.Bool:
		return v.Bool()
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int()
	case reflect.Uint8:
		return string(rune(v.Uint()))
	case reflect.Uint, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return int64(v.Uint())
	case reflect.Float32, reflect.Float64:
		return v.Float()
	case reflect.String:
		return v.String()
	case reflect.Slice, reflect.Array:
		if v.Type().Elem().Kind() == reflect.Uint8 {
			b := make([]byte, v.Len())
			for i := range b {
				b[i] = byte(v.Index(i).Uint())
			}
			return string(b)
		}
		out := make([]any, v.Len())
		for i := range out {
			out[i] = jGen(v.Index(i), depth+1)
		}
		return out
	case reflect.Map:
		keys := v.MapKeys()
		m := make(map[string]any, len(keys))
		for _, k := range keys {
			m[jShow(jGen(k, depth+1))] = jGen(v.MapIndex(k), depth+1)
		}
		return m
	}
	return jRaw(fmt.Sprintf("%+v", v.Interface()))
}

func jShow(v any) string {
	var b strings.Builder
	jWrite(&b, v)
	return b.String()
}

// jWrite печатает значение целиком: по этой строке идёт сравнение, поэтому
// обрезать её нельзя (обрезается только показ в отчёте — jCut).
func jWrite(b *strings.Builder, v any) {
	if b.Len() > 64<<20 {
		panic("judge: результат больше 64 МБ")
	}
	switch x := v.(type) {
	case nil:
		b.WriteString("null")
	case bool:
		b.WriteString(strconv.FormatBool(x))
	case int64:
		b.WriteString(strconv.FormatInt(x, 10))
	case float64:
		b.WriteString(strconv.FormatFloat(x, 'f', -1, 64))
	case string:
		b.WriteString(strconv.Quote(x))
	case jRaw:
		b.WriteString(string(x))
	case []any:
		b.WriteByte('[')
		for i, e := range x {
			if i > 0 {
				b.WriteByte(',')
			}
			jWrite(b, e)
		}
		b.WriteByte(']')
	case map[string]any:
		keys := make([]string, 0, len(x))
		for k := range x {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		b.WriteByte('{')
		for i, k := range keys {
			if i > 0 {
				b.WriteByte(',')
			}
			b.WriteString(k + ":")
			jWrite(b, x[k])
		}
		b.WriteByte('}')
	default:
		fmt.Fprintf(b, "%v", x)
	}
}

func jSortTop(v any) any {
	s, ok := v.([]any)
	if !ok {
		return v
	}
	c := append([]any(nil), s...)
	sort.SliceStable(c, func(i, j int) bool { return jShow(c[i]) < jShow(c[j]) })
	return c
}

func jSortDeep(v any) any {
	s, ok := v.([]any)
	if !ok {
		return v
	}
	c := make([]any, len(s))
	for i, e := range s {
		c[i] = jSortDeep(e)
	}
	return jSortTop(c)
}

func jFloatEq(a, b any) bool {
	fa, okA := jNum(a)
	fb, okB := jNum(b)
	if okA && okB {
		d := math.Abs(fa - fb)
		return d <= 1e-5 || d <= 1e-5*math.Max(math.Abs(fa), math.Abs(fb))
	}
	sa, okA := a.([]any)
	sb, okB := b.([]any)
	if okA && okB {
		if len(sa) != len(sb) {
			return false
		}
		for i := range sa {
			if !jFloatEq(sa[i], sb[i]) {
				return false
			}
		}
		return true
	}
	return jShow(a) == jShow(b)
}

func jNum(v any) (float64, bool) {
	switch x := v.(type) {
	case int64:
		return float64(x), true
	case float64:
		return x, true
	}
	return 0, false
}

// ---------- хелперы для тестов ----------

// JShow форматирует значение так же, как в отчёте о тестах: JShow([]any{1, nil, 2}) == "[1,null,2]".
func JShow(v any) string { return jShow(jNorm(v, 0)) }

// JList строит связный список: JList(1, 2, 3).
func JList(vals ...int) *ListNode {
	dummy := &ListNode{}
	cur := dummy
	for _, v := range vals {
		cur.Next = &ListNode{Val: v}
		cur = cur.Next
	}
	return dummy.Next
}

// JListVals возвращает значения списка (не более 100000 — защита от циклов).
func JListVals(h *ListNode) []int {
	out := []int{}
	for n := 0; h != nil && n < 100000; n++ {
		out = append(out, h.Val)
		h = h.Next
	}
	return out
}

// JListNode возвращает i-й узел списка (0-based) или nil.
func JListNode(h *ListNode, i int) *ListNode {
	for ; h != nil && i > 0; i-- {
		h = h.Next
	}
	return h
}

// JTree строит дерево из массива в порядке обхода в ширину, nil — нет узла:
// JTree(3, 9, 20, nil, nil, 15, 7).
func JTree(vals ...any) *TreeNode {
	if len(vals) == 0 || vals[0] == nil {
		return nil
	}
	root := &TreeNode{Val: vals[0].(int)}
	q := []*TreeNode{root}
	for i := 1; i < len(vals) && len(q) > 0; {
		n := q[0]
		q = q[1:]
		if i < len(vals) && vals[i] != nil {
			n.Left = &TreeNode{Val: vals[i].(int)}
			q = append(q, n.Left)
		}
		i++
		if i < len(vals) && vals[i] != nil {
			n.Right = &TreeNode{Val: vals[i].(int)}
			q = append(q, n.Right)
		}
		i++
	}
	return root
}

// JTreeVals — обратное к JTree: обход в ширину с nil, хвостовые nil обрезаются.
func JTreeVals(root *TreeNode) []any {
	out := []any{}
	q := []*TreeNode{root}
	for len(q) > 0 && len(out) < 200000 {
		n := q[0]
		q = q[1:]
		if n == nil {
			out = append(out, nil)
			continue
		}
		out = append(out, int64(n.Val))
		q = append(q, n.Left, n.Right)
	}
	for len(out) > 0 && out[len(out)-1] == nil {
		out = out[:len(out)-1]
	}
	return out
}

// JFind ищет узел дерева по значению (для задач вида LCA).
func JFind(root *TreeNode, val int) *TreeNode {
	if root == nil || root.Val == val {
		return root
	}
	if l := JFind(root.Left, val); l != nil {
		return l
	}
	return JFind(root.Right, val)
}

// JClone копирует срез (решение может менять входные данные).
func JClone[T any](s []T) []T { return append([]T{}, s...) }

// JClone2 копирует двумерный срез.
func JClone2[T any](s [][]T) [][]T {
	out := make([][]T, len(s))
	for i := range s {
		out[i] = append([]T{}, s[i]...)
	}
	return out
}

// JBoard строит [][]byte из строк: JBoard("XXO", "OXO").
func JBoard(rows ...string) [][]byte {
	out := make([][]byte, len(rows))
	for i, r := range rows {
		out[i] = []byte(r)
	}
	return out
}
