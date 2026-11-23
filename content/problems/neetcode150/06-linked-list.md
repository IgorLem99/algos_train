---
id: reverse-linked-list
title: Reverse Linked List
difficulty: Easy
category: Linked List
leetcode: 206
lists: neetcode150, blind75
algorithms: linked-list
order: 35
---
Разверни односвязный список и верни новую голову.

**Пример:** `[1,2,3,4,5]` → `[5,4,3,2,1]`

**Ограничения:** `0 ≤ n ≤ 5000`

<details><summary>Подсказка</summary>Меняй направление каждой ссылки, запоминая следующий узел до переписывания.</details>

### Итеративно
Идём по списку, храня `prev`. Для каждого узла запоминаем `Next`, перенаправляем его на `prev` и сдвигаемся вперёд.

**Сложность:** время O(n), память O(1).

```go
func reverseList(head *ListNode) *ListNode {
	var prev *ListNode
	for head != nil {
		next := head.Next
		head.Next = prev
		prev = head
		head = next
	}
	return prev
}
```

### Рекурсивно
Разворачиваем хвост рекурсивно, затем делаем так, чтобы следующий за `head` узел указывал на `head`, а `head.Next` обнуляем. Новая голова — та же, что вернул рекурсивный вызов.

**Сложность:** время O(n), память O(n) на стек вызовов.

```go
func reverseList(head *ListNode) *ListNode {
	if head == nil || head.Next == nil {
		return head
	}
	newHead := reverseList(head.Next)
	head.Next.Next = head
	head.Next = nil
	return newHead
}
```

---
id: merge-two-sorted-lists
title: Merge Two Sorted Lists
difficulty: Easy
category: Linked List
leetcode: 21
lists: neetcode150, blind75
algorithms: linked-list, two-pointers
order: 36
---
Даны головы двух отсортированных списков. Слей их в один отсортированный список из существующих узлов.

**Пример:** `[1,2,4]` и `[1,3,4]` → `[1,1,2,3,4,4]`

**Ограничения:** длина каждого списка от 0 до 50.

<details><summary>Подсказка</summary>Фиктивная голова (dummy) избавляет от особых случаев с пустым результатом.</details>

### Итеративно с dummy
Двумя указателями выбираем меньший из текущих узлов и присоединяем к хвосту результата. В конце присоединяем остаток непустого списка.

**Сложность:** время O(n+m), память O(1).

```go
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for list1 != nil && list2 != nil {
		if list1.Val <= list2.Val {
			tail.Next = list1
			list1 = list1.Next
		} else {
			tail.Next = list2
			list2 = list2.Next
		}
		tail = tail.Next
	}
	if list1 != nil {
		tail.Next = list1
	} else {
		tail.Next = list2
	}
	return dummy.Next
}
```

### Рекурсивно
Меньшая голова становится головой результата, а её `Next` — результат слияния остатка с другим списком.

**Сложность:** время O(n+m), память O(n+m) на стек.

```go
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
	if list1 == nil {
		return list2
	}
	if list2 == nil {
		return list1
	}
	if list1.Val <= list2.Val {
		list1.Next = mergeTwoLists(list1.Next, list2)
		return list1
	}
	list2.Next = mergeTwoLists(list1, list2.Next)
	return list2
}
```

---
id: linked-list-cycle
title: Linked List Cycle
difficulty: Easy
category: Linked List
leetcode: 141
lists: neetcode150, blind75
algorithms: floyd-cycle, linked-list
order: 37
---
Определи, есть ли в односвязном списке цикл.

**Пример:** `[3,2,0,-4]`, хвост ведёт на индекс 1 → `true`; `[1]` без цикла → `false`

**Ограничения:** `0 ≤ n ≤ 10⁴`. Попробуй решить за O(1) памяти.

<details><summary>Подсказка</summary>Два указателя с разной скоростью обязательно встретятся внутри цикла.</details>

### Множество посещённых узлов
Запоминаем указатели на пройденные узлы; повторная встреча означает цикл.

**Сложность:** время O(n), память O(n).

```go
func hasCycle(head *ListNode) bool {
	seen := make(map[*ListNode]struct{})
	for head != nil {
		if _, ok := seen[head]; ok {
			return true
		}
		seen[head] = struct{}{}
		head = head.Next
	}
	return false
}
```

