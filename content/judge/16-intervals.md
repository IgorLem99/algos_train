---
id: insert-interval
---
```go starter
func insert(intervals [][]int, newInterval []int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — разметка покрытых точек (координаты удваиваем, чтобы [1,2] и [3,4] не слились)
	brute := func(ivs [][]int) [][]int {
		mx := 0
		for _, iv := range ivs {
			mx = max(mx, iv[1])
		}
		cov := make([]bool, 2*mx+2)
		for _, iv := range ivs {
			for x := 2 * iv[0]; x <= 2*iv[1]; x++ {
				cov[x] = true
			}
		}
		res := [][]int{}
		for x := 0; x < len(cov); x++ {
			if cov[x] {
				s := x
				for x+1 < len(cov) && cov[x+1] {
					x++
				}
				res = append(res, []int{s / 2, x / 2})
			}
		}
		return res
	}
	cases := []struct {
		ivs  [][]int
		nw   []int
		want [][]int
	}{
		{[][]int{{1, 3}, {6, 9}}, []int{2, 5}, [][]int{{1, 5}, {6, 9}}},
		{[][]int{{1, 2}, {3, 5}, {6, 7}, {8, 10}, {12, 16}}, []int{4, 8}, [][]int{{1, 2}, {3, 10}, {12, 16}}},
		{[][]int{}, []int{5, 7}, [][]int{{5, 7}}},
		{[][]int{{1, 5}}, []int{2, 3}, [][]int{{1, 5}}},
		{[][]int{{1, 5}}, []int{6, 8}, [][]int{{1, 5}, {6, 8}}},
		{[][]int{{3, 5}}, []int{0, 1}, [][]int{{0, 1}, {3, 5}}},
		{[][]int{{1, 5}}, []int{5, 7}, [][]int{{1, 7}}},
		{[][]int{{3, 5}, {7, 9}}, []int{1, 3}, [][]int{{1, 5}, {7, 9}}},
		{[][]int{{1, 2}, {4, 5}}, []int{0, 10}, [][]int{{0, 10}}},
		{[][]int{{1, 2}, {6, 7}}, []int{3, 4}, [][]int{{1, 2}, {3, 4}, {6, 7}}},
		{[][]int{{0, 0}, {2, 2}}, []int{1, 1}, [][]int{{0, 0}, {1, 1}, {2, 2}}},
		{[][]int{{0, 0}, {2, 2}}, []int{0, 2}, [][]int{{0, 2}}},
		{[][]int{{1, 4}, {6, 8}}, []int{9, 100000}, [][]int{{1, 4}, {6, 8}, {9, 100000}}},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v, newInterval = %v", c.ivs, c.nw), c.want, func() any {
			return insert(JClone2(c.ivs), JClone(c.nw))
		})
	}
	// большие тесты: 10⁴ непересекающихся отрезков
	gen := func(n int) [][]int {
		ivs := make([][]int, n)
		for i := range ivs {
			ivs[i] = []int{10 * i, 10*i + 5}
		}
		return ivs
	}
	bigs := []struct {
		name string
		nw   []int
	}{
		{"[3, 99993]", []int{3, 99993}},
		{"[49997, 50001]", []int{49997, 50001}},
		{"[99996, 99999]", []int{99996, 99999}},
		{"[50000, 50005]", []int{50000, 50005}},
	}
	for _, b := range bigs {
		b := b
		ivs := gen(10000)
		want := brute(append(JClone2(ivs), b.nw))
		t.Case("intervals = [[0,5],[10,15],…,[99990,99995]] (10⁴ отрезков), newInterval = "+b.name, want, func() any {
			return insert(JClone2(ivs), JClone(b.nw))
		})
	}
}
```

