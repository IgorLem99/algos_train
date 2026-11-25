---
id: rotate-image
---
```go starter
func rotate(matrix [][]int) {

}
```

```go tests
func judgeTests(t *Judge) {
	// поворот по часовой: (i, j) -> (j, n-1-i)
	want := func(m [][]int) [][]int {
		n := len(m)
		r := make([][]int, n)
		for i := range r {
			r[i] = make([]int, n)
		}
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				r[j][n-1-i] = m[i][j]
			}
		}
		return r
	}
	run := func(name string, m [][]int, w [][]int) {
		t.Case(name, w, func() any {
			c := JClone2(m)
			rotate(c)
			return c
		})
	}
	m1 := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	run("matrix = [[1 2 3] [4 5 6] [7 8 9]]", m1, [][]int{{7, 4, 1}, {8, 5, 2}, {9, 6, 3}})
	m2 := [][]int{{5, 1, 9, 11}, {2, 4, 8, 10}, {13, 3, 6, 7}, {15, 14, 12, 16}}
	run("matrix = [[5 1 9 11] [2 4 8 10] [13 3 6 7] [15 14 12 16]]", m2,
		[][]int{{15, 13, 2, 5}, {14, 3, 4, 1}, {12, 6, 8, 9}, {16, 7, 10, 11}})
	run("matrix = [[1]]", [][]int{{1}}, [][]int{{1}})
	m3 := [][]int{{1, 2}, {3, 4}}
	run("matrix = [[1 2] [3 4]]", m3, [][]int{{3, 1}, {4, 2}})
	m4 := [][]int{{-1, -100, 3, 0, 7}, {5, 6, 7, 8, 9}, {10, 11, 12, 13, 14}, {15, 16, 17, 18, 19}, {20, 21, 22, 23, 24}}
	run("матрица 5×5 с отрицательными числами", m4, want(m4))
	x := uint32(123)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	for _, n := range []int{6, 7, 20} {
		m := make([][]int, n)
		for i := range m {
			m[i] = make([]int, n)
			for j := range m[i] {
				m[i][j] = next(2001) - 1000
			}
		}
		run(fmt.Sprintf("случайная матрица %d×%d", n, n), m, want(m))
	}
	// четыре поворота возвращают исходную матрицу
	t.Case("четыре поворота подряд 9×9", "исходная матрица", func() any {
		n := 9
		m := make([][]int, n)
		orig := make([][]int, n)
		for i := range m {
			m[i] = make([]int, n)
			orig[i] = make([]int, n)
			for j := range m[i] {
				m[i][j] = next(100)
				orig[i][j] = m[i][j]
			}
		}
		for k := 0; k < 4; k++ {
			rotate(m)
		}
		if JShow(m) == JShow(orig) {
			return "исходная матрица"
		}
		return JShow(m)
	})
}
```

---
id: spiral-matrix
---
```go starter
func spiralOrder(matrix [][]int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: симуляция с поворотом направо при встрече границы или посещённой клетки
	want := func(m [][]int) []int {
		rows, cols := len(m), len(m[0])
		seen := make([][]bool, rows)
		for i := range seen {
			seen[i] = make([]bool, cols)
		}
		out := []int{}
		dr := []int{0, 1, 0, -1}
		dc := []int{1, 0, -1, 0}
		r, c, d := 0, 0, 0
		for len(out) < rows*cols {
			out = append(out, m[r][c])
			seen[r][c] = true
			for tries := 0; tries < 4; tries++ {
				nr, nc := r+dr[d], c+dc[d]
				if nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] {
					break
				}
				d = (d + 1) % 4
			}
			r, c = r+dr[d], c+dc[d]
			if len(out) < rows*cols && (r < 0 || r >= rows || c < 0 || c >= cols) {
				break
			}
		}
		return out
	}
	grid := func(rows, cols int) [][]int {
		m := make([][]int, rows)
		for i := range m {
			m[i] = make([]int, cols)
			for j := range m[i] {
				m[i][j] = i*cols + j + 1
			}
		}
		return m
	}
	run := func(name string, m [][]int, w []int) {
		t.Case(name, w, func() any {
			return spiralOrder(JClone2(m))
		})
	}
	run("matrix = [[1 2 3] [4 5 6] [7 8 9]]", [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
		[]int{1, 2, 3, 6, 9, 8, 7, 4, 5})
	run("matrix = [[1 2 3 4] [5 6 7 8] [9 10 11 12]]", [][]int{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}},
		[]int{1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7})
	run("matrix = [[7]]", [][]int{{7}}, []int{7})
	run("одна строка [[1 2 3 4]]", [][]int{{1, 2, 3, 4}}, []int{1, 2, 3, 4})
	run("один столбец [[1] [2] [3]]", [][]int{{1}, {2}, {3}}, []int{1, 2, 3})
	run("matrix = [[1 2] [3 4]]", [][]int{{1, 2}, {3, 4}}, []int{1, 2, 4, 3})
	run("matrix = [[1 2 3] [4 5 6]]", [][]int{{1, 2, 3}, {4, 5, 6}}, []int{1, 2, 3, 6, 5, 4})
	run("matrix = [[1 2] [3 4] [5 6]]", [][]int{{1, 2}, {3, 4}, {5, 6}}, []int{1, 2, 4, 6, 5, 3})
	run("matrix = [[1 2 3] [4 5 6] [7 8 9] [10 11 12]]", grid(4, 3), []int{1, 2, 3, 6, 9, 12, 11, 10, 7, 4, 5, 8})
	run("матрица [[-1 0] [0 -1]]", [][]int{{-1, 0}, {0, -1}}, []int{-1, 0, -1, 0})
	for _, s := range [][2]int{{5, 5}, {6, 4}, {4, 6}, {1, 10}, {10, 1}, {10, 10}, {7, 9}} {
		m := grid(s[0], s[1])
		run(fmt.Sprintf("матрица %d×%d (1, 2, 3, …)", s[0], s[1]), m, want(m))
	}
	m := grid(100, 70)
	run("матрица 100×70", m, want(m))
}
```

