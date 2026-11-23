---
id: binary-search
title: Binary Search
difficulty: Easy
category: Binary Search
leetcode: 704
lists: neetcode150
algorithms: binary-search
order: 28
---
Дан отсортированный по возрастанию массив `nums` и число `target`. Верни индекс `target` или `-1`.

**Пример:** `nums = [-1,0,3,5,9,12], target = 9` → `4`

**Ограничения:** `1 ≤ n ≤ 10⁴`, все элементы уникальны. Нужно O(log n).

<details><summary>Подсказка</summary>Каждое сравнение с серединой отбрасывает половину диапазона.</details>

### Классический цикл `lo ≤ hi`
Держим отрезок `[lo, hi]`, смотрим на середину и сужаем границы. Середину считаем как `lo + (hi-lo)/2`, чтобы не переполниться.

**Сложность:** время O(log n), память O(1).

```go
func search(nums []int, target int) int {
	lo, hi := 0, len(nums)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		switch {
		case nums[mid] == target:
			return mid
		case nums[mid] < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return -1
}
```

### Нижняя граница (`lo < hi`)
Ищем первую позицию, где `nums[i] ≥ target`, на полуинтервале `[lo, hi)`. В конце проверяем, что элемент там действительно равен `target`. Этот шаблон универсальнее для задач на «первый подходящий».

**Сложность:** время O(log n), память O(1).

```go
func search(nums []int, target int) int {
	lo, hi := 0, len(nums) // ответ в [lo, hi]
	for lo < hi {
		mid := lo + (hi-lo)/2
		if nums[mid] < target {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	if lo < len(nums) && nums[lo] == target {
		return lo
	}
	return -1
}
```

---
id: search-a-2d-matrix
title: Search a 2D Matrix
difficulty: Medium
category: Binary Search
leetcode: 74
lists: neetcode150
algorithms: binary-search, matrix
order: 29
---
Матрица `m × n`: каждая строка отсортирована по возрастанию, первый элемент строки больше последнего элемента предыдущей. Определи, есть ли в ней `target`.

**Пример:** `matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3` → `true`

**Ограничения:** `1 ≤ m, n ≤ 100`. Нужно O(log(m·n)).

<details><summary>Подсказка</summary>Если выписать строки подряд, получится один отсортированный массив длины m·n.</details>

### Линейный просмотр
Проверяем все элементы подряд.

**Сложность:** время O(m·n), память O(1).

```go
func searchMatrix(matrix [][]int, target int) bool {
	for _, row := range matrix {
		for _, v := range row {
			if v == target {
				return true
			}
		}
	}
	return false
}
```

### Один бинарный поиск по «развёрнутой» матрице
Индекс `k` в диапазоне `[0, m·n)` соответствует элементу `matrix[k/n][k%n]`. Делаем обычный бинарный поиск по `k`.

**Сложность:** время O(log(m·n)), память O(1).

```go
func searchMatrix(matrix [][]int, target int) bool {
	m, n := len(matrix), len(matrix[0])
	lo, hi := 0, m*n-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		v := matrix[mid/n][mid%n]
		switch {
		case v == target:
			return true
		case v < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return false
}
```

### Два бинарных поиска: строка, затем столбец
Сначала бинарным поиском находим единственную строку, чей диапазон `[первый, последний]` может содержать `target`, затем ищем внутри неё.

**Сложность:** время O(log m + log n), память O(1).

```go
func searchMatrix(matrix [][]int, target int) bool {
	m, n := len(matrix), len(matrix[0])
	top, bot := 0, m-1
	for top <= bot {
		mid := top + (bot-top)/2
		switch {
		case target < matrix[mid][0]:
			bot = mid - 1
		case target > matrix[mid][n-1]:
			top = mid + 1
		default:
			row := matrix[mid]
			lo, hi := 0, n-1
			for lo <= hi {
				c := lo + (hi-lo)/2
				if row[c] == target {
					return true
				} else if row[c] < target {
					lo = c + 1
				} else {
					hi = c - 1
				}
			}
			return false
		}
	}
	return false
}
```

---
id: koko-eating-bananas
title: Koko Eating Bananas
difficulty: Medium
category: Binary Search
leetcode: 875
lists: neetcode150
algorithms: binary-search
order: 30
---
Есть `n` куч бананов `piles`, у Коко `h` часов. За час она выбирает кучу и съедает до `k` бананов из неё (остаток кучи не переносится на следующий час). Найди минимальное целое `k`, при котором она успеет всё съесть.

**Пример:** `piles = [3,6,7,11], h = 8` → `4`

**Ограничения:** `1 ≤ n ≤ 10⁴`, `n ≤ h ≤ 10⁹`, `1 ≤ piles[i] ≤ 10⁹`

<details><summary>Подсказка</summary>Чем больше скорость, тем меньше часов — функция монотонна, ищи ответ бинарным поиском по значению k.</details>

### Перебор скорости
Пробуем `k = 1, 2, …` и берём первое, при котором общее число часов не превышает `h`. Часов на кучу `p` нужно `⌈p/k⌉`.

**Сложность:** время O(n · max(piles)), память O(1).

