---
id: hashing
title: Хеш-таблицы
short: Поиск, вставка и удаление по ключу в среднем за O(1) — то, что стоит за map в Go
group: Основы и массивы
icon: #
order: 1
viz: hash-buckets, two-sum-map
---
## Суть за 30 секунд

Хеш-таблица превращает ключ в номер ячейки массива с помощью хеш-функции, поэтому значение находится без перебора — в среднем за O(1). Аналогия — гардероб: по номерку сразу идёшь к нужному крючку, а не перебираешь все пальто. Платим за это дополнительной памятью и потерей порядка: ключи лежат «вперемешку».

На собеседовании это главный способ превратить O(n²) в O(n): «видел ли я это раньше?», «сколько раз встречалось?», «где индекс парного элемента?».

## История

- **1953** — Ханс Петер Лун (Hans Peter Luhn, IBM) во внутреннем меморандуме предложил раскладывать записи по «корзинам» по значению функции от ключа и связывать коллизии в цепочки. Примерно тогда же в IBM Джин Амдал, Элейн Макгроу и Артур Сэмюэл применили *открытую адресацию* с линейным пробированием (так описывает историю Кнут в TAOCP, том 3).
- **1956** — Арнольд Дьюми (Arnold Dumey) первым описал идею в открытой печати, включая деление по модулю простого числа.
- **1960-е** — термин «hashing» закрепился в литературе; Кнут в 1963 году проанализировал линейное пробирование.
- **2017–2025** — Google представила SwissTable (библиотека Abseil): открытая адресация с метаданными, которые сравниваются пачкой SIMD-инструкций. Эту схему взял Go 1.24 для встроенного `map`.

## Как работает

1. **Хеш-функция** превращает ключ в большое число: `hash("bob") = 0x…3A`. Одинаковые ключи всегда дают одинаковый хеш, разные — «случайно разбросанный».
2. **Индекс корзины** = `hash mod M`. Если M — степень двойки, это просто `hash & (M−1)`.
3. **Коллизии** неизбежны (ключей больше, чем корзин). Два классических решения: *цепочки* (separate chaining) — в корзине лежит список элементов; *открытая адресация* — при занятой ячейке пробуем следующую по правилу (линейно, квадратично, двойным хешированием).
4. **Коэффициент заполнения** α = n / M. Пока α ограничен константой, цепочки короткие и операции — O(1) в среднем. Когда α превышает порог, таблицу увеличивают вдвое и **перехешируют** все ключи. Рост в 2 раза делает стоимость вставки O(1) *амортизированно*.

В визуализации hash(x) = x и M = 5: ключи 17, 42, 12 и 47 попадают в корзину 2 — это коллизии, цепочка растёт.

<div data-viz="hash-buckets"></div>

Типичное применение на собеседовании — Two Sum: для каждого `x` спрашиваем у map, встречалось ли `target − x`.

<div data-viz="two-sum-map"></div>