---
id: set-matrix-zeroes
---
```go starter
func setZeroes(matrix [][]int) {

}
```

```go tests
func judgeTests(t *Judge) {
	want := func(m [][]int) [][]int {
		rows, cols := len(m), len(m[0])
		zr, zc := make([]bool, rows), make([]bool, cols)
		for i := range m {
			for j := range m[i] {
				if m[i][j] == 0 {
					zr[i], zc[j] = true, true
				}
			}
		}
		r := JClone2(m)
		for i := range r {
			for j := range r[i] {
				if zr[i] || zc[j] {
					r[i][j] = 0
				}
			}
		}
		return r
	}
	runW := func(name string, m, w [][]int) {
		t.Case(name, w, func() any {
			c := JClone2(m)
			setZeroes(c)
			return c
		})
	}
	run := func(name string, m [][]int) { runW(name, m, want(m)) }
	runW("matrix = [[1 1 1] [1 0 1] [1 1 1]]", [][]int{{1, 1, 1}, {1, 0, 1}, {1, 1, 1}},
		[][]int{{1, 0, 1}, {0, 0, 0}, {1, 0, 1}})
	runW("matrix = [[0 1 2 0] [3 4 5 2] [1 3 1 5]]", [][]int{{0, 1, 2, 0}, {3, 4, 5, 2}, {1, 3, 1, 5}},
		[][]int{{0, 0, 0, 0}, {0, 4, 5, 0}, {0, 3, 1, 0}})
	runW("matrix = [[0]]", [][]int{{0}}, [][]int{{0}})
	runW("matrix = [[5]]", [][]int{{5}}, [][]int{{5}})
	run("нулей нет", [][]int{{1, 2}, {3, 4}})
	runW("ноль в левом верхнем углу", [][]int{{0, 2, 3}, {4, 5, 6}, {7, 8, 9}},
		[][]int{{0, 0, 0}, {0, 5, 6}, {0, 8, 9}})
	runW("ноль в правом нижнем углу", [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 0}},
		[][]int{{1, 2, 0}, {4, 5, 0}, {0, 0, 0}})
	runW("ноль только в первой строке", [][]int{{1, 0, 3}, {4, 5, 6}, {7, 8, 9}},
		[][]int{{0, 0, 0}, {4, 0, 6}, {7, 0, 9}})
	runW("ноль только в первом столбце", [][]int{{1, 2, 3}, {0, 5, 6}, {7, 8, 9}},
		[][]int{{0, 2, 3}, {0, 0, 0}, {0, 8, 9}})
	runW("два нуля в первой строке и первом столбце", [][]int{{1, 0, 3}, {0, 5, 6}, {7, 8, 9}},
		[][]int{{0, 0, 0}, {0, 0, 0}, {0, 0, 9}})
	run("одна строка [[1 0 3 4]]", [][]int{{1, 0, 3, 4}})
	run("один столбец [[1] [0] [3]]", [][]int{{1}, {0}, {3}})
	run("отрицательные числа", [][]int{{-1, -2, -3}, {-4, 0, -6}, {-7, -8, -9}})
	runW("все нули", [][]int{{0, 0}, {0, 0}}, [][]int{{0, 0}, {0, 0}})
	x := uint32(2718)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	random := func(rows, cols, zeros int) [][]int {
		m := make([][]int, rows)
		for i := range m {
			m[i] = make([]int, cols)
			for j := range m[i] {
				m[i][j] = next(9) + 1
			}
		}
		for k := 0; k < zeros; k++ {
			m[next(rows)][next(cols)] = 0
		}
		return m
	}
	for _, p := range [][3]int{{5, 7, 2}, {8, 8, 4}, {200, 200, 3}, {200, 150, 5}, {150, 200, 1}} {
		run(fmt.Sprintf("случайная матрица %d×%d, %d нулей", p[0], p[1], p[2]), random(p[0], p[1], p[2]))
	}
}
```