### Быстрый и медленный указатели (Floyd)
`slow` делает шаг, `fast` — два. Если цикла нет, `fast` дойдёт до `nil`; если есть, `fast` догонит `slow` внутри цикла.

**Сложность:** время O(n), память O(1).

```go
func hasCycle(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			return true
		}
	}
	return false
}
```

---
id: reorder-list
title: Reorder List
difficulty: Medium
category: Linked List
leetcode: 143
lists: neetcode150, blind75
algorithms: linked-list, two-pointers
order: 38
---
Переставь узлы списка `L0 → L1 → … → Ln` в порядок `L0 → Ln → L1 → Ln-1 → L2 → …` на месте (значения менять нельзя).

**Пример:** `[1,2,3,4]` → `[1,4,2,3]`; `[1,2,3,4,5]` → `[1,5,2,4,3]`

**Ограничения:** `1 ≤ n ≤ 5·10⁴`

<details><summary>Подсказка</summary>Найди середину, разверни вторую половину и чередуй узлы двух половин.</details>

### Массив узлов
Складываем узлы в срез и двумя индексами с концов связываем их в нужном порядке.

**Сложность:** время O(n), память O(n).

```go
func reorderList(head *ListNode) {
	var nodes []*ListNode
	for cur := head; cur != nil; cur = cur.Next {
		nodes = append(nodes, cur)
	}
	i, j := 0, len(nodes)-1
	for i < j {
		nodes[i].Next = nodes[j]
		i++
		if i == j {
			break
		}
		nodes[j].Next = nodes[i]
		j--
	}
	nodes[i].Next = nil // новый хвост
}
```

### Середина + разворот + слияние
Медленным/быстрым указателями находим середину, отрезаем вторую половину и разворачиваем её. Затем чередуем узлы первой половины и развёрнутой второй.

**Сложность:** время O(n), память O(1).

```go
func reorderList(head *ListNode) {
	if head == nil || head.Next == nil {
		return
	}
	slow, fast := head, head
	for fast.Next != nil && fast.Next.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	// разворачиваем вторую половину
	var prev *ListNode
	cur := slow.Next
	slow.Next = nil
	for cur != nil {
		next := cur.Next
		cur.Next = prev
		prev = cur
		cur = next
	}
	// чередуем
	first, second := head, prev
	for second != nil {
		n1, n2 := first.Next, second.Next
		first.Next = second
		second.Next = n1
		first, second = n1, n2
	}
}
```

---
id: remove-nth-node-from-end-of-list
title: Remove Nth Node From End of List
difficulty: Medium
category: Linked List
leetcode: 19
lists: neetcode150, blind75
algorithms: linked-list, two-pointers
order: 39
---
Удали `n`-й с конца узел списка и верни голову.

**Пример:** `head = [1,2,3,4,5], n = 2` → `[1,2,3,5]`

**Ограничения:** `1 ≤ size ≤ 30`, `1 ≤ n ≤ size`

<details><summary>Подсказка</summary>Если один указатель опережает другой на `n` шагов, то когда первый дойдёт до конца, второй окажется перед удаляемым узлом.</details>

### Два прохода
Считаем длину `L`, затем идём `L − n` шагов от dummy и удаляем следующий узел.

**Сложность:** время O(L), память O(1).

```go
func removeNthFromEnd(head *ListNode, n int) *ListNode {
	length := 0
	for cur := head; cur != nil; cur = cur.Next {
		length++
	}
	dummy := &ListNode{Next: head}
	prev := dummy
	for i := 0; i < length-n; i++ {
		prev = prev.Next
	}
	prev.Next = prev.Next.Next
	return dummy.Next
}
```

### Один проход с двумя указателями
Сдвигаем `fast` на `n` шагов от dummy, затем двигаем оба до тех пор, пока `fast.Next` не станет `nil`. Тогда `slow.Next` — удаляемый узел. Dummy нужен на случай удаления головы.

**Сложность:** время O(L), память O(1).

```go
func removeNthFromEnd(head *ListNode, n int) *ListNode {
	dummy := &ListNode{Next: head}
	slow, fast := dummy, dummy
	for i := 0; i < n; i++ {
		fast = fast.Next
	}
	for fast.Next != nil {
		slow = slow.Next
		fast = fast.Next
	}
	slow.Next = slow.Next.Next
	return dummy.Next
}
```

