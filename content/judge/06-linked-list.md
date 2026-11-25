---
id: reverse-linked-list
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reverseList(head *ListNode) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	for _, c := range [][]int{{1, 2, 3, 4, 5}, {1, 2}, {}, {7}, {5, 5, 1, 5}} {
		want := make([]int, len(c))
		for i, v := range c {
			want[len(c)-1-i] = v
		}
		t.Case(fmt.Sprintf("head = %v", c), want, func() any {
			return reverseList(JList(c...))
		})
	}
	big := make([]int, 100000)
	for i := range big {
		big[i] = i
	}
	t.Case("head = [0, 1, …, 99999]", "первый 99999, последний 0, длина 100000", func() any {
		v := JListVals(reverseList(JList(big...)))
		if len(v) == 100000 && v[0] == 99999 && v[99999] == 0 {
			return "первый 99999, последний 0, длина 100000"
		}
		return fmt.Sprintf("длина %d", len(v))
	})
}
```

---
id: merge-two-sorted-lists
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	merged := func(a, b []int) []int {
		r := append(append([]int{}, a...), b...)
		sort.Ints(r)
		return r
	}
	t.Case("list1 = [1 2 4], list2 = [1 3 4]", []int{1, 1, 2, 3, 4, 4}, func() any {
		return mergeTwoLists(JList(1, 2, 4), JList(1, 3, 4))
	})
	t.Case("list1 = [], list2 = []", []int{}, func() any {
		return mergeTwoLists(nil, nil)
	})
	t.Case("list1 = [], list2 = [0]", []int{0}, func() any {
		return mergeTwoLists(nil, JList(0))
	})
	for _, c := range [][2][]int{
		{{5}, {}},
		{{1, 2, 3}, {4, 5, 6}},
		{{4, 5, 6}, {1, 2, 3}},
		{{1, 1, 1}, {1, 1}},
		{{-10, -3, 0, 7}, {-5, -3, 2, 100}},
		{{2}, {1}},
		{{1, 3, 5, 7, 9}, {2}},
	} {
		a, b := c[0], c[1]
		t.Case(fmt.Sprintf("list1 = %v, list2 = %v", a, b), merged(a, b), func() any {
			return mergeTwoLists(JList(a...), JList(b...))
		})
	}
	x := uint32(2024)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	gen := func(n int) []int {
		r := make([]int, n)
		for i := range r {
			r[i] = next(1000) - 500
		}
		sort.Ints(r)
		return r
	}
	a, b := gen(50000), gen(30000)
	want := merged(a, b)
	t.Case("два списка длиной 50000 и 30000 (случайные отсортированные)", want, func() any {
		return mergeTwoLists(JList(a...), JList(b...))
	})
}
```

---
id: linked-list-cycle
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func hasCycle(head *ListNode) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// pos < 0 — цикла нет, иначе хвост ведёт на узел с индексом pos
	build := func(vals []int, pos int) *ListNode {
		h := JList(vals...)
		if pos >= 0 && len(vals) > 0 {
			tail := JListNode(h, len(vals)-1)
			tail.Next = JListNode(h, pos)
		}
		return h
	}
	run := func(vals []int, pos int, want bool) {
		name := fmt.Sprintf("head = %v, хвост ведёт на индекс %d", vals, pos)
		if len(vals) > 20 {
			name = fmt.Sprintf("%d узлов, хвост ведёт на индекс %d", len(vals), pos)
		}
		t.Case(name, want, func() any {
			return hasCycle(build(vals, pos))
		})
	}
	run([]int{3, 2, 0, -4}, 1, true)
	run([]int{1, 2}, 0, true)
	run([]int{1}, -1, false)
	run([]int{}, -1, false)
	run([]int{1}, 0, true)
	run([]int{1, 2}, -1, false)
	run([]int{1, 2, 3, 4, 5}, 4, true)
	run([]int{1, 2, 3, 4, 5}, -1, false)
	run([]int{1, 1, 1, 1}, -1, false)
	run([]int{1, 1, 1, 1}, 2, true)
	big := make([]int, 10000)
	for i := range big {
		big[i] = i % 7
	}
	run(big, -1, false)
	run(big, 0, true)
	run(big, 5000, true)
	run(big, 9999, true)
}
```

---
id: reorder-list
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reorderList(head *ListNode) {

}
```