---
id: happy-number
---
```go starter
func isHappy(n int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: все несчастливые числа попадают в цикл через 4
	ref := func(n int) bool {
		for n != 1 && n != 4 {
			s := 0
			for ; n > 0; n /= 10 {
				s += (n % 10) * (n % 10)
			}
			n = s
		}
		return n == 1
	}
	t.Case("n = 19", true, func() any { return isHappy(19) })
	t.Case("n = 2", false, func() any { return isHappy(2) })
	t.Case("n = 1", true, func() any { return isHappy(1) })
	t.Case("n = 7", true, func() any { return isHappy(7) })
	t.Case("n = 4", false, func() any { return isHappy(4) })
	t.Case("n = 100", true, func() any { return isHappy(100) })
	t.Case("n = 3", false, func() any { return isHappy(3) })
	t.Case("n = 1111111", true, func() any { return isHappy(1111111) })
	for _, n := range []int{10, 13, 20, 89, 145, 999999999, 2147483647, 1999999999, 1000000000} {
		t.Case(fmt.Sprintf("n = %d", n), ref(n), func() any { return isHappy(n) })
	}
	all := make([]bool, 0, 20000)
	for n := 1; n <= 20000; n++ {
		all = append(all, ref(n))
	}
	t.Case("все n от 1 до 20000", all, func() any {
		got := make([]bool, 0, 20000)
		for n := 1; n <= 20000; n++ {
			got = append(got, isHappy(n))
		}
		return got
	})
}
```

---
id: plus-one
---
```go starter
func plusOne(digits []int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	run := func(d, w []int) {
		name := fmt.Sprintf("digits = %v", d)
		if len(d) > 20 {
			name = fmt.Sprintf("digits: %d цифр", len(d))
		}
		t.Case(name, w, func() any { return plusOne(JClone(d)) })
	}
	run([]int{1, 2, 3}, []int{1, 2, 4})
	run([]int{4, 3, 2, 1}, []int{4, 3, 2, 2})
	run([]int{9}, []int{1, 0})
	run([]int{9, 9}, []int{1, 0, 0})
	run([]int{0}, []int{1})
	run([]int{1, 9, 9}, []int{2, 0, 0})
	run([]int{8, 9, 9, 9}, []int{9, 0, 0, 0})
	run([]int{1, 0, 9}, []int{1, 1, 0})
	run([]int{9, 8, 9}, []int{9, 9, 0})
	run([]int{2, 9, 9, 8}, []int{2, 9, 9, 9})
	nines := make([]int, 100)
	w := make([]int, 101)
	for i := range nines {
		nines[i] = 9
	}
	w[0] = 1
	run(nines, w)
	d := make([]int, 100)
	for i := range d {
		d[i] = 9
	}
	d[0] = 5
	w2 := append([]int{}, d...)
	w2[0] = 6
	for i := 1; i < 100; i++ {
		w2[i] = 0
	}
	run(d, w2)
	d3 := make([]int, 100)
	d3[0] = 1
	w3 := append([]int{}, d3...)
	w3[99] = 1
	run(d3, w3)
}
```

---
id: powx-n
---
```go starter
func myPow(x float64, n int) float64 {

}
```

```go tests
func judgeTests(t *Judge) {
	run := func(x float64, n int, w float64) {
		t.Case(fmt.Sprintf("x = %v, n = %d", x, n), w, func() any { return myPow(x, n) }, JFloat)
	}
	run(2.0, 10, 1024.0)
	run(2.1, 3, 9.261)
	run(2.0, -2, 0.25)
	run(2.0, 0, 1)
	run(0, 5, 0)
	run(5, 1, 5)
	run(-2, 3, -8)
	run(-2, 4, 16)
	run(-2, -3, -0.125)
	run(0.5, 10, 0.0009765625)
	run(10, -1, 0.1)
	run(1, 300000000, 1)
	run(-1, 2147483647, -1)
	run(-1, -2147483648, 1)
	run(1.00001, 100000, math.Pow(1.00001, 100000))
	run(0.99999, 100000, math.Pow(0.99999, 100000))
	run(2, 62, 4611686018427387904)
	run(2, -2147483648, 0)
	run(1.0000001, 10000000, math.Pow(1.0000001, 10000000))
	run(3, 20, 3486784401)
	run(1.5, -7, math.Pow(1.5, -7))
}
```

