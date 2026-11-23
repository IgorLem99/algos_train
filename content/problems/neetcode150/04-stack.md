---
id: valid-parentheses
title: Valid Parentheses
difficulty: Easy
category: Stack
leetcode: 20
lists: neetcode150, blind75
algorithms: stack
order: 21
---
Дана строка `s` из символов `'('`, `')'`, `'{'`, `'}'`, `'['`, `']'`. Проверь, что скобки расставлены корректно: каждая открывающая закрыта скобкой того же типа и в правильном порядке.

**Пример:** `s = "()[]{}"` → `true`; `s = "(]"` → `false`

**Ограничения:** `1 ≤ s.length ≤ 10⁴`

<details><summary>Подсказка</summary>Последняя открытая скобка должна закрыться первой — это поведение стека (LIFO).</details>

### Удаление пар «()», «[]», «{}»
Пока в строке встречается подстрока из соседних парных скобок, удаляем её. Строка корректна, если в итоге стала пустой.

**Сложность:** время O(n²), память O(n).

```go
func isValid(s string) bool {
	for {
		t := strings.ReplaceAll(s, "()", "")
		t = strings.ReplaceAll(t, "[]", "")
		t = strings.ReplaceAll(t, "{}", "")
		if len(t) == len(s) { // ничего не удалилось
			break
		}
		s = t
	}
	return len(s) == 0
}
```

### Стек
Открывающие скобки кладём в стек. На закрывающей проверяем, что на вершине лежит парная ей открывающая, и снимаем её. В конце стек должен быть пуст.

**Сложность:** время O(n), память O(n).

```go
func isValid(s string) bool {
	pair := map[byte]byte{')': '(', ']': '[', '}': '{'}
	stack := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if open, ok := pair[c]; ok {
			if len(stack) == 0 || stack[len(stack)-1] != open {
				return false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, c)
		}
	}
	return len(stack) == 0
}
```

---
id: min-stack
title: Min Stack
difficulty: Medium
category: Stack
leetcode: 155
lists: neetcode150
algorithms: stack
order: 22
---
Спроектируй стек с операциями `push`, `pop`, `top` и `getMin` (минимум в стеке), каждая должна работать за O(1).

**Пример:** `push(-2), push(0), push(-3), getMin() → -3, pop(), top() → 0, getMin() → -2`

**Ограничения:** `pop`, `top`, `getMin` вызываются только на непустом стеке; до `3·10⁴` операций.

<details><summary>Подсказка</summary>Минимум в стеке зависит только от того, сколько элементов лежит ниже — храни текущий минимум вместе с каждым элементом.</details>

### Два стека
Основной стек и параллельный стек минимумов: при `push` кладём в него `min(val, текущий минимум)`, при `pop` снимаем с обоих.

**Сложность:** время O(1) на операцию, память O(n).

```go
type MinStack struct {
	vals []int
	mins []int // mins[i] — минимум среди vals[0..i]
}

func Constructor() MinStack {
	return MinStack{}
}

func (this *MinStack) Push(val int) {
	m := val
	if len(this.mins) > 0 && this.mins[len(this.mins)-1] < m {
		m = this.mins[len(this.mins)-1]
	}
	this.vals = append(this.vals, val)
	this.mins = append(this.mins, m)
}

func (this *MinStack) Pop() {
	this.vals = this.vals[:len(this.vals)-1]
	this.mins = this.mins[:len(this.mins)-1]
}

func (this *MinStack) Top() int {
	return this.vals[len(this.vals)-1]
}

func (this *MinStack) GetMin() int {
	return this.mins[len(this.mins)-1]
}
```

### Стек пар (значение, минимум)
То же самое, но в одном срезе: каждый элемент хранит пару из значения и минимума на момент вставки.

**Сложность:** время O(1) на операцию, память O(n).

