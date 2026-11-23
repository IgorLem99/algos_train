---
id: contains-duplicate
title: Contains Duplicate
difficulty: Easy
category: Arrays & Hashing
leetcode: 217
lists: neetcode150, blind75
algorithms: hashing, sorting-selection
order: 1
---
Дан массив целых чисел `nums`. Верни `true`, если какое-то значение встречается хотя бы дважды, и `false`, если все элементы различны.

**Пример:** `nums = [1,2,3,1]` → `true`; `nums = [1,2,3,4]` → `false`

**Ограничения:** `1 ≤ n ≤ 10⁵`, `-10⁹ ≤ nums[i] ≤ 10⁹`

<details><summary>Подсказка</summary>Нужно быстро проверять, видели ли мы число раньше, — подойдёт множество.</details>

### Сортировка
После сортировки одинаковые значения оказываются рядом, достаточно сравнить соседей. Сортируем копию, чтобы не портить входной массив.

**Сложность:** время O(n log n), память O(n).

```go
func containsDuplicate(nums []int) bool {
	sorted := slices.Clone(nums)
	slices.Sort(sorted)
	for i := 1; i < len(sorted); i++ {
		if sorted[i] == sorted[i-1] {
			return true
		}
	}
	return false
}
```

### Хеш-множество
Идём по массиву и кладём числа в множество; если число уже там — дубликат найден.

**Сложность:** время O(n), память O(n).

```go
func containsDuplicate(nums []int) bool {
	seen := make(map[int]struct{}, len(nums))
	for _, x := range nums {
		if _, ok := seen[x]; ok {
			return true
		}
		seen[x] = struct{}{}
	}
	return false
}
```

---
id: valid-anagram
title: Valid Anagram
difficulty: Easy
category: Arrays & Hashing
leetcode: 242
lists: neetcode150, blind75
algorithms: hashing, sorting-selection
order: 2
---
Даны строки `s` и `t`. Верни `true`, если `t` — анаграмма `s`, то есть получается перестановкой её букв.

**Пример:** `s = "anagram", t = "nagaram"` → `true`; `s = "rat", t = "car"` → `false`

**Ограничения:** `1 ≤ len ≤ 5·10⁴`, строки из строчных латинских букв.

<details><summary>Подсказка</summary>Анаграммы имеют одинаковое количество каждой буквы.</details>

### Сортировка
Сортируем символы обеих строк и сравниваем результаты.

**Сложность:** время O(n log n), память O(n).

```go
func isAnagram(s string, t string) bool {
	a, b := []byte(s), []byte(t)
	slices.Sort(a)
	slices.Sort(b)
	return slices.Equal(a, b)
}
```

### Счётчик букв
Для 26 строчных букв хватает массива из 26 счётчиков: `s` увеличивает, `t` уменьшает. Если в конце все нули — анаграмма.

**Сложность:** время O(n), память O(1).

```go
func isAnagram(s string, t string) bool {
	if len(s) != len(t) {
		return false
	}
	var cnt [26]int
	for i := 0; i < len(s); i++ {
		cnt[s[i]-'a']++
		cnt[t[i]-'a']--
	}
	for _, c := range cnt {
		if c != 0 {
			return false
		}
	}
	return true
}
```

---
id: two-sum
title: Two Sum
difficulty: Easy
category: Arrays & Hashing
leetcode: 1
lists: neetcode150, blind75
algorithms: hashing
order: 3
---
Дан массив целых чисел `nums` и число `target`. Верни индексы двух чисел, сумма которых равна `target`.
Ровно одно решение; один элемент нельзя использовать дважды.

**Пример:** `nums = [2,7,11,15], target = 9` → `[0,1]`

**Ограничения:** `2 ≤ n ≤ 10⁴`

<details><summary>Подсказка</summary>Для каждого x нужно быстро узнать, встречалось ли target − x.</details>

### Перебор всех пар
Проверяем каждую пару (i, j).

**Сложность:** время O(n²), память O(1).

```go
func twoSum(nums []int, target int) []int {
	for i := range nums {
		for j := i + 1; j < len(nums); j++ {
			if nums[i]+nums[j] == target {
				return []int{i, j}
			}
		}
	}
	return nil
}
```

### Хеш-таблица за один проход
Храним `значение → индекс` уже просмотренных чисел и ищем дополнение `target − x`.