---
id: multiply-strings
---
```go starter
func multiply(num1 string, num2 string) string {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон — math/big
	ref := func(a, b string) string {
		x, _ := new(big.Int).SetString(a, 10)
		y, _ := new(big.Int).SetString(b, 10)
		return new(big.Int).Mul(x, y).String()
	}
	run := func(a, b string) {
		name := fmt.Sprintf("num1 = %q, num2 = %q", a, b)
		if len(name) > 100 {
			name = fmt.Sprintf("num1 из %d цифр, num2 из %d цифр", len(a), len(b))
		}
		t.Case(name, ref(a, b), func() any { return multiply(a, b) })
	}
	t.Case(`num1 = "2", num2 = "3"`, "6", func() any { return multiply("2", "3") })
	t.Case(`num1 = "123", num2 = "456"`, "56088", func() any { return multiply("123", "456") })
	t.Case(`num1 = "0", num2 = "0"`, "0", func() any { return multiply("0", "0") })
	t.Case(`num1 = "999", num2 = "999"`, "998001", func() any { return multiply("999", "999") })
	t.Case(`num1 = "9", num2 = "9"`, "81", func() any { return multiply("9", "9") })
	t.Case(`num1 = "1000", num2 = "100"`, "100000", func() any { return multiply("1000", "100") })
	run("0", "12345")
	run("12345", "0")
	run("1", "987654321")
	run("10", "10")
	run("99", "1")
	run("25", "4")
	run("500", "20")
	run("123456789", "987654321")
	run("99999999999999999999", "99999999999999999999")
	run("1000000000000000000000", "1000000000000000000000")
	x := uint32(1618)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	gen := func(n int) string {
		b := make([]byte, n)
		for i := range b {
			b[i] = byte('0' + next(10))
		}
		if n > 1 && b[0] == '0' {
			b[0] = '7'
		}
		return string(b)
	}
	run(gen(30), gen(25))
	run(gen(100), gen(100))
	run(gen(200), gen(200))
	run(gen(200), gen(1))
	nines := ""
	for i := 0; i < 200; i++ {
		nines += "9"
	}
	run(nines, nines)
}
```

