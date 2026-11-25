---
id: contains-duplicate
---
```go starter
func containsDuplicate(nums []int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want bool
	}{
		{[]int{1, 2, 3, 1}, true},
		{[]int{1, 2, 3, 4}, false},
		{[]int{1, 1, 1, 3, 3, 4, 3, 2, 4, 2}, true},
		{[]int{1}, false},
		{[]int{0, 0}, true},
		{[]int{-1000000000, 1000000000}, false},
		{[]int{-5, 3, -5}, true},
		{[]int{5, 4, 3, 2, 1, 0, -1, -2, 5}, true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return containsDuplicate(JClone(c.nums))
		})
	}
	big := make([]int, 100000)
	for i := range big {
		big[i] = (i*7919)%100003 - 50000
	}
	t.Case("nums: 100000 различных чисел", false, func() any {
		return containsDuplicate(JClone(big))
	})
	t.Case("nums: 100000 чисел, совпадают первый и последний", true, func() any {
		a := JClone(big)
		a[len(a)-1] = a[0]
		return containsDuplicate(a)
	})
}
```

---
id: valid-anagram
---
```go starter
func isAnagram(s string, t string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		s, t string
		want bool
	}{
		{"anagram", "nagaram", true},
		{"rat", "car", false},
		{"a", "ab", false},
		{"a", "a", true},
		{"a", "b", false},
		{"ab", "ba", true},
		{"aabb", "abbb", false},
		{"aab", "abb", false},
		{"listen", "silent", true},
		{"abc", "abcc", false},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("s = %q, t = %q", c.s, c.t), c.want, func() any {
			return isAnagram(c.s, c.t)
		})
	}
	a := make([]byte, 50000)
	b := make([]byte, 50000)
	for i := range a {
		a[i] = byte('a' + i%26)
		b[len(b)-1-i] = a[i]
	}
	t.Case("s, t: по 50000 букв, t — развёрнутая s", true, func() any {
		return isAnagram(string(a), string(b))
	})
	t.Case("s, t: по 50000 букв, одна буква заменена", false, func() any {
		c := append([]byte{}, b...)
		if c[100] == 'z' {
			c[100] = 'y'
		} else {
			c[100] = 'z'
		}
		return isAnagram(string(a), string(c))
	})
}
```

---
id: two-sum
---
```go starter
func twoSum(nums []int, target int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums   []int
		target int
		want   []int
	}{
		{[]int{2, 7, 11, 15}, 9, []int{0, 1}},
		{[]int{3, 2, 4}, 6, []int{1, 2}},
		{[]int{3, 3}, 6, []int{0, 1}},
		{[]int{-1, -2, -3, -4, -5}, -8, []int{2, 4}},
		{[]int{0, 4, 3, 0}, 0, []int{0, 3}},
		{[]int{1000000000, 5, -1000000000}, 0, []int{0, 2}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v, target = %d", c.nums, c.target), c.want, func() any {
			return twoSum(JClone(c.nums), c.target)
		}, JAnyOrder)
	}
	// большой тест: ответ в самом конце
	big := make([]int, 20000)
	for i := range big {
		big[i] = i * 2
	}
	big[len(big)-1] = 1
	t.Case("nums = [0, 2, 4, …, 39996, 1] (20000 чисел), target = 39997", []int{19998, 19999}, func() any {
		return twoSum(JClone(big), 39997)
	}, JAnyOrder)
}
```

