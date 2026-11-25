---
id: valid-palindrome
---
```go starter
func isPalindrome(s string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s    string
		want bool
	}{
		{"A man, a plan, a canal: Panama", true},
		{"race a car", false},
		{" ", true},
		{"", true},
		{".,", true},
		{"0P", false},
		{"ab_a", true},
		{"a.", true},
		{"Aa", true},
		{"ab", false},
		{"No 'x' in Nixon", true},
		{"12321", true},
		{"1231", false},
		{"!!a!!b!!a!!", true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q", c.s), c.want, func() any {
			return isPalindrome(c.s)
		})
	}
	big := make([]byte, 200000)
	for i := 0; i < len(big)/2; i++ {
		ch := byte('a' + i%26)
		big[i] = ch
		big[len(big)-1-i] = ch - 32 // заглавная буква
	}
	t.Case("s: палиндром из 200000 символов (в одной половине заглавные)", true, func() any {
		return isPalindrome(string(big))
	})
	t.Case("s: то же, но в середине один символ заменён", false, func() any {
		b := append([]byte{}, big...)
		b[99999] = '0'
		return isPalindrome(string(b))
	})
	t.Case("s: 200000 символов ', ' и один 'a'", true, func() any {
		b := make([]byte, 200000)
		for i := range b {
			b[i] = ','
		}
		b[123456] = 'a'
		return isPalindrome(string(b))
	})
}
```

---
id: two-sum-ii-input-array-is-sorted
---
```go starter
func twoSum(numbers []int, target int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		numbers []int
		target  int
		want    []int
	}{
		{[]int{2, 7, 11, 15}, 9, []int{1, 2}},
		{[]int{2, 3, 4}, 6, []int{1, 3}},
		{[]int{-1, 0}, -1, []int{1, 2}},
		{[]int{0, 0, 3, 4}, 0, []int{1, 2}},
		{[]int{-5, -3, -1, 2, 8}, 7, []int{3, 5}},
		{[]int{1, 2, 3, 4, 4, 9, 56, 90}, 8, []int{4, 5}},
		{[]int{-7, -1, 0, 1, 9}, 0, []int{2, 4}},
		{[]int{1, 5, 8, 20}, 28, []int{3, 4}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("numbers = %v, target = %d", c.numbers, c.target), c.want, func() any {
			return twoSum(JClone(c.numbers), c.target)
		})
	}
	t.Case("numbers = 0..29999, target = 59997 (ответ — два последних)", []int{29999, 30000}, func() any {
		a := make([]int, 30000)
		for i := range a {
			a[i] = i
		}
		return twoSum(a, 59997)
	})
	t.Case("numbers = [-100000, 0..29998], target = -70002 (ответ — первый и последний)", []int{1, 30000}, func() any {
		a := make([]int, 30000)
		a[0] = -100000
		for i := 1; i < len(a); i++ {
			a[i] = i - 1
		}
		return twoSum(a, -70002)
	})
}
```

---
id: 3sum
---
```go starter
func threeSum(nums []int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want [][]int
	}{
		{[]int{-1, 0, 1, 2, -1, -4}, [][]int{{-1, -1, 2}, {-1, 0, 1}}},
		{[]int{0, 1, 1}, [][]int{}},
		{[]int{0, 0, 0}, [][]int{{0, 0, 0}}},
		{[]int{0, 0, 0, 0}, [][]int{{0, 0, 0}}},
		{[]int{-2, 0, 1, 1, 2}, [][]int{{-2, 0, 2}, {-2, 1, 1}}},
		{[]int{1, 2, -2, -1}, [][]int{}},
		{[]int{1, 2, 3, 4}, [][]int{}},
		{[]int{-4, -1, -1, 0, 1, 2}, [][]int{{-1, -1, 2}, {-1, 0, 1}}},
		{[]int{-1, -1, -1, 2, 2}, [][]int{{-1, -1, 2}}},
		{[]int{-100000, 0, 100000, -100000, 100000}, [][]int{{-100000, 0, 100000}}},
		{[]int{3, -2, 1, 0, -1, 2, -3}, [][]int{{-3, 0, 3}, {-3, 1, 2}, {-2, -1, 3}, {-2, 0, 2}, {-1, 0, 1}}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return threeSum(JClone(c.nums))
		}, JAnyOrderDeep)
	}
	// эталон: перебор пар различных значений со счётчиками
	brute := func(nums []int) [][]int {
		cnt := map[int]int{}
		for _, v := range nums {
			cnt[v]++
		}
		vals := make([]int, 0, len(cnt))
		for v := range cnt {
			vals = append(vals, v)
		}
		sort.Ints(vals)
		res := [][]int{}
		for i := 0; i < len(vals); i++ {
			for j := i; j < len(vals); j++ {
				a, b := vals[i], vals[j]
				c := -a - b
				if c < b {
					continue
				}
				need := map[int]int{}
				need[a]++
				need[b]++
				need[c]++
				ok := true
				for v, n := range need {
					if cnt[v] < n {
						ok = false
					}
				}
				if ok {
					res = append(res, []int{a, b, c})
				}
			}
		}
		return res
	}
	gen := func(n, lo, span int, seed uint32) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = lo + int(x>>8)%span
		}
		return a
	}
	big := gen(3000, -100000, 200001, 2463534242)
	t.Case("nums: 3000 случайных чисел из [-100000, 100000]", brute(big), func() any {
		return threeSum(JClone(big))
	}, JAnyOrderDeep)
	dense := gen(3000, -60, 121, 88172645)
	t.Case("nums: 3000 случайных чисел из [-60, 60] (много дубликатов)", brute(dense), func() any {
		return threeSum(JClone(dense))
	}, JAnyOrderDeep)
	t.Case("nums: 3000 чисел -1, 0, 1 по кругу", [][]int{{-1, 0, 1}, {0, 0, 0}}, func() any {
		a := make([]int, 3000)
		for i := range a {
			a[i] = i%3 - 1
		}
		return threeSum(a)
	}, JAnyOrderDeep)
	t.Case("nums: 3000 нулей", [][]int{{0, 0, 0}}, func() any {
		return threeSum(make([]int, 3000))
	}, JAnyOrderDeep)
}
```