---
id: copy-list-with-random-pointer
title: Copy List with Random Pointer
difficulty: Medium
category: Linked List
leetcode: 138
lists: neetcode150
algorithms: linked-list, hashing
order: 40
---
У каждого узла списка есть `Next` и `Random` (указывает на любой узел или `nil`). Сделай глубокую копию списка.

**Пример:** `[[7,nil],[13,0],[11,4],[10,2],[1,0]]` (значение, индекс random) → копия с той же структурой из новых узлов.

**Ограничения:** `0 ≤ n ≤ 1000`

<details><summary>Подсказка</summary>Нужно соответствие «старый узел → новый узел», чтобы расставить `Random`.</details>

### Хеш-таблица соответствий
Первый проход создаёт копию каждого узла и запоминает `old → new`. Второй проход расставляет `Next` и `Random` через таблицу.

**Сложность:** время O(n), память O(n).

```go
type Node struct {
	Val    int
	Next   *Node
	Random *Node
}

func copyRandomList(head *Node) *Node {
	if head == nil {
		return nil
	}
	copies := make(map[*Node]*Node)
	for cur := head; cur != nil; cur = cur.Next {
		copies[cur] = &Node{Val: cur.Val}
	}
	for cur := head; cur != nil; cur = cur.Next {
		copies[cur].Next = copies[cur.Next] // nil → nil, если ключа нет
		copies[cur].Random = copies[cur.Random]
	}
	return copies[head]
}
```

### Вплетение копий в список (O(1) памяти)
Вставляем копию сразу после каждого оригинала: `A → A' → B → B'`. Тогда копия `Random` — это `cur.Random.Next`. Затем распутываем два списка, восстанавливая оригинал.

**Сложность:** время O(n), память O(1) (не считая самой копии).

```go
type Node struct {
	Val    int
	Next   *Node
	Random *Node
}

func copyRandomList(head *Node) *Node {
	if head == nil {
		return nil
	}
	// 1. A -> A' -> B -> B'
	for cur := head; cur != nil; cur = cur.Next.Next {
		cur.Next = &Node{Val: cur.Val, Next: cur.Next}
	}
	// 2. Random копии = копия Random оригинала
	for cur := head; cur != nil; cur = cur.Next.Next {
		if cur.Random != nil {
			cur.Next.Random = cur.Random.Next
		}
	}
	// 3. разделяем списки
	dummy := &Node{}
	tail := dummy
	for cur := head; cur != nil; cur = cur.Next {
		cp := cur.Next
		tail.Next = cp
		tail = cp
		cur.Next = cp.Next
	}
	return dummy.Next
}
```

---
id: add-two-numbers
title: Add Two Numbers
difficulty: Medium
category: Linked List
leetcode: 2
lists: neetcode150
algorithms: linked-list
order: 41
---
Два неотрицательных числа записаны списками цифр в обратном порядке (младший разряд первым). Верни их сумму в таком же виде.

**Пример:** `[2,4,3] + [5,6,4]` → `[7,0,8]` (342 + 465 = 807)

**Ограничения:** длина `1…100`, цифры `0…9`, без ведущих нулей (кроме самого 0).

<details><summary>Подсказка</summary>Это сложение в столбик: цифра суммы плюс перенос.</details>

### Итеративно с переносом
Идём по обоим спискам, суммируем цифры и перенос `carry`. Цикл продолжается, пока есть хоть один узел или перенос.

**Сложность:** время O(max(n, m)), память O(1) (не считая результата).

```go
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	carry := 0
	for l1 != nil || l2 != nil || carry > 0 {
		sum := carry
		if l1 != nil {
			sum += l1.Val
			l1 = l1.Next
		}
		if l2 != nil {
			sum += l2.Val
			l2 = l2.Next
		}
		tail.Next = &ListNode{Val: sum % 10}
		tail = tail.Next
		carry = sum / 10
	}
	return dummy.Next
}
```

### Рекурсивно
Функция принимает оба списка и перенос, создаёт узел с цифрой текущего разряда и рекурсивно строит остаток. Базовый случай — оба списка исчерпаны и переноса нет.