---
id: detect-squares
---
```go starter
type DetectSquares struct {

}

func Constructor() DetectSquares {

}

func (this *DetectSquares) Add(point []int) {

}

func (this *DetectSquares) Count(point []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// операции: {0, x, y} — Add, {1, x, y} — Count
	type op [3]int
	add := func(x, y int) op { return op{0, x, y} }
	cnt := func(x, y int) op { return op{1, x, y} }
	describe := func(ops []op) string {
		s := ""
		for i, o := range ops {
			if i > 0 {
				s += " "
			}
			if o[0] == 0 {
				s += fmt.Sprintf("add(%d,%d)", o[1], o[2])
			} else {
				s += fmt.Sprintf("count(%d,%d)", o[1], o[2])
			}
		}
		return s
	}
	run := func(name string, ops []op, w []int) {
		t.Case(name, w, func() any {
			d := Constructor()
			out := []int{}
			for _, o := range ops {
				if o[0] == 0 {
					d.Add([]int{o[1], o[2]})
				} else {
					out = append(out, d.Count([]int{o[1], o[2]}))
				}
			}
			return out
		})
	}
	// эталон 1: перебор всех троек добавленных точек (малые тесты)
	naive := func(ops []op) []int {
		var pts [][2]int
		out := []int{}
		for _, o := range ops {
			if o[0] == 0 {
				pts = append(pts, [2]int{o[1], o[2]})
				continue
			}
			q := [2]int{o[1], o[2]}
			res := 0
			for i := 0; i < len(pts); i++ {
				for j := i + 1; j < len(pts); j++ {
					for k := j + 1; k < len(pts); k++ {
						four := [][2]int{pts[i], pts[j], pts[k], q}
						xs, ys := map[int]int{}, map[int]int{}
						corners := map[[2]int]int{}
						for _, p := range four {
							xs[p[0]]++
							ys[p[1]]++
							corners[p]++
						}
						if len(xs) != 2 || len(ys) != 2 || len(corners) != 4 {
							continue
						}
						var vx, vy []int
						for v := range xs {
							vx = append(vx, v)
						}
						for v := range ys {
							vy = append(vy, v)
						}
						dx, dy := vx[0]-vx[1], vy[0]-vy[1]
						if dx < 0 {
							dx = -dx
						}
						if dy < 0 {
							dy = -dy
						}
						if dx == dy {
							res++
						}
					}
				}
			}
			out = append(out, res)
		}
		return out
	}
	// эталон 2: сетка кратностей, перебор стороны квадрата
	grid := func(size int, ops []op) []int {
		g := make([][]int, size)
		for i := range g {
			g[i] = make([]int, size)
		}
		at := func(x, y int) int {
			if x < 0 || y < 0 || x >= size || y >= size {
				return 0
			}
			return g[x][y]
		}
		out := []int{}
		for _, o := range ops {
			x, y := o[1], o[2]
			if o[0] == 0 {
				g[x][y]++
				continue
			}
			res := 0
			for d := -size; d <= size; d++ {
				if d == 0 {
					continue
				}
				res += at(x+d, y) * at(x, y+d) * at(x+d, y+d)
				res += at(x+d, y) * at(x, y-d) * at(x+d, y-d)
			}
			out = append(out, res)
		}
		return out
	}
	ex1 := []op{add(3, 10), add(11, 2), add(3, 2), cnt(11, 10), cnt(14, 8)}
	run("add(3,10) add(11,2) add(3,2) count(11,10) count(14,8)", ex1, []int{1, 0})
	ex2 := []op{add(3, 10), add(11, 2), add(3, 2), cnt(11, 10), cnt(14, 8), add(11, 2), cnt(11, 10)}
	run("… add(11,2) count(11,10) (дубликат точки)", ex2, []int{1, 0, 2})
	ex3 := []op{cnt(0, 0), cnt(5, 5)}
	run("count на пустой структуре", ex3, []int{0, 0})
	// дополнительные
	ops4 := []op{add(1, 1), cnt(1, 1)}
	run("точка совпадает с добавленной (нулевая площадь): "+describe(ops4), ops4, []int{0})
	ops5 := []op{add(0, 0), add(0, 0), add(0, 1), add(0, 1), add(0, 1), add(1, 0), cnt(1, 1)}
	run("кратности: 2 · 3 · 1 = 6", ops5, []int{6})
	ops6 := []op{add(0, 0), add(0, 2), add(2, 0), cnt(1, 1), cnt(2, 2), cnt(2, 2)}
	run("не квадрат (прямоугольник/смещение) и квадрат 2×2", ops6, []int{0, 1, 1})
	ops7 := []op{add(0, 0), add(0, 3), add(3, 0), add(3, 3), add(1, 1), add(1, 4), add(4, 1), cnt(4, 4), cnt(3, 3), cnt(0, 0)}
	run("несколько квадратов с общими вершинами", ops7, naive(ops7))
	ops8 := []op{add(5, 5), add(5, 8), add(8, 5), add(2, 5), add(2, 8), add(5, 2), add(2, 2), cnt(8, 8), cnt(5, 5)}
	run("квадраты слева и справа от точки", ops8, naive(ops8))
	ops9 := []op{add(0, 0), add(1, 1), add(2, 2), cnt(1, 0), cnt(0, 1), cnt(3, 3)}
	run("точки на диагонали", ops9, []int{0, 0, 0})
	ops10 := []op{add(1000, 1000), add(0, 1000), add(1000, 0), cnt(0, 0), add(0, 0), cnt(1000, 1000)}
	run("квадрат на границах координат 0..1000", ops10, []int{1, 1})
	// случайные операции
	x := uint32(8080)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	random := func(n, size int, pAdd int) []op {
		ops := make([]op, n)
		for i := range ops {
			if next(100) < pAdd {
				ops[i] = add(next(size), next(size))
			} else {
				ops[i] = cnt(next(size), next(size))
			}
		}
		return ops
	}
	for _, p := range [][4]int{{80, 4, 50, 0}, {120, 6, 40, 1}} {
		ops := random(p[0], p[1], p[2])
		run(fmt.Sprintf("%d случайных add/count в сетке %d×%d", p[0], p[1], p[1]), ops, naive(ops))
	}
	for _, p := range [][3]int{{3000, 10, 60}, {3000, 40, 70}, {3000, 1001, 60}} {
		ops := random(p[0], p[1], p[2])
		run(fmt.Sprintf("%d случайных add/count в сетке %d×%d", p[0], p[1], p[1]), ops, grid(p[1], ops))
	}
}
```
