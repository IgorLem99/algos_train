---
id: rotate-image
title: Rotate Image
difficulty: Medium
category: Math & Geometry
leetcode: 48
lists: neetcode150, blind75
algorithms: matrix
order: 136
---
Дана квадратная матрица `n × n`. Поверни её на 90° по часовой стрелке **на месте**.

**Пример:** `[[1,2,3],[4,5,6],[7,8,9]]` → `[[7,4,1],[8,5,2],[9,6,3]]`

**Ограничения:** `1 ≤ n ≤ 20`

<details><summary>Подсказка</summary>Элемент `(i, j)` переходит в `(j, n−1−i)`. Поворот = транспонирование + разворот каждой строки.</details>

### Копия матрицы
Записываем `res[j][n−1−i] = m[i][j]` и копируем обратно.

**Сложность:** время O(n²), память O(n²).

```go
func rotate(matrix [][]int) {
	n := len(matrix)
	res := make([][]int, n)
	for i := range res {
		res[i] = make([]int, n)
	}
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			res[j][n-1-i] = matrix[i][j]
		}
	}
	for i := 0; i < n; i++ {
		copy(matrix[i], res[i])
	}
}
```

### Транспонирование и разворот строк
Транспонируем (`m[i][j] ↔ m[j][i]`), затем разворачиваем каждую строку — получаем поворот по часовой стрелке.

**Сложность:** время O(n²), память O(1).

```go
func rotate(matrix [][]int) {
	n := len(matrix)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
		}
	}
	for _, row := range matrix {
		slices.Reverse(row)
	}
}
```

### Поворот слоями по четыре клетки
Идём по слоям от внешнего к внутреннему. Для каждой клетки верхнего ряда слоя циклически сдвигаем четыре клетки: левая-нижняя → левая-верхняя → правая-верхняя → правая-нижняя → левая-нижняя.

**Сложность:** время O(n²), память O(1).

```go
func rotate(matrix [][]int) {
	n := len(matrix)
	for i := 0; i < n/2; i++ {
		for j := i; j < n-1-i; j++ {
			tmp := matrix[n-1-j][i]
			matrix[n-1-j][i] = matrix[n-1-i][n-1-j]
			matrix[n-1-i][n-1-j] = matrix[j][n-1-i]
			matrix[j][n-1-i] = matrix[i][j]
			matrix[i][j] = tmp
		}
	}
}
```

---
id: spiral-matrix
title: Spiral Matrix
difficulty: Medium
category: Math & Geometry
leetcode: 54
lists: neetcode150, blind75
algorithms: matrix
order: 137
---
Дана матрица `m × n`. Верни все её элементы в порядке обхода по спирали по часовой стрелке, начиная с левого верхнего угла.

**Пример:** `[[1,2,3],[4,5,6],[7,8,9]]` → `[1,2,3,6,9,8,7,4,5]`

**Ограничения:** `1 ≤ m, n ≤ 10`

<details><summary>Подсказка</summary>Держи четыре границы (верх, низ, лево, право) и сужай их после каждой стороны, не забывая проверять, что строки или столбцы ещё остались.</details>

### Сужающиеся границы
Проходим верхнюю строку, правый столбец, нижнюю строку, левый столбец, после каждой сдвигаем границу. После двух первых сторон проверяем, что полоса не опустела.

**Сложность:** время O(m·n), память O(1) дополнительно.

```go
func spiralOrder(matrix [][]int) []int {
	top, bot := 0, len(matrix)-1
	left, right := 0, len(matrix[0])-1
	res := make([]int, 0, len(matrix)*len(matrix[0]))
	for top <= bot && left <= right {
		for j := left; j <= right; j++ {
			res = append(res, matrix[top][j])
		}
		top++
		for i := top; i <= bot; i++ {
			res = append(res, matrix[i][right])
		}
		right--
		if top <= bot {
			for j := right; j >= left; j-- {
				res = append(res, matrix[bot][j])
			}
			bot--
		}
		if left <= right {
			for i := bot; i >= top; i-- {
				res = append(res, matrix[i][left])
			}
			left++
		}
	}
	return res
}
```