```go
type MinStack struct {
	st [][2]int // {значение, минимум в стеке до этого элемента включительно}
}

func Constructor() MinStack {
	return MinStack{}
}

func (this *MinStack) Push(val int) {
	m := val
	if n := len(this.st); n > 0 && this.st[n-1][1] < m {
		m = this.st[n-1][1]
	}
	this.st = append(this.st, [2]int{val, m})
}

func (this *MinStack) Pop() {
	this.st = this.st[:len(this.st)-1]
}

func (this *MinStack) Top() int {
	return this.st[len(this.st)-1][0]
}

func (this *MinStack) GetMin() int {
	return this.st[len(this.st)-1][1]
}
```

---
id: evaluate-reverse-polish-notation
title: Evaluate Reverse Polish Notation
difficulty: Medium
category: Stack
leetcode: 150
lists: neetcode150
algorithms: stack
order: 23
---
Дан массив токенов `tokens` — выражение в обратной польской записи (операторы `+ - * /`, целые операнды). Вычисли значение. Деление целочисленное с округлением к нулю.

**Пример:** `["2","1","+","3","*"]` → `9`; `["4","13","5","/","+"]` → `6`

**Ограничения:** выражение всегда корректно, деления на ноль нет, результат помещается в 32 бита.

<details><summary>Подсказка</summary>Встретив оператор, берём два последних вычисленных числа — их удобно держать в стеке.</details>

### Стек
Числа кладём в стек. Оператор снимает два верхних числа (`b`, затем `a`), применяет `a op b` и кладёт результат обратно. Порядок важен для `-` и `/`. Деление в Go уже усекает к нулю.

**Сложность:** время O(n), память O(n).

```go
func evalRPN(tokens []string) int {
	stack := make([]int, 0, len(tokens))
	for _, tok := range tokens {
		switch tok {
		case "+", "-", "*", "/":
			b := stack[len(stack)-1]
			a := stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			var r int
			switch tok {
			case "+":
				r = a + b
			case "-":
				r = a - b
			case "*":
				r = a * b
			default:
				r = a / b
			}
			stack = append(stack, r)
		default:
			v, _ := strconv.Atoi(tok)
			stack = append(stack, v)
		}
	}
	return stack[0]
}
```

### Рекурсия с конца
Последний токен — корень дерева выражения. Если это оператор, рекурсивно вычисляем правый, затем левый операнд (идём справа налево по массиву). Стек здесь заменяет стек вызовов.

**Сложность:** время O(n), память O(n).

```go
func evalRPN(tokens []string) int {
	i := len(tokens) - 1
	var eval func() int
	eval = func() int {
		tok := tokens[i]
		i--
		switch tok {
		case "+", "-", "*", "/":
			b := eval() // сначала правый операнд
			a := eval()
			switch tok {
			case "+":
				return a + b
			case "-":
				return a - b
			case "*":
				return a * b
			}
			return a / b
		}
		v, _ := strconv.Atoi(tok)
		return v
	}
	return eval()
}
```

---
id: generate-parentheses
title: Generate Parentheses
difficulty: Medium
category: Stack
leetcode: 22
lists: neetcode150
algorithms: backtracking, stack
order: 24
---
Дано `n`. Сгенерируй все корректные скобочные последовательности из `n` пар скобок.

**Пример:** `n = 3` → `["((()))","(()())","(())()","()(())","()()()"]`

**Ограничения:** `1 ≤ n ≤ 8`

<details><summary>Подсказка</summary>Добавляй «(» пока их меньше n, а «)» — пока закрытых меньше открытых.</details>

### Перебор всех строк с проверкой
Генерируем все `2^(2n)` строк из `(` и `)` и оставляем те, у которых баланс никогда не уходит в минус и в конце равен нулю.

**Сложность:** время O(2^(2n) · n), память O(n) (без учёта ответа).

