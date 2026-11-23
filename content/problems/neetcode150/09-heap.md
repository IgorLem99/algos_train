---
id: kth-largest-element-in-a-stream
title: Kth Largest Element in a Stream
difficulty: Easy
category: Heap / Priority Queue
leetcode: 703
lists: neetcode150
algorithms: heap
order: 64
---
Спроектируй класс `KthLargest`: конструктор принимает `k` и начальный массив `nums`; метод `Add(val)` добавляет число в поток и возвращает `k`-й по величине элемент среди всех добавленных.

**Пример:** `k = 3, nums = [4,5,8,2]`; `Add(3) → 4`, `Add(5) → 5`, `Add(10) → 5`, `Add(9) → 8`

**Ограничения:** до `10⁴` вызовов `Add`; в потоке всегда хотя бы `k` элементов в момент запроса.

<details><summary>Подсказка</summary>Держи min-heap размера k: её корень — k-й по величине элемент.</details>

### Сортировка при каждом добавлении
Храним все числа, после каждого `Add` сортируем и берём элемент с индексом `len-k`.

**Сложность:** `Add` — O(n log n), память O(n).

```go
type KthLargest struct {
	k    int
	nums []int
}

func Constructor(k int, nums []int) KthLargest {
	return KthLargest{k: k, nums: append([]int(nil), nums...)}
}

func (this *KthLargest) Add(val int) int {
	this.nums = append(this.nums, val)
	sort.Ints(this.nums)
	return this.nums[len(this.nums)-this.k]
}
```

### Min-heap размера k
В куче оставляем только `k` наибольших. Если после добавления размер больше `k`, выбрасываем минимум. Корень кучи — `k`-й по величине.

**Сложность:** `Add` — O(log k), память O(k).

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

type KthLargest struct {
	k int
	h *IntHeap
}

func Constructor(k int, nums []int) KthLargest {
	kl := KthLargest{k: k, h: &IntHeap{}}
	for _, x := range nums {
		kl.Add(x)
	}
	return kl
}

func (this *KthLargest) Add(val int) int {
	heap.Push(this.h, val)
	if this.h.Len() > this.k {
		heap.Pop(this.h)
	}
	return (*this.h)[0]
}
```

---
id: last-stone-weight
title: Last Stone Weight
difficulty: Easy
category: Heap / Priority Queue
leetcode: 1046
lists: neetcode150
algorithms: heap
order: 65
---
Даны веса камней. Каждый ход берутся два самых тяжёлых камня `x ≤ y`: если `x == y`, оба уничтожаются; иначе остаётся камень весом `y - x`. Верни вес последнего камня или `0`, если камней не осталось.

**Пример:** `stones = [2,7,4,1,8,1]` → `1`

**Ограничения:** `1 ≤ n ≤ 30`, `1 ≤ stones[i] ≤ 1000`.

<details><summary>Подсказка</summary>Нужен быстрый доступ к двум максимумам с вставкой нового значения — max-heap.</details>

### Сортировка на каждом шаге
Пока камней больше одного: сортируем, берём два последних, разбиваем и кладём остаток обратно.

**Сложность:** время O(n² log n), память O(1).

```go
func lastStoneWeight(stones []int) int {
	for len(stones) > 1 {
		sort.Ints(stones)
		n := len(stones)
		y, x := stones[n-1], stones[n-2]
		stones = stones[:n-2]
		if y != x {
			stones = append(stones, y-x)
		}
	}
	if len(stones) == 0 {
		return 0
	}
	return stones[0]
}
```

### Max-heap
Кладём все камни в max-heap. Пока в куче больше одного камня, достаём два максимума и возвращаем разность, если она не нулевая.

**Сложность:** время O(n log n), память O(n).

```go
type MaxHeap []int

