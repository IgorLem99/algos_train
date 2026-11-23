---
id: prefix-sum
title: Префиксные суммы
short: Один проход подготовки — и сумма любого отрезка за O(1); плюс разностные массивы и 2D
group: Основы и массивы
icon: Σ
order: 2
viz: prefix-sum
---
## Суть за 30 секунд

Заранее посчитаем накопленные суммы `P[i] = a[0] + … + a[i−1]`. Тогда сумма любого отрезка `a[l..r]` — это разность двух чисел: `P[r+1] − P[l]`. Подготовка O(n), каждый запрос — O(1).

Аналогия — одометр в машине: чтобы узнать, сколько проехали между двумя городами, не нужно складывать все участки пути, достаточно вычесть показания одометра. Префиксный массив — это «одометр» для массива.

## История

Накопленные суммы как приём учёта старше компьютеров, и единого автора у идеи нет. В информатике у неё несколько документированных вех:

- **1980** — Ричард Ладнер и Майкл Фишер опубликовали схему *параллельного* вычисления префиксов (parallel prefix), применимую к любой ассоциативной операции; родственные схемы используются в быстрых аппаратных сумматорах (parallel prefix adders).
- **1984** — Фрэнк Кроу (Frank Crow) на SIGGRAPH представил *summed-area tables* — двумерные префиксные суммы для фильтрации текстур.
- **1990** — Гай Блеллох в работе «Prefix Sums and Their Applications» показал, что scan — базовый строительный блок параллельных алгоритмов (сортировка, компактизация, деревья).
- **1994** — Питер Фенвик описал дерево Фенвика: префиксные суммы с обновлениями за O(log n).
- **2001** — Виола и Джонс сделали интегральное изображение (тот же 2D-префикс) основой быстрого детектора лиц.

## Как работает

1. Создаём `P` длины `n+1`, `P[0] = 0` — сумма пустого префикса. Лишний элемент избавляет от проверок `l == 0`.
2. Проходим массив: `P[i+1] = P[i] + a[i]`.
3. Запрос «сумма `a[l..r]` включительно» = `P[r+1] − P[l]`: из суммы первых `r+1` элементов вычитаем сумму первых `l`.

В визуализации строится префикс для `[3, 1, 4, 1, 5, 9, 2]`, а затем отвечается запрос `a[2..5] = 23 − 4 = 19`.

<div data-viz="prefix-sum"></div>

<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
<line x1="170" y1="30" x2="370" y2="30" stroke="var(--accent)" stroke-width="2"/>
<line x1="170" y1="30" x2="170" y2="38" stroke="var(--accent)" stroke-width="2"/>
<line x1="370" y1="30" x2="370" y2="38" stroke="var(--accent)" stroke-width="2"/>
<text x="270" y="22" text-anchor="middle" font-size="12" fill="var(--accent)">a[2..5] = 19</text>
<text x="20" y="62" font-size="14" fill="var(--muted)">a</text>
<rect x="70" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="95" y="61" text-anchor="middle" font-size="13" fill="var(--text)">3</text>
<rect x="120" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="145" y="61" text-anchor="middle" font-size="13" fill="var(--text)">1</text>
<rect x="170" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="195" y="61" text-anchor="middle" font-size="13" fill="var(--text)">4</text>
<rect x="220" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="245" y="61" text-anchor="middle" font-size="13" fill="var(--text)">1</text>
<rect x="270" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="295" y="61" text-anchor="middle" font-size="13" fill="var(--text)">5</text>
<rect x="320" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="345" y="61" text-anchor="middle" font-size="13" fill="var(--text)">9</text>
<rect x="370" y="40" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="395" y="61" text-anchor="middle" font-size="13" fill="var(--text)">2</text>
<line x1="170" y1="76" x2="170" y2="106" stroke="var(--hard)" stroke-dasharray="3 3"/>
<line x1="370" y1="76" x2="370" y2="106" stroke="var(--accent)" stroke-dasharray="3 3"/>
<text x="20" y="132" font-size="14" fill="var(--muted)">P</text>
<rect x="45" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="70" y="131" text-anchor="middle" font-size="13" fill="var(--text)">0</text>
<rect x="95" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="120" y="131" text-anchor="middle" font-size="13" fill="var(--text)">3</text>
<rect x="145" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--hard)" stroke-width="2"/><text x="170" y="131" text-anchor="middle" font-size="13" fill="var(--text)">4</text>
<rect x="195" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="220" y="131" text-anchor="middle" font-size="13" fill="var(--text)">8</text>
<rect x="245" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="270" y="131" text-anchor="middle" font-size="13" fill="var(--text)">9</text>
<rect x="295" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="320" y="131" text-anchor="middle" font-size="13" fill="var(--text)">14</text>
<rect x="345" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="370" y="131" text-anchor="middle" font-size="13" fill="var(--text)">23</text>
<rect x="395" y="110" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="420" y="131" text-anchor="middle" font-size="13" fill="var(--text)">25</text>
<text x="70" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">0</text><text x="120" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">1</text><text x="170" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">2</text><text x="220" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">3</text><text x="270" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">4</text><text x="320" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">5</text><text x="370" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">6</text><text x="420" y="158" text-anchor="middle" font-size="12" fill="var(--muted)">7</text>
<text x="470" y="60" font-size="12" fill="var(--muted)">P[i] стоит на границе</text>
<text x="470" y="76" font-size="12" fill="var(--muted)">перед a[i]: сумма</text>
<text x="470" y="92" font-size="12" fill="var(--muted)">всего, что левее</text>
<text x="240" y="188" text-anchor="middle" font-size="14" fill="var(--text)">sum(a[2..5]) = P[6] − P[2] = 23 − 4 = 19</text>
</svg>