```go
func generateParenthesis(n int) []string {
	var res []string
	buf := make([]byte, 2*n)
	valid := func() bool {
		bal := 0
		for _, c := range buf {
			if c == '(' {
				bal++
			} else {
				bal--
			}
			if bal < 0 {
				return false
			}
		}
		return bal == 0
	}
	var gen func(pos int)
	gen = func(pos int) {
		if pos == len(buf) {
			if valid() {
				res = append(res, string(buf))
			}
			return
		}
		buf[pos] = '('
		gen(pos + 1)
		buf[pos] = ')'
		gen(pos + 1)
	}
	gen(0)
	return res
}
```

### Бэктрекинг с ограничениями
Строим строку, не создавая заведомо неверных префиксов: «(» можно добавить, если открытых меньше `n`; «)» — если закрытых меньше открытых. Количество результатов — число Каталана.

**Сложность:** время O(4^n / √n), память O(n) (без учёта ответа).

```go
func generateParenthesis(n int) []string {
	var res []string
	buf := make([]byte, 0, 2*n)
	var gen func(open, closed int)
	gen = func(open, closed int) {
		if len(buf) == 2*n {
			res = append(res, string(buf))
			return
		}
		if open < n {
			buf = append(buf, '(')
			gen(open+1, closed)
			buf = buf[:len(buf)-1]
		}
		if closed < open {
			buf = append(buf, ')')
			gen(open, closed+1)
			buf = buf[:len(buf)-1]
		}
	}
	gen(0, 0)
	return res
}
```

---
id: daily-temperatures
title: Daily Temperatures
difficulty: Medium
category: Stack
leetcode: 739
lists: neetcode150
algorithms: monotonic-stack, stack
order: 25
---
Дан массив температур `temperatures`. Для каждого дня верни, через сколько дней будет теплее; если такого дня нет — `0`.

**Пример:** `[73,74,75,71,69,72,76,73]` → `[1,1,4,2,1,1,0,0]`

**Ограничения:** `1 ≤ n ≤ 10⁵`, `30 ≤ temperatures[i] ≤ 100`

<details><summary>Подсказка</summary>Держи стек индексов ещё не «разрешённых» дней с невозрастающими температурами; новый день разрешает все более холодные дни на вершине.</details>

### Перебор
Для каждого дня ищем вправо первый более тёплый.

**Сложность:** время O(n²), память O(1) (без результата).

```go
func dailyTemperatures(temperatures []int) []int {
	res := make([]int, len(temperatures))
	for i := range temperatures {
		for j := i + 1; j < len(temperatures); j++ {
			if temperatures[j] > temperatures[i] {
				res[i] = j - i
				break
			}
		}
	}
	return res
}
```

### Монотонный стек
Храним индексы дней, для которых тёплый день ещё не найден (температуры в стеке не возрастают). Приходит день `i`: пока он теплее вершины, снимаем индекс `j` и записываем `i - j`. Каждый индекс входит и выходит один раз.

**Сложность:** время O(n), память O(n).

```go
func dailyTemperatures(temperatures []int) []int {
	res := make([]int, len(temperatures))
	stack := []int{} // индексы дней без ответа
	for i, t := range temperatures {
		for len(stack) > 0 && temperatures[stack[len(stack)-1]] < t {
			j := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			res[j] = i - j
		}
		stack = append(stack, i)
	}
	return res
}
```

---
id: car-fleet
title: Car Fleet
difficulty: Medium
category: Stack
leetcode: 853
lists: neetcode150
algorithms: monotonic-stack, sorting-selection, greedy
order: 26
---
Есть `n` машин на однополосной дороге, едут к точке `target`. Машина `i` стартует в `position[i]` со скоростью `speed[i]`. Обгонять нельзя: догнавшая машина едет со скоростью медленной, образуя флот. Верни число флотов, приехавших в `target`.

**Пример:** `target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]` → `3`

**Ограничения:** `1 ≤ n ≤ 10⁵`, позиции различны и меньше `target`.

<details><summary>Подсказка</summary>Отсортируй машины по позиции от ближней к цели и сравни время прибытия каждой с временем машины впереди.</details>

