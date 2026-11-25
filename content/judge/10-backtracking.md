---
id: subsets
---
```go starter
func subsets(nums []int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — перебор масок
	all := func(nums []int) [][]int {
		res := [][]int{}
		for mask := 0; mask < 1<<len(nums); mask++ {
			s := []int{}
			for i, x := range nums {
				if mask>>i&1 == 1 {
					s = append(s, x)
				}
			}
			res = append(res, s)
		}
		return res
	}
	cases := []struct {
		nums []int
		want [][]int
	}{
		{[]int{1, 2, 3}, [][]int{{}, {1}, {2}, {1, 2}, {3}, {1, 3}, {2, 3}, {1, 2, 3}}},
		{[]int{0}, [][]int{{}, {0}}},
		{[]int{-1, 5}, [][]int{{}, {-1}, {5}, {-1, 5}}},
		{[]int{10, -10, 0}, nil},
		{[]int{3, 1, 4, 2, 5}, nil},
		{[]int{-10, -7, -3, 0, 1, 2, 5, 8, 9, 10}, nil},
	}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = all(c.nums)
		}
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return subsets(JClone(c.nums))
		}, JAnyOrderDeep)
	}
	t.Check("nums = [0..9] — проверка количества", "1024 различных подмножества", func() (any, bool) {
		got := subsets([]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9})
		seen := map[int]bool{}
		for _, s := range got {
			mask := 0
			for _, x := range s {
				if x < 0 || x > 9 || mask>>x&1 == 1 {
					return JShow(s), false
				}
				mask |= 1 << x
			}
			if seen[mask] {
				return "повтор: " + JShow(s), false
			}
			seen[mask] = true
		}
		return fmt.Sprintf("%d различных подмножества", len(seen)), len(seen) == 1024
	})
}
```

---
id: combination-sum
---
```go starter
func combinationSum(candidates []int, target int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: для каждого числа (по возрастанию) решаем, сколько раз его взять
	brute := func(cands []int, target int) [][]int {
		c := append([]int(nil), cands...)
		sort.Ints(c)
		res := [][]int{}
		var cur []int
		var rec func(i, rem int)
		rec = func(i, rem int) {
			if rem == 0 {
				res = append(res, append([]int{}, cur...))
				return
			}
			if i == len(c) {
				return
			}
			n := len(cur)
			for k := 0; k*c[i] <= rem; k++ {
				if k > 0 {
					cur = append(cur, c[i])
				}
				rec(i+1, rem-k*c[i])
			}
			cur = cur[:n]
		}
		rec(0, target)
		return res
	}
	type tc struct {
		cands  []int
		target int
		want   [][]int
	}
	cs := []tc{
		{[]int{2, 3, 6, 7}, 7, [][]int{{2, 2, 3}, {7}}},
		{[]int{2, 3, 5}, 8, [][]int{{2, 2, 2, 2}, {2, 3, 3}, {3, 5}}},
		{[]int{2}, 1, [][]int{}},
		{[]int{2}, 2, [][]int{{2}}},
		{[]int{40}, 40, [][]int{{40}}},
		{[]int{8, 7, 4, 3}, 11, [][]int{{3, 4, 4}, {3, 8}, {4, 7}}},
		{[]int{7, 3, 2}, 18, nil},
		{[]int{5, 10, 15}, 31, [][]int{}},
	}
	big := make([]int, 30)
	for i := range big {
		big[i] = 31 - i // 31, 30, …, 2 — не отсортировано
	}
	cs = append(cs, tc{big, 40, nil}, tc{[]int{2, 3, 4, 5, 6, 7, 8}, 40, nil})
	for _, c := range cs {
		c := c
		if c.want == nil {
			c.want = brute(c.cands, c.target)
		}
		name := fmt.Sprintf("candidates = %v, target = %d", c.cands, c.target)
		if len(c.cands) == 30 {
			name = fmt.Sprintf("candidates = [31, 30, …, 2], target = %d (%d комбинаций)", c.target, len(c.want))
		}
		t.Case(name, c.want, func() any {
			return combinationSum(JClone(c.cands), c.target)
		}, JAnyOrderDeep)
	}
}
```