---
id: group-anagrams
---
```go starter
func groupAnagrams(strs []string) [][]string {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		strs []string
		want [][]string
	}{
		{[]string{"eat", "tea", "tan", "ate", "nat", "bat"}, [][]string{{"bat"}, {"nat", "tan"}, {"ate", "eat", "tea"}}},
		{[]string{""}, [][]string{{""}}},
		{[]string{"a"}, [][]string{{"a"}}},
		{[]string{"", "", ""}, [][]string{{"", "", ""}}},
		{[]string{"ab", "ba", "abc", "cba", "bca", "c"}, [][]string{{"ab", "ba"}, {"abc", "cba", "bca"}, {"c"}}},
		{[]string{"abc", "def", "ghi"}, [][]string{{"abc"}, {"def"}, {"ghi"}}},
		{[]string{"aab", "aba", "baa", "abb"}, [][]string{{"aab", "aba", "baa"}, {"abb"}}},
		{[]string{"x", "x", "y"}, [][]string{{"x", "x"}, {"y"}}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("strs = %q", c.strs), c.want, func() any {
			return groupAnagrams(JClone(c.strs))
		}, JAnyOrderDeep)
	}
	// большой тест; эталон считается наивно: ключ — отсортированные буквы
	gen := func() []string {
		x := uint32(2463534242)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 8) }
		strs := make([]string, 5000)
		for i := range strs {
			n := next()%6 + 1
			b := make([]byte, n)
			for j := range b {
				b[j] = byte('a' + next()%4)
			}
			strs[i] = string(b)
		}
		return strs
	}
	t.Case("strs: 5000 случайных строк из букв a-d, длина 1-6", "группы совпадают с эталоном", func() any {
		strs := gen()
		got := groupAnagrams(JClone(strs))
		key := func(s string) string {
			b := []byte(s)
			sort.Slice(b, func(i, j int) bool { return b[i] < b[j] })
			return string(b)
		}
		m := map[string][]string{}
		for _, s := range strs {
			m[key(s)] = append(m[key(s)], s)
		}
		want := make([][]string, 0, len(m))
		for _, g := range m {
			want = append(want, g)
		}
		canon := func(gs [][]string) string {
			parts := make([]string, 0, len(gs))
			for _, g := range gs {
				g = append([]string{}, g...)
				sort.Strings(g)
				parts = append(parts, strings.Join(g, ","))
			}
			sort.Strings(parts)
			return strings.Join(parts, ";")
		}
		if canon(got) == canon(want) {
			return "группы совпадают с эталоном"
		}
		return fmt.Sprintf("получено групп: %d, ожидалось: %d", len(got), len(want))
	})
}
```

---
id: top-k-frequent-elements
---
```go starter
func topKFrequent(nums []int, k int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		k    int
		want []int
	}{
		{[]int{1, 1, 1, 2, 2, 3}, 2, []int{1, 2}},
		{[]int{1}, 1, []int{1}},
		{[]int{4, 1, -1, 2, -1, 2, 3, -1, 2}, 2, []int{-1, 2}},
		{[]int{5, 5, 5, 6, 6, 7}, 3, []int{5, 6, 7}},
		{[]int{5, 5, 5, 6, 6, 7}, 1, []int{5}},
		{[]int{-1, -1, -2, -2, -2, 0}, 2, []int{-1, -2}},
		{[]int{1000000000, -1000000000, 1000000000}, 1, []int{1000000000}},
		{[]int{3, 0, 1, 0}, 1, []int{0}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v, k = %d", c.nums, c.k), c.want, func() any {
			return topKFrequent(JClone(c.nums), c.k)
		}, JAnyOrder)
	}
	// значение v встречается v+1 раз (v = 0..445), перемешано
	mk := func() []int {
		var a []int
		for v := 0; v <= 445; v++ {
			for j := 0; j <= v; j++ {
				a = append(a, v)
			}
		}
		x := uint32(88172645)
		for i := len(a) - 1; i > 0; i-- {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			j := int(x % uint32(i+1))
			a[i], a[j] = a[j], a[i]
		}
		return a
	}
	t.Case("nums: значение v (0..445) встречается v+1 раз, перемешано; k = 5", []int{445, 444, 443, 442, 441}, func() any {
		return topKFrequent(mk(), 5)
	}, JAnyOrder)
	all := make([]int, 446)
	for i := range all {
		all[i] = i
	}
	t.Case("nums: то же, k = 446", all, func() any {
		return topKFrequent(mk(), 446)
	}, JAnyOrder)
	t.Case("nums: 100000 одинаковых чисел 7, k = 1", []int{7}, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = 7
		}
		return topKFrequent(a, 1)
	}, JAnyOrder)
}
```