func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i] > h[j] }
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MaxHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func lastStoneWeight(stones []int) int {
	h := MaxHeap(append([]int(nil), stones...))
	heap.Init(&h)
	for h.Len() > 1 {
		y := heap.Pop(&h).(int)
		x := heap.Pop(&h).(int)
		if y != x {
			heap.Push(&h, y-x)
		}
	}
	if h.Len() == 0 {
		return 0
	}
	return h[0]
}
```

---
id: k-closest-points-to-origin
title: K Closest Points to Origin
difficulty: Medium
category: Heap / Priority Queue
leetcode: 973
lists: neetcode150
algorithms: heap, sorting-selection
order: 66
---
Дан массив точек `points[i] = [x, y]` и число `k`. Верни `k` точек, ближайших к началу координат (евклидово расстояние). Порядок ответа любой.

**Пример:** `points = [[1,3],[-2,2]], k = 1` → `[[-2,2]]`

**Ограничения:** `1 ≤ k ≤ n ≤ 10⁴`, `-10⁴ ≤ x, y ≤ 10⁴`.

<details><summary>Подсказка</summary>Корень извлекать не нужно — сравнивай квадраты расстояний.</details>

### Сортировка по расстоянию
Сортируем точки по `x² + y²` и берём первые `k`.

**Сложность:** время O(n log n), память O(1) дополнительной.

```go
func kClosest(points [][]int, k int) [][]int {
	sort.Slice(points, func(i, j int) bool {
		a, b := points[i], points[j]
		return a[0]*a[0]+a[1]*a[1] < b[0]*b[0]+b[1]*b[1]
	})
	return points[:k]
}
```

### Max-heap размера k
Держим в куче `k` лучших кандидатов; корень — самый далёкий из них. Если новая точка ближе корня, заменяем его.

**Сложность:** время O(n log k), память O(k).

```go
type item struct {
	dist int
	idx  int
}

type MaxHeap []item

func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i].dist > h[j].dist }
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *MaxHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func kClosest(points [][]int, k int) [][]int {
	h := &MaxHeap{}
	for i, p := range points {
		d := p[0]*p[0] + p[1]*p[1]
		if h.Len() < k {
			heap.Push(h, item{d, i})
		} else if d < (*h)[0].dist {
			(*h)[0] = item{d, i}
			heap.Fix(h, 0)
		}
	}
	res := make([][]int, 0, k)
	for _, it := range *h {
		res = append(res, points[it.idx])
	}
	return res
}
```

### Quickselect
Разбиваем массив вокруг случайного опорного по расстоянию (как в quicksort), но продолжаем только в той части, где лежит граница `k`. Когда опорный оказался на позиции `k`, первые `k` элементов — ответ.

**Сложность:** время O(n) в среднем (O(n²) в худшем), память O(1).

```go
func kClosest(points [][]int, k int) [][]int {
	dist := func(p []int) int { return p[0]*p[0] + p[1]*p[1] }
	partition := func(l, r int) int {
		ri := l + rand.Intn(r-l+1)
		points[ri], points[r] = points[r], points[ri]
		pivot := dist(points[r])
		i := l
		for j := l; j < r; j++ {
			if dist(points[j]) < pivot {
				points[i], points[j] = points[j], points[i]
				i++
			}
		}
		points[i], points[r] = points[r], points[i]
		return i
	}

	l, r := 0, len(points)-1
	for l <= r {
		p := partition(l, r)
		if p == k {
			break
		} else if p < k {
			l = p + 1
		} else {
			r = p - 1
		}
	}
	return points[:k]
}
```

---
id: kth-largest-element-in-an-array
title: Kth Largest Element in an Array
difficulty: Medium
category: Heap / Priority Queue
leetcode: 215
lists: neetcode150
algorithms: heap, sorting-selection
order: 67
---
Дан массив `nums` и число `k`. Верни `k`-й по величине элемент (в отсортированном порядке, а не `k`-й уникальный).

**Пример:** `nums = [3,2,1,5,6,4], k = 2` → `5`; `nums = [3,2,3,1,2,4,5,5,6], k = 4` → `4`

**Ограничения:** `1 ≤ k ≤ n ≤ 10⁵`, `-10⁴ ≤ nums[i] ≤ 10⁴`.

<details><summary>Подсказка</summary>Нужен элемент на индексе n−k в отсортированном массиве — полная сортировка не обязательна.</details>

### Сортировка
Сортируем массив и берём элемент с индексом `n - k`.

**Сложность:** время O(n log n), память O(1).

```go
func findKthLargest(nums []int, k int) int {
	sort.Ints(nums)
	return nums[len(nums)-k]
}
```

### Min-heap размера k
Держим `k` наибольших элементов в min-heap; когда размер превышает `k`, выбрасываем минимум. После прохода корень — ответ.

**Сложность:** время O(n log k), память O(k).

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

func findKthLargest(nums []int, k int) int {
	h := &IntHeap{}
	for _, x := range nums {
		heap.Push(h, x)
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	return (*h)[0]
}
```