```go tests
func judgeTests(t *Judge) {
	want := func(c []int) []int {
		r := make([]int, 0, len(c))
		i, j := 0, len(c)-1
		for i <= j {
			r = append(r, c[i])
			i++
			if i <= j {
				r = append(r, c[j])
				j--
			}
		}
		return r
	}
	run := func(c []int) {
		t.Case(fmt.Sprintf("head = %v", c), want(c), func() any {
			h := JList(c...)
			reorderList(h)
			return h
		})
	}
	t.Case("head = [1 2 3 4]", []int{1, 4, 2, 3}, func() any {
		h := JList(1, 2, 3, 4)
		reorderList(h)
		return h
	})
	t.Case("head = [1 2 3 4 5]", []int{1, 5, 2, 4, 3}, func() any {
		h := JList(1, 2, 3, 4, 5)
		reorderList(h)
		return h
	})
	t.Case("head = [1]", []int{1}, func() any {
		h := JList(1)
		reorderList(h)
		return h
	})
	run([]int{1, 2})
	run([]int{1, 2, 3})
	run([]int{1, 2, 3, 4, 5, 6})
	run([]int{1, 2, 3, 4, 5, 6, 7})
	run([]int{5, 5, 5, 5})
	run([]int{9, 1, 8, 2, 7, 3, 6, 4})
	big := make([]int, 50000)
	for i := range big {
		big[i] = i
	}
	t.Case("head = [0, 1, …, 49999]", want(big), func() any {
		h := JList(big...)
		reorderList(h)
		return h
	})
}
```

---
id: remove-nth-node-from-end-of-list
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func removeNthFromEnd(head *ListNode, n int) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	run := func(name string, c []int, n int) {
		w := append(append([]int{}, c[:len(c)-n]...), c[len(c)-n+1:]...)
		t.Case(name, w, func() any {
			return removeNthFromEnd(JList(c...), n)
		})
	}
	t.Case("head = [1 2 3 4 5], n = 2", []int{1, 2, 3, 5}, func() any {
		return removeNthFromEnd(JList(1, 2, 3, 4, 5), 2)
	})
	t.Case("head = [1], n = 1", []int{}, func() any {
		return removeNthFromEnd(JList(1), 1)
	})
	t.Case("head = [1 2], n = 1", []int{1}, func() any {
		return removeNthFromEnd(JList(1, 2), 1)
	})
	small := func(c []int, n int) { run(fmt.Sprintf("head = %v, n = %d", c, n), c, n) }
	small([]int{1, 2}, 2)
	small([]int{1, 2, 3}, 2)
	small([]int{1, 2, 3}, 3)
	small([]int{1, 2, 3}, 1)
	small([]int{7, 7, 7, 7}, 2)
	big := make([]int, 50000)
	for i := range big {
		big[i] = i
	}
	run("head = [0 … 49999], n = 1", big, 1)
	run("head = [0 … 49999], n = 25000", big, 25000)
	run("head = [0 … 49999], n = 50000", big, 50000)
}
```

---
id: copy-list-with-random-pointer
---
```go starter
/**
 * Definition for a Node.
 * type Node struct {
 *     Val int
 *     Next *Node
 *     Random *Node
 * }
 */