**Сложность:** время O(max(n, m)), память O(max(n, m)) на стек.

```go
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
	var add func(a, b *ListNode, carry int) *ListNode
	add = func(a, b *ListNode, carry int) *ListNode {
		if a == nil && b == nil && carry == 0 {
			return nil
		}
		sum := carry
		var na, nb *ListNode
		if a != nil {
			sum += a.Val
			na = a.Next
		}
		if b != nil {
			sum += b.Val
			nb = b.Next
		}
		return &ListNode{Val: sum % 10, Next: add(na, nb, sum/10)}
	}
	return add(l1, l2, 0)
}
```

---
id: find-the-duplicate-number
title: Find the Duplicate Number
difficulty: Medium
category: Linked List
leetcode: 287
lists: neetcode150
algorithms: floyd-cycle, binary-search
order: 42
---
Массив `nums` из `n+1` целых чисел в диапазоне `[1, n]` содержит ровно одно повторяющееся число (оно может встречаться несколько раз). Найди его, не изменяя массив и используя O(1) памяти.

**Пример:** `[1,3,4,2,2]` → `2`; `[3,1,3,4,2]` → `3`

**Ограничения:** `1 ≤ n ≤ 10⁵`

<details><summary>Подсказка</summary>Считай `i → nums[i]` рёбрами графа: из-за дубликата возникает цикл, а его вход и есть ответ.</details>

### Множество
Запоминаем встреченные числа; первое повторное — ответ. Не удовлетворяет требованию O(1) памяти, но самое простое.

**Сложность:** время O(n), память O(n).

```go
func findDuplicate(nums []int) int {
	seen := make(map[int]struct{}, len(nums))
	for _, v := range nums {
		if _, ok := seen[v]; ok {
			return v
		}
		seen[v] = struct{}{}
	}
	return -1
}
```

### Бинарный поиск по значению
По принципу Дирихле: если чисел `≤ mid` больше, чем `mid`, то дубликат лежит в `[1, mid]`, иначе в `[mid+1, n]`. Каждый шаг считает количество за один проход.

**Сложность:** время O(n log n), память O(1).

```go
func findDuplicate(nums []int) int {
	lo, hi := 1, len(nums)-1
	for lo < hi {
		mid := lo + (hi-lo)/2
		cnt := 0
		for _, v := range nums {
			if v <= mid {
				cnt++
			}
		}
		if cnt > mid {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}
```

### Алгоритм Floyd (цикл в функциональном графе)
Индекс `i` ведёт в `nums[i]`; вход в цикл — как раз дубликат (в него ведут две стрелки). Сначала находим точку встречи медленного и быстрого указателей, потом запускаем второй медленный указатель с начала: они встретятся во входе цикла.

**Сложность:** время O(n), память O(1).

```go
func findDuplicate(nums []int) int {
	slow, fast := nums[0], nums[nums[0]]
	for slow != fast {
		slow = nums[slow]
		fast = nums[nums[fast]]
	}
	slow = 0
	for slow != fast {
		slow = nums[slow]
		fast = nums[fast]
	}
	return slow
}
```

---
id: lru-cache
title: LRU Cache
difficulty: Medium
category: Linked List
leetcode: 146
lists: neetcode150
algorithms: linked-list, hashing
order: 43
---
Спроектируй LRU-кэш ёмкости `capacity`: `get(key)` возвращает значение или `-1`, `put(key, value)` вставляет/обновляет, при переполнении вытесняет наименее недавно использованный ключ. Обе операции — O(1).

**Пример:** `cap=2: put(1,1); put(2,2); get(1)→1; put(3,3) (вытесняет 2); get(2)→-1`

**Ограничения:** `1 ≤ capacity ≤ 3000`, до `2·10⁵` вызовов.

<details><summary>Подсказка</summary>Хеш-таблица даёт доступ по ключу, двусвязный список — порядок использования и удаление узла за O(1).</details>

### Хеш-таблица + container/list
Список хранит записи от самой свежей (в голове) к самой старой (в хвосте). Хеш-таблица хранит `key → *list.Element`. При `get`/`put` перемещаем элемент в начало; при переполнении удаляем хвост.

**Сложность:** время O(1) на операцию, память O(capacity).