---
id: combination-sum-ii
---
```go starter
func combinationSum2(candidates []int, target int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: перебор масок по индексам, одинаковые комбинации схлопываются
	brute := func(cands []int, target int) [][]int {
		seen := map[string]bool{}
		res := [][]int{}
		for mask := 0; mask < 1<<len(cands); mask++ {
			s := []int{}
			sum := 0
			for i, x := range cands {
				if mask>>i&1 == 1 {
					s = append(s, x)
					sum += x
				}
			}
			if sum != target {
				continue
			}
			sort.Ints(s)
			if k := fmt.Sprint(s); !seen[k] {
				seen[k] = true
				res = append(res, s)
			}
		}
		return res
	}
	// эталон для больших входов: по различным значениям с кратностями
	byCount := func(cands []int, target int) [][]int {
		cnt := map[int]int{}
		for _, x := range cands {
			cnt[x]++
		}
		vals := []int{}
		for v := range cnt {
			vals = append(vals, v)
		}
		sort.Ints(vals)
		res := [][]int{}
		var cur []int
		var rec func(i, rem int)
		rec = func(i, rem int) {
			if rem == 0 {
				res = append(res, append([]int{}, cur...))
				return
			}
			if i == len(vals) {
				return
			}
			n := len(cur)
			for k := 0; k <= cnt[vals[i]] && k*vals[i] <= rem; k++ {
				if k > 0 {
					cur = append(cur, vals[i])
				}
				rec(i+1, rem-k*vals[i])
			}
			cur = cur[:n]
		}
		rec(0, target)
		return res
	}
	type tc struct {
		name   string
		cands  []int
		target int
		want   [][]int
	}
	cs := []tc{
		{"", []int{10, 1, 2, 7, 6, 1, 5}, 8, [][]int{{1, 1, 6}, {1, 2, 5}, {1, 7}, {2, 6}}},
		{"", []int{2, 5, 2, 1, 2}, 5, [][]int{{1, 2, 2}, {5}}},
		{"", []int{1}, 1, [][]int{{1}}},
		{"", []int{2}, 1, [][]int{}},
		{"", []int{1, 1, 1, 1}, 2, [][]int{{1, 1}}},
		{"", []int{3, 1, 3, 5, 1, 1}, 8, nil},
		{"", []int{4, 4, 2, 1, 4, 2, 2, 1, 3}, 6, nil},
		{"", []int{14, 6, 25, 9, 30, 20, 33, 34, 28, 30, 16, 12, 31, 9, 9, 12, 34, 16, 25, 32, 8, 7, 30, 12, 33, 20, 21, 29, 24, 17, 27, 34, 11, 17, 30, 6, 32, 21, 27, 17, 16, 8, 24, 12, 12, 28, 11, 33, 10, 32, 22, 13, 34, 18, 12}, 27, nil},
	}
	ones := make([]int, 100)
	for i := range ones {
		ones[i] = 1
	}
	cs = append(cs, tc{"candidates = [1 × 100], target = 30", ones, 30, [][]int{{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}}})
	twice := make([]int, 100)
	for i := range twice {
		twice[i] = 50 - (i*37)%50 // каждое число 1..50 ровно дважды, вперемешку
	}
	cs = append(cs, tc{"candidates = 1..50 по два раза вперемешку (100 чисел), target = 30", twice, 30, nil})
	for _, c := range cs {
		c := c
		if c.want == nil {
			if len(c.cands) <= 20 {
				c.want = brute(c.cands, c.target)
			} else {
				c.want = byCount(c.cands, c.target)
			}
		}
		name := c.name
		if name == "" {
			name = fmt.Sprintf("candidates = %v, target = %d", c.cands, c.target)
		}
		t.Case(name, c.want, func() any {
			return combinationSum2(JClone(c.cands), c.target)
		}, JAnyOrderDeep)
	}
}
```

---
id: permutations
---
```go starter
func permute(nums []int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — рекурсивная вставка первого элемента во все позиции перестановок хвоста
	var perms func(a []int) [][]int
	perms = func(a []int) [][]int {
		if len(a) == 0 {
			return [][]int{{}}
		}
		res := [][]int{}
		for _, p := range perms(a[1:]) {
			for pos := 0; pos <= len(p); pos++ {
				q := append([]int{}, p[:pos]...)
				q = append(q, a[0])
				q = append(q, p[pos:]...)
				res = append(res, q)
			}
		}
		return res
	}
	cases := []struct {
		nums []int
		want [][]int
	}{
		{[]int{1, 2, 3}, [][]int{{1, 2, 3}, {1, 3, 2}, {2, 1, 3}, {2, 3, 1}, {3, 1, 2}, {3, 2, 1}}},
		{[]int{0, 1}, [][]int{{0, 1}, {1, 0}}},
		{[]int{1}, [][]int{{1}}},
		{[]int{-10, 10}, [][]int{{-10, 10}, {10, -10}}},
		{[]int{5, -1, 0, 3}, nil},
		{[]int{4, 2, 7, -3, 0}, nil},
		{[]int{1, 2, 3, 4, 5, 6}, nil},
		{[]int{10, -10, 9, -9, 0, 1}, nil},
	}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = perms(c.nums)
		}
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return permute(JClone(c.nums))
		}, JAnyOrder)
	}
}
```

