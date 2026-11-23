---
id: linked-list
title: Связные списки
short: Узлы, связанные указателями: O(1) вставка и удаление по ссылке, разворот, dummy-узел, LRU
group: Линейные структуры
icon: →
order: 9
viz: linked-list-reverse
---
## Суть за 30 секунд

Связный список — цепочка узлов, где каждый хранит значение и указатель на следующий (`Next`), а в двусвязном — ещё и на предыдущий (`Prev`). Узлы лежат где угодно в памяти, порядок задают только указатели.

Отсюда компромисс: вставить или удалить узел, **на который уже есть ссылка**, — O(1), достаточно переставить пару указателей, ничего не сдвигая. Зато доступ к i-му элементу — O(n), и обход медленнее массива из-за промахов кеша. Аналогия — квест с записками: каждая записка говорит, где лежит следующая; вставить новую записку легко, а вот найти десятую можно только пройдя первые девять.

На собеседованиях списки проверяют аккуратность работы с указателями: разворот, слияние, удаление n-го с конца, поиск середины и цикла.

## История

- **1955–1956** — Аллен Ньюэлл, Клифф Шоу и Герберт Саймон (RAND Corporation и Технологический институт Карнеги) создали язык IPL (Information Processing Language) для программы Logic Theorist; списочные структуры с указателями были его основой.
- **1958** — Джон Маккарти разработал LISP, где вся программа и данные строятся из cons-ячеек — пар «значение + указатель на хвост».
- Дальше списки стали базовой структурой ядер ОС и аллокаторов: free list свободных блоков памяти — одно из самых ранних и долгоживущих применений.

## Как работает

**Разворот на месте** — главный приём, из которого собираются остальные:

1. `prev = nil`, `cur = head`.
2. Запоминаем `next = cur.Next` — иначе потеряем хвост.
3. Разворачиваем стрелку: `cur.Next = prev`.
4. Сдвигаемся: `prev = cur`, `cur = next`.
5. Когда `cur == nil`, новая голова — `prev`.

Каждый шаг меняет ровно одну стрелку; памяти O(1).

<div data-viz="linked-list-reverse"></div>

**Ещё три приёма, которые закрывают большинство задач:**

- **Фиктивная голова (dummy/sentinel)**: создаём узел-заглушку перед головой. Тогда удаление первого элемента или построение нового списка не требует особого случая — ответ `dummy.Next`.
- **Быстрый и медленный указатели**: `fast` шагает на 2, `slow` на 1. Когда `fast` дошёл до конца, `slow` — в середине. Та же пара находит цикл (алгоритм Флойда — отдельная статья).
- **Отставание на n**: сначала `fast` уходит на n шагов вперёд, затем оба идут вместе — когда `fast` в конце, `slow` стоит перед n-м с конца узлом.

Сложные задачи — композиции: «Reorder List» = найти середину + развернуть вторую половину + слить поочерёдно; «палиндром» = середина + разворот + сравнение; «Reverse Nodes in k-Group» = разворот отрезков с аккуратной сшивкой.