```go
type entry struct {
	key, val int
}

type LRUCache struct {
	cap   int
	ll    *list.List
	items map[int]*list.Element
}

func Constructor(capacity int) LRUCache {
	return LRUCache{cap: capacity, ll: list.New(), items: make(map[int]*list.Element)}
}

func (this *LRUCache) Get(key int) int {
	el, ok := this.items[key]
	if !ok {
		return -1
	}
	this.ll.MoveToFront(el)
	return el.Value.(*entry).val
}

func (this *LRUCache) Put(key int, value int) {
	if el, ok := this.items[key]; ok {
		el.Value.(*entry).val = value
		this.ll.MoveToFront(el)
		return
	}
	if this.ll.Len() == this.cap {
		last := this.ll.Back()
		delete(this.items, last.Value.(*entry).key)
		this.ll.Remove(last)
	}
	this.items[key] = this.ll.PushFront(&entry{key, value})
}
```

### Собственный двусвязный список с sentinel-узлами
То же без стандартной библиотеки: фиктивные `head` и `tail` убирают проверки на `nil`. Самый свежий узел — сразу после `head`, вытесняемый — перед `tail`.

**Сложность:** время O(1) на операцию, память O(capacity).

```go
type node struct {
	key, val   int
	prev, next *node
}

type LRUCache struct {
	cap        int
	items      map[int]*node
	head, tail *node // фиктивные границы
}

func Constructor(capacity int) LRUCache {
	head, tail := &node{}, &node{}
	head.next = tail
	tail.prev = head
	return LRUCache{cap: capacity, items: make(map[int]*node), head: head, tail: tail}
}

func (this *LRUCache) remove(n *node) {
	n.prev.next = n.next
	n.next.prev = n.prev
}

func (this *LRUCache) pushFront(n *node) {
	n.next = this.head.next
	n.prev = this.head
	this.head.next.prev = n
	this.head.next = n
}

func (this *LRUCache) Get(key int) int {
	n, ok := this.items[key]
	if !ok {
		return -1
	}
	this.remove(n)
	this.pushFront(n)
	return n.val
}

func (this *LRUCache) Put(key int, value int) {
	if n, ok := this.items[key]; ok {
		n.val = value
		this.remove(n)
		this.pushFront(n)
		return
	}
	if len(this.items) == this.cap {
		lru := this.tail.prev
		this.remove(lru)
		delete(this.items, lru.key)
	}
	n := &node{key: key, val: value}
	this.items[key] = n
	this.pushFront(n)
}
```

---
id: merge-k-sorted-lists
title: Merge k Sorted Lists
difficulty: Hard
category: Linked List
leetcode: 23
lists: neetcode150, blind75
algorithms: heap, linked-list
order: 44
---
Дан массив из `k` отсортированных связных списков. Слей их в один отсортированный список.

**Пример:** `[[1,4,5],[1,3,4],[2,6]]` → `[1,1,2,3,4,4,5,6]`

**Ограничения:** `0 ≤ k ≤ 10⁴`, суммарное число узлов `N ≤ 10⁴`.

<details><summary>Подсказка</summary>Минимальный из голов всех списков можно быстро доставать из кучи или сливать списки парами, как в merge sort.</details>

### Последовательное слияние
Сливаем результат по очереди с каждым следующим списком, используя слияние двух списков. Первые списки участвуют в слиянии много раз.

**Сложность:** время O(k·N), память O(1).

```go
func mergeKLists(lists []*ListNode) *ListNode {
	var res *ListNode
	for _, l := range lists {
		res = mergeTwo(res, l)
	}
	return res
}

func mergeTwo(a, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for a != nil && b != nil {
		if a.Val <= b.Val {
			tail.Next = a
			a = a.Next
		} else {
			tail.Next = b
			b = b.Next
		}
		tail = tail.Next
	}
	if a != nil {
		tail.Next = a
	} else {
		tail.Next = b
	}
	return dummy.Next
}
```

### Мин-куча
В куче лежат текущие головы всех списков. Достаём минимальную, присоединяем к результату, а её следующий узел кладём в кучу.

**Сложность:** время O(N log k), память O(k).

