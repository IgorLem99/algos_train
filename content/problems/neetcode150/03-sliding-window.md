---
id: best-time-to-buy-and-sell-stock
title: Best Time to Buy and Sell Stock
difficulty: Easy
category: Sliding Window
leetcode: 121
lists: neetcode150, blind75
algorithms: sliding-window, greedy
order: 15
---
Дан массив цен `prices`, где `prices[i]` — цена акции в день `i`. Выбери день покупки и более поздний день продажи так, чтобы прибыль была максимальной. Верни её (или `0`, если прибыли нет).

**Пример:** `prices = [7,1,5,3,6,4]` → `5` (купить по 1, продать по 6)

**Ограничения:** `1 ≤ n ≤ 10⁵`, `0 ≤ prices[i] ≤ 10⁴`

<details><summary>Подсказка</summary>Для каждого дня продажи лучшая покупка — минимальная цена до него.</details>

### Перебор всех пар
Для каждой пары `i < j` считаем `prices[j] − prices[i]`.

**Сложность:** время O(n²), память O(1).

```go
func maxProfit(prices []int) int {
	best := 0
	for i := 0; i < len(prices); i++ {
		for j := i + 1; j < len(prices); j++ {
			best = max(best, prices[j]-prices[i])
		}
	}
	return best
}
```

### Минимум на лету
Идём слева направо, помним минимальную цену и обновляем лучший результат как `price − minPrice`.

**Сложность:** время O(n), память O(1).

```go
func maxProfit(prices []int) int {
	best := 0
	minPrice := prices[0]
	for _, p := range prices {
		minPrice = min(minPrice, p)
		best = max(best, p-minPrice)
	}
	return best
}
```

---
id: longest-substring-without-repeating-characters
title: Longest Substring Without Repeating Characters
difficulty: Medium
category: Sliding Window
leetcode: 3
lists: neetcode150, blind75
algorithms: sliding-window, hashing
order: 16
---
Дана строка `s`. Найди длину самой длинной подстроки без повторяющихся символов.

**Пример:** `s = "abcabcbb"` → `3` (`"abc"`); `s = "bbbbb"` → `1`

**Ограничения:** `0 ≤ len ≤ 5·10⁴`, ASCII-символы.

<details><summary>Подсказка</summary>Расширяй окно справа; при повторе сдвигай левую границу за прошлое вхождение символа.</details>

### Окно с множеством
Правая граница добавляет символ в множество; пока он уже есть, сдвигаем левую границу и удаляем символы из множества.

**Сложность:** время O(n), память O(min(n, алфавит)).

```go
func lengthOfLongestSubstring(s string) int {
	inWindow := make(map[byte]bool)
	best, l := 0, 0
	for r := 0; r < len(s); r++ {
		for inWindow[s[r]] {
			delete(inWindow, s[l])
			l++
		}
		inWindow[s[r]] = true
		best = max(best, r-l+1)
	}
	return best
}
```

### Прыжок левой границы по последнему индексу
Храним последний индекс каждого символа. При повторе внутри окна левая граница сразу прыгает на `last+1` — без пошагового удаления.

**Сложность:** время O(n), память O(1) (массив на 256 символов).

```go
func lengthOfLongestSubstring(s string) int {
	var last [256]int // индекс последнего вхождения + 1, 0 — не встречался
	best, l := 0, 0
	for r := 0; r < len(s); r++ {
		l = max(l, last[s[r]])
		last[s[r]] = r + 1
		best = max(best, r-l+1)
	}
	return best
}
```

---
id: longest-repeating-character-replacement
title: Longest Repeating Character Replacement
difficulty: Medium
category: Sliding Window
leetcode: 424
lists: neetcode150, blind75
algorithms: sliding-window
order: 17
---
Дана строка `s` из заглавных латинских букв и число `k`. Можно не более `k` раз заменить любой символ на любой другой. Верни длину самой длинной подстроки из одинаковых букв, которую можно получить.

**Пример:** `s = "AABABBA", k = 1` → `4` (`"AABA"` → `"AAAA"`)

**Ограничения:** `1 ≤ len ≤ 10⁵`, `0 ≤ k ≤ len`

<details><summary>Подсказка</summary>Окно допустимо, если `длина − (частота самой частой буквы) ≤ k`.</details>

### Окно с пересчётом максимума
Двигаем правую границу; пока замен нужно больше `k` (длина минус максимальная частота, пересчитанная по 26 буквам), сдвигаем левую.

**Сложность:** время O(26 · n), память O(1).