**Три расширения, которые спрашивают чаще всего:**

- **Префикс + хеш-таблица.** «Сколько подмассивов с суммой k?» Подмассив `(j..i]` имеет сумму k, если `P[i] − P[j] = k`, то есть `P[j] = P[i] − k`. Идём слева направо, храним в map, сколько раз встречалась каждая префиксная сумма, и прибавляем `cnt[P − k]`. Работает и с отрицательными числами — в отличие от скользящего окна.
- **2D-префикс.** `P[i][j]` — сумма прямоугольника от `(0,0)` до `(i−1, j−1)`. Сумма любого прямоугольника — четыре обращения по формуле включений-исключений.
- **Разностный массив** — обратная операция. Нужно много раз «прибавить v на отрезке `[l..r]`»: пишем `d[l] += v`, `d[r+1] −= v`, а в конце восстанавливаем массив префиксной суммой по `d`. Каждое обновление — O(1).

Та же идея работает для любой обратимой операции: префиксный XOR (`x[l..r] = X[r+1] ^ X[l]`), префиксное количество (сколько гласных/единиц на отрезке). Для произведения без деления используют пару «префикс × суффикс» (Product of Array Except Self).

## Шаблон на Go

```go
// Prefix строит p, где p[i] = a[0] + ... + a[i-1], len(p) = len(a)+1.
func Prefix(a []int) []int {
	p := make([]int, len(a)+1)
	for i, x := range a {
		p[i+1] = p[i] + x
	}
	return p
}

// RangeSum — сумма a[l..r] включительно.
func RangeSum(p []int, l, r int) int { return p[r+1] - p[l] }

// subarraySum — число подмассивов с суммой k (префикс + map).
func subarraySum(nums []int, k int) int {
	cnt := map[int]int{0: 1} // пустой префикс встречался один раз
	sum, res := 0, 0
	for _, x := range nums {
		sum += x
		res += cnt[sum-k]
		cnt[sum]++
	}
	return res
}
```

```go
// Prefix2D — двумерные префиксные суммы (summed-area table).
type Prefix2D [][]int

func NewPrefix2D(g [][]int) Prefix2D {
	n, m := len(g), 0
	if n > 0 {
		m = len(g[0])
	}
	p := make(Prefix2D, n+1)
	for i := range p {
		p[i] = make([]int, m+1)
	}
	for i := 0; i < n; i++ {
		for j := 0; j < m; j++ {
			p[i+1][j+1] = g[i][j] + p[i][j+1] + p[i+1][j] - p[i][j]
		}
	}
	return p
}

// Sum — сумма прямоугольника [r1..r2] x [c1..c2] включительно.
func (p Prefix2D) Sum(r1, c1, r2, c2 int) int {
	return p[r2+1][c2+1] - p[r1][c2+1] - p[r2+1][c1] + p[r1][c1]
}

// ApplyRangeAdds — разностный массив: ops[i] = {l, r, v} прибавляет v к a[l..r].
func ApplyRangeAdds(n int, ops [][3]int) []int {
	d := make([]int, n+1)
	for _, op := range ops {
		d[op[0]] += op[2]
		d[op[1]+1] -= op[2]
	}
	res := make([]int, n)
	run := 0
	for i := range res {
		run += d[i]
		res[i] = run
	}
	return res
}
```

