---
id: min-stack
---
```go starter
type MinStack struct {

}

func Constructor() MinStack {

}

func (this *MinStack) Push(val int) {

}

func (this *MinStack) Pop() {

}

func (this *MinStack) Top() int {

}

func (this *MinStack) GetMin() int {

}
```

```go tests
func judgeTests(t *Judge) {
	t.Case("push(-2) push(0) push(-3) getMin() pop() top() getMin()", []int{-3, 0, -2}, func() any {
		s := Constructor()
		s.Push(-2)
		s.Push(0)
		s.Push(-3)
		out := []int{s.GetMin()}
		s.Pop()
		out = append(out, s.Top(), s.GetMin())
		return out
	})
	t.Case("push(1) push(1) push(2) getMin() pop() pop() getMin() top()", []int{1, 1, 1}, func() any {
		s := Constructor()
		s.Push(1)
		s.Push(1)
		s.Push(2)
		out := []int{s.GetMin()}
		s.Pop()
		s.Pop()
		return append(out, s.GetMin(), s.Top())
	})
	t.Case("push(2147483647) push(-2147483648) getMin() pop() getMin()", []int{-2147483648, 2147483647}, func() any {
		s := Constructor()
		s.Push(2147483647)
		s.Push(-2147483648)
		out := []int{s.GetMin()}
		s.Pop()
		return append(out, s.GetMin())
	})
	// случайная последовательность операций против наивной модели
	t.Case("10000 случайных операций push/pop/top/getMin", "совпадает с эталоном", func() any {
		s := Constructor()
		var model []int
		x := uint32(12345)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % 2001) - 1000 }
		for i := 0; i < 10000; i++ {
			op := next() & 3
			if len(model) == 0 || op <= 1 {
				v := next()
				s.Push(v)
				model = append(model, v)
				continue
			}
			switch op {
			case 2:
				s.Pop()
				model = model[:len(model)-1]
			case 3:
				m := model[0]
				for _, v := range model {
					m = min(m, v)
				}
				if s.GetMin() != m || s.Top() != model[len(model)-1] {
					return fmt.Sprintf("расхождение на операции %d", i+1)
				}
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: valid-parentheses
---
```go starter
func isValid(s string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s    string
		want bool
	}{
		{"()[]{}", true},
		{"(]", false},
		{"([)]", false},
		{"(", false},
		{")", false},
		{"((", false},
		{"))", false},
		{"{[]}", true},
		{"([{}])", true},
		{"(){}}{", false},
		{"[({})]]", false},
		{"()))((", false},
		{"{{{{}}}}", true},
		{"{[}]", false},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q", c.s), c.want, func() any {
			return isValid(c.s)
		})
	}
	t.Case("s = «(» × 5000 + «)» × 5000", true, func() any {
		return isValid(strings.Repeat("(", 5000) + strings.Repeat(")", 5000))
	})
	t.Case("s = «(» × 5000 + «)» × 4999 + «]»", false, func() any {
		return isValid(strings.Repeat("(", 5000) + strings.Repeat(")", 4999) + "]")
	})
	t.Case("s = «()» × 5000", true, func() any {
		return isValid(strings.Repeat("()", 5000))
	})
	t.Case("s = «([{» × 1666 + «}])» × 1666", true, func() any {
		return isValid(strings.Repeat("([{", 1666) + strings.Repeat("}])", 1666))
	})
	t.Case("s = «([{» × 1666 + «})]» × 1666", false, func() any {
		return isValid(strings.Repeat("([{", 1666) + strings.Repeat("})]", 1666))
	})
	t.Case("300 случайных строк длиной до 12", "0 расхождений", func() any {
		brute := func(s string) bool {
			for {
				u := strings.ReplaceAll(s, "()", "")
				u = strings.ReplaceAll(u, "[]", "")
				u = strings.ReplaceAll(u, "{}", "")
				if len(u) == len(s) {
					return len(s) == 0
				}
				s = u
			}
		}
		x := uint32(2463534242)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 4) }
		alpha := "()[]{}"
		bad := 0
		for i := 0; i < 300; i++ {
			n := 1 + next()%12
			b := make([]byte, n)
			for j := range b {
				b[j] = alpha[next()%6]
			}
			if isValid(string(b)) != brute(string(b)) {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: evaluate-reverse-polish-notation
---
```go starter
func evalRPN(tokens []string) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tokens []string
		want   int
	}{
		{[]string{"2", "1", "+", "3", "*"}, 9},
		{[]string{"4", "13", "5", "/", "+"}, 6},
		{[]string{"10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"}, 22},
		{[]string{"18"}, 18},
		{[]string{"-7"}, -7},
		{[]string{"-7", "2", "/"}, -3},
		{[]string{"7", "-2", "/"}, -3},
		{[]string{"-7", "-2", "/"}, 3},
		{[]string{"3", "4", "-"}, -1},
		{[]string{"1", "2", "3", "4", "-", "-", "-"}, -2},
		{[]string{"0", "3", "/"}, 0},
		{[]string{"1", "3", "/"}, 0},
		{[]string{"-1", "3", "/"}, 0},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("tokens = %q", c.tokens), c.want, func() any {
			return evalRPN(JClone(c.tokens))
		})
	}
	// случайные выражения: значение считается во время построения
	build := func(seed uint32, depth int) ([]string, int) {
		x := seed
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 3) }
		var gen func(d int) ([]string, int)
		gen = func(d int) ([]string, int) {
			if d == 0 || next()%5 == 0 {
				v := next()%41 - 20
				return []string{strconv.Itoa(v)}, v
			}
			for {
				a, av := gen(d - 1)
				b, bv := gen(d - 1)
				op := next() % 4
				var v int
				switch op {
				case 0:
					v = av + bv
				case 1:
					v = av - bv
				case 2:
					v = av * bv
					if v > 1000000000 || v < -1000000000 {
						continue
					}
				case 3:
					if bv == 0 {
						continue
					}
					v = av / bv
				}
				toks := append(append(append([]string{}, a...), b...), string("+-*/"[op]))
				return toks, v
			}
		}
		return gen(depth)
	}
	for _, seed := range []uint32{1, 7, 42, 2024} {
		toks, want := build(seed*2654435761+1, 9)
		t.Case(fmt.Sprintf("случайное выражение из %d токенов (seed %d)", len(toks), seed), want, func() any {
			return evalRPN(JClone(toks))
		})
	}
	t.Case("«1» и 9999 раз «1 +» (около 20000 токенов)", 10000, func() any {
		toks := []string{"1"}
		for i := 0; i < 9999; i++ {
			toks = append(toks, "1", "+")
		}
		return evalRPN(toks)
	})
	t.Case("9999 единиц подряд, затем «0» и 9999 операторов «+»", 9999, func() any {
		toks := make([]string, 0, 20000)
		for i := 0; i < 9999; i++ {
			toks = append(toks, "1")
		}
		toks = append(toks, "0")
		for i := 0; i < 9999; i++ {
			toks = append(toks, "+")
		}
		return evalRPN(toks)
	})
}
```

---
id: generate-parentheses
---
```go starter
func generateParenthesis(n int) []string {

}
```

```go tests
func judgeTests(t *Judge) {
	t.Case("n = 3", []string{"((()))", "(()())", "(())()", "()(())", "()()()"}, func() any {
		return generateParenthesis(3)
	}, JAnyOrder)
	t.Case("n = 1", []string{"()"}, func() any {
		return generateParenthesis(1)
	}, JAnyOrder)
	t.Case("n = 2", []string{"(())", "()()"}, func() any {
		return generateParenthesis(2)
	}, JAnyOrder)
	t.Case("n = 4", []string{
		"(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()",
		"(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()",
	}, func() any {
		return generateParenthesis(4)
	}, JAnyOrder)
	// n = 5..8: количество (числа Каталана), уникальность и корректность каждой строки
	catalan := map[int]int{5: 42, 6: 132, 7: 429, 8: 1430}
	for n := 5; n <= 8; n++ {
		t.Check(fmt.Sprintf("n = %d", n), fmt.Sprintf("%d различных корректных строк длины %d", catalan[n], 2*n), func() (any, bool) {
			res := generateParenthesis(n)
			valid := func(s string) bool {
				if len(s) != 2*n {
					return false
				}
				bal := 0
				for _, c := range s {
					switch c {
					case '(':
						bal++
					case ')':
						bal--
					default:
						return false
					}
					if bal < 0 {
						return false
					}
				}
				return bal == 0
			}
			seen := map[string]bool{}
			for _, s := range res {
				if !valid(s) || seen[s] {
					return fmt.Sprintf("получено %d строк, есть неверная или повтор: %q", len(res), s), false
				}
				seen[s] = true
			}
			return fmt.Sprintf("%d различных корректных строк", len(res)), len(res) == catalan[n]
		})
	}
}
```

---
id: daily-temperatures
---
```go starter
func dailyTemperatures(temperatures []int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		temps []int
		want  []int
	}{
		{[]int{73, 74, 75, 71, 69, 72, 76, 73}, []int{1, 1, 4, 2, 1, 1, 0, 0}},
		{[]int{30, 40, 50, 60}, []int{1, 1, 1, 0}},
		{[]int{30, 60, 90}, []int{1, 1, 0}},
		{[]int{50}, []int{0}},
		{[]int{70, 70, 70}, []int{0, 0, 0}},
		{[]int{90, 80, 70, 60}, []int{0, 0, 0, 0}},
		{[]int{60, 70, 60, 70, 80}, []int{1, 3, 1, 1, 0}},
		{[]int{89, 62, 70, 58, 47, 47, 46, 76, 100, 70}, []int{8, 1, 5, 4, 3, 2, 1, 1, 0, 0}},
		{[]int{30, 100}, []int{1, 0}},
		{[]int{100, 30}, []int{0, 0}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("temperatures = %v", c.temps), c.want, func() any {
			return dailyTemperatures(JClone(c.temps))
		})
	}
	brute := func(a []int) []int {
		res := make([]int, len(a))
		for i := range a {
			for j := i + 1; j < len(a); j++ {
				if a[j] > a[i] {
					res[i] = j - i
					break
				}
			}
		}
		return res
	}
	gen := func(seed uint32, n int) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = 30 + int(x>>5)%71
		}
		return a
	}
	for _, seed := range []uint32{11, 22, 33} {
		a := gen(seed, 2000)
		t.Case(fmt.Sprintf("2000 случайных температур (seed %d)", seed), brute(a), func() any {
			return dailyTemperatures(JClone(a))
		})
	}
	t.Case("n = 30000, температуры «пилой» 100, 99, …, 30, 100, …", "совпадает с эталоном", func() any {
		a := make([]int, 30000)
		for i := range a {
			a[i] = 100 - i%71
		}
		got := dailyTemperatures(JClone(a))
		if !slices.Equal(got, brute(a)) {
			return "расхождение с эталоном"
		}
		return "совпадает с эталоном"
	})
	t.Case("n = 100000, температура 30 + i%71", "совпадает с эталоном", func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = 30 + i%71
		}
		got := dailyTemperatures(JClone(a))
		for i := range a {
			w := 1 // следующий день на градус теплее
			if a[i] == 100 || i == len(a)-1 {
				w = 0 // теплее уже не будет
			}
			if got[i] != w {
				return fmt.Sprintf("неверно на индексе %d", i)
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: car-fleet
---
```go starter
func carFleet(target int, position []int, speed []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		target int
		pos    []int
		speed  []int
		want   int
	}{
		{12, []int{10, 8, 0, 5, 3}, []int{2, 4, 1, 1, 3}, 3},
		{10, []int{3}, []int{3}, 1},
		{100, []int{0, 2, 4}, []int{4, 2, 1}, 1},
		{10, []int{0, 4, 2}, []int{2, 1, 3}, 1},
		{10, []int{8, 6}, []int{1, 2}, 1},
		{10, []int{1, 2, 3}, []int{1, 2, 3}, 3},
		{10, []int{1, 2, 3}, []int{3, 2, 1}, 1},
		{10, []int{6, 4, 2, 0}, []int{1, 1, 1, 1}, 4},
		{10, []int{0, 5}, []int{1, 1}, 2},
		{1000, []int{0, 1, 2}, []int{1, 1, 1000}, 3},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("target = %d, position = %v, speed = %v", c.target, c.pos, c.speed), c.want, func() any {
			return carFleet(c.target, JClone(c.pos), JClone(c.speed))
		})
	}
	// эталон: сортировка по позиции и сравнение времён без плавающей точки
	brute := func(target int, pos, sp []int) int {
		idx := make([]int, len(pos))
		for i := range idx {
			idx[i] = i
		}
		sort.Slice(idx, func(a, b int) bool { return pos[idx[a]] > pos[idx[b]] })
		fleets := 0
		lead := -1
		for _, i := range idx {
			// время i больше времени ведущего: (T-p_i)/s_i > (T-p_l)/s_l
			if lead < 0 || (target-pos[i])*sp[lead] > (target-pos[lead])*sp[i] {
				fleets++
				lead = i
			}
		}
		return fleets
	}
	gen := func(seed uint32, n, target, maxSpeed int) ([]int, []int) {
		x := seed
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 3) }
		perm := make([]int, target)
		for i := range perm {
			perm[i] = i
		}
		for i := target - 1; i > 0; i-- {
			j := next() % (i + 1)
			perm[i], perm[j] = perm[j], perm[i]
		}
		pos := perm[:n]
		sp := make([]int, n)
		for i := range sp {
			sp[i] = 1 + next()%maxSpeed
		}
		return pos, sp
	}
	for _, seed := range []uint32{5, 6, 7, 8} {
		pos, sp := gen(seed, 50, 100, 5)
		t.Case(fmt.Sprintf("50 случайных машин, target = 100 (seed %d)", seed), brute(100, pos, sp), func() any {
			return carFleet(100, JClone(pos), JClone(sp))
		})
	}
	pos, sp := gen(99, 100000, 1000000, 100)
	t.Case("100000 случайных машин, target = 10⁶", brute(1000000, pos, sp), func() any {
		return carFleet(1000000, JClone(pos), JClone(sp))
	})
	t.Case("100000 машин, все с одинаковой скоростью", 100000, func() any {
		p := make([]int, 100000)
		s := make([]int, 100000)
		for i := range p {
			p[i] = 99999 - i
			s[i] = 1
		}
		return carFleet(100000, p, s)
	})
}
```

---
id: largest-rectangle-in-histogram
---
```go starter
func largestRectangleArea(heights []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		h    []int
		want int
	}{
		{[]int{2, 1, 5, 6, 2, 3}, 10},
		{[]int{2, 4}, 4},
		{[]int{1, 1}, 2},
		{[]int{0}, 0},
		{[]int{7}, 7},
		{[]int{0, 0, 0}, 0},
		{[]int{5, 4, 3, 2, 1}, 9},
		{[]int{1, 2, 3, 4, 5}, 9},
		{[]int{2, 1, 2}, 3},
		{[]int{6, 2, 5, 4, 5, 1, 6}, 12},
		{[]int{3, 0, 3}, 3},
		{[]int{10000, 10000, 10000}, 30000},
		{[]int{4, 2, 0, 3, 2, 5}, 6},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("heights = %v", c.h), c.want, func() any {
			return largestRectangleArea(JClone(c.h))
		})
	}
	brute := func(h []int) int {
		best := 0
		for i := range h {
			m := h[i]
			for j := i; j < len(h); j++ {
				m = min(m, h[j])
				best = max(best, m*(j-i+1))
			}
		}
		return best
	}
	gen := func(seed uint32, n, maxv int) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>4) % (maxv + 1)
		}
		return a
	}
	for _, seed := range []uint32{3, 4, 5} {
		a := gen(seed, 3000, 10)
		t.Case(fmt.Sprintf("3000 случайных высот 0..10 (seed %d)", seed), brute(a), func() any {
			return largestRectangleArea(JClone(a))
		})
	}
	a := gen(77, 3000, 10000)
	t.Case("3000 случайных высот 0..10000", brute(a), func() any {
		return largestRectangleArea(JClone(a))
	})
	t.Case("n = 20000, все высоты 10000", 200000000, func() any {
		h := make([]int, 20000)
		for i := range h {
			h[i] = 10000
		}
		return largestRectangleArea(h)
	})
	t.Case("n = 10000, высоты 1, 2, …, 10000", "совпадает с эталоном", func() any {
		h := make([]int, 10000)
		best := 0
		for i := range h {
			h[i] = i + 1
			best = max(best, h[i]*(len(h)-i))
		}
		if got := largestRectangleArea(h); got != best {
			return fmt.Sprintf("получено %d, ожидалось %d", got, best)
		}
		return "совпадает с эталоном"
	})
}
```