```go
func characterReplacement(s string, k int) int {
	var cnt [26]int
	best, l := 0, 0
	for r := 0; r < len(s); r++ {
		cnt[s[r]-'A']++
		for (r-l+1)-slices.Max(cnt[:]) > k {
			cnt[s[l]-'A']--
			l++
		}
		best = max(best, r-l+1)
	}
	return best
}
```

### Окно с «исторически лучшим» максимумом
Хранимый `maxFreq` никогда не уменьшается: ответ увеличивается только при росте `maxFreq`, поэтому устаревшее значение не портит результат. Окно просто сдвигается на 1 вместо сжатия.

**Сложность:** время O(n), память O(1).

```go
func characterReplacement(s string, k int) int {
	var cnt [26]int
	maxFreq, l := 0, 0
	for r := 0; r < len(s); r++ {
		cnt[s[r]-'A']++
		maxFreq = max(maxFreq, cnt[s[r]-'A'])
		if (r-l+1)-maxFreq > k {
			cnt[s[l]-'A']--
			l++
		}
	}
	return len(s) - l
}
```

---
id: permutation-in-string
title: Permutation in String
difficulty: Medium
category: Sliding Window
leetcode: 567
lists: neetcode150
algorithms: sliding-window, hashing
order: 18
---
Даны строки `s1` и `s2`. Верни `true`, если `s2` содержит перестановку `s1` в виде подстроки.

**Пример:** `s1 = "ab", s2 = "eidbaooo"` → `true` (`"ba"`); `s1 = "ab", s2 = "eidboaoo"` → `false`

**Ограничения:** `1 ≤ len ≤ 10⁴`, строчные латинские буквы.

<details><summary>Подсказка</summary>Окно фиксированной длины `len(s1)` и сравнение счётчиков букв.</details>

### Окно фиксированной длины со сравнением счётчиков
Скользим окном длины `len(s1)` по `s2`, поддерживая счётчики; на каждом шаге сравниваем два массива из 26 элементов.

**Сложность:** время O(26 · n), память O(1).

```go
func checkInclusion(s1 string, s2 string) bool {
	if len(s1) > len(s2) {
		return false
	}
	var need, win [26]int
	for i := 0; i < len(s1); i++ {
		need[s1[i]-'a']++
		win[s2[i]-'a']++
	}
	if need == win {
		return true
	}
	for r := len(s1); r < len(s2); r++ {
		win[s2[r]-'a']++
		win[s2[r-len(s1)]-'a']--
		if need == win {
			return true
		}
	}
	return false
}
```

### Счётчик совпавших букв
Вместо сравнения массивов поддерживаем число букв `matches`, у которых счётчики окна и `s1` равны. Каждый сдвиг окна меняет не больше двух букв, так что проверка за O(1).

**Сложность:** время O(n), память O(1).

```go
func checkInclusion(s1 string, s2 string) bool {
	if len(s1) > len(s2) {
		return false
	}
	var need, win [26]int
	for i := 0; i < len(s1); i++ {
		need[s1[i]-'a']++
		win[s2[i]-'a']++
	}
	matches := 0
	for i := 0; i < 26; i++ {
		if need[i] == win[i] {
			matches++
		}
	}
	if matches == 26 {
		return true
	}
	// update меняет счётчик буквы c в окне на d и поддерживает matches
	update := func(c byte, d int) {
		i := c - 'a'
		if win[i] == need[i] {
			matches--
		}
		win[i] += d
		if win[i] == need[i] {
			matches++
		}
	}
	for r := len(s1); r < len(s2); r++ {
		update(s2[r], 1)
		update(s2[r-len(s1)], -1)
		if matches == 26 {
			return true
		}
	}
	return false
}
```

---
id: minimum-window-substring
title: Minimum Window Substring
difficulty: Hard
category: Sliding Window
leetcode: 76
lists: neetcode150, blind75
algorithms: sliding-window, hashing
order: 19
---
Даны строки `s` и `t`. Верни наименьшую подстроку `s`, содержащую все символы `t` (с учётом кратности). Если такой нет — пустую строку.

**Пример:** `s = "ADOBECODEBANC", t = "ABC"` → `"BANC"`

**Ограничения:** `1 ≤ len(s), len(t) ≤ 10⁵`, латинские буквы обоих регистров.

<details><summary>Подсказка</summary>Расширяй окно, пока оно не покроет `t`, затем сжимай слева, пока покрытие сохраняется.</details>

### Перебор всех подстрок
Для каждого начала `i` расширяем конец `j`, пока подстрока не покроет `t`, и запоминаем кратчайшую.

**Сложность:** время O(n²), память O(1).