<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
<defs><marker id="hs-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs>
<rect x="10" y="14" width="96" height="32" rx="6" fill="var(--panel2)" stroke="var(--line)"/>
<text x="58" y="35" text-anchor="middle" font-size="13" fill="var(--text)">key "bob"</text>
<line x1="106" y1="30" x2="134" y2="30" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<rect x="136" y="14" width="124" height="32" rx="6" fill="var(--panel2)" stroke="var(--blue)"/>
<text x="198" y="35" text-anchor="middle" font-size="13" fill="var(--text)">hash = 0x…3A</text>
<line x1="260" y1="30" x2="288" y2="30" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<rect x="290" y="14" width="150" height="32" rx="6" fill="var(--panel2)" stroke="var(--blue)"/>
<text x="365" y="35" text-anchor="middle" font-size="13" fill="var(--text)">0x3A &amp; (8−1) = 2</text>
<line x1="365" y1="46" x2="168" y2="88" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<text x="40" y="80" font-size="12" fill="var(--muted)">корзины, M = 8</text>
<rect x="40" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="65" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">0</text>
<rect x="90" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="115" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">1</text>
<rect x="140" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="165" y="111" text-anchor="middle" font-size="12" fill="var(--text)">2</text>
<rect x="190" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="215" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">3</text>
<rect x="240" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="265" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">4</text>
<rect x="290" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="315" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">5</text>
<rect x="340" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="365" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">6</text>
<rect x="390" y="90" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="415" y="111" text-anchor="middle" font-size="12" fill="var(--muted)">7</text>
<line x1="165" y1="122" x2="165" y2="138" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<rect x="128" y="140" width="74" height="26" rx="5" fill="var(--panel2)" stroke="var(--line)"/><text x="165" y="158" text-anchor="middle" font-size="12" fill="var(--text)">"alice"</text>
<line x1="165" y1="166" x2="165" y2="180" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<rect x="128" y="182" width="74" height="26" rx="5" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="165" y="200" text-anchor="middle" font-size="12" fill="var(--text)">"bob"</text>
<line x1="315" y1="122" x2="315" y2="138" stroke="var(--muted)" marker-end="url(#hs-ar)"/>
<rect x="278" y="140" width="74" height="26" rx="5" fill="var(--panel2)" stroke="var(--line)"/><text x="315" y="158" text-anchor="middle" font-size="12" fill="var(--text)">"eve"</text>
<text x="40" y="236" font-size="12" fill="var(--muted)">коллизия: "alice" и "bob" в корзине 2 → цепочка</text>
<text x="545" y="20" text-anchor="middle" font-size="12" fill="var(--muted)">bucket в Go ≤ 1.23</text>
<rect x="465" y="30" width="160" height="30" fill="var(--panel2)" stroke="var(--violet)"/><text x="545" y="50" text-anchor="middle" font-size="12" fill="var(--text)">tophash [8]uint8</text>
<rect x="465" y="64" width="160" height="30" fill="var(--panel2)" stroke="var(--line)"/><text x="545" y="84" text-anchor="middle" font-size="12" fill="var(--text)">keys [8]K</text>
<rect x="465" y="98" width="160" height="30" fill="var(--panel2)" stroke="var(--line)"/><text x="545" y="118" text-anchor="middle" font-size="12" fill="var(--text)">elems [8]V</text>
<rect x="465" y="132" width="160" height="30" fill="var(--panel2)" stroke="var(--medium)"/><text x="545" y="152" text-anchor="middle" font-size="12" fill="var(--text)">overflow *bmap</text>
<line x1="545" y1="162" x2="545" y2="180" stroke="var(--medium)" marker-end="url(#hs-ar)"/>
<rect x="485" y="182" width="120" height="24" rx="5" fill="none" stroke="var(--medium)" stroke-dasharray="4 3"/><text x="545" y="199" text-anchor="middle" font-size="12" fill="var(--muted)">overflow bucket</text>
<text x="545" y="226" text-anchor="middle" font-size="12" fill="var(--muted)">Go 1.24+: Swiss tables —</text>
<text x="545" y="242" text-anchor="middle" font-size="12" fill="var(--muted)">группы по 8 слотов</text>
</svg>

## Шаблон на Go

Три самых частых приёма: «видел ли раньше», подсчёт частот и составной ключ.

```go
// Two Sum: значение → индекс уже просмотренных чисел.
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

// Частоты: нулевое значение int — 0, проверка наличия не нужна.
func freq(s string) map[rune]int {
	cnt := make(map[rune]int)
	for _, r := range s {
		cnt[r]++
	}
	return cnt
}

// Составной ключ: массивы и структуры сравнимы, срезы — нет.
func groupAnagrams(strs []string) [][]string {
	groups := make(map[[26]byte][]string)
	for _, s := range strs {
		var key [26]byte
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

Учебная таблица с цепочками — полезно хотя бы раз написать руками, чтобы понять рост и перехеширование:

```go
type entry[K comparable, V any] struct {
	key K
	val V
}

