---
id: best-time-to-buy-and-sell-stock
---
```go starter
func maxProfit(prices []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		prices []int
		want   int
	}{
		{[]int{7, 1, 5, 3, 6, 4}, 5},
		{[]int{7, 6, 4, 3, 1}, 0},
		{[]int{2, 4, 1}, 2},
		{[]int{5}, 0},
		{[]int{3, 3}, 0},
		{[]int{1, 2}, 1},
		{[]int{2, 1}, 0},
		{[]int{2, 1, 2, 0, 1}, 1},
		{[]int{0, 10000}, 10000},
		{[]int{10000, 0, 10000}, 10000},
		{[]int{3, 2, 6, 5, 0, 3}, 4},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("prices = %v", c.prices), c.want, func() any {
			return maxProfit(JClone(c.prices))
		})
	}
	t.Case("prices: 20000 цен по убыванию", 0, func() any {
		a := make([]int, 20000)
		for i := range a {
			a[i] = 10000 - i/2
		}
		return maxProfit(a)
	})
	t.Case("prices: 20000 цен по возрастанию 0..9999", 9999, func() any {
		a := make([]int, 20000)
		for i := range a {
			a[i] = i / 2
		}
		return maxProfit(a)
	})
	gen := func(n int, seed uint32) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>8) % 10001
		}
		return a
	}
	brute := func(a []int) int {
		best := 0
		for i := range a {
			for j := i + 1; j < len(a); j++ {
				if a[j]-a[i] > best {
					best = a[j] - a[i]
				}
			}
		}
		return best
	}
	r1 := gen(3000, 2463534242)
	t.Case("prices: 3000 случайных цен", brute(r1), func() any {
		return maxProfit(JClone(r1))
	})
	r2 := gen(20000, 88172645)
	t.Case("prices: 20000 случайных цен", "совпадает с эталоном", func() any {
		mn, want := r2[0], 0
		for _, p := range r2 {
			if p < mn {
				mn = p
			}
			if p-mn > want {
				want = p - mn
			}
		}
		got := maxProfit(JClone(r2))
		if got == want {
			return "совпадает с эталоном"
		}
		return fmt.Sprintf("получено %d, ожидалось %d", got, want)
	})
}
```

---
id: longest-substring-without-repeating-characters
---
```go starter
func lengthOfLongestSubstring(s string) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s    string
		want int
	}{
		{"abcabcbb", 3},
		{"bbbbb", 1},
		{"pwwkew", 3},
		{"", 0},
		{" ", 1},
		{"au", 2},
		{"dvdf", 3},
		{"abba", 2},
		{"tmmzuxt", 5},
		{"abcdefg", 7},
		{"a b a", 3},
		{"aab", 2},
		{"cdd", 2},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q", c.s), c.want, func() any {
			return lengthOfLongestSubstring(c.s)
		})
	}
	t.Case("s: 50000 одинаковых символов a", 1, func() any {
		return lengthOfLongestSubstring(strings.Repeat("a", 50000))
	})
	t.Case("s: 50000 символов, 95 печатных ASCII по кругу", 95, func() any {
		b := make([]byte, 50000)
		for i := range b {
			b[i] = byte(32 + i%95)
		}
		return lengthOfLongestSubstring(string(b))
	})
	brute := func(s string) int {
		best := 0
		for i := 0; i < len(s); i++ {
			seen := map[byte]bool{}
			for j := i; j < len(s) && !seen[s[j]]; j++ {
				seen[s[j]] = true
				if j-i+1 > best {
					best = j - i + 1
				}
			}
		}
		return best
	}
	gen := func(n, alpha int, seed uint32) string {
		x := seed
		b := make([]byte, n)
		for i := range b {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			b[i] = byte('a' + int(x>>8)%alpha)
		}
		return string(b)
	}
	s1 := gen(2000, 20, 2463534242)
	t.Case("s: 2000 случайных букв из 20", brute(s1), func() any {
		return lengthOfLongestSubstring(s1)
	})
	s2 := gen(50000, 26, 88172645)
	t.Case("s: 50000 случайных строчных букв", brute(s2), func() any {
		return lengthOfLongestSubstring(s2)
	})
}
```

