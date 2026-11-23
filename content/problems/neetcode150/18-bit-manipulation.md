---
id: single-number
title: Single Number
difficulty: Easy
category: Bit Manipulation
leetcode: 136
lists: neetcode150
algorithms: bit-manipulation, hashing
order: 144
---
В массиве `nums` каждое число встречается дважды, кроме одного. Найди это число. Нужно решение за линейное время и O(1) памяти.

**Примеры:** `[2,2,1]` → `1`; `[4,1,2,1,2]` → `4`

**Ограничения:** `1 ≤ n ≤ 3·10⁴`

<details><summary>Подсказка</summary>`a ^ a = 0`, `a ^ 0 = a`, XOR коммутативен и ассоциативен.</details>

### Хеш-таблица счётчиков
Считаем вхождения и возвращаем число со счётчиком 1.

**Сложность:** время O(n), память O(n).

```go
func singleNumber(nums []int) int {
	cnt := make(map[int]int)
	for _, x := range nums {
		cnt[x]++
	}
	for x, c := range cnt {
		if c == 1 {
			return x
		}
	}
	return 0
}
```

### XOR всех элементов
Парные числа взаимно уничтожаются при XOR, остаётся одиночное.

**Сложность:** время O(n), память O(1).

```go
func singleNumber(nums []int) int {
	res := 0
	for _, x := range nums {
		res ^= x
	}
	return res
}
```

---
id: number-of-1-bits
title: Number of 1 Bits
difficulty: Easy
category: Bit Manipulation
leetcode: 191
lists: neetcode150, blind75
algorithms: bit-manipulation
order: 145
---
Верни количество единичных бит в двоичном представлении неотрицательного числа `n` (Hamming weight).

**Примеры:** `n = 11` (`1011`) → `3`; `n = 128` → `1`

**Ограничения:** `1 ≤ n ≤ 2³¹ − 1`

<details><summary>Подсказка</summary>`n & (n−1)` сбрасывает самый младший единичный бит.</details>

### Проверка каждого бита
Сдвигаем `n` вправо и складываем младшие биты.

**Сложность:** время O(log n), память O(1).

```go
func hammingWeight(n int) int {
	cnt := 0
	for n > 0 {
		cnt += n & 1
		n >>= 1
	}
	return cnt
}
```

### Трюк Брайана Кернигана
Каждая итерация `n &= n − 1` убирает один единичный бит, поэтому число итераций равно числу единиц.

**Сложность:** время O(k), где k — число единичных бит; память O(1).

```go
func hammingWeight(n int) int {
	cnt := 0
	for n != 0 {
		n &= n - 1 // убираем младшую единицу
		cnt++
	}
	return cnt
}
```

### math/bits
Готовая функция, которая на современных CPU компилируется в инструкцию POPCNT.

**Сложность:** время O(1), память O(1).

```go
func hammingWeight(n int) int {
	return bits.OnesCount(uint(n))
}
```

---
id: counting-bits
title: Counting Bits
difficulty: Easy
category: Bit Manipulation
leetcode: 338
lists: neetcode150, blind75
algorithms: bit-manipulation, dynamic-programming
order: 146
---
Дано `n`. Верни массив длины `n + 1`, где `ans[i]` — число единичных бит в `i`.

**Пример:** `n = 5` → `[0,1,1,2,1,2]`

**Ограничения:** `0 ≤ n ≤ 10⁵`. Follow-up: за O(n) без встроенных popcount.

<details><summary>Подсказка</summary>Ответ для `i` выражается через уже посчитанный ответ для меньшего числа: `i >> 1` или `i & (i−1)`.</details>

### Подсчёт битов для каждого числа
Для каждого `i` считаем единицы методом Кернигана.

**Сложность:** время O(n log n), память O(1) дополнительно.

```go
func countBits(n int) []int {
	res := make([]int, n+1)
	for i := 0; i <= n; i++ {
		x, c := i, 0
		for x != 0 {
			x &= x - 1
			c++
		}
		res[i] = c
	}
	return res
}
```