---
id: merge-intervals
---
```go starter
func merge(intervals [][]int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — разметка покрытых точек (координаты удваиваем)
	brute := func(ivs [][]int) [][]int {
		mx := 0
		for _, iv := range ivs {
			mx = max(mx, iv[1])
		}
		cov := make([]bool, 2*mx+2)
		for _, iv := range ivs {
			for x := 2 * iv[0]; x <= 2*iv[1]; x++ {
				cov[x] = true
			}
		}
		res := [][]int{}
		for x := 0; x < len(cov); x++ {
			if cov[x] {
				s := x
				for x+1 < len(cov) && cov[x+1] {
					x++
				}
				res = append(res, []int{s / 2, x / 2})
			}
		}
		return res
	}
	cases := []struct {
		ivs  [][]int
		want [][]int
	}{
		{[][]int{{1, 3}, {2, 6}, {8, 10}, {15, 18}}, [][]int{{1, 6}, {8, 10}, {15, 18}}},
		{[][]int{{1, 4}, {4, 5}}, [][]int{{1, 5}}},
		{[][]int{{4, 7}, {1, 4}}, [][]int{{1, 7}}},
		{[][]int{{1, 4}}, [][]int{{1, 4}}},
		{[][]int{{1, 4}, {0, 4}}, [][]int{{0, 4}}},
		{[][]int{{1, 4}, {2, 3}}, [][]int{{1, 4}}},
		{[][]int{{1, 4}, {0, 0}}, [][]int{{0, 0}, {1, 4}}},
		{[][]int{{2, 3}, {4, 5}, {6, 7}, {8, 9}, {1, 10}}, [][]int{{1, 10}}},
		{[][]int{{1, 1}, {1, 1}, {2, 2}}, [][]int{{1, 1}, {2, 2}}},
		{[][]int{{5, 6}, {1, 2}, {3, 4}}, [][]int{{1, 2}, {3, 4}, {5, 6}}},
		{[][]int{{0, 10000}, {10000, 10000}, {0, 0}}, [][]int{{0, 10000}}},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v", c.ivs), c.want, func() any {
			return merge(JClone2(c.ivs))
		}, JAnyOrder)
	}
	r := rand.New(rand.NewSource(17))
	gen := func(n, span, maxLen int) [][]int {
		ivs := make([][]int, n)
		for i := range ivs {
			s := r.Intn(span)
			ivs[i] = []int{s, s + r.Intn(maxLen+1)}
		}
		return ivs
	}
	bigs := []struct {
		name string
		ivs  [][]int
	}{
		{"10⁴ случайных отрезков в [0, 10⁴], длина ≤ 3", gen(10000, 10000, 3)},
		{"10⁴ случайных отрезков в [0, 10⁵], длина ≤ 5", gen(10000, 100000, 5)},
		{"10⁴ случайных точечных отрезков [x, x] в [0, 3·10⁴]", gen(10000, 30000, 0)},
	}
	for _, b := range bigs {
		b := b
		want := brute(b.ivs)
		t.Case(fmt.Sprintf("intervals = %s (в ответе %d отрезков)", b.name, len(want)), want, func() any {
			return merge(JClone2(b.ivs))
		}, JAnyOrder)
	}
}
```

---
id: non-overlapping-intervals
---
```go starter
func eraseOverlapIntervals(intervals [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон для маленьких входов — перебор всех подмножеств оставляемых отрезков
	brute := func(ivs [][]int) int {
		n := len(ivs)
		best := 0
		for mask := 0; mask < 1<<n; mask++ {
			ok, cnt := true, 0
			for i := 0; i < n && ok; i++ {
				if mask>>i&1 == 0 {
					continue
				}
				cnt++
				for j := i + 1; j < n; j++ {
					if mask>>j&1 == 1 && ivs[i][0] < ivs[j][1] && ivs[j][0] < ivs[i][1] {
						ok = false
						break
					}
				}
			}
			if ok {
				best = max(best, cnt)
			}
		}
		return n - best
	}
	// эталон для больших — жадный выбор по концу
	greedy := func(ivs [][]int) int {
		s := JClone2(ivs)
		sort.Slice(s, func(i, j int) bool { return s[i][1] < s[j][1] })
		kept, end := 0, math.MinInt
		for _, iv := range s {
			if iv[0] >= end {
				kept++
				end = iv[1]
			}
		}
		return len(s) - kept
	}
	cases := []struct {
		ivs  [][]int
		want int
	}{
		{[][]int{{1, 2}, {2, 3}, {3, 4}, {1, 3}}, 1},
		{[][]int{{1, 2}, {1, 2}, {1, 2}}, 2},
		{[][]int{{1, 2}, {2, 3}}, 0},
		{[][]int{{0, 5}}, 0},
		{[][]int{{1, 100}, {11, 22}, {1, 11}, {2, 12}}, 2},
		{[][]int{{-50000, 50000}, {-3, -1}, {-1, 2}, {2, 7}}, 1},
		{[][]int{{0, 2}, {1, 3}, {2, 4}, {3, 5}, {4, 6}}, 2},
		{[][]int{{1, 10}, {2, 3}, {4, 5}, {6, 7}, {8, 9}}, 1},
		{[][]int{{5, 6}, {1, 3}, {3, 5}, {2, 4}}, 1},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v", c.ivs), c.want, func() any {
			return eraseOverlapIntervals(JClone2(c.ivs))
		})
	}
	r := rand.New(rand.NewSource(23))
	gen := func(n, span, maxLen int) [][]int {
		ivs := make([][]int, n)
		for i := range ivs {
			s := r.Intn(2*span+1) - span
			ivs[i] = []int{s, s + 1 + r.Intn(maxLen)}
		}
		return ivs
	}
	for i := 0; i < 4; i++ {
		ivs := gen(12, 10, 6)
		t.Case(fmt.Sprintf("intervals = %v", ivs), brute(ivs), func() any {
			return eraseOverlapIntervals(JClone2(ivs))
		})
	}
	bigs := []struct {
		name string
		ivs  [][]int
	}{
		{"10⁴ случайных отрезков в [-5·10⁴, 5·10⁴], длина ≤ 100", gen(10000, 50000, 100)},
		{"10⁴ случайных отрезков в [-100, 100], длина ≤ 20", gen(10000, 100, 20)},
	}
	for _, b := range bigs {
		b := b
		t.Case("intervals = "+b.name, greedy(b.ivs), func() any {
			return eraseOverlapIntervals(JClone2(b.ivs))
		})
	}
}
```