---
id: encode-and-decode-strings
---
```go starter
type Codec struct {
}

func (c *Codec) Encode(strs []string) string {

}

func (c *Codec) Decode(s string) []string {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := [][]string{
		{"lint", "code", "love", "you"},
		{"we", "say", ":", "yes"},
		{"hello", "world"},
		{},
		{""},
		{"", ""},
		{"", "a", ""},
		{"#", "##", "3#abc"},
		{"3#abc", "1#", "0#"},
		{"a b", "line1\nline2", "tab\there", "юникод", "日本語"},
		{"12", "345#6", "7"},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("strs = %q", c), c, func() any {
			enc := (&Codec{}).Encode(JClone(c))
			return (&Codec{}).Decode(enc)
		})
	}
	t.Case("200 строк длины до 200 из символов #, 0-9, a, пробела и перевода строки", "Decode(Encode(strs)) == strs", func() any {
		x := uint32(362436069)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 8) }
		alpha := "#0123456789a \n"
		strs := make([]string, 200)
		for i := range strs {
			b := make([]byte, next()%201)
			for j := range b {
				b[j] = alpha[next()%len(alpha)]
			}
			strs[i] = string(b)
		}
		got := (&Codec{}).Decode((&Codec{}).Encode(JClone(strs)))
		if reflect.DeepEqual(got, strs) {
			return "Decode(Encode(strs)) == strs"
		}
		return fmt.Sprintf("не совпало: получено %d строк", len(got))
	})
}
```

---
id: product-of-array-except-self
---
```go starter
func productExceptSelf(nums []int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want []int
	}{
		{[]int{1, 2, 3, 4}, []int{24, 12, 8, 6}},
		{[]int{-1, 1, 0, -3, 3}, []int{0, 0, 9, 0, 0}},
		{[]int{2, 3}, []int{3, 2}},
		{[]int{0, 2, 0, 5}, []int{0, 0, 0, 0}},
		{[]int{0, 4, 5}, []int{20, 0, 0}},
		{[]int{-2, -3, -4}, []int{12, 8, 6}},
		{[]int{1, 1, 1, 1}, []int{1, 1, 1, 1}},
		{[]int{-30, 30, 2, -1}, []int{-60, 60, 900, -1800}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return productExceptSelf(JClone(c.nums))
		})
	}
	mk := func() []int {
		a := make([]int, 100000)
		x := uint32(123456789)
		for i := range a {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			a[i] = 1 - 2*int(x>>16&1)
		}
		return a
	}
	t.Case("nums: 100000 чисел ±1", "answer[i] = произведение всех · nums[i]", func() any {
		a := mk()
		total := 1
		for _, v := range a {
			total *= v
		}
		got := productExceptSelf(JClone(a))
		if len(got) != len(a) {
			return fmt.Sprintf("длина %d вместо %d", len(got), len(a))
		}
		for i := range a {
			if got[i] != total*a[i] {
				return fmt.Sprintf("answer[%d] = %d, ожидалось %d", i, got[i], total*a[i])
			}
		}
		return "answer[i] = произведение всех · nums[i]"
	})
	t.Case("nums: 100000 чисел ±1, на позиции 77777 стоит 0", "ненулевой ответ только на позиции 77777", func() any {
		a := mk()
		a[77777] = 0
		prod := 1
		for i, v := range a {
			if i != 77777 {
				prod *= v
			}
		}
		got := productExceptSelf(JClone(a))
		if len(got) != len(a) {
			return fmt.Sprintf("длина %d вместо %d", len(got), len(a))
		}
		for i := range a {
			w := 0
			if i == 77777 {
				w = prod
			}
			if got[i] != w {
				return fmt.Sprintf("answer[%d] = %d, ожидалось %d", i, got[i], w)
			}
		}
		return "ненулевой ответ только на позиции 77777"
	})
}
```