### Quickselect
Ищем элемент, который встанет на индекс `n - k` после сортировки. Разбиваем вокруг случайного опорного и продолжаем только в нужной половине.

**Сложность:** время O(n) в среднем (O(n²) в худшем случае), память O(1).

```go
func findKthLargest(nums []int, k int) int {
	target := len(nums) - k
	l, r := 0, len(nums)-1
	for {
		ri := l + rand.Intn(r-l+1)
		nums[ri], nums[r] = nums[r], nums[ri]
		pivot := nums[r]
		i := l
		for j := l; j < r; j++ {
			if nums[j] < pivot {
				nums[i], nums[j] = nums[j], nums[i]
				i++
			}
		}
		nums[i], nums[r] = nums[r], nums[i]
		switch {
		case i == target:
			return nums[i]
		case i < target:
			l = i + 1
		default:
			r = i - 1
		}
	}
}
```

---
id: task-scheduler
title: Task Scheduler
difficulty: Medium
category: Heap / Priority Queue
leetcode: 621
lists: neetcode150
algorithms: heap, greedy
order: 68
---
Дан массив задач-букв `tasks` и число `n`. Каждая задача выполняется за 1 такт, одинаковые задачи должны разделяться минимум `n` тактами простоя/других задач. Процессор может простаивать. Верни минимальное число тактов.

**Пример:** `tasks = ["A","A","A","B","B","B"], n = 2` → `8` (`A B _ A B _ A B`)

**Ограничения:** `1 ≤ |tasks| ≤ 10⁴`, буквы `A–Z`, `0 ≤ n ≤ 100`.

<details><summary>Подсказка</summary>Самая частая задача задаёт каркас расписания; остальные заполняют промежутки.</details>

### Симуляция с max-heap и очередью охлаждения
На каждом такте берём из max-heap задачу с наибольшим остатком, выполняем её; если остаток положителен, кладём в очередь охлаждения вместе со временем, когда она снова доступна. Освободившиеся задачи возвращаем в кучу. Если куча пуста, процессор простаивает (время всё равно идёт).

**Сложность:** время O(T · log 26), где T — итоговое число тактов, память O(1).

```go
type MaxHeap []int

func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i] > h[j] }
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MaxHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func leastInterval(tasks []byte, n int) int {
	var cnt [26]int
	for _, t := range tasks {
		cnt[t-'A']++
	}
	h := &MaxHeap{}
	for _, c := range cnt {
		if c > 0 {
			*h = append(*h, c)
		}
	}
	heap.Init(h)

	type cooling struct{ left, ready int }
	var queue []cooling
	time := 0
	for h.Len() > 0 || len(queue) > 0 {
		time++
		if h.Len() > 0 {
			left := heap.Pop(h).(int) - 1
			if left > 0 {
				queue = append(queue, cooling{left, time + n})
			}
		}
		if len(queue) > 0 && queue[0].ready == time {
			heap.Push(h, queue[0].left)
			queue = queue[1:]
		}
	}
	return time
}
```

### Формула через самую частую задачу
Пусть `maxF` — максимальная частота, `cntMax` — сколько задач имеют такую частоту. Каркас: `maxF - 1` блоков по `n + 1` тактов плюс последний блок из `cntMax` задач. Если задач больше, чем помещается в каркас, простоев не будет, и ответ равен `len(tasks)`.

**Сложность:** время O(T), где T = |tasks|, память O(1).