---
id: longest-repeating-character-replacement
---
```go starter
func characterReplacement(s string, k int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s    string
		k    int
		want int
	}{
		{"ABAB", 2, 4},
		{"AABABBA", 1, 4},
		{"AAAA", 0, 4},
		{"A", 0, 1},
		{"AB", 0, 1},
		{"ABC", 3, 3},
		{"ABBB", 2, 4},
		{"ABCDE", 1, 2},
		{"AAAB", 0, 3},
		{"BAAAB", 2, 5},
		{"ABBBCCCC", 2, 6},
		{"ABCABCABC", 2, 4},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q, k = %d", c.s, c.k), c.want, func() any {
			return characterReplacement(c.s, c.k)
		})
	}
	// эталон: для каждой буквы — самое длинное окно, где «чужих» символов не больше k
	ref := func(s string, k int) int {
		best := 0
		for ch := byte('A'); ch <= 'Z'; ch++ {
			l, bad := 0, 0
			for r := 0; r < len(s); r++ {
				if s[r] != ch {
					bad++
				}
				for bad > k {
					if s[l] != ch {
						bad--
					}
					l++
				}
				if r-l+1 > best {
					best = r - l + 1
				}
			}
		}
		return best
	}
	gen := func(n, alpha int, seed uint32) string {
		x := seed
		b := make([]byte, n)
		for i := range b {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			b[i] = byte('A' + int(x>>8)%alpha)
		}
		return string(b)
	}
	t.Case("s: 100000 букв A, k = 0", 100000, func() any {
		return characterReplacement(strings.Repeat("A", 100000), 0)
	})
	t.Case("s: AB x 50000, k = 100000", 100000, func() any {
		return characterReplacement(strings.Repeat("AB", 50000), 100000)
	})
	t.Case("s: AB x 50000, k = 1000", 2001, func() any {
		return characterReplacement(strings.Repeat("AB", 50000), 1000)
	})
	for _, c := range []struct{ n, alpha, k int }{{100000, 26, 1000}, {100000, 3, 5000}, {100000, 2, 0}} {
		s := gen(c.n, c.alpha, 362436069+uint32(c.k))
		t.Case(fmt.Sprintf("s: %d случайных букв из %d, k = %d", c.n, c.alpha, c.k), ref(s, c.k), func() any {
			return characterReplacement(s, c.k)
		})
	}
}
```

