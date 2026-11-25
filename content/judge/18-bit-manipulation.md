---
id: single-number
---
```go starter
func singleNumber(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want int
	}{
		{[]int{2, 2, 1}, 1},
		{[]int{4, 1, 2, 1, 2}, 4},
		{[]int{1}, 1},
		{[]int{0}, 0},
		{[]int{0, 1, 0}, 1},
		{[]int{-1, -1, -2}, -2},
		{[]int{-3, 5, -3}, 5},
		{[]int{7, 3, 5, 4, 5, 3, 4}, 7},
		{[]int{-2147483648, 5, 5}, -2147483648},
		{[]int{2147483647, -2147483648, 2147483647}, -2147483648},
		{[]int{30000, -30000, 30000}, -30000},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return singleNumber(JClone(c.nums))
		})
	}
	big := func(single int, seed uint32) []int {
		n := 14999
		nums := make([]int, 0, 2*n+1)
		for i := 0; i < n; i++ {
			v := i*7919 - 50000000
			nums = append(nums, v, v)
		}
		nums = append(nums, single)
		x := seed
		for i := len(nums) - 1; i > 0; i-- {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			j := int(x>>3) % (i + 1)
			nums[i], nums[j] = nums[j], nums[i]
		}
		return nums
	}
	t.Case("n = 29999: 14999 пар в случайном порядке и одно число 123456789", 123456789, func() any {
		return singleNumber(big(123456789, 1))
	})
	t.Case("n = 29999: 14999 пар и одно число −2147483648", -2147483648, func() any {
		return singleNumber(big(-2147483648, 2))
	})
}
```