---
id: subsets-ii
---
```go starter
func subsetsWithDup(nums []int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — перебор масок, одинаковые подмножества схлопываются
	all := func(nums []int) [][]int {
		seen := map[string]bool{}
		res := [][]int{}
		for mask := 0; mask < 1<<len(nums); mask++ {
			s := []int{}
			for i, x := range nums {
				if mask>>i&1 == 1 {
					s = append(s, x)
				}
			}
			sort.Ints(s)
			if k := fmt.Sprint(s); !seen[k] {
				seen[k] = true
				res = append(res, s)
			}
		}
		return res
	}
	cases := []struct {
		nums []int
		want [][]int
	}{
		{[]int{1, 2, 2}, [][]int{{}, {1}, {1, 2}, {1, 2, 2}, {2}, {2, 2}}},
		{[]int{0}, [][]int{{}, {0}}},
		{[]int{4, 4, 4, 1, 4}, [][]int{{}, {1}, {1, 4}, {1, 4, 4}, {1, 4, 4, 4}, {1, 4, 4, 4, 4}, {4}, {4, 4}, {4, 4, 4}, {4, 4, 4, 4}}},
		{[]int{5, 5}, [][]int{{}, {5}, {5, 5}}},
		{[]int{2, 1, 2, 1, 3}, nil},
		{[]int{-1, 1, -1, 0}, nil},
		{[]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, nil},
		{[]int{3, 3, 3, 3, 3, 3, 3, 3, 3, 3}, nil},
		{[]int{5, -2, 5, 0, -2, 7, 0, 5, -10, 10}, nil},
	}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = all(c.nums)
		}
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return subsetsWithDup(JClone(c.nums))
		}, JAnyOrderDeep)
	}
}
```

---
id: word-search
---
```go starter
func exist(board [][]byte, word string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	abc := []string{"ABCE", "SFCS", "ADEE"}
	cases := []struct {
		board []string
		word  string
		want  bool
	}{
		{abc, "ABCCED", true},
		{abc, "ABCB", false},
		{abc, "SEE", true},
		{[]string{"A"}, "A", true},
		{[]string{"A"}, "B", false},
		{[]string{"A"}, "AA", false},
		{[]string{"AB"}, "BA", true},
		{[]string{"AB", "CD"}, "ABDC", true},
		{[]string{"AB", "CD"}, "ABCD", false},
		{[]string{"aA"}, "Aa", true},
		{[]string{"aA"}, "AA", false},
		{abc, "ESEECCBASADF", true},
		{[]string{"CAA", "AAA", "BCD"}, "AAB", true},
		{[]string{"ABCE", "SFES", "ADEE"}, "ABCESEEEFS", true},
		{[]string{"ABCDEF", "LKJIHG", "MNOPQR", "XWVUTS", "YZabcd", "jihgfe"}, "ABCDEFGHIJKLMNO", true},
		{[]string{"AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA"}, "AAAAAAAAAAAAAAA", true},
		{[]string{"AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAB"}, "AAAAAAAAAAAAAAB", true},
		{[]string{"AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA"}, "AAAAAAAAAAAAAAB", false},
		{[]string{"BAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA", "AAAAAA"}, "AAAAAAAAAAAAAAC", false},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("board = %s, word = %q", JShow(c.board), c.word), c.want, func() any {
			return exist(JBoard(c.board...), c.word)
		})
	}
}
```