### Симуляция с направлениями и visited
Идём в текущем направлении; если следующая клетка вне матрицы или уже посещена — поворачиваем направо (`d = (d+1) % 4`). Делаем ровно `m·n` шагов.

**Сложность:** время O(m·n), память O(m·n).

```go
func spiralOrder(matrix [][]int) []int {
	m, n := len(matrix), len(matrix[0])
	seen := make([][]bool, m)
	for i := range seen {
		seen[i] = make([]bool, n)
	}
	dr := [4]int{0, 1, 0, -1}
	dc := [4]int{1, 0, -1, 0}
	res := make([]int, 0, m*n)
	r, c, d := 0, 0, 0
	for k := 0; k < m*n; k++ {
		res = append(res, matrix[r][c])
		seen[r][c] = true
		nr, nc := r+dr[d], c+dc[d]
		if nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc] {
			d = (d + 1) % 4
			nr, nc = r+dr[d], c+dc[d]
		}
		r, c = nr, nc
	}
	return res
}
```

---
id: set-matrix-zeroes
title: Set Matrix Zeroes
difficulty: Medium
category: Math & Geometry
leetcode: 73
lists: neetcode150, blind75
algorithms: matrix
order: 138
---
Дана матрица `m × n`. Если элемент равен 0, обнули всю его строку и весь столбец. Сделай это на месте.

**Пример:** `[[1,1,1],[1,0,1],[1,1,1]]` → `[[1,0,1],[0,0,0],[1,0,1]]`

**Ограничения:** `1 ≤ m, n ≤ 200`. Follow-up: решение за O(1) дополнительной памяти.

<details><summary>Подсказка</summary>Первая строка и первый столбец сами могут служить массивами-флагами для остальных.</details>

### Массивы флагов строк и столбцов
Первым проходом отмечаем строки и столбцы, содержащие ноль; вторым — обнуляем клетки, у которых отмечена строка или столбец.

**Сложность:** время O(m·n), память O(m + n).

```go
func setZeroes(matrix [][]int) {
	m, n := len(matrix), len(matrix[0])
	rows, cols := make([]bool, m), make([]bool, n)
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if matrix[i][j] == 0 {
				rows[i], cols[j] = true, true
			}
		}
	}
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if rows[i] || cols[j] {
				matrix[i][j] = 0
			}
		}
	}
}
```

### Флаги в первой строке и первом столбце
Нули из внутренней части записываем в `matrix[i][0]` и `matrix[0][j]`. Заранее запоминаем, были ли нули в самой первой строке/столбце. Обнуляем внутреннюю часть по маркерам, затем при необходимости — первую строку и столбец.

**Сложность:** время O(m·n), память O(1).

```go
func setZeroes(matrix [][]int) {
	m, n := len(matrix), len(matrix[0])
	firstRow, firstCol := false, false
	for j := 0; j < n; j++ {
		if matrix[0][j] == 0 {
			firstRow = true
		}
	}
	for i := 0; i < m; i++ {
		if matrix[i][0] == 0 {
			firstCol = true
		}
	}
	for i := 1; i < m; i++ {
		for j := 1; j < n; j++ {
			if matrix[i][j] == 0 {
				matrix[i][0], matrix[0][j] = 0, 0
			}
		}
	}
	for i := 1; i < m; i++ {
		for j := 1; j < n; j++ {
			if matrix[i][0] == 0 || matrix[0][j] == 0 {
				matrix[i][j] = 0
			}
		}
	}
	if firstRow {
		for j := 0; j < n; j++ {
			matrix[0][j] = 0
		}
	}
	if firstCol {
		for i := 0; i < m; i++ {
			matrix[i][0] = 0
		}
	}
}
```

---
id: happy-number
title: Happy Number
difficulty: Easy
category: Math & Geometry
leetcode: 202
lists: neetcode150
algorithms: floyd-cycle, hashing
order: 139
---
Число «счастливое», если, многократно заменяя его на сумму квадратов его цифр, мы придём к 1. Если процесс зацикливается без единицы — число несчастливое. Определи, счастливо ли `n`.

**Примеры:** `n = 19` → `true` (19 → 82 → 68 → 100 → 1); `n = 2` → `false`

