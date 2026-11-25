---
id: binary-search
---
```go starter
func search(nums []int, target int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums   []int
		target int
		want   int
	}{
		{[]int{-1, 0, 3, 5, 9, 12}, 9, 4},
		{[]int{-1, 0, 3, 5, 9, 12}, 2, -1},
		{[]int{5}, 5, 0},
		{[]int{5}, -5, -1},
		{[]int{5}, 6, -1},
		{[]int{1, 3}, 1, 0},
		{[]int{1, 3}, 3, 1},
		{[]int{1, 3}, 2, -1},
		{[]int{-1, 0, 3, 5, 9, 12}, -1, 0},
		{[]int{-1, 0, 3, 5, 9, 12}, 12, 5},
		{[]int{-1, 0, 3, 5, 9, 12}, -100, -1},
		{[]int{-1, 0, 3, 5, 9, 12}, 100, -1},
		{[]int{-10000, -5, 0, 7, 10000}, 10000, 4},
		{[]int{-10000, -5, 0, 7, 10000}, -10000, 0},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v, target = %d", c.nums, c.target), c.want, func() any {
			return search(JClone(c.nums), c.target)
		})
	}
	t.Case("nums = 0, 3, 6, …, 2999997 (10⁶ элементов); 2000 запросов", "0 расхождений", func() any {
		nums := make([]int, 1000000)
		for i := range nums {
			nums[i] = 3 * i
		}
		bad := 0
		x := uint32(777)
		for q := 0; q < 2000; q++ {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			target := int(x%3000100) - 50
			want := -1
			if target >= 0 && target%3 == 0 && target/3 < len(nums) {
				want = target / 3
			}
			if search(nums, target) != want {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("все n ≤ 40: каждый элемент и числа между ними", "0 расхождений", func() any {
		bad := 0
		for n := 1; n <= 40; n++ {
			nums := make([]int, n)
			for i := range nums {
				nums[i] = 2*i - 11
			}
			for target := -15; target <= 2*n; target++ {
				want := -1
				for i, v := range nums {
					if v == target {
						want = i
					}
				}
				if search(JClone(nums), target) != want {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: search-a-2d-matrix
---
```go starter
func searchMatrix(matrix [][]int, target int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	m34 := [][]int{{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}}
	cases := []struct {
		m      [][]int
		target int
		want   bool
	}{
		{m34, 3, true},
		{m34, 13, false},
		{[][]int{{1}}, 1, true},
		{[][]int{{1}}, 2, false},
		{[][]int{{1}}, 0, false},
		{[][]int{{1, 3, 5}}, 5, true},
		{[][]int{{1, 3, 5}}, 4, false},
		{[][]int{{1}, {3}, {5}}, 3, true},
		{[][]int{{1}, {3}, {5}}, 4, false},
		{m34, 1, true},
		{m34, 60, true},
		{m34, 0, false},
		{m34, 61, false},
		{m34, 8, false},
		{m34, 21, false},
		{m34, 10, true},
		{m34, 20, true},
		{m34, 23, true},
		{[][]int{{-5, -3}, {-1, 4}}, -3, true},
		{[][]int{{-5, -3}, {-1, 4}}, -2, false},
		{[][]int{{-10000, 10000}}, 10000, true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("matrix = %v, target = %d", c.m, c.target), c.want, func() any {
			return searchMatrix(JClone2(c.m), c.target)
		})
	}
	t.Case("матрица 100×100 из чётных чисел 0..19998; все target от −2 до 20001", "0 расхождений", func() any {
		m := make([][]int, 100)
		for i := range m {
			m[i] = make([]int, 100)
			for j := range m[i] {
				m[i][j] = 2 * (i*100 + j)
			}
		}
		bad := 0
		for target := -2; target <= 20001; target++ {
			want := target >= 0 && target <= 19998 && target%2 == 0
			if searchMatrix(m, target) != want {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("все формы m×n до 12×12, все target", "0 расхождений", func() any {
		bad := 0
		for r := 1; r <= 12; r++ {
			for c := 1; c <= 12; c++ {
				m := make([][]int, r)
				for i := range m {
					m[i] = make([]int, c)
					for j := range m[i] {
						m[i][j] = 3*(i*c+j) + 1
					}
				}
				for target := -1; target <= 3*r*c+2; target++ {
					want := false
					for _, row := range m {
						for _, v := range row {
							if v == target {
								want = true
							}
						}
					}
					if searchMatrix(JClone2(m), target) != want {
						bad++
					}
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: koko-eating-bananas
---
```go starter
func minEatingSpeed(piles []int, h int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		piles []int
		h     int
		want  int
	}{
		{[]int{3, 6, 7, 11}, 8, 4},
		{[]int{30, 11, 23, 4, 20}, 5, 30},
		{[]int{30, 11, 23, 4, 20}, 6, 23},
		{[]int{1}, 1, 1},
		{[]int{1000000000}, 1000000000, 1},
		{[]int{1000000000}, 2, 500000000},
		{[]int{1000000000, 1000000000}, 1000000000, 2},
		{[]int{1000000}, 1, 1000000},
		{[]int{5, 5, 5}, 3, 5},
		{[]int{5, 5, 5}, 4, 5},
		{[]int{5, 5, 5}, 6, 3},
		{[]int{3, 6, 7, 11}, 1000000000, 1},
		{[]int{2, 2}, 3, 2},
		{[]int{312884470}, 312884469, 2},
		{[]int{805306368, 805306368, 805306368}, 1000000000, 3},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("piles = %v, h = %d", c.piles, c.h), c.want, func() any {
			return minEatingSpeed(JClone(c.piles), c.h)
		})
	}
	// эталон: перебор k = 1, 2, … (для небольших куч)
	brute := func(piles []int, h int) int {
		for k := 1; ; k++ {
			hours := 0
			for _, p := range piles {
				hours += (p + k - 1) / k
			}
			if hours <= h {
				return k
			}
		}
	}
	gen := func(seed uint32, n, maxv int) []int {
		x := seed
		a := make([]int, n)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = 1 + int(x>>4)%maxv
		}
		return a
	}
	for i, hf := range []int{1, 2, 5} {
		p := gen(uint32(100+i), 1000, 1000)
		h := len(p) * hf
		t.Case(fmt.Sprintf("1000 куч случайного размера до 1000, h = %d", h), brute(p, h), func() any {
			return minEatingSpeed(JClone(p), h)
		})
	}
	p := gen(555, 10000, 100)
	t.Case("10000 куч до 100, h = n", brute(p, 10000), func() any {
		return minEatingSpeed(JClone(p), 10000)
	})
	t.Case("10000 куч по 1, h = 10000", 1, func() any {
		p := make([]int, 10000)
		for i := range p {
			p[i] = 1
		}
		return minEatingSpeed(p, 10000)
	})
}
```

---
id: find-minimum-in-rotated-sorted-array
---
```go starter
func findMin(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want int
	}{
		{[]int{3, 4, 5, 1, 2}, 1},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 0},
		{[]int{11, 13, 15, 17}, 11},
		{[]int{1}, 1},
		{[]int{2, 1}, 1},
		{[]int{1, 2}, 1},
		{[]int{2, 3, 1}, 1},
		{[]int{3, 1, 2}, 1},
		{[]int{-3, -2, -1, -5, -4}, -5},
		{[]int{5, 1, 2, 3, 4}, 1},
		{[]int{2, 3, 4, 5, 1}, 1},
		{[]int{-5000, 5000}, -5000},
		{[]int{5000, -5000}, -5000},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return findMin(JClone(c.nums))
		})
	}
	rotate := func(a []int, k int) []int {
		out := make([]int, len(a))
		for i := range a {
			out[i] = a[(i+k)%len(a)]
		}
		return out
	}
	t.Case("все сдвиги отсортированных массивов длины 1..40", "0 расхождений", func() any {
		bad := 0
		for n := 1; n <= 40; n++ {
			base := make([]int, n)
			for i := range base {
				base[i] = 3*i - 20
			}
			for k := 0; k < n; k++ {
				if findMin(rotate(base, k)) != base[0] {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("n = 5000: все 5000 сдвигов массива −2500..2499", "0 расхождений", func() any {
		base := make([]int, 5000)
		for i := range base {
			base[i] = i - 2500
		}
		bad := 0
		for k := 0; k < 5000; k++ {
			if findMin(rotate(base, k)) != -2500 {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: search-in-rotated-sorted-array
---
```go starter
func search(nums []int, target int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums   []int
		target int
		want   int
	}{
		{[]int{4, 5, 6, 7, 0, 1, 2}, 0, 4},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 3, -1},
		{[]int{1}, 0, -1},
		{[]int{1}, 1, 0},
		{[]int{3, 1}, 1, 1},
		{[]int{3, 1}, 3, 0},
		{[]int{3, 1}, 2, -1},
		{[]int{1, 3}, 3, 1},
		{[]int{1, 3}, 1, 0},
		{[]int{5, 1, 3}, 5, 0},
		{[]int{5, 1, 3}, 3, 2},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 4, 0},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 2, 6},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 7, 3},
		{[]int{4, 5, 6, 7, 0, 1, 2}, 8, -1},
		{[]int{4, 5, 6, 7, 0, 1, 2}, -1, -1},
		{[]int{-9, -7, -5, -20, -15, -12}, -20, 3},
		{[]int{-9, -7, -5, -20, -15, -12}, -9, 0},
		{[]int{-9, -7, -5, -20, -15, -12}, -6, -1},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v, target = %d", c.nums, c.target), c.want, func() any {
			return search(JClone(c.nums), c.target)
		})
	}
	rotate := func(a []int, k int) []int {
		out := make([]int, len(a))
		for i := range a {
			out[i] = a[(i+k)%len(a)]
		}
		return out
	}
	t.Case("все сдвиги массивов длины 1..30 и все target вокруг значений", "0 расхождений", func() any {
		bad := 0
		for n := 1; n <= 30; n++ {
			base := make([]int, n)
			for i := range base {
				base[i] = 2*i - 7
			}
			for k := 0; k < n; k++ {
				nums := rotate(base, k)
				for target := -10; target <= 2*n; target++ {
					want := -1
					for i, v := range nums {
						if v == target {
							want = i
						}
					}
					if search(JClone(nums), target) != want {
						bad++
					}
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("n = 5000: 50 сдвигов, поиск каждого элемента и промежутков", "0 расхождений", func() any {
		base := make([]int, 5000)
		for i := range base {
			base[i] = 2*i - 5000
		}
		bad := 0
		for k := 0; k < 5000; k += 100 {
			nums := rotate(base, k)
			pos := make(map[int]int, len(nums))
			for i, v := range nums {
				pos[v] = i
			}
			for target := -5002; target <= 5000; target += 1 {
				want, ok := pos[target]
				if !ok {
					want = -1
				}
				if search(nums, target) != want {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: time-based-key-value-store
---
```go starter
type TimeMap struct {

}

func Constructor() TimeMap {

}

func (this *TimeMap) Set(key string, value string, timestamp int) {

}

func (this *TimeMap) Get(key string, timestamp int) string {

}
```

```go tests
func judgeTests(t *Judge) {
	t.Case(`set(foo,bar,1) get(foo,1) get(foo,3) set(foo,bar2,4) get(foo,4) get(foo,5)`, []string{"bar", "bar", "bar2", "bar2"}, func() any {
		m := Constructor()
		var out []string
		m.Set("foo", "bar", 1)
		out = append(out, m.Get("foo", 1), m.Get("foo", 3))
		m.Set("foo", "bar2", 4)
		out = append(out, m.Get("foo", 4), m.Get("foo", 5))
		return out
	})
	t.Case(`set(love,high,10) set(love,low,20) get(love,5) get(love,10) get(love,15) get(love,20) get(love,25)`, []string{"", "high", "high", "low", "low"}, func() any {
		m := Constructor()
		m.Set("love", "high", 10)
		m.Set("love", "low", 20)
		var out []string
		for _, ts := range []int{5, 10, 15, 20, 25} {
			out = append(out, m.Get("love", ts))
		}
		return out
	})
	t.Case(`get(a,1) set(a,x,5) get(a,4) get(b,5) get(a,5)`, []string{"", "", "", "x"}, func() any {
		m := Constructor()
		out := []string{m.Get("a", 1)}
		m.Set("a", "x", 5)
		out = append(out, m.Get("a", 4), m.Get("b", 5), m.Get("a", 5))
		return out
	})
	t.Case(`два ключа вперемешку`, []string{"a1", "b2", "a3", "", "b2"}, func() any {
		m := Constructor()
		m.Set("a", "a1", 1)
		m.Set("b", "b2", 2)
		m.Set("a", "a3", 3)
		return []string{m.Get("a", 2), m.Get("b", 3), m.Get("a", 100), m.Get("b", 1), m.Get("b", 2)}
	})
	t.Case(`значение с timestamp = 10⁷, запрос раньше и позже`, []string{"", "v", "v"}, func() any {
		m := Constructor()
		m.Set("k", "v", 10000000)
		return []string{m.Get("k", 9999999), m.Get("k", 10000000), m.Get("k", 10000001)}
	})
	t.Case(`пустое значение и одинаковые значения`, []string{"", "same", "same"}, func() any {
		m := Constructor()
		m.Set("k", "same", 1)
		m.Set("k", "same", 2)
		return []string{m.Get("k", 0), m.Get("k", 1), m.Get("k", 3)}
	})
	t.Case("40000 случайных операций set/get по 5 ключам против наивной модели", "совпадает с эталоном", func() any {
		type rec struct {
			ts  int
			val string
		}
		m := Constructor()
		model := map[string][]rec{}
		x := uint32(987654321)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 3) }
		keys := []string{"a", "b", "c", "d", "e"}
		ts := 0
		for i := 0; i < 40000; i++ {
			key := keys[next()%5]
			if next()%3 == 0 {
				ts += 1 + next()%3
				val := fmt.Sprintf("v%d", i)
				m.Set(key, val, ts)
				model[key] = append(model[key], rec{ts, val})
				continue
			}
			q := next() % (ts + 3)
			want := ""
			for _, r := range model[key] {
				if r.ts <= q {
					want = r.val
				}
			}
			if got := m.Get(key, q); got != want {
				return fmt.Sprintf("операция %d: get(%s,%d) = %q, ожидалось %q", i+1, key, q, got, want)
			}
		}
		return "совпадает с эталоном"
	})
	t.Case("100000 set для одного ключа, затем 100000 get", "совпадает с эталоном", func() any {
		m := Constructor()
		for i := 1; i <= 100000; i++ {
			m.Set("k", fmt.Sprintf("v%d", i), 2*i)
		}
		for q := 0; q <= 200001; q += 2 {
			want := ""
			if q >= 2 {
				want = fmt.Sprintf("v%d", min(q/2, 100000))
			}
			if got := m.Get("k", q); got != want {
				return fmt.Sprintf("get(k,%d) = %q, ожидалось %q", q, got, want)
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: median-of-two-sorted-arrays
---
```go starter
func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		a, b []int
		want float64
	}{
		{[]int{1, 3}, []int{2}, 2.0},
		{[]int{1, 2}, []int{3, 4}, 2.5},
		{[]int{0, 0}, []int{0, 0}, 0},
		{[]int{}, []int{1}, 1},
		{[]int{2}, []int{}, 2},
		{[]int{}, []int{1, 2}, 1.5},
		{[]int{3, 4}, []int{}, 3.5},
		{[]int{1}, []int{2}, 1.5},
		{[]int{1}, []int{1}, 1},
		{[]int{1, 2, 3}, []int{4, 5, 6}, 3.5},
		{[]int{4, 5, 6}, []int{1, 2, 3}, 3.5},
		{[]int{1, 2, 3, 4, 5}, []int{6}, 3.5},
		{[]int{-5, -3, -1}, []int{-2}, -2.5},
		{[]int{-1000000, 1000000}, []int{-1000000, 1000000}, 0},
		{[]int{1, 1, 1}, []int{1, 1}, 1},
		{[]int{1, 3, 5, 7}, []int{2, 4, 6, 8}, 4.5},
		{[]int{1, 2}, []int{-1, 3}, 1.5},
		{[]int{2, 2, 2}, []int{1, 2, 3, 4}, 2},
		{[]int{100000}, []int{100001}, 100000.5},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums1 = %v, nums2 = %v", c.a, c.b), c.want, func() any {
			return findMedianSortedArrays(JClone(c.a), JClone(c.b))
		}, JFloat)
	}
	brute := func(a, b []int) float64 {
		all := append(append([]int{}, a...), b...)
		sort.Ints(all)
		n := len(all)
		if n%2 == 1 {
			return float64(all[n/2])
		}
		return float64(all[n/2-1]+all[n/2]) / 2
	}
	gen := func(x *uint32, n, spread int) []int {
		next := func() int { *x ^= *x << 13; *x ^= *x >> 17; *x ^= *x << 5; return int(*x >> 3) }
		a := make([]int, n)
		for i := range a {
			a[i] = next()%(2*spread+1) - spread
		}
		sort.Ints(a)
		return a
	}
	t.Case("2000 случайных пар массивов длины 0..8 (много дубликатов)", "0 расхождений", func() any {
		x := uint32(31337)
		bad := 0
		for i := 0; i < 2000; i++ {
			next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 3) }
			m, n := next()%9, next()%9
			if m+n == 0 {
				continue
			}
			a, b := gen(&x, m, 6), gen(&x, n, 6)
			if math.Abs(findMedianSortedArrays(JClone(a), JClone(b))-brute(a, b)) > 1e-9 {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("200 случайных пар массивов длины до 1000 (суммарно 1..2000)", "0 расхождений", func() any {
		x := uint32(4242)
		bad := 0
		for i := 0; i < 200; i++ {
			next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 3) }
			m, n := next()%1001, next()%1001
			if m+n == 0 {
				continue
			}
			a, b := gen(&x, m, 1000000), gen(&x, n, 1000000)
			if math.Abs(findMedianSortedArrays(JClone(a), JClone(b))-brute(a, b)) > 1e-9 {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("nums1 = 1..1000, nums2 = 1001..2000", 1000.5, func() any {
		a := make([]int, 1000)
		b := make([]int, 1000)
		for i := range a {
			a[i] = i + 1
			b[i] = i + 1001
		}
		return findMedianSortedArrays(a, b)
	}, JFloat)
	t.Case("nums1 = [], nums2 = 1..2000", 1000.5, func() any {
		b := make([]int, 2000)
		for i := range b {
			b[i] = i + 1
		}
		return findMedianSortedArrays([]int{}, b)
	}, JFloat)
}
```