---
id: palindrome-partitioning
---
```go starter
func partition(s string) [][]string {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — перебор всех 2^(n-1) способов разрезать строку
	all := func(s string) [][]string {
		isPal := func(x string) bool {
			for i, j := 0, len(x)-1; i < j; i, j = i+1, j-1 {
				if x[i] != x[j] {
					return false
				}
			}
			return true
		}
		res := [][]string{}
		n := len(s)
		for mask := 0; mask < 1<<(n-1); mask++ {
			var parts []string
			ok := true
			start := 0
			for i := 1; i <= n && ok; i++ {
				if i == n || mask>>(i-1)&1 == 1 {
					p := s[start:i]
					if !isPal(p) {
						ok = false
					}
					parts = append(parts, p)
					start = i
				}
			}
			if ok {
				res = append(res, parts)
			}
		}
		return res
	}
	cases := []struct {
		s    string
		want [][]string
	}{
		{"aab", [][]string{{"a", "a", "b"}, {"aa", "b"}}},
		{"a", [][]string{{"a"}}},
		{"aba", [][]string{{"a", "b", "a"}, {"aba"}}},
		{"ab", [][]string{{"a", "b"}}},
		{"aaa", nil},
		{"efe", nil},
		{"abbab", nil},
		{"racecar", nil},
		{"abcdefghijklmnop", nil},
		{"abacabadabacabab", nil},
		{"aaaaaaaaaaaaaaaa", nil},
	}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = all(c.s)
		}
		name := fmt.Sprintf("s = %q", c.s)
		if len(c.want) > 20 {
			name += fmt.Sprintf(" (%d разбиений)", len(c.want))
		}
		// порядок разбиений любой, порядок кусков внутри разбиения важен
		t.Case(name, c.want, func() any {
			return partition(c.s)
		}, JAnyOrder)
	}
}
```

---
id: letter-combinations-of-a-phone-number
---
```go starter
func letterCombinations(digits string) []string {

}
```

```go tests
func judgeTests(t *Judge) {
	keys := []string{"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}
	all := func(digits string) []string {
		if digits == "" {
			return []string{}
		}
		res := []string{""}
		for i := 0; i < len(digits); i++ {
			var next []string
			for _, p := range res {
				for _, ch := range keys[digits[i]-'0'] {
					next = append(next, p+string(ch))
				}
			}
			res = next
		}
		return res
	}
	cases := []struct {
		digits string
		want   []string
	}{
		{"23", []string{"ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"}},
		{"", []string{}},
		{"2", []string{"a", "b", "c"}},
		{"7", []string{"p", "q", "r", "s"}},
		{"99", nil},
		{"79", nil},
		{"234", nil},
		{"2222", nil},
		{"7979", nil},
		{"5678", nil},
	}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = all(c.digits)
		}
		t.Case(fmt.Sprintf("digits = %q", c.digits), c.want, func() any {
			return letterCombinations(c.digits)
		}, JAnyOrder)
	}
}
```

---
id: n-queens
---
```go starter
func solveNQueens(n int) [][]string {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — простой перебор по строкам с проверкой всех поставленных ферзей
	solve := func(n int) [][]string {
		res := [][]string{}
		pos := make([]int, n)
		var rec func(r int)
		rec = func(r int) {
			if r == n {
				board := make([]string, n)
				for i := range board {
					row := make([]byte, n)
					for j := range row {
						row[j] = '.'
					}
					row[pos[i]] = 'Q'
					board[i] = string(row)
				}
				res = append(res, board)
				return
			}
			for c := 0; c < n; c++ {
				ok := true
				for i := 0; i < r; i++ {
					d := r - i
					if pos[i] == c || pos[i] == c-d || pos[i] == c+d {
						ok = false
						break
					}
				}
				if ok {
					pos[r] = c
					rec(r + 1)
				}
			}
		}
		rec(0)
		return res
	}
	cases := []struct {
		n    int
		want [][]string
	}{
		{4, [][]string{{".Q..", "...Q", "Q...", "..Q."}, {"..Q.", "Q...", "...Q", ".Q.."}}},
		{1, [][]string{{"Q"}}},
		{2, [][]string{}},
		{3, [][]string{}},
		{5, nil},
		{6, nil},
		{7, nil},
		{8, nil},
		{9, nil},
	}
	counts := map[int]int{1: 1, 2: 0, 3: 0, 4: 2, 5: 10, 6: 4, 7: 40, 8: 92, 9: 352}
	for _, c := range cases {
		c := c
		if c.want == nil {
			c.want = solve(c.n)
		}
		if len(c.want) != counts[c.n] {
			panic("n-queens: эталон ошибся в количестве")
		}
		name := fmt.Sprintf("n = %d", c.n)
		if c.n > 4 {
			name += fmt.Sprintf(" (%d расстановок)", counts[c.n])
		}
		// порядок расстановок любой, строки доски — по порядку
		t.Case(name, c.want, func() any {
			return solveNQueens(c.n)
		}, JAnyOrder)
	}
}
```