**Сложность:** время O(n), память O(n).

```go
func twoSum(nums []int, target int) []int {
	seen := make(map[int]int, len(nums))
	for i, x := range nums {
		if j, ok := seen[target-x]; ok {
			return []int{j, i}
		}
		seen[x] = i
	}
	return nil
}
```

---
id: group-anagrams
title: Group Anagrams
difficulty: Medium
category: Arrays & Hashing
leetcode: 49
lists: neetcode150, blind75
algorithms: hashing, sorting-selection
order: 4
---
Дан массив строк `strs`. Сгруппируй анаграммы вместе; порядок групп и слов внутри групп любой.

**Пример:** `strs = ["eat","tea","tan","ate","nat","bat"]` → `[["bat"],["nat","tan"],["ate","eat","tea"]]`

**Ограничения:** `1 ≤ n ≤ 10⁴`, `0 ≤ len(strs[i]) ≤ 100`, строчные латинские буквы.

<details><summary>Подсказка</summary>Нужен ключ, одинаковый у всех анаграмм: отсортированная строка или вектор частот.</details>

### Ключ — отсортированная строка
Сортируем буквы каждого слова; анаграммы дают одинаковый ключ и попадают в одну группу карты.

**Сложность:** время O(n · k log k), память O(n · k), где k — длина слова.

```go
func groupAnagrams(strs []string) [][]string {
	groups := make(map[string][]string)
	for _, s := range strs {
		b := []byte(s)
		slices.Sort(b)
		key := string(b)
		groups[key] = append(groups[key], s)
	}
	res := make([][]string, 0, len(groups))
	for _, g := range groups {
		res = append(res, g)
	}
	return res
}
```

### Ключ — вектор частот
Вместо сортировки считаем частоты 26 букв; массив `[26]int` сравним и годится как ключ карты напрямую.

**Сложность:** время O(n · k), память O(n · k).

```go
func groupAnagrams(strs []string) [][]string {
	groups := make(map[[26]int][]string)
	for _, s := range strs {
		var key [26]int
		for i := 0; i < len(s); i++ {
			key[s[i]-'a']++
		}
		groups[key] = append(groups[key], s)
	}
	res := make([][]string, 0, len(groups))
	for _, g := range groups {
		res = append(res, g)
	}
	return res
}
```

---
id: top-k-frequent-elements
title: Top K Frequent Elements
difficulty: Medium
category: Arrays & Hashing
leetcode: 347
lists: neetcode150, blind75
algorithms: hashing, heap, sorting-selection
order: 5
---
Дан массив `nums` и число `k`. Верни `k` самых частых элементов в любом порядке. Ответ гарантированно единственный.

**Пример:** `nums = [1,1,1,2,2,3], k = 2` → `[1,2]`

**Ограничения:** `1 ≤ n ≤ 10⁵`, `k` от 1 до числа различных элементов. Хорошо бы быстрее O(n log n).

<details><summary>Подсказка</summary>Частота не больше n — можно группировать числа по частоте в «корзины».</details>

### Сортировка по частоте
Считаем частоты картой, берём уникальные числа и сортируем по убыванию частоты.

**Сложность:** время O(n log n), память O(n).

```go
func topKFrequent(nums []int, k int) []int {
	cnt := make(map[int]int)
	for _, x := range nums {
		cnt[x]++
	}
	keys := make([]int, 0, len(cnt))
	for x := range cnt {
		keys = append(keys, x)
	}
	slices.SortFunc(keys, func(a, b int) int { return cnt[b] - cnt[a] })
	return keys[:k]
}
```

### Куча размера k
Поддерживаем min-кучу из k пар (частота, число): при переполнении выкидываем самый редкий элемент.

**Сложность:** время O(n log k), память O(n).

```go
type item struct{ val, freq int }

type minHeap []item

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].freq < h[j].freq }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func topKFrequent(nums []int, k int) []int {
	cnt := make(map[int]int)
	for _, x := range nums {
		cnt[x]++
	}
	h := &minHeap{}
	for v, f := range cnt {
		heap.Push(h, item{v, f})
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	res := make([]int, 0, k)
	for h.Len() > 0 {
		res = append(res, heap.Pop(h).(item).val)
	}
	return res
}
```

### Bucket sort
Частота лежит в диапазоне 1..n. Кладём число в корзину `buckets[freq]` и собираем ответ с конца, пока не наберём k элементов.

