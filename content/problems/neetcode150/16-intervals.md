---
id: insert-interval
title: Insert Interval
difficulty: Medium
category: Intervals
leetcode: 57
lists: neetcode150, blind75
algorithms: intervals
order: 130
---
Дан отсортированный список непересекающихся отрезков `intervals` и новый отрезок `newInterval`. Вставь его, слив пересекающиеся, чтобы результат остался отсортированным и непересекающимся.

**Пример:** `intervals = [[1,3],[6,9]], newInterval = [2,5]` → `[[1,5],[6,9]]`

**Ограничения:** `0 ≤ n ≤ 10⁴`, `0 ≤ start ≤ end ≤ 10⁵`

<details><summary>Подсказка</summary>Список делится на три части: целиком левее нового, пересекающиеся с ним, целиком правее.</details>

### Добавить, отсортировать, слить
Добавляем отрезок в список, сортируем по началу и сливаем, как в задаче Merge Intervals.

**Сложность:** время O(n log n), память O(n).

```go
func insert(intervals [][]int, newInterval []int) [][]int {
	all := append(append([][]int(nil), intervals...), newInterval)
	sort.Slice(all, func(i, j int) bool { return all[i][0] < all[j][0] })
	res := [][]int{{all[0][0], all[0][1]}}
	for _, iv := range all[1:] {
		last := res[len(res)-1]
		if iv[0] <= last[1] {
			last[1] = max(last[1], iv[1])
		} else {
			res = append(res, []int{iv[0], iv[1]})
		}
	}
	return res
}
```

### Линейный проход в три фазы
Копируем отрезки, заканчивающиеся левее нового. Затем сливаем с новым все, чьё начало `≤ конец нового`. Дописываем результат слияния и оставшиеся отрезки.

**Сложность:** время O(n), память O(n) под ответ.

```go
func insert(intervals [][]int, newInterval []int) [][]int {
	res := make([][]int, 0, len(intervals)+1)
	cur := []int{newInterval[0], newInterval[1]}
	i, n := 0, len(intervals)
	for i < n && intervals[i][1] < cur[0] {
		res = append(res, intervals[i])
		i++
	}
	for i < n && intervals[i][0] <= cur[1] {
		cur[0] = min(cur[0], intervals[i][0])
		cur[1] = max(cur[1], intervals[i][1])
		i++
	}
	res = append(res, cur)
	for ; i < n; i++ {
		res = append(res, intervals[i])
	}
	return res
}
```

---
id: merge-intervals
title: Merge Intervals
difficulty: Medium
category: Intervals
leetcode: 56
lists: neetcode150, blind75
algorithms: intervals, sorting-selection
order: 131
---
Дан массив отрезков `intervals[i] = [start, end]`. Слей все пересекающиеся и верни непересекающиеся отрезки, покрывающие те же точки.

**Пример:** `intervals = [[1,3],[2,6],[8,10],[15,18]]` → `[[1,6],[8,10],[15,18]]`

**Ограничения:** `1 ≤ n ≤ 10⁴`. Отрезки `[1,4]` и `[4,5]` считаются пересекающимися.

<details><summary>Подсказка</summary>После сортировки по началу пересечься с текущим слитым отрезком может только следующий.</details>

### Сортировка по началу и слияние
Сортируем по `start`. Если начало очередного отрезка `≤` конца последнего в ответе — расширяем конец, иначе начинаем новый.

**Сложность:** время O(n log n), память O(n).

```go
func merge(intervals [][]int) [][]int {
	sorted := append([][]int(nil), intervals...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })
	res := [][]int{{sorted[0][0], sorted[0][1]}}
	for _, iv := range sorted[1:] {
		last := res[len(res)-1]
		if iv[0] <= last[1] {
			last[1] = max(last[1], iv[1])
		} else {
			res = append(res, []int{iv[0], iv[1]})
		}
	}
	return res
}
```

### Сортировка начал и концов отдельно
Сортируем отдельно массивы начал и концов и идём как по событиям. При равенстве сначала обрабатываем начало (чтобы `[1,4]` и `[4,5]` слились). Счётчик открытых отрезков: 0→1 — начало слитого отрезка, 1→0 — его конец.

**Сложность:** время O(n log n), память O(n).

```go
func merge(intervals [][]int) [][]int {
	n := len(intervals)
	starts, ends := make([]int, n), make([]int, n)
	for i, iv := range intervals {
		starts[i], ends[i] = iv[0], iv[1]
	}
	sort.Ints(starts)
	sort.Ints(ends)
	var res [][]int
	open, begin := 0, 0
	for i, j := 0, 0; j < n; {
		if i < n && starts[i] <= ends[j] {
			if open == 0 {
				begin = starts[i]
			}
			open++
			i++
		} else {
			open--
			if open == 0 {
				res = append(res, []int{begin, ends[j]})
			}
			j++
		}
	}
	return res
}
```