```go
func minEatingSpeed(piles []int, h int) int {
	for k := 1; ; k++ {
		hours := 0
		for _, p := range piles {
			hours += (p + k - 1) / k // потолок деления
		}
		if hours <= h {
			return k
		}
	}
}
```

### Бинарный поиск по ответу
Скорость лежит в `[1, max(piles)]`, а предикат «успеет за `h` часов» монотонен. Ищем минимальное `k`, для которого он истинен.

**Сложность:** время O(n · log(max(piles))), память O(1).

```go
func minEatingSpeed(piles []int, h int) int {
	hi := 0
	for _, p := range piles {
		hi = max(hi, p)
	}
	lo := 1
	for lo < hi {
		k := lo + (hi-lo)/2
		hours := 0
		for _, p := range piles {
			hours += (p + k - 1) / k
		}
		if hours <= h {
			hi = k // k подходит, ищем меньше
		} else {
			lo = k + 1
		}
	}
	return lo
}
```

---
id: find-minimum-in-rotated-sorted-array
title: Find Minimum in Rotated Sorted Array
difficulty: Medium
category: Binary Search
leetcode: 153
lists: neetcode150, blind75
algorithms: binary-search
order: 31
---
Отсортированный массив из уникальных чисел был циклически сдвинут. Найди минимальный элемент за O(log n).

**Пример:** `nums = [3,4,5,1,2]` → `1`; `[4,5,6,7,0,1,2]` → `0`

**Ограничения:** `1 ≤ n ≤ 5000`, элементы уникальны.

<details><summary>Подсказка</summary>Сравни середину с правым концом: если `nums[mid] > nums[hi]`, минимум правее середины.</details>

### Линейный проход
Просто ищем минимум.

**Сложность:** время O(n), память O(1).

```go
func findMin(nums []int) int {
	res := nums[0]
	for _, v := range nums {
		res = min(res, v)
	}
	return res
}
```

### Бинарный поиск по правому краю
Если `nums[mid] > nums[hi]`, точка излома (минимум) справа от `mid`, иначе `mid` может быть минимумом, и сдвигаем `hi = mid`.

**Сложность:** время O(log n), память O(1).

```go
func findMin(nums []int) int {
	lo, hi := 0, len(nums)-1
	for lo < hi {
		mid := lo + (hi-lo)/2
		if nums[mid] > nums[hi] {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return nums[lo]
}
```

---
id: search-in-rotated-sorted-array
title: Search in Rotated Sorted Array
difficulty: Medium
category: Binary Search
leetcode: 33
lists: neetcode150, blind75
algorithms: binary-search
order: 32
---
Отсортированный массив уникальных чисел циклически сдвинут. Найди индекс `target` или верни `-1` за O(log n).

**Пример:** `nums = [4,5,6,7,0,1,2], target = 0` → `4`

**Ограничения:** `1 ≤ n ≤ 5000`, элементы уникальны.

<details><summary>Подсказка</summary>Одна из половин `[lo, mid]` и `[mid, hi]` всегда отсортирована — определи, в какой из них может лежать target.</details>

### Линейный поиск
Идём по массиву.

**Сложность:** время O(n), память O(1).

```go
func search(nums []int, target int) int {
	for i, v := range nums {
		if v == target {
			return i
		}
	}
	return -1
}
```

### Один бинарный поиск
На каждом шаге определяем, какая половина отсортирована (`nums[lo] ≤ nums[mid]` — левая). Если `target` попадает в диапазон отсортированной половины, идём в неё, иначе в другую.

**Сложность:** время O(log n), память O(1).

```go
func search(nums []int, target int) int {
	lo, hi := 0, len(nums)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if nums[mid] == target {
			return mid
		}
		if nums[lo] <= nums[mid] { // левая половина отсортирована
			if nums[lo] <= target && target < nums[mid] {
				hi = mid - 1
			} else {
				lo = mid + 1
			}
		} else { // правая половина отсортирована
			if nums[mid] < target && target <= nums[hi] {
				lo = mid + 1
			} else {
				hi = mid - 1
			}
		}
	}
	return -1
}
```

### Найти точку излома, затем обычный поиск
Сначала бинарным поиском находим индекс минимума `pivot`. Затем ищем `target` как в массиве, «повёрнутом» обратно: индекс `i` в виртуальном отсортированном массиве соответствует `(i + pivot) % n`.

**Сложность:** время O(log n), память O(1).

```go
func search(nums []int, target int) int {
	n := len(nums)
	lo, hi := 0, n-1
	for lo < hi { // pivot — индекс минимума
		mid := lo + (hi-lo)/2
		if nums[mid] > nums[hi] {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	pivot := lo
	lo, hi = 0, n-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		real := (mid + pivot) % n
		switch {
		case nums[real] == target:
			return real
		case nums[real] < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return -1
}
```

---
id: time-based-key-value-store
title: Time Based Key-Value Store
difficulty: Medium
category: Binary Search
leetcode: 981
lists: neetcode150
algorithms: binary-search, hashing
order: 33
---
Спроектируй хранилище `TimeMap`: `set(key, value, timestamp)` сохраняет значение, `get(key, timestamp)` возвращает значение с наибольшим `timestamp_prev ≤ timestamp` для этого ключа или `""`. Метки времени в `set` строго возрастают.