```go
func leastInterval(tasks []byte, n int) int {
	var cnt [26]int
	maxF := 0
	for _, t := range tasks {
		cnt[t-'A']++
		maxF = max(maxF, cnt[t-'A'])
	}
	cntMax := 0
	for _, c := range cnt {
		if c == maxF {
			cntMax++
		}
	}
	return max(len(tasks), (maxF-1)*(n+1)+cntMax)
}
```

---
id: design-twitter
title: Design Twitter
difficulty: Medium
category: Heap / Priority Queue
leetcode: 355
lists: neetcode150
algorithms: heap
order: 69
---
Спроектируй упрощённый Twitter: `PostTweet(userId, tweetId)`, `GetNewsFeed(userId)` — до 10 самых свежих твитов самого пользователя и тех, на кого он подписан (от новых к старым), `Follow(followerId, followeeId)`, `Unfollow(followerId, followeeId)`.

**Пример:** `PostTweet(1,5); GetNewsFeed(1) → [5]; Follow(1,2); PostTweet(2,6); GetNewsFeed(1) → [6,5]; Unfollow(1,2); GetNewsFeed(1) → [5]`

**Ограничения:** `1 ≤ userId, followerId, followeeId ≤ 500`, `0 ≤ tweetId ≤ 10⁴`, до `3·10⁴` вызовов.

<details><summary>Подсказка</summary>Лента — это слияние нескольких уже отсортированных по времени списков твитов; для слияния подходит куча.</details>

### Общий список твитов и фильтр
Все твиты лежат в одном срезе в порядке публикации. Для ленты идём с конца и берём твиты автора или его подписок, пока не наберём 10.

**Сложность:** `GetNewsFeed` — O(T) в худшем случае, где T — число всех твитов; остальные операции O(1).

```go
type tweet struct {
	user, id int
}

type Twitter struct {
	tweets  []tweet
	follows map[int]map[int]bool
}

func Constructor() Twitter {
	return Twitter{follows: map[int]map[int]bool{}}
}

func (this *Twitter) PostTweet(userId int, tweetId int) {
	this.tweets = append(this.tweets, tweet{userId, tweetId})
}

func (this *Twitter) GetNewsFeed(userId int) []int {
	res := []int{}
	for i := len(this.tweets) - 1; i >= 0 && len(res) < 10; i-- {
		t := this.tweets[i]
		if t.user == userId || this.follows[userId][t.user] {
			res = append(res, t.id)
		}
	}
	return res
}

func (this *Twitter) Follow(followerId int, followeeId int) {
	if this.follows[followerId] == nil {
		this.follows[followerId] = map[int]bool{}
	}
	this.follows[followerId][followeeId] = true
}

func (this *Twitter) Unfollow(followerId int, followeeId int) {
	delete(this.follows[followerId], followeeId)
}
```

### Твиты по пользователям и слияние через max-heap
У каждого пользователя свой список твитов с глобальным временем. Для ленты кладём в max-heap по времени последний твит каждого из интересующих авторов (сам пользователь и подписки), затем 10 раз достаём самый свежий и добавляем предыдущий твит того же автора.

**Сложность:** `GetNewsFeed` — O(F + 10·log F), где F — число подписок; остальные операции O(1).