### Динамика через сдвиг
`i >> 1` — это `i` без младшего бита, поэтому `bits(i) = bits(i >> 1) + (i & 1)`.

**Сложность:** время O(n), память O(1) дополнительно.

```go
func countBits(n int) []int {
	res := make([]int, n+1)
	for i := 1; i <= n; i++ {
		res[i] = res[i>>1] + i&1
	}
	return res
}
```

### Динамика через сброс младшей единицы
`i & (i−1)` — это `i` без младшей единицы, то есть на одну единицу меньше: `bits(i) = bits(i & (i−1)) + 1`.

**Сложность:** время O(n), память O(1) дополнительно.

```go
func countBits(n int) []int {
	res := make([]int, n+1)
	for i := 1; i <= n; i++ {
		res[i] = res[i&(i-1)] + 1
	}
	return res
}
```

---
id: reverse-bits
title: Reverse Bits
difficulty: Easy
category: Bit Manipulation
leetcode: 190
lists: neetcode150, blind75
algorithms: bit-manipulation
order: 147
---
Разверни порядок бит в 32-битном беззнаковом числе.

**Пример:** `00000010100101000001111010011100` (43261596) → `00111001011110000010100101000000` (964176192)

**Ограничения:** вход — 32-битное беззнаковое число

<details><summary>Подсказка</summary>Забирай младший бит входа и дописывай его справа в результат, сдвигая результат влево.</details>

### Побитовый цикл
32 раза: сдвигаем результат влево, добавляем младший бит `num`, сдвигаем `num` вправо.

**Сложность:** время O(32) = O(1), память O(1).

```go
func reverseBits(num uint32) uint32 {
	var res uint32
	for i := 0; i < 32; i++ {
		res = res<<1 | num&1
		num >>= 1
	}
	return res
}
```

### Обмен блоков маской
Меняем местами половины по 16 бит, затем байты в половинах, затем полубайты, пары и соседние биты. Всего пять шагов вместо тридцати двух.

**Сложность:** время O(log w) для ширины слова w = 32, то есть 5 шагов; память O(1).

```go
func reverseBits(num uint32) uint32 {
	num = num>>16 | num<<16
	num = (num&0xff00ff00)>>8 | (num&0x00ff00ff)<<8
	num = (num&0xf0f0f0f0)>>4 | (num&0x0f0f0f0f)<<4
	num = (num&0xcccccccc)>>2 | (num&0x33333333)<<2
	num = (num&0xaaaaaaaa)>>1 | (num&0x55555555)<<1
	return num
}
```

---
id: missing-number
title: Missing Number
difficulty: Easy
category: Bit Manipulation
leetcode: 268
lists: neetcode150, blind75
algorithms: bit-manipulation, hashing
order: 148
---
Дан массив `nums` из `n` различных чисел из диапазона `[0, n]`. Верни единственное число из диапазона, которого в массиве нет.

**Примеры:** `[3,0,1]` → `2`; `[0,1]` → `2`

**Ограничения:** `1 ≤ n ≤ 10⁴`

<details><summary>Подсказка</summary>Известна сумма `0..n` и XOR `0..n` — сравни с тем, что в массиве.</details>

### Множество присутствующих
Отмечаем встретившиеся числа и ищем непомеченное.

**Сложность:** время O(n), память O(n).

```go
func missingNumber(nums []int) int {
	seen := make([]bool, len(nums)+1)
	for _, x := range nums {
		seen[x] = true
	}
	for i, ok := range seen {
		if !ok {
			return i
		}
	}
	return -1
}
```

### Формула суммы
Ожидаемая сумма `n(n+1)/2` минус сумма элементов.

**Сложность:** время O(n), память O(1).