func copyRandomList(head *Node) *Node {

}
```

```go types
type Node struct {
	Val    int
	Next   *Node
	Random *Node
}
```

```go tests
func judgeTests(t *Judge) {
	// rnd[i] — индекс узла, на который указывает Random i-го узла, или -1
	build := func(vals, rnd []int) (*Node, []*Node) {
		nodes := make([]*Node, len(vals))
		for i, v := range vals {
			nodes[i] = &Node{Val: v}
		}
		for i := range nodes {
			if i+1 < len(nodes) {
				nodes[i].Next = nodes[i+1]
			}
			if rnd[i] >= 0 {
				nodes[i].Random = nodes[rnd[i]]
			}
		}
		if len(nodes) == 0 {
			return nil, nodes
		}
		return nodes[0], nodes
	}
	// описание структуры списка: [[val,randomIndex],...]
	describe := func(h *Node) string {
		idx := map[*Node]int{}
		i := 0
		for n := h; n != nil && i < 100000; n = n.Next {
			idx[n] = i
			i++
		}
		s := "["
		i = 0
		for n := h; n != nil && i < 100000; n = n.Next {
			r := -1
			if n.Random != nil {
				if k, ok := idx[n.Random]; ok {
					r = k
				} else {
					r = -2 // Random указывает на узел вне списка
				}
			}
			if i > 0 {
				s += ","
			}
			s += fmt.Sprintf("[%d,%d]", n.Val, r)
			i++
		}
		return s + "]"
	}
	short := func(s string) string {
		if len(s) > 150 {
			return s[:150] + "…"
		}
		return s
	}
	run := func(name string, vals, rnd []int) {
		h0, _ := build(vals, rnd)
		wantDesc := describe(h0)
		t.Check(name, "новые узлы, те же значения и Random: "+short(wantDesc), func() (any, bool) {
			h, nodes := build(vals, rnd)
			got := copyRandomList(h)
			if len(vals) == 0 {
				return fmt.Sprint(got), got == nil
			}
			if got == nil {
				return "nil", false
			}
			orig := map[*Node]bool{}
			for _, n := range nodes {
				orig[n] = true
			}
			cnt := 0
			for n := got; n != nil && cnt <= len(vals); n = n.Next {
				if orig[n] {
					return "в копии остался исходный узел", false
				}
				if n.Random != nil && orig[n.Random] {
					return "Random копии ведёт в исходный список", false
				}
				cnt++
			}
			// исходный список не должен измениться
			for i, n := range nodes {
				var nx *Node
				if i+1 < len(nodes) {
					nx = nodes[i+1]
				}
				var rr *Node
				if rnd[i] >= 0 {
					rr = nodes[rnd[i]]
				}
				if n.Next != nx || n.Random != rr || n.Val != vals[i] {
					return "исходный список изменён", false
				}
			}
			d := describe(got)
			return short(d), d == wantDesc
		})
	}
	run("[[7,nil],[13,0],[11,4],[10,2],[1,0]]", []int{7, 13, 11, 10, 1}, []int{-1, 0, 4, 2, 0})
	run("[[1,1],[2,1]]", []int{1, 2}, []int{1, 1})
	run("[[3,nil],[3,0],[3,nil]]", []int{3, 3, 3}, []int{-1, 0, -1})
	run("[]", []int{}, []int{})
	run("[[5,0]] (Random на себя)", []int{5}, []int{0})
	run("[[5,nil]]", []int{5}, []int{-1})
	run("[[1,2],[2,0],[3,1]]", []int{1, 2, 3}, []int{2, 0, 1})
	run("[[1,nil],[2,nil],[3,nil],[4,nil]]", []int{1, 2, 3, 4}, []int{-1, -1, -1, -1})
	x := uint32(777)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	n := 1000
	vals, rnd := make([]int, n), make([]int, n)
	for i := range vals {
		vals[i] = next(21) - 10
		rnd[i] = next(n+1) - 1
	}
	run("1000 узлов, случайные Random", vals, rnd)
}
```

---
id: add-two-numbers
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	// сложение «в столбик» над срезами цифр (младший разряд первым)
	add := func(a, b []int) []int {
		r := []int{}
		carry := 0
		for i := 0; i < len(a) || i < len(b) || carry > 0; i++ {
			s := carry
			if i < len(a) {
				s += a[i]
			}
			if i < len(b) {
				s += b[i]
			}
			r = append(r, s%10)
			carry = s / 10
		}
		return r
	}
	t.Case("l1 = [2 4 3], l2 = [5 6 4]", []int{7, 0, 8}, func() any {
		return addTwoNumbers(JList(2, 4, 3), JList(5, 6, 4))
	})
	t.Case("l1 = [0], l2 = [0]", []int{0}, func() any {
		return addTwoNumbers(JList(0), JList(0))
	})
	t.Case("l1 = [9 9 9 9 9 9 9], l2 = [9 9 9 9]", []int{8, 9, 9, 9, 0, 0, 0, 1}, func() any {
		return addTwoNumbers(JList(9, 9, 9, 9, 9, 9, 9), JList(9, 9, 9, 9))
	})
	t.Case("l1 = [5], l2 = [5]", []int{0, 1}, func() any {
		return addTwoNumbers(JList(5), JList(5))
	})
	t.Case("l1 = [1], l2 = [9 9 9]", []int{0, 0, 0, 1}, func() any {
		return addTwoNumbers(JList(1), JList(9, 9, 9))
	})
	t.Case("l1 = [0], l2 = [1 2 3]", []int{1, 2, 3}, func() any {
		return addTwoNumbers(JList(0), JList(1, 2, 3))
	})
	t.Case("l1 = [1 8], l2 = [0]", []int{1, 8}, func() any {
		return addTwoNumbers(JList(1, 8), JList(0))
	})
	x := uint32(31337)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	gen := func(n int) []int {
		r := make([]int, n)
		for i := range r {
			r[i] = next(10)
		}
		if n > 1 && r[n-1] == 0 {
			r[n-1] = 1
		}
		return r
	}
	for _, sz := range [][2]int{{100, 100}, {100, 37}, {2000, 1500}} {
		a, b := gen(sz[0]), gen(sz[1])
		t.Case(fmt.Sprintf("случайные числа из %d и %d цифр", sz[0], sz[1]), add(a, b), func() any {
			return addTwoNumbers(JList(a...), JList(b...))
		})
	}
	nines := make([]int, 1000)
	for i := range nines {
		nines[i] = 9
	}
	t.Case("999…9 (1000 цифр) + 1", add(nines, []int{1}), func() any {
		return addTwoNumbers(JList(nines...), JList(1))
	})
}
```