// HashMap — хеш-таблица с цепочками; число корзин всегда степень двойки.
type HashMap[K comparable, V any] struct {
	buckets [][]entry[K, V]
	n       int
	hash    func(K) uint64
}

func NewHashMap[K comparable, V any](hash func(K) uint64) *HashMap[K, V] {
	return &HashMap[K, V]{buckets: make([][]entry[K, V], 8), hash: hash}
}

func (m *HashMap[K, V]) idx(k K) int {
	return int(m.hash(k) & uint64(len(m.buckets)-1))
}

func (m *HashMap[K, V]) Get(k K) (V, bool) {
	for _, e := range m.buckets[m.idx(k)] {
		if e.key == k {
			return e.val, true
		}
	}
	var zero V
	return zero, false
}

func (m *HashMap[K, V]) Put(k K, v V) {
	b := m.idx(k)
	for i := range m.buckets[b] {
		if m.buckets[b][i].key == k {
			m.buckets[b][i].val = v
			return
		}
	}
	m.buckets[b] = append(m.buckets[b], entry[K, V]{k, v})
	m.n++
	if m.n > len(m.buckets)*3/4 { // load factor > 0.75
		m.grow()
	}
}

func (m *HashMap[K, V]) grow() {
	old := m.buckets
	m.buckets = make([][]entry[K, V], len(old)*2)
	for _, chain := range old {
		for _, e := range chain {
			b := m.idx(e.key)
			m.buckets[b] = append(m.buckets[b], e)
		}
	}
}