**Сложность:** время O(n), память O(n).

```go
func topKFrequent(nums []int, k int) []int {
	cnt := make(map[int]int)
	for _, x := range nums {
		cnt[x]++
	}
	buckets := make([][]int, len(nums)+1)
	for v, f := range cnt {
		buckets[f] = append(buckets[f], v)
	}
	res := make([]int, 0, k)
	for f := len(buckets) - 1; f > 0 && len(res) < k; f-- {
		res = append(res, buckets[f]...)
	}
	return res[:k]
}
```

---
id: encode-and-decode-strings
title: Encode and Decode Strings
difficulty: Medium
category: Arrays & Hashing
leetcode: 271
lists: neetcode150, blind75
algorithms: hashing
order: 6
---
Реализуй `Encode`, превращающий список строк в одну строку, и `Decode`, восстанавливающий исходный список. Строки могут содержать любые символы, в том числе разделители.

**Пример:** `["lint","code","love","you"]` → `Encode` → `Decode` → `["lint","code","love","you"]`

**Ограничения:** `0 ≤ n ≤ 200`, длина строки до 200, любые символы (включая пустую строку).

<details><summary>Подсказка</summary>Перед каждой строкой записывай её длину — тогда содержимое не может «сломать» разбор.</details>

### Длина и разделитель
Кодируем каждую строку как `длина#содержимое`. При декодировании читаем число до `#`, затем ровно столько байт — символы внутри строки уже ничего не ломают.

**Сложность:** время O(N), память O(N), где N — суммарная длина.

```go
type Codec struct{}

func (c *Codec) Encode(strs []string) string {
	var sb strings.Builder
	for _, s := range strs {
		sb.WriteString(strconv.Itoa(len(s)))
		sb.WriteByte('#')
		sb.WriteString(s)
	}
	return sb.String()
}

func (c *Codec) Decode(s string) []string {
	res := []string{}
	i := 0
	for i < len(s) {
		j := i
		for s[j] != '#' {
			j++
		}
		n, _ := strconv.Atoi(s[i:j])
		res = append(res, s[j+1:j+1+n])
		i = j + 1 + n
	}
	return res
}
```

---
id: product-of-array-except-self
title: Product of Array Except Self
difficulty: Medium
category: Arrays & Hashing
leetcode: 238
lists: neetcode150, blind75
algorithms: prefix-sum
order: 7
---
Дан массив `nums`. Верни массив `answer`, где `answer[i]` — произведение всех элементов кроме `nums[i]`. Делить нельзя, время O(n).

**Пример:** `nums = [1,2,3,4]` → `[24,12,8,6]`

**Ограничения:** `2 ≤ n ≤ 10⁵`, `-30 ≤ nums[i] ≤ 30`, произведения помещаются в int32.

<details><summary>Подсказка</summary>Ответ = произведение всех элементов слева × произведение всех справа.</details>

### Префиксы и суффиксы
Строим массивы произведений слева `left[i]` и справа `right[i]`, ответ — их произведение.

**Сложность:** время O(n), память O(n).

```go
func productExceptSelf(nums []int) []int {
	n := len(nums)
	left := make([]int, n)
	right := make([]int, n)
	left[0] = 1
	for i := 1; i < n; i++ {
		left[i] = left[i-1] * nums[i-1]
	}
	right[n-1] = 1
	for i := n - 2; i >= 0; i-- {
		right[i] = right[i+1] * nums[i+1]
	}
	res := make([]int, n)
	for i := range res {
		res[i] = left[i] * right[i]
	}
	return res
}
```

### Один массив результата
Записываем префиксные произведения прямо в ответ, а затем проходом справа налево домножаем на накопленный суффикс в одной переменной.

**Сложность:** время O(n), память O(1) без учёта ответа.

```go
func productExceptSelf(nums []int) []int {
	n := len(nums)
	res := make([]int, n)
	res[0] = 1
	for i := 1; i < n; i++ {
		res[i] = res[i-1] * nums[i-1]
	}
	suffix := 1
	for i := n - 1; i >= 0; i-- {
		res[i] *= suffix
		suffix *= nums[i]
	}
	return res
}
```