```go
type nodeHeap []*ListNode

func (h nodeHeap) Len() int           { return len(h) }
func (h nodeHeap) Less(i, j int) bool { return h[i].Val < h[j].Val }
func (h nodeHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *nodeHeap) Push(x any)        { *h = append(*h, x.(*ListNode)) }
func (h *nodeHeap) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func mergeKLists(lists []*ListNode) *ListNode {
	h := &nodeHeap{}
	for _, l := range lists {
		if l != nil {
			*h = append(*h, l)
		}
	}
	heap.Init(h)
	dummy := &ListNode{}
	tail := dummy
	for h.Len() > 0 {
		n := heap.Pop(h).(*ListNode)
		tail.Next = n
		tail = n
		if n.Next != nil {
			heap.Push(h, n.Next)
		}
	}
	return dummy.Next
}
```

### Разделяй и властвуй
Сливаем списки попарно за раунд: `k → k/2 → … → 1`. Каждый узел участвует в `log k` слияниях.

**Сложность:** время O(N log k), память O(1) (без учёта среза списков).

```go
func mergeKLists(lists []*ListNode) *ListNode {
	if len(lists) == 0 {
		return nil
	}
	for len(lists) > 1 {
		var merged []*ListNode
		for i := 0; i < len(lists); i += 2 {
			if i+1 < len(lists) {
				merged = append(merged, mergeTwo(lists[i], lists[i+1]))
			} else {
				merged = append(merged, lists[i])
			}
		}
		lists = merged
	}
	return lists[0]
}

func mergeTwo(a, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for a != nil && b != nil {
		if a.Val <= b.Val {
			tail.Next = a
			a = a.Next
		} else {
			tail.Next = b
			b = b.Next
		}
		tail = tail.Next
	}
	if a != nil {
		tail.Next = a
	} else {
		tail.Next = b
	}
	return dummy.Next
}
```

---
id: reverse-nodes-in-k-group
title: Reverse Nodes in k-Group
difficulty: Hard
category: Linked List
leetcode: 25
lists: neetcode150
algorithms: linked-list
order: 45
---
Разверни узлы списка группами по `k`. Если в конце осталось меньше `k` узлов, оставь их как есть. Менять значения нельзя — только ссылки.

**Пример:** `[1,2,3,4,5], k = 2` → `[2,1,4,3,5]`; `k = 3` → `[3,2,1,4,5]`

**Ограничения:** `1 ≤ k ≤ n ≤ 5000`

<details><summary>Подсказка</summary>Перед разворотом группы проверь, что в ней действительно `k` узлов, и не забудь связать её с предыдущей и следующей группами.</details>

### Итеративно
`groupPrev` — узел перед текущей группой. Находим `kth` — последний узел группы (если его нет, заканчиваем). Разворачиваем группу так, чтобы её хвост указывал на `groupNext`, затем связываем `groupPrev → kth`, а новым `groupPrev` становится старая первая вершина группы (теперь хвост).

**Сложность:** время O(n), память O(1).

```go
func reverseKGroup(head *ListNode, k int) *ListNode {
	dummy := &ListNode{Next: head}
	groupPrev := dummy
	for {
		kth := groupPrev
		for i := 0; i < k && kth != nil; i++ {
			kth = kth.Next
		}
		if kth == nil {
			break // осталось меньше k узлов
		}
		groupNext := kth.Next
		prev, cur := groupNext, groupPrev.Next
		for cur != groupNext {
			next := cur.Next
			cur.Next = prev
			prev = cur
			cur = next
		}
		tail := groupPrev.Next // бывшая первая вершина — теперь хвост группы
		groupPrev.Next = kth
		groupPrev = tail
	}
	return dummy.Next
}
```

### Рекурсивно
Проверяем, что впереди есть `k` узлов. Если да — рекурсивно обрабатываем остаток, а затем разворачиваем текущие `k` узлов так, чтобы хвост группы указывал на результат для остатка.

**Сложность:** время O(n), память O(n/k) на стек.

```go
func reverseKGroup(head *ListNode, k int) *ListNode {
	cur := head
	for i := 0; i < k; i++ {
		if cur == nil {
			return head // меньше k узлов — не трогаем
		}
		cur = cur.Next
	}
	// cur — начало остатка
	prev := reverseKGroup(cur, k)
	for i := 0; i < k; i++ {
		next := head.Next
		head.Next = prev
		prev = head
		head = next
	}
	return prev
}
```