---
id: meeting-rooms
---
```go starter
func canAttendMeetings(intervals [][]int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		ivs  [][]int
		want bool
	}{
		{[][]int{{0, 30}, {5, 10}, {15, 20}}, false},
		{[][]int{{7, 10}, {2, 4}}, true},
		{[][]int{}, true},
		{[][]int{{1, 5}}, true},
		{[][]int{{1, 5}, {5, 10}}, true},
		{[][]int{{5, 10}, {1, 5}}, true},
		{[][]int{{1, 5}, {4, 10}}, false},
		{[][]int{{1, 10}, {2, 3}}, false},
		{[][]int{{1, 5}, {1, 5}}, false},
		{[][]int{{9, 10}, {4, 9}, {4, 17}}, false},
		{[][]int{{13, 15}, {1, 13}, {15, 20}, {20, 21}}, true},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v", c.ivs), c.want, func() any {
			return canAttendMeetings(JClone2(c.ivs))
		})
	}
	// 10⁴ встреч, касающихся концами, в перемешанном порядке
	r := rand.New(rand.NewSource(31))
	chain := make([][]int, 10000)
	for i := range chain {
		chain[i] = []int{3 * i, 3*i + 3}
	}
	r.Shuffle(len(chain), func(i, j int) { chain[i], chain[j] = chain[j], chain[i] })
	t.Case("10⁴ встреч [3i, 3i+3] вперемешку", true, func() any {
		return canAttendMeetings(JClone2(chain))
	})
	clash := JClone2(chain)
	clash[r.Intn(len(clash))] = []int{14999, 15001}
	t.Case("те же 10⁴ встреч, одна заменена на [14999, 15001]", false, func() any {
		return canAttendMeetings(JClone2(clash))
	})
}
```