---
id: valid-sudoku
title: Valid Sudoku
difficulty: Medium
category: Arrays & Hashing
leetcode: 36
lists: neetcode150
algorithms: hashing, matrix
order: 8
---
Дана доска 9×9, частично заполненная цифрами `'1'..'9'`, пустые клетки — `'.'`. Проверь, что заполненные клетки не нарушают правил: цифры не повторяются в строке, столбце и каждом из девяти блоков 3×3. Решать судоку не нужно.

**Пример:** доска с двумя пятёрками в первой строке → `false`.

**Ограничения:** `board.length == 9`, `board[i].length == 9`.

<details><summary>Подсказка</summary>Номер блока для клетки (r, c) — это `(r/3)*3 + c/3`.</details>

### Три набора множеств
Для каждой строки, столбца и блока ведём множество уже встреченных цифр. При повторе в любом из них — доска невалидна.

**Сложность:** время O(81) = O(1), память O(1).

```go
func isValidSudoku(board [][]byte) bool {
	var rows, cols, boxes [9]map[byte]bool
	for i := 0; i < 9; i++ {
		rows[i] = map[byte]bool{}
		cols[i] = map[byte]bool{}
		boxes[i] = map[byte]bool{}
	}
	for r := 0; r < 9; r++ {
		for c := 0; c < 9; c++ {
			d := board[r][c]
			if d == '.' {
				continue
			}
			b := (r/3)*3 + c/3
			if rows[r][d] || cols[c][d] || boxes[b][d] {
				return false
			}
			rows[r][d] = true
			cols[c][d] = true
			boxes[b][d] = true
		}
	}
	return true
}
```

### Битовые маски
Вместо карт — по одному `uint16` на строку, столбец и блок: бит `d` означает, что цифра `d` уже встречалась.

**Сложность:** время O(1), память O(1).

```go
func isValidSudoku(board [][]byte) bool {
	var rows, cols, boxes [9]uint16
	for r := 0; r < 9; r++ {
		for c := 0; c < 9; c++ {
			if board[r][c] == '.' {
				continue
			}
			bit := uint16(1) << (board[r][c] - '1')
			b := (r/3)*3 + c/3
			if rows[r]&bit != 0 || cols[c]&bit != 0 || boxes[b]&bit != 0 {
				return false
			}
			rows[r] |= bit
			cols[c] |= bit
			boxes[b] |= bit
		}
	}
	return true
}
```

---
id: longest-consecutive-sequence
title: Longest Consecutive Sequence
difficulty: Medium
category: Arrays & Hashing
leetcode: 128
lists: neetcode150, blind75
algorithms: hashing, sorting-selection
order: 9
---
Дан неотсортированный массив `nums`. Верни длину самой длинной последовательности подряд идущих чисел (например, 3,4,5). Нужно решение за O(n).

**Пример:** `nums = [100,4,200,1,3,2]` → `4` (последовательность `1,2,3,4`)

**Ограничения:** `0 ≤ n ≤ 10⁵`, `-10⁹ ≤ nums[i] ≤ 10⁹`

<details><summary>Подсказка</summary>Начинай отсчёт только с чисел, у которых нет предшественника `x-1` в множестве.</details>

### Сортировка
Сортируем и одним проходом считаем длину текущей цепочки; дубликаты пропускаем.

**Сложность:** время O(n log n), память O(n).

```go
func longestConsecutive(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	sorted := slices.Clone(nums)
	slices.Sort(sorted)
	best, cur := 1, 1
	for i := 1; i < len(sorted); i++ {
		switch {
		case sorted[i] == sorted[i-1]:
			// дубликат — цепочку не меняем
		case sorted[i] == sorted[i-1]+1:
			cur++
		default:
			cur = 1
		}
		best = max(best, cur)
	}
	return best
}
```

### Хеш-множество и старты цепочек
Кладём все числа в множество. Цепочку начинаем только с `x`, у которого нет `x-1`, и идём вверх. Каждый элемент посещается не более двух раз.

**Сложность:** время O(n), память O(n).

```go
func longestConsecutive(nums []int) int {
	set := make(map[int]struct{}, len(nums))
	for _, x := range nums {
		set[x] = struct{}{}
	}
	best := 0
	for x := range set {
		if _, ok := set[x-1]; ok {
			continue // не начало цепочки
		}
		length := 1
		for {
			if _, ok := set[x+length]; !ok {
				break
			}
			length++
		}
		best = max(best, length)
	}
	return best
}
```
