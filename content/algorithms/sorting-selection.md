---
id: sorting-selection
title: Сортировка, Quickselect и Bucket sort
short: Как сортирует Go, k-й элемент за O(n) без полной сортировки и подсчёт по корзинам
group: Основы и массивы
icon: ↕
order: 6
viz: quickselect
---
## Суть за 30 секунд

Сортировка — самый частый «первый шаг» решения: после неё работают два указателя, бинарный поиск, жадность и группировка. Но полная сортировка за O(n log n) нужна не всегда.

- **Quickselect** находит k-й по величине элемент за O(n) в среднем: делаем одно разбиение (partition) как в quicksort и продолжаем только в той половине, где лежит ответ.
- **Bucket / counting sort** обходит нижнюю границу Ω(n log n) для сравнений: если значения ограничены (частоты, оценки, цены с шагом), элемент кладётся прямо в «корзину» по своему значению.

Аналогия для quickselect: чтобы найти медиану роста в классе, не нужно строить всех по росту — достаточно разделить на «ниже Пети» и «выше Пети» и понять, в какой группе медиана.

## История

- **1959–1961** — Тони Хоар придумал quicksort во время стажировки в МГУ (нужно было сортировать слова для машинного перевода). В 1961 году в Communications of the ACM вышли его алгоритмы PARTITION, QUICKSORT и FIND — последний и есть quickselect.
- **1973** — Блюм, Флойд, Пратт, Ривест и Тарьян опубликовали «медиану медиан» (BFPRT) — выбор k-го элемента за O(n) *в худшем* случае.
- **1997** — Дэвид Массер предложил introsort/introselect: quicksort, который при плохой глубине рекурсии переключается на heapsort. Так устроен `std::sort` во многих реализациях C++.
- Корзинные методы старше компьютеров: электромеханические сортировщики перфокарт (линейка машин Германа Холлерита, начало XX века) раскладывали колоду по карманам по одной цифре за проход — это поразрядная сортировка (radix sort).
- **2021** — Орсон Питерс опубликовал pdqsort (pattern-defeating quicksort); с **Go 1.19** `sort.Sort` и `sort.Slice` используют именно его.

## Как работает

**Partition (схема Ломуто)**: берём опорный элемент `pivot` (лучше случайный), проходим отрезок и переносим всё меньшее pivot в левую часть. В конце ставим pivot на границу — это его **итоговая позиция** `p` в отсортированном массиве.

**Quickselect**: хотим элемент, который стоял бы на позиции `k` в отсортированном массиве (для k-го *наибольшего* это `n − k`).

1. Делаем partition, получаем `p`.
2. `p == k` — ответ `a[p]`.
3. `p < k` — ответ справа, работаем с `[p+1..hi]`; иначе — с `[lo..p−1]`.

В отличие от quicksort, рекурсия идёт только в одну сторону. В среднем размер отрезка падает вдвое: `n + n/2 + n/4 + … ≈ 2n` — это O(n). При неудачных pivot (всегда минимум) — O(n²), поэтому pivot выбирают случайно.

В визуализации ищем 2-й наибольший в `[3, 2, 1, 5, 6, 4]` (позиция `n − k = 4`): первый pivot 4 встаёт на позицию 3 → ищем справа; pivot 5 встаёт на позицию 4 — ответ 5.

<div data-viz="quickselect"></div>