Заметки по Go: `int` на 64-битных платформах — 64 бита, но на 32-битных (`GOARCH=386`, `arm`) — 32, поэтому для денег и больших сумм явно используйте `int64`. В стандартной библиотеке нет готового prefix scan — цикл пишется руками и прекрасно оптимизируется компилятором. Если массив меняется между запросами, префиксный массив пересчитывать дорого — нужно дерево Фенвика или дерево отрезков (O(log n) на обновление и запрос).

## Сложность

| операция | время | память |
| --- | --- | --- |
| построение 1D-префикса | O(n) | O(n) |
| сумма на отрезке | O(1) | O(1) |
| подмассивы с суммой k (префикс + map) | O(n) | O(n) |
| построение 2D-префикса | O(n·m) | O(n·m) |
| сумма прямоугольника | O(1) | O(1) |
| q обновлений разностным массивом + восстановление | O(q + n) | O(n) |

## Когда применять

- Много запросов «сумма / количество на отрезке» к **неизменному** массиву.
- «Число подмассивов с суммой k», «сумма делится на k», «равное число 0 и 1» — префикс + map (часто с ключом `P mod k` или балансом).
- Есть отрицательные числа, и скользящее окно ломается — префикс + map работает всегда.
- «Сумма в прямоугольнике матрицы» — 2D-префикс.
- «Много прибавлений на отрезках, потом один ответ» (бронирования, Car Pooling) — разностный массив.
- «Произведение всех, кроме текущего» — префикс и суффикс.

## Где применяется в реальном мире

### Бигтех
- **Prometheus**: метрика типа counter монотонно накапливает значение — по сути префиксная сумма событий. Функции `rate()` и `increase()` берут разность значений на концах окна (с поправкой на сброс счётчика при рестарте).
- **Apache Arrow**: строки переменной длины лежат в одном буфере байтов плюс массив `offsets`, где `offsets[i+1] − offsets[i]` — длина i-й строки. Массив offsets — префиксная сумма длин, доступ к любой строке за O(1).
- **GPU-вычисления**: параллельный scan (Блеллох) — основа stream compaction и radix sort в библиотеках CUDA, таких как CUB и Thrust (`exclusive_scan`).
- **OpenCV**: функция `integral` строит интегральное изображение; на нём держится детектор Виолы–Джонса — признаки Хаара считаются за O(1) в любом окне.

### Финтех
- **Балансы в леджере**: баланс счёта — префиксная сумма проводок. На практике хранят периодические снапшоты, и баланс на дату = снапшот + сумма проводок после него.
- **Кумулятивный P&L и максимальная просадка**: по префиксным суммам дневного результата идём с бегущим максимумом; просадка = максимум минус текущее значение.
- **VWAP на произвольном интервале**: храним префиксы `Σ price·volume` и `Σ volume`; VWAP(l..r) = отношение разностей — без пересчёта сделок.
- **Отчёты и лимиты**: оборот клиента за период по кумулятивным дневным суммам — два чтения вместо агрегации тысяч транзакций.

### Геймдев
- **Summed-area tables** (Кроу, 1984): box blur и фильтры переменного размера с постоянной стоимостью на пиксель — техника, используемая для размытия, глянцевых отражений и depth of field.
- **Взвешенный случайный выбор** (лут, спавн монстров): префиксные суммы весов + бинарный поиск случайного числа в `[0, total)`.
- **GPU-частицы**: компактизация живых частиц в compute-шейдерах через prefix scan — живые элементы получают новые индексы без пропусков.
- **Тайловые карты**: 2D-префикс отвечает за O(1), сколько препятствий или ресурсов в прямоугольнике, — удобно для проверки размещения построек.

## Типичные ошибки

- **Off-by-one**: `P` длины `n`, а не `n+1`, или формула `P[r] − P[l]` вместо `P[r+1] − P[l]`. Договоритесь, что `P[i]` — сумма *первых i* элементов, и всё сходится.
- **Забыть `cnt[0] = 1`** в задаче «подмассивы с суммой k» — теряются подмассивы, начинающиеся с индекса 0.
- **Переполнение**: сумма 10⁵ чисел до 10⁹ уже не влезает в `int32`.
- **Отрицательный остаток** в задачах «сумма делится на k»: в Go `-7 % 3 == -1`, нормализуйте `((x % k) + k) % k`.
- **Знаки в 2D**: забыть прибавить обратно `p[r1][c1]`, которая вычтена дважды.
- **Массив меняется**: пересчитывать префикс после каждого обновления — O(n) на операцию; нужен Fenwick tree.