---
id: container-with-most-water
---
```go starter
func maxArea(height []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		height []int
		want   int
	}{
		{[]int{1, 8, 6, 2, 5, 4, 8, 3, 7}, 49},
		{[]int{1, 1}, 1},
		{[]int{4, 3, 2, 1, 4}, 16},
		{[]int{0, 0}, 0},
		{[]int{0, 5}, 0},
		{[]int{1, 2, 1}, 2},
		{[]int{2, 3, 4, 5, 18, 17, 6}, 17},
		{[]int{1, 2, 4, 3}, 4},
		{[]int{10000, 1, 1, 1, 10000}, 40000},
		{[]int{5, 4, 3, 2, 1}, 6},
		{[]int{1, 2, 3, 4, 5}, 6},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("height = %v", c.height), c.want, func() any {
			return maxArea(JClone(c.height))
		})
	}
	t.Case("height: 100000 столбцов высоты 10000", 999990000, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = 10000
		}
		return maxArea(a)
	})
	t.Case("height = 1..10000 (возрастающие)", 25000000, func() any {
		a := make([]int, 10000)
		for i := range a {
			a[i] = i + 1
		}
		return maxArea(a)
	})
	t.Case("height = 10000..1 (убывающие)", 25000000, func() any {
		a := make([]int, 10000)
		for i := range a {
			a[i] = 10000 - i
		}
		return maxArea(a)
	})
	t.Case("height: 3000 случайных высот 0..10000", "совпадает с эталоном", func() any {
		x := uint32(362436069)
		a := make([]int, 3000)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>8) % 10001
		}
		want := 0
		for i := range a {
			for j := i + 1; j < len(a); j++ {
				h := a[i]
				if a[j] < h {
					h = a[j]
				}
				if v := h * (j - i); v > want {
					want = v
				}
			}
		}
		got := maxArea(JClone(a))
		if got == want {
			return "совпадает с эталоном"
		}
		return fmt.Sprintf("получено %d, ожидалось %d", got, want)
	})
}
```

---
id: trapping-rain-water
---
```go starter
func trap(height []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		height []int
		want   int
	}{
		{[]int{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}, 6},
		{[]int{4, 2, 0, 3, 2, 5}, 9},
		{[]int{1, 0, 2}, 1},
		{[]int{0}, 0},
		{[]int{5}, 0},
		{[]int{0, 0}, 0},
		{[]int{1, 2, 3}, 0},
		{[]int{3, 2, 1}, 0},
		{[]int{5, 0, 0, 0, 5}, 15},
		{[]int{2, 0, 2}, 2},
		{[]int{3, 0, 1, 0, 2}, 5},
		{[]int{5, 4, 1, 2}, 1},
		{[]int{0, 3, 0, 3, 0}, 3},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("height = %v", c.height), c.want, func() any {
			return trap(JClone(c.height))
		})
	}
	t.Case("height = [100000, 0 x 19998, 100000]", 1999800000, func() any {
		a := make([]int, 20000)
		a[0] = 100000
		a[len(a)-1] = 100000
		return trap(a)
	})
	t.Case("height: 20000 одинаковых столбцов", 0, func() any {
		a := make([]int, 20000)
		for i := range a {
			a[i] = 7
		}
		return trap(a)
	})
	t.Case("height: 3000 случайных высот 0..100", "совпадает с эталоном", func() any {
		x := uint32(123456789)
		a := make([]int, 3000)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>8) % 101
		}
		want := 0
		for i := range a {
			l, r := a[i], a[i]
			for j := 0; j < i; j++ {
				if a[j] > l {
					l = a[j]
				}
			}
			for j := i + 1; j < len(a); j++ {
				if a[j] > r {
					r = a[j]
				}
			}
			m := l
			if r < m {
				m = r
			}
			want += m - a[i]
		}
		got := trap(JClone(a))
		if got == want {
			return "совпадает с эталоном"
		}
		return fmt.Sprintf("получено %d, ожидалось %d", got, want)
	})
	t.Case("height: 20000 случайных высот 0..100000", "совпадает с эталоном", func() any {
		x := uint32(2463534242)
		a := make([]int, 20000)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = int(x>>8) % 100001
		}
		pre := make([]int, len(a))
		suf := make([]int, len(a))
		for i := range a {
			pre[i] = a[i]
			if i > 0 && pre[i-1] > pre[i] {
				pre[i] = pre[i-1]
			}
		}
		for i := len(a) - 1; i >= 0; i-- {
			suf[i] = a[i]
			if i+1 < len(a) && suf[i+1] > suf[i] {
				suf[i] = suf[i+1]
			}
		}
		want := 0
		for i := range a {
			m := pre[i]
			if suf[i] < m {
				m = suf[i]
			}
			want += m - a[i]
		}
		got := trap(JClone(a))
		if got == want {
			return "совпадает с эталоном"
		}
		return fmt.Sprintf("получено %d, ожидалось %d", got, want)
	})
}
```