```go
func missingNumber(nums []int) int {
	n := len(nums)
	sum := n * (n + 1) / 2
	for _, x := range nums {
		sum -= x
	}
	return sum
}
```

### XOR индексов и значений
XOR всех чисел `0..n` и всех элементов: каждое присутствующее число встречается дважды и гасится, остаётся пропущенное. Начинаем с `n`, а в цикле XOR-им `i ^ nums[i]`.

**Сложность:** время O(n), память O(1).

```go
func missingNumber(nums []int) int {
	res := len(nums)
	for i, x := range nums {
		res ^= i ^ x
	}
	return res
}
```

---
id: sum-of-two-integers
title: Sum of Two Integers
difficulty: Medium
category: Bit Manipulation
leetcode: 371
lists: neetcode150, blind75
algorithms: bit-manipulation
order: 149
---
Верни сумму двух целых `a` и `b`, не используя операторы `+` и `-`.

**Примеры:** `a = 1, b = 2` → `3`; `a = 2, b = 3` → `5`

**Ограничения:** `-1000 ≤ a, b ≤ 1000`

<details><summary>Подсказка</summary>XOR — сложение без переноса, `(a & b) << 1` — перенос. Повторяй, пока перенос не обнулится.</details>

### Итеративный перенос
`a ^ b` — сумма без учёта переноса, `(a & b) << 1` — перенос. Повторяем, пока перенос не станет нулём. Дополнительный код отрицательных чисел работает без особых случаев.

**Сложность:** время O(w) для ширины слова w, память O(1).

```go
func getSum(a int, b int) int {
	for b != 0 {
		carry := (a & b) << 1
		a ^= b
		b = carry
	}
	return a
}
```

### Рекурсивная версия
Та же идея в рекурсивной форме: сумма `a + b` равна сумме `a ^ b` и переноса.

**Сложность:** время O(w), память O(w) на стек.

```go
func getSum(a int, b int) int {
	if b == 0 {
		return a
	}
	return getSum(a^b, (a&b)<<1)
}
```

---
id: reverse-integer
title: Reverse Integer
difficulty: Medium
category: Bit Manipulation
leetcode: 7
lists: neetcode150
algorithms: bit-manipulation
order: 150
---
Дано знаковое 32-битное целое `x`. Верни `x` с перевёрнутыми цифрами. Если результат выходит за диапазон `[−2³¹, 2³¹ − 1]`, верни `0`.

**Примеры:** `x = 123` → `321`; `x = -123` → `-321`; `x = 120` → `21`

**Ограничения:** `−2³¹ ≤ x ≤ 2³¹ − 1`

<details><summary>Подсказка</summary>Достань цифру через `x % 10`, добавь в результат `res*10 + d` и проверь переполнение до умножения.</details>

### Проверка переполнения перед умножением
Забираем младшую цифру и добавляем её к результату. До этого проверяем: если `res*10 + d` выйдет за 32-битный диапазон, возвращаем 0. В Go остаток `%` для отрицательных чисел имеет знак делимого, поэтому знак отдельно обрабатывать не нужно.

**Сложность:** время O(log x), память O(1).

```go
func reverse(x int) int {
	res := 0
	for x != 0 {
		d := x % 10
		x /= 10
		if res > math.MaxInt32/10 || (res == math.MaxInt32/10 && d > 7) {
			return 0
		}
		if res < math.MinInt32/10 || (res == math.MinInt32/10 && d < -8) {
			return 0
		}
		res = res*10 + d
	}
	return res
}
```

### Накопление в 64-битном int и проверка в конце
В Go `int` на 64-битных платформах не переполнится на 10 цифрах, поэтому сначала переворачиваем, потом сравниваем с границами `int32`.

**Сложность:** время O(log x), память O(1).

```go
func reverse(x int) int {
	res := 0
	for x != 0 {
		res = res*10 + x%10
		x /= 10
	}
	if res > math.MaxInt32 || res < math.MinInt32 {
		return 0
	}
	return res
}
```