**Ограничения:** `1 ≤ n ≤ 2³¹ − 1`

<details><summary>Подсказка</summary>Последовательность либо доходит до 1, либо зацикливается — как связный список с циклом.</details>

### Хеш-множество посещённых
Запоминаем уже встреченные значения; повторение означает цикл.

**Сложность:** время O(log n) (число шагов ограничено небольшой константой), память O(log n).

```go
func isHappy(n int) bool {
	next := func(x int) int {
		s := 0
		for ; x > 0; x /= 10 {
			d := x % 10
			s += d * d
		}
		return s
	}
	seen := make(map[int]bool)
	for n != 1 {
		if seen[n] {
			return false
		}
		seen[n] = true
		n = next(n)
	}
	return true
}
```

### Floyd: медленный и быстрый указатели
Применяем алгоритм «черепахи и зайца» к последовательности. Если быстрый указатель дошёл до 1 — число счастливое; если указатели встретились раньше — цикл без единицы.

**Сложность:** время O(log n), память O(1).

```go
func isHappy(n int) bool {
	next := func(x int) int {
		s := 0
		for ; x > 0; x /= 10 {
			d := x % 10
			s += d * d
		}
		return s
	}
	slow, fast := n, next(n)
	for fast != 1 && slow != fast {
		slow = next(slow)
		fast = next(next(fast))
	}
	return fast == 1
}
```

---
id: plus-one
title: Plus One
difficulty: Easy
category: Math & Geometry
leetcode: 66
lists: neetcode150
algorithms:
order: 140
---
Число записано массивом цифр `digits` (старшая цифра первая). Прибавь к нему единицу и верни массив цифр.

**Примеры:** `[1,2,3]` → `[1,2,4]`; `[9,9]` → `[1,0,0]`

**Ограничения:** `1 ≤ n ≤ 100`, нет ведущих нулей (кроме числа 0)

<details><summary>Подсказка</summary>Иди справа налево: все девятки превращаются в нули, первая не-девятка просто увеличивается.</details>

### Явный перенос
Прибавляем 1 к младшей цифре и распространяем перенос влево. Если перенос остался после старшей цифры — дописываем `1` в начало.

**Сложность:** время O(n), память O(1) (O(n) при росте длины).

```go
func plusOne(digits []int) []int {
	carry := 1
	for i := len(digits) - 1; i >= 0 && carry > 0; i-- {
		s := digits[i] + carry
		digits[i] = s % 10
		carry = s / 10
	}
	if carry > 0 {
		return append([]int{carry}, digits...)
	}
	return digits
}
```

### Ранний выход на первой не-девятке
Идём справа налево: если цифра `< 9`, увеличиваем её и сразу возвращаем результат, иначе обнуляем. Если все были девятками, результат — `1` и `n` нулей.

**Сложность:** время O(n), память O(1) (O(n) для случая из одних девяток).

```go
func plusOne(digits []int) []int {
	for i := len(digits) - 1; i >= 0; i-- {
		if digits[i] < 9 {
			digits[i]++
			return digits
		}
		digits[i] = 0
	}
	res := make([]int, len(digits)+1)
	res[0] = 1
	return res
}
```

---
id: powx-n
title: Pow(x, n)
difficulty: Medium
category: Math & Geometry
leetcode: 50
lists: neetcode150
algorithms: fast-exponentiation
order: 141
---
Реализуй `pow(x, n)` — возведение числа `x` типа `float64` в целую степень `n` (может быть отрицательной).

**Примеры:** `x = 2.0, n = 10` → `1024.0`; `x = 2.0, n = -2` → `0.25`

**Ограничения:** `-2³¹ ≤ n ≤ 2³¹ − 1`, результат помещается в `float64`

<details><summary>Подсказка</summary>`x^n = (x^(n/2))²`, а при нечётном `n` ещё умножаем на `x`. Отрицательную степень заменяем на `(1/x)^(−n)`.</details>

### Наивное умножение n раз
Умножаем в цикле `|n|` раз. Для `n` порядка `2³¹` это слишком медленно (TLE), но полезно как базовая идея.

**Сложность:** время O(|n|), память O(1).