```go
func minWindow(s string, t string) string {
	var need [128]int
	for i := 0; i < len(t); i++ {
		need[t[i]]++
	}
	bestStart, bestLen := 0, len(s)+1
	for i := 0; i < len(s); i++ {
		have := need
		missing := len(t)
		for j := i; j < len(s); j++ {
			if have[s[j]] > 0 {
				missing--
			}
			have[s[j]]--
			if missing == 0 {
				if j-i+1 < bestLen {
					bestStart, bestLen = i, j-i+1
				}
				break
			}
		}
	}
	if bestLen > len(s) {
		return ""
	}
	return s[bestStart : bestStart+bestLen]
}
```

### Скользящее окно
Массив `need[c]` — сколько ещё нужно букв `c` (может уйти в минус для лишних). Переменная `missing` — сколько букв `t` ещё не покрыто. Когда `missing == 0`, сжимаем окно слева, пока не потеряем нужную букву.

**Сложность:** время O(n + m), память O(1).

```go
func minWindow(s string, t string) string {
	var need [128]int
	for i := 0; i < len(t); i++ {
		need[t[i]]++
	}
	missing := len(t)
	bestStart, bestLen := 0, len(s)+1
	l := 0
	for r := 0; r < len(s); r++ {
		if need[s[r]] > 0 {
			missing--
		}
		need[s[r]]--
		for missing == 0 {
			if r-l+1 < bestLen {
				bestStart, bestLen = l, r-l+1
			}
			need[s[l]]++
			if need[s[l]] > 0 {
				missing++
			}
			l++
		}
	}
	if bestLen > len(s) {
		return ""
	}
	return s[bestStart : bestStart+bestLen]
}
```

---
id: sliding-window-maximum
title: Sliding Window Maximum
difficulty: Hard
category: Sliding Window
leetcode: 239
lists: neetcode150
algorithms: sliding-window, monotonic-stack, heap
order: 20
---
Дан массив `nums` и размер окна `k`. Окно движется слева направо по одному элементу. Верни максимум в каждом положении окна.

**Пример:** `nums = [1,3,-1,-3,5,3,6,7], k = 3` → `[3,3,5,5,6,7]`

**Ограничения:** `1 ≤ k ≤ n ≤ 10⁵`, `-10⁴ ≤ nums[i] ≤ 10⁴`

<details><summary>Подсказка</summary>Держи индексы в deque так, чтобы значения убывали: голова — текущий максимум.</details>

### Перебор максимума в каждом окне
Для каждого окна находим максимум заново.

**Сложность:** время O(n · k), память O(1) без учёта ответа.

```go
func maxSlidingWindow(nums []int, k int) []int {
	res := make([]int, 0, len(nums)-k+1)
	for i := 0; i+k <= len(nums); i++ {
		res = append(res, slices.Max(nums[i:i+k]))
	}
	return res
}
```

### Куча с ленивым удалением
Кладём в max-кучу пары (значение, индекс). Перед чтением максимума выкидываем вершины, индекс которых уже вышел из окна.

**Сложность:** время O(n log n), память O(n).

```go
type entry struct{ val, idx int }

type maxHeap []entry

func (h maxHeap) Len() int           { return len(h) }
func (h maxHeap) Less(i, j int) bool { return h[i].val > h[j].val }
func (h maxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *maxHeap) Push(x any)        { *h = append(*h, x.(entry)) }
func (h *maxHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func maxSlidingWindow(nums []int, k int) []int {
	h := &maxHeap{}
	res := make([]int, 0, len(nums)-k+1)
	for i, x := range nums {
		heap.Push(h, entry{x, i})
		if i >= k-1 {
			for (*h)[0].idx <= i-k {
				heap.Pop(h)
			}
			res = append(res, (*h)[0].val)
		}
	}
	return res
}
```

### Монотонная очередь (deque)
Храним в очереди индексы с убывающими значениями. Новый элемент вытесняет с хвоста все меньшие; с головы убираем индекс, вышедший из окна. Голова всегда — максимум. Каждый индекс входит и выходит один раз.

**Сложность:** время O(n), память O(k).

```go
func maxSlidingWindow(nums []int, k int) []int {
	dq := []int{} // индексы, значения nums по ним убывают
	res := make([]int, 0, len(nums)-k+1)
	for i, x := range nums {
		for len(dq) > 0 && nums[dq[len(dq)-1]] <= x {
			dq = dq[:len(dq)-1]
		}
		dq = append(dq, i)
		if dq[0] <= i-k {
			dq = dq[1:]
		}
		if i >= k-1 {
			res = append(res, nums[dq[0]])
		}
	}
	return res
}
```