---
id: non-overlapping-intervals
title: Non-overlapping Intervals
difficulty: Medium
category: Intervals
leetcode: 435
lists: neetcode150, blind75
algorithms: greedy, intervals, dynamic-programming
order: 132
---
Дан массив отрезков. Найди минимальное число отрезков, которые нужно удалить, чтобы оставшиеся не пересекались. Отрезки, касающиеся концами (`[1,2]` и `[2,3]`), не пересекаются.

**Пример:** `intervals = [[1,2],[2,3],[3,4],[1,3]]` → `1`

**Ограничения:** `1 ≤ n ≤ 10⁵`

<details><summary>Подсказка</summary>Задача равносильна выбору максимального числа непересекающихся отрезков (activity selection) — выгодно брать тот, что заканчивается раньше.</details>

### Динамика по отсортированным отрезкам
Сортируем по началу. `dp[i]` — наибольшее число непересекающихся отрезков, последним из которых является `i`. Ответ — `n − max(dp)`.

**Сложность:** время O(n²), память O(n).

```go
func eraseOverlapIntervals(intervals [][]int) int {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
	n := len(iv)
	dp := make([]int, n)
	best := 0
	for i := 0; i < n; i++ {
		dp[i] = 1
		for j := 0; j < i; j++ {
			if iv[j][1] <= iv[i][0] {
				dp[i] = max(dp[i], dp[j]+1)
			}
		}
		best = max(best, dp[i])
	}
	return n - best
}
```

### Жадность: сортировка по концу
Сортируем по `end`. Оставляем первый отрезок; каждый следующий, чьё начало `≥` конца последнего оставленного, тоже оставляем, иначе удаляем.

**Сложность:** время O(n log n), память O(1) дополнительно.

```go
func eraseOverlapIntervals(intervals [][]int) int {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][1] < iv[j][1] })
	removed := 0
	prevEnd := iv[0][1]
	for _, cur := range iv[1:] {
		if cur[0] >= prevEnd {
			prevEnd = cur[1]
		} else {
			removed++
		}
	}
	return removed
}
```

### Жадность: сортировка по началу
Сортируем по `start`. При пересечении удаляем тот отрезок, который заканчивается позже — то есть оставляем минимальный конец.

**Сложность:** время O(n log n), память O(1) дополнительно.

```go
func eraseOverlapIntervals(intervals [][]int) int {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
	removed := 0
	prevEnd := iv[0][1]
	for _, cur := range iv[1:] {
		if cur[0] < prevEnd { // пересечение
			removed++
			prevEnd = min(prevEnd, cur[1]) // оставляем тот, что кончается раньше
		} else {
			prevEnd = cur[1]
		}
	}
	return removed
}
```

---
id: meeting-rooms
title: Meeting Rooms
difficulty: Easy
category: Intervals
leetcode: 252
lists: neetcode150, blind75
algorithms: intervals, sorting-selection
order: 133
---
Дан массив интервалов встреч `intervals[i] = [start, end]`. Может ли один человек посетить все встречи? Встречи, где одна заканчивается в момент начала другой, не пересекаются.

**Примеры:** `[[0,30],[5,10],[15,20]]` → `false`; `[[7,10],[2,4]]` → `true`

**Ограничения:** `0 ≤ n ≤ 10⁴`

<details><summary>Подсказка</summary>После сортировки по началу достаточно сравнить соседние встречи.</details>

### Перебор всех пар
Две встречи пересекаются, если `a.start < b.end` и `b.start < a.end`.

**Сложность:** время O(n²), память O(1).

```go
func canAttendMeetings(intervals [][]int) bool {
	for i := 0; i < len(intervals); i++ {
		for j := i + 1; j < len(intervals); j++ {
			a, b := intervals[i], intervals[j]
			if a[0] < b[1] && b[0] < a[1] {
				return false
			}
		}
	}
	return true
}
```

### Сортировка по началу
После сортировки встреча `i` не должна начинаться раньше окончания встречи `i−1`.

**Сложность:** время O(n log n), память O(1) дополнительно.

```go
func canAttendMeetings(intervals [][]int) bool {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
	for i := 1; i < len(iv); i++ {
		if iv[i][0] < iv[i-1][1] {
			return false
		}
	}
	return true
}
```

---
id: meeting-rooms-ii
title: Meeting Rooms II
difficulty: Medium
category: Intervals
leetcode: 253
lists: neetcode150, blind75
algorithms: heap, intervals, sorting-selection
order: 134
---
Дан массив интервалов встреч. Верни минимальное число переговорных комнат, достаточное для проведения всех встреч. Встречи, касающиеся концами, комнату не делят.

**Примеры:** `[[0,30],[5,10],[15,20]]` → `2`; `[[7,10],[2,4]]` → `1`

**Ограничения:** `1 ≤ n ≤ 10⁴`

<details><summary>Подсказка</summary>Ответ — максимальное число встреч, идущих одновременно.</details>

### Мин-куча времён окончания
Сортируем встречи по началу. В куче — времена окончания занятых комнат. Если самая ранняя освободилась к началу новой встречи, переиспользуем комнату (pop). Затем кладём конец новой встречи. Размер кучи — число комнат.