```go
func myPow(x float64, n int) float64 {
	if n < 0 {
		x = 1 / x
		n = -n
	}
	res := 1.0
	for i := 0; i < n; i++ {
		res *= x
	}
	return res
}
```

### Рекурсивное быстрое возведение
Считаем `h = x^(n/2)`; если `n` чётно — `h·h`, иначе `h·h·x`. Глубина рекурсии `log n`.

**Сложность:** время O(log n), память O(log n).

```go
func myPow(x float64, n int) float64 {
	if n < 0 {
		x = 1 / x
		n = -n // int 64-битный, переполнения при n = -2³¹ нет
	}
	var pow func(n int) float64
	pow = func(n int) float64 {
		if n == 0 {
			return 1
		}
		h := pow(n / 2)
		if n%2 == 0 {
			return h * h
		}
		return h * h * x
	}
	return pow(n)
}
```

### Итеративное быстрое возведение
Бинарное разложение степени: на каждом шаге, если младший бит `n` равен 1, домножаем результат на текущую степень `x`, затем возводим `x` в квадрат и сдвигаем `n`.

**Сложность:** время O(log n), память O(1).

```go
func myPow(x float64, n int) float64 {
	if n < 0 {
		x = 1 / x
		n = -n
	}
	res := 1.0
	for n > 0 {
		if n&1 == 1 {
			res *= x
		}
		x *= x
		n >>= 1
	}
	return res
}
```

---
id: multiply-strings
title: Multiply Strings
difficulty: Medium
category: Math & Geometry
leetcode: 43
lists: neetcode150
algorithms:
order: 142
---
Даны два неотрицательных числа `num1` и `num2` в виде строк. Верни их произведение тоже строкой. Нельзя использовать встроенные big-integer библиотеки и преобразовывать входы в целые напрямую.

**Пример:** `num1 = "123", num2 = "456"` → `"56088"`

**Ограничения:** `1 ≤ |num| ≤ 200`, только цифры, без ведущих нулей (кроме `"0"`)

<details><summary>Подсказка</summary>Произведение цифр `num1[i]·num2[j]` вносит вклад в позиции `i+j` и `i+j+1` результата длины `m+n`.</details>

### Умножение в столбик
Массив `res` длиной `m+n`. Для каждой пары цифр добавляем произведение к `res[i+j+1]` (с уже накопленным значением), единицы оставляем, десятки переносим в `res[i+j]`. В конце пропускаем ведущие нули.

**Сложность:** время O(m·n), память O(m + n).

```go
func multiply(num1 string, num2 string) string {
	if num1 == "0" || num2 == "0" {
		return "0"
	}
	m, n := len(num1), len(num2)
	res := make([]int, m+n)
	for i := m - 1; i >= 0; i-- {
		for j := n - 1; j >= 0; j-- {
			p := int(num1[i]-'0')*int(num2[j]-'0') + res[i+j+1]
			res[i+j+1] = p % 10
			res[i+j] += p / 10
		}
	}
	k := 0
	for k < len(res) && res[k] == 0 {
		k++
	}
	out := make([]byte, 0, len(res)-k)
	for ; k < len(res); k++ {
		out = append(out, byte('0'+res[k]))
	}
	return string(out)
}
```

### Сложение частичных произведений
Для каждой цифры `num2` (справа налево) умножаем на неё `num1`, дописываем нужное число нулей (разряд) и прибавляем к накопленному результату сложением строк. Проще для понимания, но тяжелее по константе.

**Сложность:** время O(m·n), память O(m + n).