---
id: permutation-in-string
---
```go starter
func checkInclusion(s1 string, s2 string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s1, s2 string
		want   bool
	}{
		{"ab", "eidbaooo", true},
		{"ab", "eidboaoo", false},
		{"adc", "dcda", true},
		{"a", "a", true},
		{"ab", "a", false},
		{"a", "b", false},
		{"abc", "ccccbbbbaaaa", false},
		{"abc", "bbbca", true},
		{"aa", "aba", false},
		{"hello", "ooolleoooleh", false},
		{"abc", "abc", true},
		{"abc", "cba", true},
		{"ab", "bbba", true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s1 = %q, s2 = %q", c.s1, c.s2), c.want, func() any {
			return checkInclusion(c.s1, c.s2)
		})
	}
	s1 := strings.Repeat("a", 4999) + "b"
	t.Case("s1 = a x 4999 + b, s2 = a x 10000", false, func() any {
		return checkInclusion(s1, strings.Repeat("a", 10000))
	})
	t.Case("s1 = a x 4999 + b, s2 = a x 7000 + b + a x 2999", true, func() any {
		return checkInclusion(s1, strings.Repeat("a", 7000)+"b"+strings.Repeat("a", 2999))
	})
	t.Case("s1 = ab x 2500, s2 = abc x 3333", false, func() any {
		return checkInclusion(strings.Repeat("ab", 2500), strings.Repeat("abc", 3333))
	})
	brute := func(a, b string) bool {
		sorted := func(s string) string {
			x := []byte(s)
			sort.Slice(x, func(i, j int) bool { return x[i] < x[j] })
			return string(x)
		}
		sa := sorted(a)
		for i := 0; i+len(a) <= len(b); i++ {
			if sorted(b[i:i+len(a)]) == sa {
				return true
			}
		}
		return false
	}
	gen := func(n, alpha int, seed uint32) string {
		x := seed
		b := make([]byte, n)
		for i := range b {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			b[i] = byte('a' + int(x>>8)%alpha)
		}
		return string(b)
	}
	t.Case("300 случайных пар (эталон — сортировка окон)", "совпадает с эталоном", func() any {
		for it := 0; it < 300; it++ {
			a := gen(1+it%6, 3+it%3, uint32(1000+it))
			b := gen(5+it%40, 3+it%3, uint32(5000+it))
			if got, want := checkInclusion(a, b), brute(a, b); got != want {
				return fmt.Sprintf("s1 = %q, s2 = %q: получено %v, ожидалось %v", a, b, got, want)
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: minimum-window-substring
---
```go starter
func minWindow(s string, t string) string {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s, t string
		want string
	}{
		{"ADOBECODEBANC", "ABC", "BANC"},
		{"a", "a", "a"},
		{"a", "aa", ""},
		{"ab", "b", "b"},
		{"ab", "a", "a"},
		{"aa", "aa", "aa"},
		{"abc", "cba", "abc"},
		{"bba", "ab", "ba"},
		{"ab", "A", ""},
		{"aAbB", "Ab", "Ab"},
		{"xyz", "abc", ""},
		{"aaaaaaaaaaaabbbbbcdd", "abcdd", "abbbbbcdd"},
		{"cabwefgewcwaefgcf", "cae", "cwae"},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q, t = %q", c.s, c.t), c.want, func() any {
			return minWindow(c.s, c.t)
		})
	}
	t.Case("s = a x 5000 + b + c x 5000, t = abc", "abc", func() any {
		return minWindow(strings.Repeat("a", 5000)+"b"+strings.Repeat("c", 5000), "abc")
	})
	t.Case("s = a x 10000, t = a x 10000", strings.Repeat("a", 10000), func() any {
		return minWindow(strings.Repeat("a", 10000), strings.Repeat("a", 10000))
	})
	t.Case("s = a x 10000, t = b", "", func() any {
		return minWindow(strings.Repeat("a", 10000), "b")
	})
	// эталон: перебор всех окон; допустим любой минимальный по длине ответ
	covers := func(w, tt string) bool {
		var cnt [128]int
		for i := 0; i < len(tt); i++ {
			cnt[tt[i]]++
		}
		for i := 0; i < len(w); i++ {
			cnt[w[i]]--
		}
		for _, v := range cnt {
			if v > 0 {
				return false
			}
		}
		return true
	}
	minLen := func(s, tt string) int {
		best := -1
		for i := 0; i < len(s); i++ {
			for j := i + 1; j <= len(s); j++ {
				if (best < 0 || j-i < best) && covers(s[i:j], tt) {
					best = j - i
				}
			}
		}
		return best
	}
	gen := func(n int, alpha string, seed uint32) string {
		x := seed
		b := make([]byte, n)
		for i := range b {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			b[i] = alpha[int(x>>8)%len(alpha)]
		}
		return string(b)
	}
	t.Check("200 случайных пар (s до 60 символов, t до 6)", "окно покрывает t и имеет минимальную длину", func() (any, bool) {
		for it := 0; it < 200; it++ {
			s := gen(5+it%56, "abcABC", uint32(100+it))
			tt := gen(1+it%6, "abcABC", uint32(9000+it))
			got := minWindow(s, tt)
			want := minLen(s, tt)
			if want < 0 {
				if got != "" {
					return fmt.Sprintf("s = %q, t = %q: получено %q, ожидалась пустая строка", s, tt, got), false
				}
				continue
			}
			if len(got) != want || !strings.Contains(s, got) || !covers(got, tt) {
				return fmt.Sprintf("s = %q, t = %q: получено %q, ожидалась длина %d", s, tt, got, want), false
			}
		}
		return "все 200 пар верны", true
	})
	big := gen(100000, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 2463534242)
	t.Check("s: 100000 случайных латинских букв, t = aAbBcC", "окно покрывает t, длина совпадает с эталоном", func() (any, bool) {
		tt := "aAbBcC"
		got := minWindow(big, tt)
		// эталон: для каждого начала i минимальный конец — максимум из первых вхождений букв t правее i
		best := -1
		for i := 0; i < len(big); i++ {
			if strings.IndexByte(tt, big[i]) < 0 {
				continue
			}
			end := i
			okAll := true
			for k := 0; k < len(tt); k++ {
				p := strings.IndexByte(big[i:], tt[k])
				if p < 0 {
					okAll = false
					break
				}
				if i+p > end {
					end = i + p
				}
			}
			if okAll && (best < 0 || end-i+1 < best) {
				best = end - i + 1
			}
		}
		if best < 0 {
			return got, got == ""
		}
		return got, len(got) == best && strings.Contains(big, got) && covers(got, tt)
	})
}
```

---
id: sliding-window-maximum
---
```go starter
func maxSlidingWindow(nums []int, k int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		k    int
		want []int
	}{
		{[]int{1, 3, -1, -3, 5, 3, 6, 7}, 3, []int{3, 3, 5, 5, 6, 7}},
		{[]int{1}, 1, []int{1}},
		{[]int{1, -1}, 1, []int{1, -1}},
		{[]int{9, 11}, 2, []int{11}},
		{[]int{4, -2}, 2, []int{4}},
		{[]int{7, 2, 4}, 2, []int{7, 4}},
		{[]int{-7, -8, 7, 5, 7, 1, 6, 0}, 4, []int{7, 7, 7, 7, 7}},
		{[]int{5, 4, 3, 2, 1}, 3, []int{5, 4, 3}},
		{[]int{1, 2, 3, 4, 5}, 3, []int{3, 4, 5}},
		{[]int{2, 2, 2, 2}, 2, []int{2, 2, 2}},
		{[]int{-10000, 10000, -10000}, 3, []int{10000}},
		{[]int{1, 3, 1, 2, 0, 5}, 3, []int{3, 3, 2, 5}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v, k = %d", c.nums, c.k), c.want, func() any {
			return maxSlidingWindow(JClone(c.nums), c.k)
		})
	}
	gen := func(n int, seed uint32) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>8)%20001 - 10000
		}
		return a
	}
	brute := func(a []int, k int) []int {
		res := make([]int, 0, len(a)-k+1)
		for i := 0; i+k <= len(a); i++ {
			m := a[i]
			for j := i + 1; j < i+k; j++ {
				if a[j] > m {
					m = a[j]
				}
			}
			res = append(res, m)
		}
		return res
	}
	r1 := gen(20000, 2463534242)
	t.Case("nums: 20000 случайных чисел, k = 1000", brute(r1, 1000), func() any {
		return maxSlidingWindow(JClone(r1), 1000)
	})
	r2 := gen(100000, 88172645)
	t.Case("nums: 100000 случайных чисел, k = 3", brute(r2, 3), func() any {
		return maxSlidingWindow(JClone(r2), 3)
	})
	inc := make([]int, 0, 99901)
	for i := 99; i < 100000; i++ {
		inc = append(inc, i)
	}
	t.Case("nums = 0..99999 (возрастающие), k = 100", inc, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = i
		}
		return maxSlidingWindow(a, 100)
	})
	t.Case("nums: 100000 чисел, k = 100000", []int{99999}, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = -i
		}
		a[99999] = 99999
		return maxSlidingWindow(a, 100000)
	})
}
```