---
id: find-the-duplicate-number
---
```go starter
func findDuplicate(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	run := func(nums []int, want int) {
		name := fmt.Sprintf("nums = %v", nums)
		if len(nums) > 30 {
			name = fmt.Sprintf("%d элементов, значения 1..%d", len(nums), len(nums)-1)
		}
		t.Case(name, want, func() any {
			return findDuplicate(JClone(nums))
		})
	}
	run([]int{1, 3, 4, 2, 2}, 2)
	run([]int{3, 1, 3, 4, 2}, 3)
	run([]int{3, 3, 3, 3, 3}, 3)
	run([]int{1, 1}, 1)
	run([]int{1, 1, 2}, 1)
	run([]int{2, 2, 2}, 2)
	run([]int{1, 4, 4, 2, 4}, 4)
	run([]int{2, 5, 9, 6, 9, 3, 8, 9, 7, 1}, 9)
	x := uint32(99)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	// длина n+1, значения 1..n, число d встречается k раз, остальные различны
	gen := func(n, d, k int) []int {
		r := make([]int, 0, n+1)
		for i := 0; i < k; i++ {
			r = append(r, d)
		}
		for v := 1; v <= n && len(r) < n+1; v++ {
			if v != d {
				r = append(r, v)
			}
		}
		for i := len(r) - 1; i > 0; i-- {
			j := next(i + 1)
			r[i], r[j] = r[j], r[i]
		}
		return r
	}
	run(gen(100000, 77777, 2), 77777)
	run(gen(100000, 1, 6), 1)
	run(gen(100000, 100000, 3), 100000)
	run(gen(50000, 25000, 40), 25000)
}
```

---
id: lru-cache
---
```go starter
type LRUCache struct {

}

func Constructor(capacity int) LRUCache {

}

func (this *LRUCache) Get(key int) int {

}

func (this *LRUCache) Put(key int, value int) {

}
```