**Сложность:** время O(n log n), память O(n).

```go
type IntHeap []int

func (h IntHeap) Len() int           { return len(h) }
func (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func minMeetingRooms(intervals [][]int) int {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
	h := &IntHeap{}
	for _, m := range iv {
		if h.Len() > 0 && (*h)[0] <= m[0] {
			heap.Pop(h) // комната освободилась
		}
		heap.Push(h, m[1])
	}
	return h.Len()
}
```

### Два отсортированных массива
Сортируем начала и концы независимо. Для каждого начала: если оно не раньше самого раннего неосвобождённого конца — комната переиспользуется (двигаем указатель концов), иначе нужна новая.

**Сложность:** время O(n log n), память O(n).

```go
func minMeetingRooms(intervals [][]int) int {
	n := len(intervals)
	starts, ends := make([]int, n), make([]int, n)
	for i, m := range intervals {
		starts[i], ends[i] = m[0], m[1]
	}
	sort.Ints(starts)
	sort.Ints(ends)
	rooms, j := 0, 0
	for i := 0; i < n; i++ {
		if starts[i] >= ends[j] {
			j++ // освободившуюся комнату занимает новая встреча
		} else {
			rooms++
		}
	}
	return rooms
}
```

### Sweep line по событиям
Превращаем встречи в события `(время, ±1)`: начало даёт `+1`, конец `−1`. При равном времени конец идёт раньше начала. Ответ — максимум префиксной суммы.

**Сложность:** время O(n log n), память O(n).

```go
func minMeetingRooms(intervals [][]int) int {
	type event struct{ t, d int }
	ev := make([]event, 0, 2*len(intervals))
	for _, m := range intervals {
		ev = append(ev, event{m[0], 1}, event{m[1], -1})
	}
	sort.Slice(ev, func(i, j int) bool {
		if ev[i].t != ev[j].t {
			return ev[i].t < ev[j].t
		}
		return ev[i].d < ev[j].d // -1 (конец) раньше +1 (начала)
	})
	cur, best := 0, 0
	for _, e := range ev {
		cur += e.d
		best = max(best, cur)
	}
	return best
}
```

---
id: minimum-interval-to-include-each-query
title: Minimum Interval to Include Each Query
difficulty: Hard
category: Intervals
leetcode: 1851
lists: neetcode150
algorithms: heap, intervals, sorting-selection
order: 135
---
Даны отрезки `intervals[i] = [left, right]` (размер `right − left + 1`) и запросы `queries[j]`. Для каждого запроса верни размер наименьшего отрезка, содержащего точку `queries[j]`, либо `-1`.

**Пример:** `intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]` → `[3,3,1,4]`

**Ограничения:** `1 ≤ n, q ≤ 10⁵`, значения до `10⁷`

<details><summary>Подсказка</summary>Обрабатывай запросы в порядке возрастания, добавляя отрезки в мин-кучу по размеру и выбрасывая те, что уже закончились.</details>

### Перебор для каждого запроса
Для каждого запроса просматриваем все отрезки.

**Сложность:** время O(n·q), память O(1) дополнительно.

```go
func minInterval(intervals [][]int, queries []int) []int {
	res := make([]int, len(queries))
	for qi, q := range queries {
		best := -1
		for _, iv := range intervals {
			if iv[0] <= q && q <= iv[1] {
				size := iv[1] - iv[0] + 1
				if best == -1 || size < best {
					best = size
				}
			}
		}
		res[qi] = best
	}
	return res
}
```

### Офлайн: сортировка и куча
Сортируем отрезки по началу, запросы — по значению (запоминая исходные индексы). Для запроса `q` добавляем в мин-кучу `(размер, конец)` все отрезки с `left ≤ q`, затем выбрасываем с вершины те, у которых `right < q` (для больших запросов они тоже бесполезны). Вершина кучи — ответ.

**Сложность:** время O((n + q) log(n + q)), память O(n + q).

```go
type item struct{ size, end int }
type minHeap []item

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].size < h[j].size }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func minInterval(intervals [][]int, queries []int) []int {
	iv := append([][]int(nil), intervals...)
	sort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
	idx := make([]int, len(queries))
	for i := range idx {
		idx[i] = i
	}
	sort.Slice(idx, func(a, b int) bool { return queries[idx[a]] < queries[idx[b]] })

	res := make([]int, len(queries))
	h := &minHeap{}
	i := 0
	for _, qi := range idx {
		q := queries[qi]
		for i < len(iv) && iv[i][0] <= q {
			heap.Push(h, item{iv[i][1] - iv[i][0] + 1, iv[i][1]})
			i++
		}
		for h.Len() > 0 && (*h)[0].end < q {
			heap.Pop(h) // отрезок уже закончился
		}
		if h.Len() > 0 {
			res[qi] = (*h)[0].size
		} else {
			res[qi] = -1
		}
	}
	return res
}
```