---
id: meeting-rooms-ii
---
```go starter
func minMeetingRooms(intervals [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — максимум числа встреч, идущих в момент начала какой-либо встречи
	brute := func(ivs [][]int) int {
		best := 0
		for _, a := range ivs {
			cnt := 0
			for _, b := range ivs {
				if b[0] <= a[0] && a[0] < b[1] {
					cnt++
				}
			}
			best = max(best, cnt)
		}
		return best
	}
	cases := []struct {
		ivs  [][]int
		want int
	}{
		{[][]int{{0, 30}, {5, 10}, {15, 20}}, 2},
		{[][]int{{7, 10}, {2, 4}}, 1},
		{[][]int{{1, 5}, {5, 10}}, 1},
		{[][]int{{1, 5}}, 1},
		{[][]int{{1, 5}, {1, 5}, {1, 5}}, 3},
		{[][]int{{1, 10}, {2, 7}, {3, 19}, {8, 12}, {10, 20}, {11, 30}}, 4},
		{[][]int{{9, 10}, {4, 9}, {4, 17}}, 2},
		{[][]int{{2, 11}, {6, 16}, {11, 16}}, 2},
		{[][]int{{1, 2}, {2, 3}, {3, 4}, {1, 4}}, 2},
		{[][]int{{0, 1000000}, {1, 2}, {3, 4}, {5, 6}, {2, 3}}, 2},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v", c.ivs), c.want, func() any {
			return minMeetingRooms(JClone2(c.ivs))
		})
	}
	r := rand.New(rand.NewSource(41))
	gen := func(n, span, maxLen int) [][]int {
		ivs := make([][]int, n)
		for i := range ivs {
			s := r.Intn(span)
			ivs[i] = []int{s, s + 1 + r.Intn(maxLen)}
		}
		return ivs
	}
	for _, b := range []struct {
		name string
		ivs  [][]int
	}{
		{"3000 случайных встреч в [0, 10⁴], длина ≤ 200", gen(3000, 10000, 200)},
		{"3000 случайных встреч в [0, 100], длина ≤ 5", gen(3000, 100, 5)},
	} {
		b := b
		t.Case("intervals = "+b.name, brute(b.ivs), func() any {
			return minMeetingRooms(JClone2(b.ivs))
		})
	}
	// 10⁴ встреч [i, i+100] — в каждый момент идут ровно 100
	window := make([][]int, 10000)
	for i := range window {
		window[i] = []int{i, i + 100}
	}
	r.Shuffle(len(window), func(i, j int) { window[i], window[j] = window[j], window[i] })
	t.Case("10⁴ встреч [i, i+100] вперемешку", 100, func() any {
		return minMeetingRooms(JClone2(window))
	})
}
```

---
id: minimum-interval-to-include-each-query
---
```go starter
func minInterval(intervals [][]int, queries []int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	brute := func(ivs [][]int, qs []int) []int {
		res := make([]int, len(qs))
		for i, q := range qs {
			res[i] = -1
			for _, iv := range ivs {
				if iv[0] <= q && q <= iv[1] {
					if sz := iv[1] - iv[0] + 1; res[i] == -1 || sz < res[i] {
						res[i] = sz
					}
				}
			}
		}
		return res
	}
	cases := []struct {
		ivs  [][]int
		qs   []int
		want []int
	}{
		{[][]int{{1, 4}, {2, 4}, {3, 6}, {4, 4}}, []int{2, 3, 4, 5}, []int{3, 3, 1, 4}},
		{[][]int{{2, 3}, {2, 5}, {1, 8}, {20, 25}}, []int{2, 19, 5, 22}, []int{2, -1, 4, 6}},
		{[][]int{{1, 1}}, []int{1, 2, 0}, []int{1, -1, -1}},
		{[][]int{{5, 10}}, []int{4, 5, 10, 11}, []int{-1, 6, 6, -1}},
		{[][]int{{1, 10}, {3, 3}, {2, 6}}, []int{3, 3, 2, 7, 10}, []int{1, 1, 5, 10, 10}},
		{[][]int{{1, 10000000}, {9999999, 10000000}}, []int{1, 10000000, 5000000}, []int{10000000, 2, 10000000}},
		{[][]int{{4, 5}, {5, 8}, {1, 9}, {8, 10}, {1, 6}}, []int{7, 9, 3, 9, 3}, []int{4, 3, 6, 3, 6}},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("intervals = %v, queries = %v", c.ivs, c.qs), c.want, func() any {
			return minInterval(JClone2(c.ivs), JClone(c.qs))
		})
	}
	r := rand.New(rand.NewSource(53))
	gen := func(n, q, span, maxLen int) ([][]int, []int) {
		ivs := make([][]int, n)
		for i := range ivs {
			s := r.Intn(span) + 1
			ivs[i] = []int{s, s + r.Intn(maxLen)}
		}
		qs := make([]int, q)
		for i := range qs {
			qs[i] = r.Intn(span+maxLen) + 1
		}
		return ivs, qs
	}
	for _, b := range []struct {
		name               string
		n, q, span, maxLen int
	}{
		{"30 отрезков и 30 запросов в [1, 50]", 30, 30, 40, 10},
		{"5000 отрезков и 5000 запросов в [1, 10⁷]", 5000, 5000, 10000000, 50000},
		{"10⁴ отрезков и 10⁴ запросов в [1, 10⁴]", 10000, 10000, 10000, 300},
	} {
		ivs, qs := gen(b.n, b.q, b.span, b.maxLen)
		name := b.name
		if b.n <= 30 {
			name = fmt.Sprintf("intervals = %v, queries = %v", ivs, qs)
		}
		t.Case(name, brute(ivs, qs), func() any {
			return minInterval(JClone2(ivs), JClone(qs))
		})
	}
}
```