<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
<defs><marker id="ll-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs>
<text x="20" y="18" font-size="12" fill="var(--text)">узлы разбросаны по куче: каждый переход по Next — потенциальный промах кеша</text>
<text x="10" y="62" font-size="12" fill="var(--blue)">head</text>
<line x1="40" y1="58" x2="58" y2="58" stroke="var(--blue)" marker-end="url(#ll-ar)"/>
<rect x="60" y="40" width="50" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="85" y="62" text-anchor="middle" font-size="13" fill="var(--text)">1</text>
<rect x="110" y="40" width="40" height="34" fill="var(--panel2)" stroke="var(--violet)"/><text x="130" y="62" text-anchor="middle" font-size="12" fill="var(--muted)">•</text>
<text x="105" y="90" text-anchor="middle" font-size="12" fill="var(--muted)">0xc000010000</text>
<line x1="135" y1="62" x2="193" y2="112" stroke="var(--muted)" marker-end="url(#ll-ar)"/>
<rect x="195" y="100" width="50" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="220" y="122" text-anchor="middle" font-size="13" fill="var(--text)">2</text>
<rect x="245" y="100" width="40" height="34" fill="var(--panel2)" stroke="var(--violet)"/><text x="265" y="122" text-anchor="middle" font-size="12" fill="var(--muted)">•</text>
<text x="240" y="150" text-anchor="middle" font-size="12" fill="var(--muted)">0xc00001a040</text>
<line x1="270" y1="122" x2="328" y2="52" stroke="var(--muted)" marker-end="url(#ll-ar)"/>
<rect x="330" y="40" width="50" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="355" y="62" text-anchor="middle" font-size="13" fill="var(--text)">3</text>
<rect x="380" y="40" width="40" height="34" fill="var(--panel2)" stroke="var(--violet)"/><text x="400" y="62" text-anchor="middle" font-size="12" fill="var(--muted)">•</text>
<text x="375" y="90" text-anchor="middle" font-size="12" fill="var(--muted)">0xc000012080</text>
<line x1="405" y1="62" x2="463" y2="112" stroke="var(--muted)" marker-end="url(#ll-ar)"/>
<rect x="465" y="100" width="50" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="490" y="122" text-anchor="middle" font-size="13" fill="var(--text)">4</text>
<rect x="515" y="100" width="40" height="34" fill="var(--panel2)" stroke="var(--violet)"/><text x="535" y="122" text-anchor="middle" font-size="12" fill="var(--muted)">•</text>
<text x="510" y="150" text-anchor="middle" font-size="12" fill="var(--muted)">0xc0000140c0</text>
<line x1="540" y1="117" x2="580" y2="117" stroke="var(--muted)" marker-end="url(#ll-ar)"/>
<text x="586" y="122" font-size="13" fill="var(--hard)">nil</text>
<text x="20" y="196" font-size="12" fill="var(--muted)">срез — один блок:</text>
<rect x="140" y="178" width="50" height="30" fill="var(--panel2)" stroke="var(--accent)"/><text x="165" y="198" text-anchor="middle" font-size="13" fill="var(--text)">1</text>
<rect x="190" y="178" width="50" height="30" fill="var(--panel2)" stroke="var(--accent)"/><text x="215" y="198" text-anchor="middle" font-size="13" fill="var(--text)">2</text>
<rect x="240" y="178" width="50" height="30" fill="var(--panel2)" stroke="var(--accent)"/><text x="265" y="198" text-anchor="middle" font-size="13" fill="var(--text)">3</text>
<rect x="290" y="178" width="50" height="30" fill="var(--panel2)" stroke="var(--accent)"/><text x="315" y="198" text-anchor="middle" font-size="13" fill="var(--text)">4</text>
<text x="356" y="190" font-size="12" fill="var(--muted)">соседи в одной кеш-линии, предвыборка работает;</text>
<text x="356" y="206" font-size="12" fill="var(--muted)">зато вставка в середину — сдвиг O(n)</text>
</svg>

## Шаблон на Go

```go
type ListNode struct {
	Val  int
	Next *ListNode
}

// reverseList — разворот на месте, O(n) времени и O(1) памяти.
func reverseList(head *ListNode) *ListNode {
	var prev *ListNode
	for cur := head; cur != nil; {
		next := cur.Next
		cur.Next = prev
		prev, cur = cur, next
	}
	return prev
}

// mergeTwoLists — dummy-узел убирает особые случаи пустого результата.
func mergeTwoLists(a, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for a != nil && b != nil {
		if a.Val <= b.Val {
			tail.Next, a = a, a.Next
		} else {
			tail.Next, b = b, b.Next
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

// middleNode — быстрый и медленный указатели (для чётной длины — второй из средних).
func middleNode(head *ListNode) *ListNode {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow, fast = slow.Next, fast.Next.Next
	}
	return slow
}

// removeNthFromEnd — отставание на n плюс dummy (вдруг удаляем голову).
func removeNthFromEnd(head *ListNode, n int) *ListNode {
	dummy := &ListNode{Next: head}
	fast, slow := dummy, dummy
	for i := 0; i < n; i++ {
		fast = fast.Next
	}
	for fast.Next != nil {
		fast, slow = fast.Next, slow.Next
	}
	slow.Next = slow.Next.Next
	return dummy.Next
}
```

LRU-кеш — классическая связка «хеш-таблица + двусвязный список» на `container/list`:

```go
type entry struct{ key, val int }

type LRU struct {
	cap   int
	ll    *list.List            // спереди — самые свежие
	items map[int]*list.Element // ключ → узел списка
}

func NewLRU(capacity int) *LRU {
	return &LRU{cap: capacity, ll: list.New(), items: make(map[int]*list.Element)}
}

func (c *LRU) Get(key int) (int, bool) {
	e, ok := c.items[key]
	if !ok {
		return 0, false
	}
	c.ll.MoveToFront(e)
	return e.Value.(entry).val, true
}

func (c *LRU) Put(key, val int) {
	if e, ok := c.items[key]; ok {
		e.Value = entry{key, val}
		c.ll.MoveToFront(e)
		return
	}
	c.items[key] = c.ll.PushFront(entry{key, val})
	if c.ll.Len() > c.cap {
		old := c.ll.Back()
		c.ll.Remove(old)
		delete(c.items, old.Value.(entry).key)
	}
}
```