```go tests
func judgeTests(t *Judge) {
	// операции: {0, key} — Get, {1, key, value} — Put; результат — значения всех Get
	type op [3]int
	get := func(k int) op { return op{0, k, 0} }
	put := func(k, v int) op { return op{1, k, v} }
	describe := func(ops []op) string {
		s := ""
		for i, o := range ops {
			if i > 0 {
				s += " "
			}
			if o[0] == 0 {
				s += fmt.Sprintf("get(%d)", o[1])
			} else {
				s += fmt.Sprintf("put(%d,%d)", o[1], o[2])
			}
		}
		return s
	}
	// наивная модель: срез записей от самой старой к самой свежей
	model := func(capacity int, ops []op) []int {
		type kv struct{ k, v int }
		var m []kv
		find := func(k int) int {
			for i, e := range m {
				if e.k == k {
					return i
				}
			}
			return -1
		}
		out := []int{}
		for _, o := range ops {
			i := find(o[1])
			if o[0] == 0 {
				if i < 0 {
					out = append(out, -1)
					continue
				}
				e := m[i]
				m = append(append(m[:i:i], m[i+1:]...), e)
				out = append(out, e.v)
				continue
			}
			if i >= 0 {
				m = append(m[:i:i], m[i+1:]...)
			} else if len(m) == capacity {
				m = m[1:]
			}
			m = append(m, kv{o[1], o[2]})
		}
		return out
	}
	run := func(name string, capacity int, ops []op, want []int) {
		t.Case(name, want, func() any {
			c := Constructor(capacity)
			out := []int{}
			for _, o := range ops {
				if o[0] == 0 {
					out = append(out, c.Get(o[1]))
				} else {
					c.Put(o[1], o[2])
				}
			}
			return out
		})
	}
	// примеры
	ops1 := []op{put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)}
	run("cap = 2: "+describe(ops1), 2, ops1, []int{1, -1, -1, 3, 4})
	ops2 := []op{put(1, 1), put(2, 2), get(1), put(3, 3), get(2)}
	run("cap = 2: "+describe(ops2), 2, ops2, []int{1, -1})
	ops3 := []op{get(5), put(5, 50), get(5), put(5, 51), get(5)}
	run("cap = 1: "+describe(ops3), 1, ops3, []int{-1, 50, 51})
	// дополнительные
	ops4 := []op{put(1, 1), put(2, 2), put(1, 10), put(3, 3), get(2), get(1), get(3)}
	run("cap = 2 (обновление освежает ключ): "+describe(ops4), 2, ops4, []int{-1, 10, 3})
	ops5 := []op{put(1, 1), put(2, 2), put(3, 3), put(4, 4), get(1), get(2), get(3), get(4)}
	run("cap = 3 (вытесняется самый старый): "+describe(ops5), 3, ops5, []int{-1, 2, 3, 4})
	ops6 := []op{put(1, 1), put(2, 2), put(3, 3), get(1), get(2), put(4, 4), get(3), get(1), get(2), get(4)}
	run("cap = 3 (get освежает ключ): "+describe(ops6), 3, ops6, []int{1, 2, -1, 1, 2, 4})
	ops7 := []op{put(2, 1), put(2, 2), get(2), put(1, 1), put(4, 1), get(2)}
	run("cap = 2 (повторный put): "+describe(ops7), 2, ops7, []int{2, -1})
	ops8 := []op{put(0, 0), get(0), put(1, 1), get(0), get(1)}
	run("cap = 1, ключ 0: "+describe(ops8), 1, ops8, []int{0, -1, 1})
	// случайные операции против наивной модели
	x := uint32(4242)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	random := func(n, keys int) []op {
		ops := make([]op, n)
		for i := range ops {
			k := next(keys)
			if next(2) == 0 {
				ops[i] = get(k)
			} else {
				ops[i] = put(k, next(1000))
			}
		}
		return ops
	}
	for _, p := range [][3]int{{3, 8, 3000}, {5, 10, 3000}, {50, 120, 20000}, {1000, 3000, 30000}} {
		capacity, keys, n := p[0], p[1], p[2]
		ops := random(n, keys)
		run(fmt.Sprintf("cap = %d, %d случайных get/put по ключам 0..%d", capacity, n, keys-1),
			capacity, ops, model(capacity, ops))
	}
}
```