```go
func multiply(num1 string, num2 string) string {
	if num1 == "0" || num2 == "0" {
		return "0"
	}
	// add складывает два десятичных числа-строки
	add := func(a, b []byte) []byte {
		res := make([]byte, 0, max(len(a), len(b))+1)
		i, j, carry := len(a)-1, len(b)-1, 0
		for i >= 0 || j >= 0 || carry > 0 {
			s := carry
			if i >= 0 {
				s += int(a[i] - '0')
				i--
			}
			if j >= 0 {
				s += int(b[j] - '0')
				j--
			}
			res = append(res, byte('0'+s%10))
			carry = s / 10
		}
		slices.Reverse(res)
		return res
	}
	total := []byte("0")
	for k := len(num2) - 1; k >= 0; k-- {
		d := int(num2[k] - '0')
		part := make([]byte, 0, len(num1)+len(num2))
		carry := 0
		for i := len(num1) - 1; i >= 0; i-- {
			p := int(num1[i]-'0')*d + carry
			part = append(part, byte('0'+p%10))
			carry = p / 10
		}
		if carry > 0 {
			part = append(part, byte('0'+carry))
		}
		slices.Reverse(part)
		for z := 0; z < len(num2)-1-k; z++ {
			part = append(part, '0')
		}
		total = add(total, part)
	}
	// убираем ведущие нули (если цифра num2 была нулём, part состоит из нулей)
	i := 0
	for i < len(total)-1 && total[i] == '0' {
		i++
	}
	return string(total[i:])
}
```

---
id: detect-squares
title: Detect Squares
difficulty: Medium
category: Math & Geometry
leetcode: 2013
lists: neetcode150
algorithms: hashing
order: 143
---
Спроектируй структуру `DetectSquares`: `Add(point)` добавляет точку на плоскости (дубликаты разрешены и учитываются), `Count(point)` возвращает число способов выбрать три добавленные точки так, чтобы вместе с `point` они образовали квадрат со сторонами, параллельными осям, и положительной площадью.

**Пример:** добавили `[3,10],[11,2],[3,2]`, `Count([11,10])` → `1`; `Count([14,8])` → `0`

**Ограничения:** координаты `0 ≤ x, y ≤ 1000`, до `3000` вызовов

<details><summary>Подсказка</summary>Выбери диагональную точку: она однозначно задаёт две оставшиеся вершины, а ответ — произведение их кратностей.</details>

### Счётчик точек и перебор диагональных вершин
Хранится `map[точка]кратность`. Для запроса `(x, y)` перебираем все различные точки `(px, py)` как диагональные: нужны `|px−x| = |py−y| > 0`. Две другие вершины — `(x, py)` и `(px, y)`, ответ растёт на произведение трёх кратностей.

**Сложность:** `Add` — O(1), `Count` — O(k), где k — число различных точек; память O(k).

```go
type DetectSquares struct {
	cnt map[[2]int]int
}

func Constructor() DetectSquares {
	return DetectSquares{cnt: make(map[[2]int]int)}
}

func (d *DetectSquares) Add(point []int) {
	d.cnt[[2]int{point[0], point[1]}]++
}

func (d *DetectSquares) Count(point []int) int {
	x, y := point[0], point[1]
	res := 0
	for p, c := range d.cnt {
		dx, dy := p[0]-x, p[1]-y
		if dx == 0 || (dx != dy && dx != -dy) {
			continue
		}
		res += c * d.cnt[[2]int{x, p[1]}] * d.cnt[[2]int{p[0], y}]
	}
	return res
}
```

### Точки, сгруппированные по x
Для `x` храним `map[y]кратность`. Для запроса перебираем только точки с тем же `x` как вертикальную соседнюю вершину `(x, y2)`; длина стороны `d = y2 − y`, и квадрат можно достроить влево и вправо (`x ± d`).

**Сложность:** `Add` — O(1), `Count` — O(m), где m — число различных `y` в столбце `x`; память O(k).

```go
type DetectSquares struct {
	cols map[int]map[int]int // x -> y -> кратность
}

func Constructor() DetectSquares {
	return DetectSquares{cols: make(map[int]map[int]int)}
}

func (d *DetectSquares) Add(point []int) {
	x, y := point[0], point[1]
	if d.cols[x] == nil {
		d.cols[x] = make(map[int]int)
	}
	d.cols[x][y]++
}

func (d *DetectSquares) Count(point []int) int {
	x, y := point[0], point[1]
	res := 0
	for y2, c := range d.cols[x] {
		side := y2 - y
		if side == 0 {
			continue
		}
		for _, x2 := range [2]int{x + side, x - side} {
			res += c * d.cols[x2][y] * d.cols[x2][y2]
		}
	}
	return res
}
```