<svg viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
<defs><marker id="qs-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs>
<text x="20" y="22" font-size="13" fill="var(--muted)">после partition:</text>
<rect x="20" y="32" width="250" height="38" fill="var(--panel2)" stroke="var(--blue)"/>
<text x="145" y="56" text-anchor="middle" font-size="13" fill="var(--text)">&lt; pivot</text>
<rect x="270" y="32" width="60" height="38" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/>
<text x="300" y="56" text-anchor="middle" font-size="13" fill="var(--text)">pivot</text>
<rect x="330" y="32" width="290" height="38" fill="var(--panel2)" stroke="var(--violet)"/>
<text x="475" y="56" text-anchor="middle" font-size="13" fill="var(--text)">≥ pivot</text>
<text x="300" y="88" text-anchor="middle" font-size="12" fill="var(--accent)">p — итоговое место</text>
<line x1="500" y1="104" x2="500" y2="74" stroke="var(--medium)" stroke-width="2" marker-end="url(#qs-ar)"/>
<text x="500" y="120" text-anchor="middle" font-size="12" fill="var(--medium)">k &gt; p → идём только сюда</text>
<text x="145" y="92" text-anchor="middle" font-size="12" fill="var(--muted)">отбрасываем целиком</text>
<text x="20" y="152" font-size="13" fill="var(--text)">quickselect:</text>
<rect x="130" y="140" width="320" height="14" fill="var(--violet)" opacity="0.7"/>
<rect x="130" y="158" width="160" height="14" fill="var(--violet)" opacity="0.55"/>
<rect x="130" y="176" width="80" height="14" fill="var(--violet)" opacity="0.4"/>
<rect x="130" y="194" width="40" height="14" fill="var(--violet)" opacity="0.3"/>
<text x="460" y="152" font-size="12" fill="var(--muted)">n</text>
<text x="300" y="170" font-size="12" fill="var(--muted)">n/2</text>
<text x="220" y="188" font-size="12" fill="var(--muted)">n/4</text>
<text x="180" y="206" font-size="12" fill="var(--muted)">…</text>
<text x="380" y="200" font-size="13" fill="var(--text)">n + n/2 + n/4 + … ≈ 2n → O(n)</text>
<text x="380" y="220" font-size="12" fill="var(--muted)">quicksort идёт в обе стороны → O(n log n)</text>
</svg>

**Bucket sort для частот** (Top K Frequent Elements): частота элемента лежит в диапазоне `1..n`, поэтому заводим `n+1` корзин, где индекс — частота. Кладём каждое число в корзину своей частоты и идём от последней корзины к первой, пока не наберём k элементов. Итого O(n) без сортировки и без кучи.

**Counting sort**: значения в маленьком диапазоне `[0, R)` — считаем, сколько раз встречается каждое, и выписываем по порядку. O(n + R).

## Шаблон на Go

```go
// quickselect возвращает элемент, который стоял бы на позиции k (с нуля)
// в отсортированном массиве. Среднее O(n). Переставляет элементы a.
func quickselect(a []int, k int) int {
	lo, hi := 0, len(a)-1
	for lo < hi {
		p := partition(a, lo, hi)
		switch {
		case p == k:
			return a[p]
		case p < k:
			lo = p + 1
		default:
			hi = p - 1
		}
	}
	return a[lo]
}

// partition — схема Ломуто со случайным опорным элементом.
func partition(a []int, lo, hi int) int {
	r := lo + rand.Intn(hi-lo+1)
	a[r], a[hi] = a[hi], a[r]
	pivot, i := a[hi], lo
	for j := lo; j < hi; j++ {
		if a[j] < pivot {
			a[i], a[j] = a[j], a[i]
			i++
		}
	}
	a[i], a[hi] = a[hi], a[i]
	return i
}

func findKthLargest(nums []int, k int) int {
	return quickselect(nums, len(nums)-k)
}

// topKFrequent — bucket sort по частоте: O(n).
func topKFrequent(nums []int, k int) []int {
	cnt := make(map[int]int)
	for _, x := range nums {
		cnt[x]++
	}
	buckets := make([][]int, len(nums)+1) // индекс = частота
	for x, c := range cnt {
		buckets[c] = append(buckets[c], x)
	}
	res := make([]int, 0, k)
	for c := len(buckets) - 1; c > 0 && len(res) < k; c-- {
		res = append(res, buckets[c]...)
	}
	return res[:k]
}
```

```go
type Order struct {
	Price float64
	Time  int64
}

// sortOrders — цена по убыванию, при равной цене — раньше пришедшая.
func sortOrders(orders []Order) {
	slices.SortFunc(orders, func(a, b Order) int {
		if c := cmp.Compare(b.Price, a.Price); c != 0 {
			return c
		}
		return cmp.Compare(a.Time, b.Time)
	})
}
```

**Как сортирует Go.** `sort.Sort`, `sort.Slice`, а с Go 1.21 и `slices.Sort`/`slices.SortFunc` — это pdqsort: quicksort с выбором pivot по медиане нескольких элементов, переходом на insertion sort для маленьких отрезков, распознаванием уже отсортированных участков и запасным heapsort при плохом разбиении, что гарантирует O(n log n). Эти сортировки **нестабильны**. Для стабильной — `sort.Stable`/`sort.SliceStable` или `slices.SortStableFunc` (слияние на месте, без дополнительной памяти, но медленнее). Дженерик-версии из пакета `slices` обычно быстрее `sort.Slice`: нет вызовов через интерфейс и рефлексии для обмена. Готового `nth_element` в стандартной библиотеке нет — quickselect пишут сами, а для потока данных берут кучу из `container/heap` (top-k за O(n log k)).