// Хеш для строк: FNV-1a из hash/fnv.
func hashString(s string) uint64 {
	h := fnv.New64a()
	h.Write([]byte(s))
	return h.Sum64()
}
```

Использование: `m := NewHashMap[string, int](hashString)`.

### Как устроен map в Go

**До Go 1.23 включительно** `map` — это 2^B корзин (bucket), в каждой по 8 слотов. В корзине сначала лежит массив `tophash [8]uint8` — старшие 8 бит хеша каждого ключа: при поиске сначала сравниваются эти байты, и только при совпадении — сами ключи. Ключи и значения хранятся отдельными массивами (`keys`, затем `elems`), чтобы не тратить место на выравнивание. Если корзина переполнена, к ней цепляется overflow-корзина. Когда в среднем на корзину приходится больше 6.5 элементов, таблица удваивается, причём *инкрементально*: старые корзины «эвакуируются» понемногу при каждой записи, без длинной паузы.

**Начиная с Go 1.24** `map` реализован как Swiss table: открытая адресация, слоты сгруппированы по 8, у каждой группы 8-байтовое контрольное слово — по байту на слот с 7 битами хеша. Восемь байтов сравниваются одной операцией (SIMD или битовые трюки), пробирование идёт по группам. Максимальное заполнение — 7/8. Большой map разбит на несколько таблиц (до 1024 элементов в каждой) с каталогом в духе extendible hashing, поэтому рост затрагивает лишь одну маленькую таблицу.

Что важно знать в любом случае: у каждого map случайный seed хеш-функции (защита от HashDoS), порядок обхода `range` не определён и намеренно рандомизирован, map не безопасен для конкурентной записи, а после `delete` память не возвращается — map не «сжимается».

## Сложность

| операция | время | память |
| --- | --- | --- |
| вставка / поиск / удаление (в среднем) | O(1) | O(n) на всю таблицу |
| то же в худшем случае (все ключи в одной корзине) | O(n) | — |
| рост с перехешированием | O(n) разово, O(1) амортизированно | O(n) временно |
| обход всех элементов | O(n + M) | O(1) |
| множество `map[T]struct{}` | как у map | значение занимает 0 байт |

## Когда применять

- «Найди пару/дополнение», «встречалось ли раньше», «первый неповторяющийся» — map или множество.
- «Посчитай частоты», «анаграммы», «самые частые k» — словарь счётчиков.
- «Сгруппируй по признаку» — ключ = канонизированный признак (отсортированная строка, массив частот, структура).
- Нужна O(1)-проверка принадлежности вместо поиска в срезе.
- Кеширование результатов (мемоизация в DP) по ключу-состоянию.

Вариации: префиксная сумма + map (подмассивы с суммой k), map + двусвязный список (LRU-кеш), map индексов для sliding window, consistent hashing для распределения по серверам, Bloom-фильтр как вероятностное множество.

## Где применяется в реальном мире

### Бигтех
- **Redis**: всё пространство ключей — хеш-таблица `dict` с цепочками. При росте Redis держит две таблицы и делает *инкрементальный rehash* — переносит часть корзин на каждой операции, чтобы однопоточный сервер не замирал.
- **Amazon Dynamo** (статья 2007 года) и **Apache Cassandra**: consistent hashing — ключи и узлы хешируются на кольцо; при добавлении узла переезжает лишь малая доля ключей, а не все.
- **PostgreSQL**: Hash Join и HashAggregate строят хеш-таблицу по меньшему входу и проходят по большему за один раз.
- **Linux kernel**: макросы `include/linux/hashtable.h`; кеш dentry (имя в каталоге → inode) и таблица соединений conntrack в netfilter — хеш-таблицы.
- **Git**: content-addressable хранилище — каждый объект адресуется SHA-1 (или SHA-256) своего содержимого.

### Финтех
- **Матчинг-движки бирж**: индекс `orderID → заявка` позволяет отменить или изменить заявку за O(1), не ища её в стакане, — стандартная практика.
- **Идемпотентность платежей**: Stripe API принимает заголовок `Idempotency-Key`; сервер хранит ключ → результат, и повторный запрос (например, после таймаута) возвращает сохранённый ответ вместо второго списания.
- **Антифрод**: velocity-счётчики по ключу «карта / устройство / IP» в in-memory хранилищах вроде Redis.
- **Сверка (reconciliation)**: выписка банка и внутренний леджер соединяются по ID транзакции через хеш-таблицу; записи без пары — расхождения.

### Геймдев
- **Spatial hashing** в broad-phase физики: ключ — координаты ячейки `(x/cell, y/cell)`, значение — объекты в ней; пары на столкновение проверяются только в соседних ячейках.
- **Zobrist hashing** (Альберт Зобрист, 1970) в шахматных движках вроде Stockfish: позиция → 64-битный ключ, который обновляется XOR-ом за ход; transposition table кеширует уже оценённые позиции.
- **Интернирование строк**: движки заменяют имена ассетов, костей, событий на ID через хеш-таблицу (в Unreal Engine так устроен `FName`), чтобы сравнивать их за O(1), а не посимвольно.

## Типичные ошибки

- **Конкурентная запись** в обычный map из нескольких горутин — `fatal error: concurrent map writes`; это не паника, `recover` не поможет. Нужен `sync.Mutex`/`sync.RWMutex` или `sync.Map` для read-heavy случаев.
- **Запись в nil map** (`var m map[string]int; m["a"] = 1`) — паника. Инициализируйте через `make` или литерал.
- **Опора на порядок обхода** — он случайный. Если нужен порядок, соберите ключи и отсортируйте (`slices.Sorted(maps.Keys(m))` в Go 1.23+).
- **Отсутствующий ключ** возвращает нулевое значение — без `v, ok := m[k]` не отличить «нет ключа» от «значение 0».
- **Срез как ключ** не компилируется; используйте массив `[26]byte`, строку или структуру. Ключ `float64` с NaN никогда не найдётся.
- **Изменение поля структуры по месту** (`m[k].Count++`) не компилируется — элементы map неадресуемы; храните указатели или перезаписывайте значение целиком.
- **Ожидание, что delete освободит память**: большой map после удаления почти всех ключей продолжает занимать память — пересоздайте его.