---
id: merge-k-sorted-lists
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func mergeKLists(lists []*ListNode) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	run := func(name string, lists [][]int) {
		all := []int{}
		for _, l := range lists {
			all = append(all, l...)
		}
		sort.Ints(all)
		t.Case(name, all, func() any {
			ls := make([]*ListNode, len(lists))
			for i, l := range lists {
				ls[i] = JList(l...)
			}
			return mergeKLists(ls)
		})
	}
	run("lists = [[1 4 5] [1 3 4] [2 6]]", [][]int{{1, 4, 5}, {1, 3, 4}, {2, 6}})
	run("lists = []", [][]int{})
	run("lists = [[]]", [][]int{{}})
	run("lists = [[] [] []]", [][]int{{}, {}, {}})
	run("lists = [[1]]", [][]int{{1}})
	run("lists = [[] [5] []]", [][]int{{}, {5}, {}})
	run("lists = [[2] [1]]", [][]int{{2}, {1}})
	run("lists = [[-3 -1 0] [-2 -2 5] [10] [-5]]", [][]int{{-3, -1, 0}, {-2, -2, 5}, {10}, {-5}})
	run("lists = [[1 1 1] [1 1] [1]]", [][]int{{1, 1, 1}, {1, 1}, {1}})
	run("lists = [[1 2 3] [4 5 6] [7 8 9]]", [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}})
	x := uint32(555)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	random := func(k, per int) [][]int {
		ls := make([][]int, k)
		for i := range ls {
			l := make([]int, next(per+1))
			for j := range l {
				l[j] = next(20001) - 10000
			}
			sort.Ints(l)
			ls[i] = l
		}
		return ls
	}
	run("1000 случайных списков, до 20 узлов в каждом", random(1000, 20))
	run("10 случайных списков, до 1000 узлов в каждом", random(10, 1000))
	one := make([]int, 10000)
	for i := range one {
		one[i] = i
	}
	run("один список из 10000 узлов", [][]int{one})
	many := make([][]int, 10000)
	for i := range many {
		many[i] = []int{next(1000)}
	}
	run("10000 списков по одному узлу", many)
}
```

---
id: reverse-nodes-in-k-group
---
```go starter
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reverseKGroup(head *ListNode, k int) *ListNode {

}
```

```go tests
func judgeTests(t *Judge) {
	want := func(c []int, k int) []int {
		r := append([]int{}, c...)
		for i := 0; i+k <= len(r); i += k {
			for a, b := i, i+k-1; a < b; a, b = a+1, b-1 {
				r[a], r[b] = r[b], r[a]
			}
		}
		return r
	}
	run := func(name string, c []int, k int) {
		t.Case(name, want(c, k), func() any {
			return reverseKGroup(JList(c...), k)
		})
	}
	t.Case("head = [1 2 3 4 5], k = 2", []int{2, 1, 4, 3, 5}, func() any {
		return reverseKGroup(JList(1, 2, 3, 4, 5), 2)
	})
	t.Case("head = [1 2 3 4 5], k = 3", []int{3, 2, 1, 4, 5}, func() any {
		return reverseKGroup(JList(1, 2, 3, 4, 5), 3)
	})
	t.Case("head = [1], k = 1", []int{1}, func() any {
		return reverseKGroup(JList(1), 1)
	})
	small := func(c []int, k int) { run(fmt.Sprintf("head = %v, k = %d", c, k), c, k) }
	small([]int{1, 2, 3, 4, 5}, 1)
	small([]int{1, 2, 3, 4, 5}, 5)
	small([]int{1, 2, 3, 4, 5}, 4)
	small([]int{1, 2, 3, 4, 5, 6}, 3)
	small([]int{1, 2, 3, 4, 5, 6, 7}, 3)
	small([]int{1, 2}, 2)
	small([]int{1, 2, 3, 4, 5, 6, 7, 8}, 2)
	small([]int{4, 4, 1, 1, 9, 9}, 2)
	big := make([]int, 20000)
	for i := range big {
		big[i] = i
	}
	run("head = [0 … 19999], k = 3", big, 3)
	run("head = [0 … 19999], k = 7", big, 7)
	run("head = [0 … 19999], k = 20000", big, 20000)
	run("head = [0 … 19999], k = 1", big, 1)
}
```