## Сложность

| алгоритм | время | память |
| --- | --- | --- |
| сортировка сравнениями (pdqsort в Go) | O(n log n) | O(log n) |
| нижняя граница для сравнений | Ω(n log n) | — |
| quickselect | O(n) в среднем, O(n²) в худшем | O(1) |
| медиана медиан (BFPRT) | O(n) в худшем | O(log n) |
| top-k через кучу размера k | O(n log k) | O(k) |
| counting sort, значения в [0, R) | O(n + R) | O(R) |
| bucket sort по частотам | O(n) | O(n) |

## Когда применять

- «k-й по величине», «медиана», «k ближайших точек» — quickselect (O(n)) или куча (O(n log k), подходит для потока).
- «Top-k частых» и значения ограничены по диапазону — bucket sort.
- Значения из маленького диапазона (оценки 0–100, буквы, возраст) — counting sort.
- Интервалы, встречи, «объединить пересекающиеся» — сначала сортировка по началу.
- Перед двумя указателями, бинарным поиском, жадным выбором.
- «Отсортировать 0, 1, 2 на месте» — Dutch national flag, трёхпутевое разбиение.

## Где применяется в реальном мире

### Бигтех
- **PostgreSQL**: для `ORDER BY … LIMIT k` в EXPLAIN ANALYZE можно увидеть `Sort Method: top-N heapsort` — хранится только k лучших строк в куче, а не сортируется вся выборка.
- **Linux kernel**: `lib/sort.c` реализует heapsort — гарантированные O(n log n) и O(1) памяти без рекурсии важнее средней скорости quicksort.
- **Перцентили задержек** (p50/p99) в мониторинге: точные — через selection по окну; на больших потоках — бакетные гистограммы (Prometheus histogram с бакетами `le`, HdrHistogram), то есть корзинный подход с контролируемой потерей точности.
- **Hadoop TeraSort**: ключи сэмплируются, по сэмплу выбираются границы диапазонов, и каждый редьюсер сортирует свою «корзину» — распределённый bucket sort.

### Финтех
- **Historical VaR**: 99%-й VaR — квантиль распределения сценарных P&L, то есть k-я порядковая статистика; полная сортировка не обязательна.
- **Стакан с шагом цены**: цены кратны tick size, поэтому ценовые уровни можно хранить в массиве по номеру тика — корзины вместо дерева; распространённый приём в низколатентных системах.
- **Робастная статистика в антифроде**: медиана и MAD (median absolute deviation) устойчивы к выбросам — медиана считается selection-ом.
- **Отчётность и лимиты**: top-K клиентов по обороту или контрагентов по экспозиции — куча или quickselect вместо сортировки миллионов строк.

### Геймдев
- **Сортировка draw calls** по 64-битному ключу (слой, шейдер, материал, глубина), часто radix sort, — техника, описанная, например, Кристером Эриксоном в статье «Order your graphics draw calls around!».
- **Прозрачные объекты и частицы** сортируются по глубине back-to-front; на GPU для этого используют параллельный radix sort.
- **Построение BVH и kd-деревьев**: разбиение по медиане через `std::nth_element` (introselect) — так делает, например, pbrt в стратегии equal counts.
- **Таблицы лидеров**: top-K игроков — Redis sorted set или куча, а не полная сортировка.

## Типичные ошибки

- **Фиксированный pivot** (первый/последний) на уже отсортированных данных — O(n²). Берите случайный.
- **Много одинаковых элементов** в схеме Ломуто — тоже O(n²); помогает трёхпутевое разбиение (`< pivot`, `= pivot`, `> pivot`).
- **Путаница k-го наибольшего и наименьшего**: k-й наибольший — это позиция `n − k` при нумерации с нуля.
- **Компаратор нарушает строгий порядок** (например, `a <= b` вместо `a < b` в `sort.Slice` или несогласованные поля) — результат непредсказуем.
- **Ожидание стабильности** от `sort.Slice`/`slices.Sort` — порядок равных элементов не сохраняется.
- **Quickselect меняет входной срез** — скопируйте (`slices.Clone`), если исходный порядок ещё нужен.
- **Сортировка ради top-k** при n = 10⁷ и k = 10 — куча на k элементов в десятки раз дешевле.