**Пример:** `set("foo","bar",1); get("foo",1) → "bar"; get("foo",3) → "bar"; set("foo","bar2",4); get("foo",4) → "bar2"; get("foo",5) → "bar2"`

**Ограничения:** до `2·10⁵` вызовов.

<details><summary>Подсказка</summary>Для каждого ключа значения лежат в порядке возрастания времени — в списке можно искать бинарным поиском.</details>

### Линейный поиск с конца
Для каждого ключа храним срез пар `(timestamp, value)`. В `Get` идём с конца и берём первую запись с `ts ≤ timestamp`.

**Сложность:** `Set` O(1), `Get` O(n) на ключ, память O(n).

```go
type entry struct {
	ts  int
	val string
}

type TimeMap struct {
	data map[string][]entry
}

func Constructor() TimeMap {
	return TimeMap{data: make(map[string][]entry)}
}

func (this *TimeMap) Set(key string, value string, timestamp int) {
	this.data[key] = append(this.data[key], entry{timestamp, value})
}

func (this *TimeMap) Get(key string, timestamp int) string {
	es := this.data[key]
	for i := len(es) - 1; i >= 0; i-- {
		if es[i].ts <= timestamp {
			return es[i].val
		}
	}
	return ""
}
```

### Бинарный поиск по меткам времени
Так как метки в срезе возрастают, находим первую запись с `ts > timestamp` через `sort.Search`; ответ — предыдущая запись.

**Сложность:** `Set` O(1), `Get` O(log n), память O(n).

```go
type entry struct {
	ts  int
	val string
}

type TimeMap struct {
	data map[string][]entry
}

func Constructor() TimeMap {
	return TimeMap{data: make(map[string][]entry)}
}

func (this *TimeMap) Set(key string, value string, timestamp int) {
	this.data[key] = append(this.data[key], entry{timestamp, value})
}

func (this *TimeMap) Get(key string, timestamp int) string {
	es := this.data[key]
	i := sort.Search(len(es), func(i int) bool { return es[i].ts > timestamp })
	if i == 0 {
		return ""
	}
	return es[i-1].val
}
```

---
id: median-of-two-sorted-arrays
title: Median of Two Sorted Arrays
difficulty: Hard
category: Binary Search
leetcode: 4
lists: neetcode150
algorithms: binary-search
order: 34
---
Даны два отсортированных массива `nums1` и `nums2` размеров `m` и `n`. Найди медиану объединённого массива за O(log(m+n)).

**Пример:** `[1,3], [2]` → `2.0`; `[1,2], [3,4]` → `2.5`

**Ограничения:** `0 ≤ m, n ≤ 1000`, `1 ≤ m+n ≤ 2000`

<details><summary>Подсказка</summary>Бинарным поиском выбери разрез меньшего массива так, чтобы левые части обоих массивов вместе давали половину элементов и все они были не больше правых.</details>

### Слияние
Сливаем массивы как в merge sort и берём средний элемент (или два средних).

**Сложность:** время O(m+n), память O(m+n).

```go
func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
	merged := make([]int, 0, len(nums1)+len(nums2))
	i, j := 0, 0
	for i < len(nums1) || j < len(nums2) {
		if j == len(nums2) || (i < len(nums1) && nums1[i] <= nums2[j]) {
			merged = append(merged, nums1[i])
			i++
		} else {
			merged = append(merged, nums2[j])
			j++
		}
	}
	n := len(merged)
	if n%2 == 1 {
		return float64(merged[n/2])
	}
	return float64(merged[n/2-1]+merged[n/2]) / 2
}
```

### Бинарный поиск разреза
Берём меньший массив `A`, выбираем `i` — число его элементов в левой половине; из `B` в левую половину идёт `j = half − i`. Разрез верен, если `A[i-1] ≤ B[j]` и `B[j-1] ≤ A[i]`. Иначе сдвигаем `i`. Отсутствующие границы заменяем на ±∞.

**Сложность:** время O(log(min(m, n))), память O(1).

```go
func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
	if len(nums1) > len(nums2) {
		nums1, nums2 = nums2, nums1
	}
	const inf = 1 << 60
	m, n := len(nums1), len(nums2)
	half := (m + n + 1) / 2
	lo, hi := 0, m
	for lo <= hi {
		i := lo + (hi-lo)/2
		j := half - i
		l1, r1, l2, r2 := -inf, inf, -inf, inf
		if i > 0 {
			l1 = nums1[i-1]
		}
		if i < m {
			r1 = nums1[i]
		}
		if j > 0 {
			l2 = nums2[j-1]
		}
		if j < n {
			r2 = nums2[j]
		}
		if l1 <= r2 && l2 <= r1 {
			if (m+n)%2 == 1 {
				return float64(max(l1, l2))
			}
			return float64(max(l1, l2)+min(r1, r2)) / 2
		}
		if l1 > r2 {
			hi = i - 1
		} else {
			lo = i + 1
		}
	}
	return 0
}
```