---
id: number-of-1-bits
---
```go starter
func hammingWeight(n int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n    int
		want int
	}{
		{11, 3},
		{128, 1},
		{2147483645, 30},
		{1, 1},
		{2, 1},
		{3, 2},
		{255, 8},
		{256, 1},
		{1023, 10},
		{2147483647, 31},
		{1073741824, 1},
		{1073741823, 30},
		{1431655765, 16},
		{2863311530 >> 1, 16},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d", c.n), c.want, func() any {
			return hammingWeight(c.n)
		})
	}
	t.Case("все степени двойки 2⁰..2³⁰", "0 расхождений", func() any {
		bad := 0
		for i := 0; i <= 30; i++ {
			if hammingWeight(1<<i) != 1 {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("2³¹ − 1 − 2ⁱ для i = 0..30 (ровно 30 единиц)", "0 расхождений", func() any {
		bad := 0
		for i := 0; i <= 30; i++ {
			if hammingWeight(2147483647-(1<<i)) != 30 {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("20000 случайных чисел от 1 до 2³¹ − 1", "0 расхождений", func() any {
		x := uint32(88172645)
		bad := 0
		for i := 0; i < 20000; i++ {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			n := int(x>>1) + 1
			want := strings.Count(strconv.FormatInt(int64(n), 2), "1")
			if hammingWeight(n) != want {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: counting-bits
---
```go starter
func countBits(n int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n    int
		want []int
	}{
		{2, []int{0, 1, 1}},
		{5, []int{0, 1, 1, 2, 1, 2}},
		{0, []int{0}},
		{1, []int{0, 1}},
		{3, []int{0, 1, 1, 2}},
		{8, []int{0, 1, 1, 2, 1, 2, 2, 3, 1}},
		{16, []int{0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4, 1}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d", c.n), c.want, func() any {
			return countBits(c.n)
		})
	}
	ref := func(n int) []int {
		res := make([]int, n+1)
		for i := range res {
			res[i] = strings.Count(strconv.FormatInt(int64(i), 2), "1")
		}
		return res
	}
	for _, n := range []int{1000, 65535, 65536, 100000} {
		want := ref(n)
		t.Case(fmt.Sprintf("n = %d", n), want, func() any {
			return countBits(n)
		})
	}
}
```

---
id: reverse-bits
---
```go starter
func reverseBits(num uint32) uint32 {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n    uint32
		want uint32
	}{
		{43261596, 964176192},
		{4294967293, 3221225471},
		{0, 0},
		{1, 2147483648},
		{2147483648, 1},
		{4294967295, 4294967295},
		{2, 1073741824},
		{3, 3221225472},
		{255, 4278190080},
		{65535, 4294901760},
		{2863311530, 1431655765},
		{1431655765, 2863311530},
		{4294901760, 65535},
		{2147483647, 4294967294},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d (%032b)", c.n, c.n), c.want, func() any {
			return reverseBits(c.n)
		})
	}
	t.Case("5000 случайных 32-битных чисел и двойной разворот", "0 расхождений", func() any {
		x := uint32(2463534242)
		bad := 0
		for i := 0; i < 5000; i++ {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			var want uint32
			for b := 0; b < 32; b++ {
				if x&(1<<b) != 0 {
					want |= 1 << (31 - b)
				}
			}
			if r := reverseBits(x); r != want || reverseBits(r) != x {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("каждое число с единственным битом 2ⁱ, i = 0..31", "0 расхождений", func() any {
		bad := 0
		for i := 0; i < 32; i++ {
			if reverseBits(uint32(1)<<i) != uint32(1)<<(31-i) {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: missing-number
---
```go starter
func missingNumber(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want int
	}{
		{[]int{3, 0, 1}, 2},
		{[]int{0, 1}, 2},
		{[]int{9, 6, 4, 2, 3, 5, 7, 0, 1}, 8},
		{[]int{0}, 1},
		{[]int{1}, 0},
		{[]int{1, 2}, 0},
		{[]int{0, 2}, 1},
		{[]int{2, 0, 1}, 3},
		{[]int{1, 2, 3, 4, 5}, 0},
		{[]int{5, 4, 3, 2, 1, 0, 7, 8}, 6},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return missingNumber(JClone(c.nums))
		})
	}
	build := func(n, missing int, seed uint32) []int {
		nums := make([]int, 0, n)
		for v := 0; v <= n; v++ {
			if v != missing {
				nums = append(nums, v)
			}
		}
		x := seed
		for i := len(nums) - 1; i > 0; i-- {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			j := int(x>>3) % (i + 1)
			nums[i], nums[j] = nums[j], nums[i]
		}
		return nums
	}
	for _, miss := range []int{0, 1234, 9999, 10000} {
		t.Case(fmt.Sprintf("n = 10000, числа 0..10000 в случайном порядке без %d", miss), miss, func() any {
			return missingNumber(build(10000, miss, uint32(miss)+17))
		})
	}
	t.Case("все n ≤ 30 и все возможные пропущенные", "0 расхождений", func() any {
		bad := 0
		for n := 1; n <= 30; n++ {
			for miss := 0; miss <= n; miss++ {
				if missingNumber(build(n, miss, uint32(n*100+miss)+5)) != miss {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: sum-of-two-integers
---
```go starter
func getSum(a int, b int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct{ a, b, want int }{
		{1, 2, 3},
		{2, 3, 5},
		{-1, 1, 0},
		{0, 0, 0},
		{0, 7, 7},
		{7, 0, 7},
		{-5, 0, -5},
		{-5, 3, -2},
		{3, -5, -2},
		{-3, -4, -7},
		{1000, 1000, 2000},
		{-1000, -1000, -2000},
		{1000, -1000, 0},
		{-1000, 999, -1},
		{1, -1000, -999},
		{511, 1, 512},
		{1023, 1, 1024},
		{-512, -512, -1024},
		{-1, -1, -2},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("a = %d, b = %d", c.a, c.b), c.want, func() any {
			return getSum(c.a, c.b)
		})
	}
	t.Case("все пары (a, b) из диапазона −1000..1000 с шагом 7 и 11", "0 расхождений", func() any {
		bad := 0
		for a := -1000; a <= 1000; a += 7 {
			for b := -1000; b <= 1000; b += 11 {
				if getSum(a, b) != a+b {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("все пары из −40..40", "0 расхождений", func() any {
		bad := 0
		for a := -40; a <= 40; a++ {
			for b := -40; b <= 40; b++ {
				if getSum(a, b) != a+b {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```

---
id: reverse-integer
---
```go starter
func reverse(x int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct{ x, want int }{
		{123, 321},
		{-123, -321},
		{120, 21},
		{0, 0},
		{7, 7},
		{-7, -7},
		{10, 1},
		{-100, -1},
		{1000000009, 0},
		{1000000002, 2000000001},
		{1534236469, 0},
		{2147483647, 0},
		{-2147483648, 0},
		{1463847412, 2147483641},
		{-1463847412, -2147483641},
		{1563847412, 0},
		{-1563847412, 0},
		{2147447412, 2147447412},
		{-2147483412, -2143847412},
		{1000000003, 0},
		{1999999999, 0},
		{1111111111, 1111111111},
		{-1111111111, -1111111111},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("x = %d", c.x), c.want, func() any {
			return reverse(c.x)
		})
	}
	ref := func(x int) int {
		neg := x < 0
		s := strconv.FormatInt(int64(x), 10)
		if neg {
			s = s[1:]
		}
		b := []byte(s)
		for i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
			b[i], b[j] = b[j], b[i]
		}
		v, _ := strconv.ParseInt(string(b), 10, 64)
		if neg {
			v = -v
		}
		if v > 2147483647 || v < -2147483648 {
			return 0
		}
		return int(v)
	}
	t.Case("20000 случайных 32-битных x", "0 расхождений", func() any {
		x := uint32(123456789)
		bad := 0
		for i := 0; i < 20000; i++ {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			v := int(int32(x))
			if i%3 == 0 {
				v /= 1000 // короткие числа с разным числом цифр
			}
			if reverse(v) != ref(v) {
				bad++
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
	t.Case("значения вокруг границ ±2³¹ и 10⁹", "0 расхождений", func() any {
		bad := 0
		for d := -50; d <= 50; d++ {
			for _, base := range []int{2147483647, -2147483648, 1000000000, -1000000000, 1463847412, -1463847412} {
				v := base + d
				if v > 2147483647 || v < -2147483648 {
					continue
				}
				if reverse(v) != ref(v) {
					bad++
				}
			}
		}
		return fmt.Sprintf("%d расхождений", bad)
	})
}
```