**Списки в Go.** `container/list` — двусвязный *кольцевой* список с фиктивным корневым элементом (`root`): у пустого списка `root.next == root.prev == &root`, поэтому вставка и удаление не проверяют краевые случаи. Значение хранится как `any` — нужна проверка типа `e.Value.(entry)`, и каждый элемент — отдельная аллокация. `container/ring` — кольцевой список без выделенной головы (удобен для round-robin). Внутри рантайма списки тоже есть: горутины, ожидающие на канале, стоят в очередях `recvq`/`sendq` — двусвязных списках структур `sudog`. Сборщик мусора спокойно собирает циклические структуры, так что «петля» в списке не утекает — но обход без проверки зациклится навсегда.

## Сложность

| операция | время | память |
| --- | --- | --- |
| доступ к i-му элементу / поиск по значению | O(n) | O(1) |
| вставка/удаление по известному узлу (двусвязный) | O(1) | O(1) |
| вставка в голову / в хвост (если есть указатель tail) | O(1) | O(1) |
| удаление по узлу в односвязном | O(n) — нужен предыдущий | O(1) |
| разворот, середина, слияние двух списков | O(n) | O(1) |
| LRU Get/Put (map + список) | O(1) | O(capacity) |

## Когда применять

- Задача дана **на списке**: разворот (целиком, на отрезке, группами по k), слияние, разбиение, удаление n-го с конца, сложение чисел-списков.
- Нужны частые вставки/удаления **в середине по ссылке** и порядок важен — LRU/LFU-кеш, очередь с отменой элементов.
- Нужно O(1) памяти, а массив требует копирования.
- Видите «середина», «n-й с конца», «есть ли цикл» — быстрый/медленный указатели.
- Список с дополнительным указателем (Copy List with Random Pointer) — map «старый → новый» или переплетение узлов.

Вариации: двусвязный список с sentinel, кольцевой список, skip list (многоуровневый список с поиском O(log n)), интрузивный список.

## Где применяется в реальном мире

### Бигтех
- **Linux kernel**: `struct list_head` — интрузивный двусвязный кольцевой список. Узел встраивается прямо в структуру (`task_struct`, `inode`), а макрос `container_of` по адресу узла возвращает объект. Удаление O(1) без отдельных аллокаций.
- **Redis**: sorted set (ZSET) — хеш-таблица плюс skip list (многоуровневый связный список) для диапазонных запросов; тип LIST — quicklist, связный список компактных блоков listpack.
- **LRU-кеши**: memcached ведёт двусвязные LRU-списки для вытеснения; в Go-экосистеме `groupcache/lru` и `hashicorp/golang-lru` построены на map + списке.
- **Go runtime**: очереди горутин, ждущих отправки или приёма на канале (`sendq`/`recvq`), — двусвязные списки `sudog`.

### Финтех
- **Стакан заявок**: каждый ценовой уровень — FIFO-очередь заявок (приоритет по времени), часто двусвязный список плюс map `orderID → узел`, чтобы отменить заявку из середины очереди за O(1). Распространённый дизайн матчинг-движков.
- **Блокчейн**: каждый блок содержит хеш предыдущего — список, где «указатель» — криптографический хеш. Подмена одного блока ломает все ссылки после него.
- **Журналы аудита с hash chaining**: каждая запись включает хеш предыдущей, что делает подделку истории проводок обнаружимой.

### Геймдев
- **Doom (1993)**, исходники открыты: все активные «мыслители» (двери, лифты, монстры) хранятся в двусвязном кольцевом списке с фиктивным узлом `thinkercap`, который обходится каждый тик.
- **Free list в пулах объектов**: свободные слоты пула пуль или частиц связаны индексом «следующий свободный» прямо внутри неиспользуемых элементов — выделение и освобождение за O(1) без аллокатора.
- **Контрпример — ECS и data-oriented design**: современные движки уходят от списков объектов к плотным массивам компонентов, потому что обход указателей бьёт по кешу сильнее, чем стоят сдвиги в массиве.

## Типичные ошибки

- **Потерять хвост**: переписать `cur.Next` до сохранения `next := cur.Next`.
- **Разыменование nil**: `fast.Next.Next` без проверки `fast != nil && fast.Next != nil`; в Go это паника `nil pointer dereference`.
- **Забыть dummy** и обрабатывать «удаляем голову» отдельной веткой — источник половины багов.
- **Не обнулить хвост**: после разбиения или перестановки последний узел продолжает указывать в старый список — получается цикл.
- **Сравнение значений вместо узлов**: в задачах на пересечение списков сравнивают указатели (`a == b`), а не `a.Val == b.Val`.
- **`container/list` с чужим элементом**: `Remove(e)` для элемента другого списка молча ничего не делает; а `e.Value.(T)` с неверным типом — паника.
- **Список там, где нужен срез**: для последовательного обхода и доступа по индексу срез почти всегда быстрее, даже со сдвигами.