### Сортировка и стек времён
Идём от машины, ближайшей к цели. Время прибытия `t = (target − pos) / speed`. Если `t` больше времени флота впереди (вершина стека), машина не догонит его и образует новый флот — кладём в стек. Иначе она сливается с флотом.

**Сложность:** время O(n log n), память O(n).

```go
func carFleet(target int, position []int, speed []int) int {
	idx := make([]int, len(position))
	for i := range idx {
		idx[i] = i
	}
	sort.Slice(idx, func(a, b int) bool {
		return position[idx[a]] > position[idx[b]]
	})
	var stack []float64
	for _, i := range idx {
		t := float64(target-position[i]) / float64(speed[i])
		if len(stack) == 0 || t > stack[len(stack)-1] {
			stack = append(stack, t)
		}
	}
	return len(stack)
}
```

### Сортировка без стека
Стек нужен только ради вершины, поэтому достаточно хранить время последнего флота. Каждый раз, когда текущая машина медленнее (время больше), увеличиваем счётчик и обновляем это время.

**Сложность:** время O(n log n), память O(n) на индексы (O(1) дополнительно к сортировке).

```go
func carFleet(target int, position []int, speed []int) int {
	idx := make([]int, len(position))
	for i := range idx {
		idx[i] = i
	}
	sort.Slice(idx, func(a, b int) bool {
		return position[idx[a]] > position[idx[b]]
	})
	fleets := 0
	lead := 0.0 // время прибытия ведущего флота
	for _, i := range idx {
		t := float64(target-position[i]) / float64(speed[i])
		if t > lead {
			fleets++
			lead = t
		}
	}
	return fleets
}
```

---
id: largest-rectangle-in-histogram
title: Largest Rectangle in Histogram
difficulty: Hard
category: Stack
leetcode: 84
lists: neetcode150
algorithms: monotonic-stack, stack
order: 27
---
Дана гистограмма с единичной шириной столбцов `heights`. Найди площадь наибольшего прямоугольника, целиком лежащего в гистограмме.

**Пример:** `heights = [2,1,5,6,2,3]` → `10` (столбцы высотой 5 и 6)

**Ограничения:** `1 ≤ n ≤ 10⁵`, `0 ≤ heights[i] ≤ 10⁴`

<details><summary>Подсказка</summary>Для каждого столбца нужно знать ближайшие меньшие слева и справа — это даёт монотонный стек.</details>

### Перебор границ
Для каждого столбца расширяем прямоугольник влево и вправо, пока высоты не меньше текущей, и считаем площадь.

**Сложность:** время O(n²), память O(1).

```go
func largestRectangleArea(heights []int) int {
	best := 0
	for i, h := range heights {
		l, r := i, i
		for l > 0 && heights[l-1] >= h {
			l--
		}
		for r < len(heights)-1 && heights[r+1] >= h {
			r++
		}
		best = max(best, h*(r-l+1))
	}
	return best
}
```

### Монотонный стек
Стек хранит индексы столбцов с возрастающей высотой. Когда приходит столбец ниже вершины, вершина достигла правой границы: её левая граница — элемент под ней в стеке. Добавляем фиктивный столбец высоты 0 в конце, чтобы вытолкнуть всё.

**Сложность:** время O(n), память O(n).

```go
func largestRectangleArea(heights []int) int {
	best := 0
	stack := []int{} // индексы с возрастающими высотами
	for i := 0; i <= len(heights); i++ {
		h := 0 // фиктивный столбец в конце
		if i < len(heights) {
			h = heights[i]
		}
		for len(stack) > 0 && heights[stack[len(stack)-1]] >= h {
			top := heights[stack[len(stack)-1]]
			stack = stack[:len(stack)-1]
			left := -1
			if len(stack) > 0 {
				left = stack[len(stack)-1]
			}
			best = max(best, top*(i-left-1))
		}
		stack = append(stack, i)
	}
	return best
}
```