```go
type tweet struct {
	time, id int
}

type entry struct {
	t     tweet
	user  int
	index int // позиция твита в списке автора
}

type MaxHeap []entry

func (h MaxHeap) Len() int           { return len(h) }
func (h MaxHeap) Less(i, j int) bool { return h[i].t.time > h[j].t.time }
func (h MaxHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x any)        { *h = append(*h, x.(entry)) }
func (h *MaxHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

type Twitter struct {
	clock   int
	tweets  map[int][]tweet
	follows map[int]map[int]bool
}

func Constructor() Twitter {
	return Twitter{
		tweets:  map[int][]tweet{},
		follows: map[int]map[int]bool{},
	}
}

func (this *Twitter) PostTweet(userId int, tweetId int) {
	this.clock++
	this.tweets[userId] = append(this.tweets[userId], tweet{this.clock, tweetId})
}

func (this *Twitter) GetNewsFeed(userId int) []int {
	h := &MaxHeap{}
	push := func(u int) {
		if list := this.tweets[u]; len(list) > 0 {
			last := len(list) - 1
			*h = append(*h, entry{list[last], u, last})
		}
	}
	push(userId)
	for f := range this.follows[userId] {
		if f != userId {
			push(f)
		}
	}
	heap.Init(h)

	res := []int{}
	for h.Len() > 0 && len(res) < 10 {
		e := heap.Pop(h).(entry)
		res = append(res, e.t.id)
		if e.index > 0 {
			list := this.tweets[e.user]
			heap.Push(h, entry{list[e.index-1], e.user, e.index - 1})
		}
	}
	return res
}

func (this *Twitter) Follow(followerId int, followeeId int) {
	if this.follows[followerId] == nil {
		this.follows[followerId] = map[int]bool{}
	}
	this.follows[followerId][followeeId] = true
}

func (this *Twitter) Unfollow(followerId int, followeeId int) {
	delete(this.follows[followerId], followeeId)
}
```

---
id: find-median-from-data-stream
title: Find Median from Data Stream
difficulty: Hard
category: Heap / Priority Queue
leetcode: 295
lists: neetcode150, blind75
algorithms: heap
order: 70
---
Реализуй `MedianFinder`: `AddNum(num)` добавляет число в поток, `FindMedian()` возвращает медиану текущих чисел (для чётного количества — среднее двух центральных).

**Пример:** `AddNum(1); AddNum(2); FindMedian() → 1.5; AddNum(3); FindMedian() → 2.0`

**Ограничения:** `-10⁵ ≤ num ≤ 10⁵`, до `5·10⁴` вызовов, `FindMedian` вызывается при непустом потоке.

<details><summary>Подсказка</summary>Раздели числа на нижнюю и верхнюю половины: max-heap для нижней и min-heap для верхней; медиана — на их вершинах.</details>

### Отсортированный срез со вставкой
Храним числа в отсортированном срезе. `AddNum` находит позицию бинарным поиском и вставляет со сдвигом, `FindMedian` берёт центральные элементы за O(1).

**Сложность:** `AddNum` — O(n), `FindMedian` — O(1), память O(n).

```go
type MedianFinder struct {
	nums []int
}

func Constructor() MedianFinder {
	return MedianFinder{}
}

func (this *MedianFinder) AddNum(num int) {
	i := sort.SearchInts(this.nums, num)
	this.nums = append(this.nums, 0)
	copy(this.nums[i+1:], this.nums[i:])
	this.nums[i] = num
}

func (this *MedianFinder) FindMedian() float64 {
	n := len(this.nums)
	if n%2 == 1 {
		return float64(this.nums[n/2])
	}
	return float64(this.nums[n/2-1]+this.nums[n/2]) / 2.0
}
```

### Две кучи
Нижняя половина лежит в max-heap `lo` (храним отрицательные числа в min-heap), верхняя — в min-heap `hi`. Инвариант: `len(lo) == len(hi)` или `len(lo) == len(hi) + 1`. Новое число сначала идёт в `lo`, максимум `lo` переносится в `hi`, и при перекосе баланс восстанавливается обратно.

**Сложность:** `AddNum` — O(log n), `FindMedian` — O(1), память O(n).

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

type MedianFinder struct {
	lo *IntHeap // max-heap нижней половины (значения с минусом)
	hi *IntHeap // min-heap верхней половины
}

func Constructor() MedianFinder {
	return MedianFinder{lo: &IntHeap{}, hi: &IntHeap{}}
}

func (this *MedianFinder) AddNum(num int) {
	heap.Push(this.lo, -num)
	heap.Push(this.hi, -heap.Pop(this.lo).(int))
	if this.hi.Len() > this.lo.Len() {
		heap.Push(this.lo, -heap.Pop(this.hi).(int))
	}
}

func (this *MedianFinder) FindMedian() float64 {
	if this.lo.Len() > this.hi.Len() {
		return float64(-(*this.lo)[0])
	}
	return float64(-(*this.lo)[0]+(*this.hi)[0]) / 2.0
}
```