---
id: valid-sudoku
---
```go starter
func isValidSudoku(board [][]byte) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	valid := []string{
		"53..7....",
		"6..195...",
		".98....6.",
		"8...6...3",
		"4..8.3..1",
		"7...2...6",
		".6....28.",
		"...419..5",
		"....8..79",
	}
	solved := []string{
		"534678912",
		"672195348",
		"198342567",
		"859761423",
		"426853791",
		"713924856",
		"961537284",
		"287419635",
		"345286179",
	}
	empty := []string{".........", ".........", ".........", ".........", ".........", ".........", ".........", ".........", "........."}
	// set возвращает копию доски с изменёнными клетками
	set := func(base []string, edits map[[2]int]byte) []string {
		out := append([]string{}, base...)
		for p, v := range edits {
			r := []byte(out[p[0]])
			r[p[1]] = v
			out[p[0]] = string(r)
		}
		return out
	}
	cases := []struct {
		name  string
		board []string
		want  bool
	}{
		{"классическая допустимая доска", valid, true},
		{"две пятёрки в первой строке", set(valid, map[[2]int]byte{{0, 1}: '5'}), false},
		{"восьмёрка в первой строке, столбце и блоке", set(valid, map[[2]int]byte{{0, 0}: '8'}), false},
		{"пустая доска", empty, true},
		{"полностью решённая доска", solved, true},
		{"повтор в столбце (разные строки и блоки)", set(empty, map[[2]int]byte{{0, 0}: '5', {8, 0}: '5'}), false},
		{"повтор только в блоке", set(empty, map[[2]int]byte{{0, 0}: '5', {1, 1}: '5'}), false},
		{"повтор только в строке", set(empty, map[[2]int]byte{{4, 0}: '9', {4, 8}: '9'}), false},
		{"одинаковые цифры в разных строках, столбцах и блоках", set(empty, map[[2]int]byte{{0, 0}: '1', {1, 3}: '1', {2, 6}: '1', {3, 1}: '1', {4, 4}: '1', {5, 7}: '1'}), true},
		{"решённая доска с подменой одной клетки", set(solved, map[[2]int]byte{{8, 8}: '8'}), false},
		{"повтор в среднем блоке", set(empty, map[[2]int]byte{{3, 3}: '7', {5, 5}: '7'}), false},
		{"повтор в правом нижнем блоке", set(empty, map[[2]int]byte{{6, 6}: '2', {8, 7}: '2'}), false},
	}
	for _, c := range cases {
		t.Case(c.name+": "+strings.Join(c.board, " "), c.want, func() any {
			return isValidSudoku(JBoard(c.board...))
		})
	}
	// случайные доски: эталон — проверка всех пар клеток
	t.Case("200 случайных разреженных досок", "совпадает с эталоном", func() any {
		x := uint32(2463534242)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x >> 8) }
		for it := 0; it < 200; it++ {
			rows := make([]string, 9)
			dens := 5 + it%20
			for r := range rows {
				b := make([]byte, 9)
				for c := range b {
					if next()%100 < dens {
						b[c] = byte('1' + next()%9)
					} else {
						b[c] = '.'
					}
				}
				rows[r] = string(b)
			}
			want := true
			for a := 0; a < 81; a++ {
				for b := a + 1; b < 81; b++ {
					ra, ca, rb, cb := a/9, a%9, b/9, b%9
					if rows[ra][ca] == '.' || rows[ra][ca] != rows[rb][cb] {
						continue
					}
					if ra == rb || ca == cb || (ra/3 == rb/3 && ca/3 == cb/3) {
						want = false
					}
				}
			}
			if got := isValidSudoku(JBoard(rows...)); got != want {
				return fmt.Sprintf("доска %v: получено %v, ожидалось %v", rows, got, want)
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: longest-consecutive-sequence
---
```go starter
func longestConsecutive(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		want int
	}{
		{[]int{100, 4, 200, 1, 3, 2}, 4},
		{[]int{0, 3, 7, 2, 5, 8, 4, 6, 0, 1}, 9},
		{[]int{1, 0, 1, 2}, 3},
		{[]int{}, 0},
		{[]int{7}, 1},
		{[]int{5, 5, 5}, 1},
		{[]int{-3, -2, -1, 0, 1}, 5},
		{[]int{1000000000, 999999999, -1000000000, -999999999}, 2},
		{[]int{10, 30, 20}, 1},
		{[]int{9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6}, 7},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("nums = %v", c.nums), c.want, func() any {
			return longestConsecutive(JClone(c.nums))
		})
	}
	shuffle := func(a []int, seed uint32) {
		x := seed
		for i := len(a) - 1; i > 0; i-- {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			j := int(x % uint32(i+1))
			a[i], a[j] = a[j], a[i]
		}
	}
	t.Case("nums: числа 1..100000 в случайном порядке", 100000, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = i + 1
		}
		shuffle(a, 2463534242)
		return longestConsecutive(a)
	})
	t.Case("nums: чётные числа 0..199998 в случайном порядке", 1, func() any {
		a := make([]int, 100000)
		for i := range a {
			a[i] = i * 2
		}
		shuffle(a, 88172645)
		return longestConsecutive(a)
	})
	t.Case("nums: два блока подряд идущих (длины 40000 и 50000) с дубликатами", 50000, func() any {
		var a []int
		for i := 0; i < 40000; i++ {
			a = append(a, -20000+i)
		}
		for i := 0; i < 50000; i++ {
			a = append(a, 1000000+i)
		}
		for i := 0; i < 10000; i++ {
			a = append(a, 1000000+i)
		}
		shuffle(a, 362436069)
		return longestConsecutive(a)
	})
}
```
