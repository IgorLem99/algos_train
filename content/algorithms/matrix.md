---
id: matrix
title: Обход и преобразование матриц
short: Поворот через транспонирование, спираль границами, пометки in-place и почему row-major важен для кэша
group: Биты и математика
icon: ⊞
order: 29
viz:
---
## Суть за 30 секунд

Задачи на матрицы редко требуют хитрых алгоритмов — они проверяют **аккуратную работу с индексами**. Почти всё сводится к нескольким приёмам: поворот = транспонирование + разворот строк; спираль = четыре сжимающиеся границы; изменения «на месте» = хранить пометки в самой матрице (в первой строке и столбце или в неиспользуемых битах); обход соседей = массив направлений.

Второй важный момент — **производительность**: матрица в памяти лежит строкой за строкой (row-major), поэтому обход «по строкам» в разы быстрее обхода «по столбцам», хотя асимптотика одинаковая.

## История

У этих приёмов нет единственного автора: поворот через транспонирование, спиральный обход и пометки in-place — математический и программистский фольклор, ставший классикой собеседований. Сам термин «матрица» ввёл Джеймс Сильвестр в 1850 году. Порядок хранения закрепился исторически: Fortran (1957) хранит массивы по столбцам (column-major), C и большинство его наследников, включая Go, — по строкам (row-major). Поэтому, например, библиотеки линейной алгебры в духе BLAS/LAPACK явно принимают флаг порядка хранения, а оптимизированные реализации умножения матриц разбивают их на блоки (tiling), чтобы данные помещались в кэш.

## Как работает

**Поворот на 90° по часовой стрелке.** Элемент `(i, j)` переходит в `(j, n−1−i)`. Можно двигать по четыре элемента по кольцам, но проще разбить на два «зеркала»:

1. **Транспонировать** — поменять местами `(i, j)` и `(j, i)` для `j > i` (отражение относительно главной диагонали).
2. **Развернуть каждую строку** (отражение относительно вертикальной оси).

Композиция двух отражений — это поворот. Обе операции делаются на месте, O(1) доп. памяти.

<svg viewBox="0 0 640 230" style="max-width:100%;height:auto" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif"><defs><marker id="mx-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs><rect x="1" y="1" width="638" height="228" rx="10" fill="var(--panel2)" stroke="var(--line)"/><rect x="30" y="52" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="47" y="74" text-anchor="middle" font-size="14" fill="var(--text)">1</text><rect x="64" y="52" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="81" y="74" text-anchor="middle" font-size="14" fill="var(--text)">2</text><rect x="98" y="52" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="115" y="74" text-anchor="middle" font-size="14" fill="var(--text)">3</text><rect x="30" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="47" y="108" text-anchor="middle" font-size="14" fill="var(--text)">4</text><rect x="64" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="81" y="108" text-anchor="middle" font-size="14" fill="var(--text)">5</text><rect x="98" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="115" y="108" text-anchor="middle" font-size="14" fill="var(--text)">6</text><rect x="30" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="47" y="142" text-anchor="middle" font-size="14" fill="var(--text)">7</text><rect x="64" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="81" y="142" text-anchor="middle" font-size="14" fill="var(--text)">8</text><rect x="98" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="115" y="142" text-anchor="middle" font-size="14" fill="var(--text)">9</text><text x="81" y="40" text-anchor="middle" font-size="12" fill="var(--muted)">исходная</text><rect x="253" y="52" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="270" y="74" text-anchor="middle" font-size="14" fill="var(--text)">1</text><rect x="287" y="52" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="304" y="74" text-anchor="middle" font-size="14" fill="var(--text)">4</text><rect x="321" y="52" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="338" y="74" text-anchor="middle" font-size="14" fill="var(--text)">7</text><rect x="253" y="86" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="270" y="108" text-anchor="middle" font-size="14" fill="var(--text)">2</text><rect x="287" y="86" width="34" height="34" fill="var(--violet)" fill-opacity="0.15" stroke="var(--line)"/><text x="304" y="108" text-anchor="middle" font-size="14" fill="var(--text)">5</text><rect x="321" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="338" y="108" text-anchor="middle" font-size="14" fill="var(--text)">8</text><rect x="253" y="120" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="270" y="142" text-anchor="middle" font-size="14" fill="var(--text)">3</text><rect x="287" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="304" y="142" text-anchor="middle" font-size="14" fill="var(--text)">6</text><rect x="321" y="120" width="34" height="34" fill="var(--violet)" fill-opacity="0.15" stroke="var(--line)"/><text x="338" y="142" text-anchor="middle" font-size="14" fill="var(--text)">9</text><text x="304" y="40" text-anchor="middle" font-size="12" fill="var(--muted)">транспонированная</text><rect x="476" y="52" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="493" y="74" text-anchor="middle" font-size="14" fill="var(--text)">7</text><rect x="510" y="52" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="527" y="74" text-anchor="middle" font-size="14" fill="var(--text)">4</text><rect x="544" y="52" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="561" y="74" text-anchor="middle" font-size="14" fill="var(--text)">1</text><rect x="476" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="493" y="108" text-anchor="middle" font-size="14" fill="var(--text)">8</text><rect x="510" y="86" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="527" y="108" text-anchor="middle" font-size="14" fill="var(--text)">5</text><rect x="544" y="86" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="561" y="108" text-anchor="middle" font-size="14" fill="var(--text)">2</text><rect x="476" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="493" y="142" text-anchor="middle" font-size="14" fill="var(--text)">9</text><rect x="510" y="120" width="34" height="34" fill="var(--panel2)" stroke="var(--line)"/><text x="527" y="142" text-anchor="middle" font-size="14" fill="var(--text)">6</text><rect x="544" y="120" width="34" height="34" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.5"/><text x="561" y="142" text-anchor="middle" font-size="14" fill="var(--text)">3</text><text x="527" y="40" text-anchor="middle" font-size="12" fill="var(--muted)">повёрнутая на 90°</text><line x1="142" y1="103" x2="243" y2="103" stroke="var(--muted)" stroke-width="2" marker-end="url(#mx-arr)"/><line x1="365" y1="103" x2="466" y2="103" stroke="var(--muted)" stroke-width="2" marker-end="url(#mx-arr)"/><text x="192" y="94" text-anchor="middle" font-size="12" fill="var(--violet)">(i,j) ↔ (j,i)</text><text x="192" y="122" text-anchor="middle" font-size="12" fill="var(--muted)">транспонировать</text><text x="415" y="94" text-anchor="middle" font-size="12" fill="var(--blue)">reverse(row)</text><text x="415" y="122" text-anchor="middle" font-size="12" fill="var(--muted)">развернуть строки</text><text x="320" y="186" text-anchor="middle" font-size="13" fill="var(--text)">По часовой: (i, j) → (j, n−1−i). Первая строка становится последним столбцом.</text><text x="320" y="210" text-anchor="middle" font-size="12" fill="var(--muted)">Против часовой: транспонировать + перевернуть порядок строк; 180°: оба разворота</text></svg>

**Спиральный обход.** Держим четыре границы `top, bottom, left, right`. Идём вправо по `top` и сдвигаем `top++`; вниз по `right` и `right--`; влево по `bottom` (если ещё остался ряд) и `bottom--`; вверх по `left` (если остался столбец) и `left++`. Проверки «если ещё остался» нужны для прямоугольных матриц — иначе средняя строка или столбец пройдутся дважды.

**Пометки in-place (Set Matrix Zeroes).** Наивно — запомнить нулевые строки и столбцы в двух множествах, O(m + n) памяти. Трюк: использовать **первую строку и первый столбец как флаги**. Сначала отдельно запоминаем, были ли нули в них самих, затем ставим метки, применяем их ко внутренней части и в самом конце обрабатываем первую строку и столбец. Родственный приём — **кодирование нескольких состояний в одной ячейке**: в «Жизни» Конвея (LeetCode 289) младший бит хранит текущее состояние, второй — следующее, а в конце все значения сдвигаются `>> 1`.

**Соседи и диагонали.** Массив направлений `{{-1,0},{1,0},{0,-1},{0,1}}` + проверка границ — основа BFS/DFS по сетке (острова, заливка, кратчайший путь в лабиринте). На одной диагонали постоянна разность `i − j`, на одной антидиагонали — сумма `i + j`; это используется в задаче N ферзей и при диагональном обходе.

**Кэш и row-major.** Процессор читает память кэш-линиями по 64 байта — это 8 значений `int64`. При обходе по строкам каждая загруженная линия используется целиком; при обходе по столбцам почти каждое обращение — промах кэша, и на больших матрицах разница достигает нескольких раз. В Go есть нюанс:

- `[][]int` — это слайс слайсов: каждая строка — отдельная аллокация, а доступ `m[i][j]` идёт через лишнюю косвенность (заголовок строки, затем данные). Строки могут лежать в памяти где угодно.
- Плоский `[]int` длины `rows·cols` с индексом `r·cols + c` — один непрерывный блок, одна аллокация, меньше нагрузки на GC и лучшая предсказуемость для префетчера.
- Массивы фиксированного размера `[N][M]int` тоже лежат непрерывно, но размер должен быть известен при компиляции.

## Шаблон на Go

```go
// rotate поворачивает квадратную матрицу на 90° по часовой стрелке in-place.
func rotate(m [][]int) {
	n := len(m)
	for i := 0; i < n; i++ { // 1) транспонирование
		for j := i + 1; j < n; j++ {
			m[i][j], m[j][i] = m[j][i], m[i][j]
		}
	}
	for _, row := range m { // 2) разворот каждой строки
		slices.Reverse(row)
	}
}

// spiralOrder обходит матрицу по спирали, сжимая четыре границы.
func spiralOrder(m [][]int) []int {
	if len(m) == 0 {
		return nil
	}
	top, bottom, left, right := 0, len(m)-1, 0, len(m[0])-1
	res := make([]int, 0, len(m)*len(m[0]))
	for top <= bottom && left <= right {
		for j := left; j <= right; j++ {
			res = append(res, m[top][j])
		}
		top++
		for i := top; i <= bottom; i++ {
			res = append(res, m[i][right])
		}
		right--
		if top <= bottom { // остался хотя бы один ряд
			for j := right; j >= left; j-- {
				res = append(res, m[bottom][j])
			}
			bottom--
		}
		if left <= right { // остался хотя бы один столбец
			for i := bottom; i >= top; i-- {
				res = append(res, m[i][left])
			}
			left++
		}
	}
	return res
}

// setZeroes: если m[i][j] == 0, обнуляем строку i и столбец j. O(1) доп. памяти.
func setZeroes(m [][]int) {
	rows, cols := len(m), len(m[0])
	firstRowZero := slices.Contains(m[0], 0)
	firstColZero := false
	for i := 0; i < rows; i++ {
		if m[i][0] == 0 {
			firstColZero = true
		}
	}
	for i := 1; i < rows; i++ { // 1) ставим метки в нулевую строку и столбец
		for j := 1; j < cols; j++ {
			if m[i][j] == 0 {
				m[i][0], m[0][j] = 0, 0
			}
		}
	}
	for i := 1; i < rows; i++ { // 2) применяем метки
		for j := 1; j < cols; j++ {
			if m[i][0] == 0 || m[0][j] == 0 {
				m[i][j] = 0
			}
		}
	}
	if firstRowZero { // 3) сами маркеры — в последнюю очередь
		clear(m[0])
	}
	if firstColZero {
		for i := 0; i < rows; i++ {
			m[i][0] = 0
		}
	}
}
```

Плоская матрица — одна аллокация и последовательный доступ:

```go
type Grid[T any] struct {
	Rows, Cols int
	Data       []T // row-major: элемент (r, c) лежит в Data[r*Cols+c]
}

func NewGrid[T any](rows, cols int) *Grid[T] {
	return &Grid[T]{Rows: rows, Cols: cols, Data: make([]T, rows*cols)}
}

func (g *Grid[T]) At(r, c int) T     { return g.Data[r*g.Cols+c] }
func (g *Grid[T]) Set(r, c int, v T) { g.Data[r*g.Cols+c] = v }
func (g *Grid[T]) Row(r int) []T     { return g.Data[r*g.Cols : (r+1)*g.Cols] }

// Внешний цикл по строкам, внутренний по столбцам — память читается подряд.
func Sum(g *Grid[int]) int {
	s := 0
	for r := 0; r < g.Rows; r++ {
		for _, v := range g.Row(r) {
			s += v
		}
	}
	return s
}

var dirs = [4][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

// neighbors вызывает visit для каждого соседа (r, c) внутри сетки.
func neighbors(r, c, rows, cols int, visit func(nr, nc int)) {
	for _, d := range dirs {
		nr, nc := r+d[0], c+d[1]
		if nr >= 0 && nr < rows && nc >= 0 && nc < cols {
			visit(nr, nc)
		}
	}
}
```

Go-детали: `make([][]int, n)` создаёт только внешний слайс — каждую строку нужно `make` отдельно, иначе паника на `nil`. Если всё же нужен `[][]int`, строки можно нарезать из одного большого `[]int` (`m[i] = buf[i*cols:(i+1)*cols]`) — интерфейс прежний, а память непрерывная. Присваивание `row := m[i]` копирует лишь заголовок слайса, изменения через `row` видны в матрице. `slices.Reverse` и `clear` доступны с Go 1.21.

## Сложность

| Операция | Время | Память |
|---|---|---|
| Поворот n×n (транспонирование + разворот) | O(n²) | O(1) |
| Поворот через новую матрицу | O(n²) | O(n²) |
| Спиральный обход m×n | O(m·n) | O(1) доп. (кроме ответа) |
| Set Matrix Zeroes с пометками in-place | O(m·n) | O(1) |
| BFS/DFS по сетке | O(m·n) | O(m·n) |
| Обход по строкам vs по столбцам | O(m·n) оба | разница в константе из-за кэша, может быть кратной |

## Когда применять

- Условие «сделай на месте», «без дополнительной матрицы» — ищите разложение на отражения или храните метки в самой матрице.
- «Повернуть», «отразить», «транспонировать», «обойти по спирали/диагоналям/змейкой».
- Сетка с клетками-препятствиями, острова, заливка — BFS/DFS с массивом направлений.
- Отсортированные строки и столбцы — поиск «лестницей» из правого верхнего угла за O(m + n) (Search a 2D Matrix II).
- Много запросов суммы подпрямоугольника — двумерные префиксные суммы.
- Вариации: Rotate Image, Spiral Matrix I/II, Set Matrix Zeroes, Game of Life, Valid Sudoku, Diagonal Traverse, Toeplitz Matrix, Transpose Matrix.

## Где применяется в реальном мире

### Бигтех
- **Обработка изображений**: картинка — матрица пикселей в row-major порядке; повороты на 90° (в том числе по EXIF-ориентации фотографии с телефона) и отражения — ровно транспонирование + разворот.
- **Свёртки** (размытие, выделение границ, свёрточные нейросети) — скользящее окно по матрице; приём im2col разворачивает свёртку в обычное умножение матриц, которое выполняется оптимизированными библиотеками.
- **Умножение матриц в BLAS и на GPU**: данные разбиваются на блоки (tiling), чтобы каждый блок помещался в кэш или в shared memory; порядок циклов `i-k-j` вместо `i-j-k` в наивной реализации уже заметно ускоряет код за счёт последовательного доступа.
- **Строковые и колоночные хранилища**: выбор между row-major (OLTP-базы) и column-major (Parquet, ClickHouse) — та же идея «храни подряд то, что читаешь подряд», только на уровне диска.

### Финтех
- **Ковариационные и корреляционные матрицы** в риск-менеджменте симметричны — часто хранят только верхний треугольник в плоском массиве и обходят его по строкам.
- **Колоночное хранение временных рядов** (kdb+ и аналоги): цены одного инструмента лежат подряд, поэтому агрегаты по столбцу считаются с максимальной скоростью чтения памяти.
- **Табличные движки и отчёты**: сводные таблицы, транспонирование отчётов «дата × инструмент» и пересчёт ячеек в электронных таблицах — работа с двумерными сетками.

### Геймдев
- **Тайловые карты**: уровень хранится плоским массивом с индексом `y·width + x`; соседи, заливка (paint bucket), открытие пустых клеток в «Сапёре» и поиск путей — обходы сетки.
- **Поворот фигур в «Тетрисе»**: фигура — маленькая матрица, поворот — транспонирование + разворот (с дополнительными правилами сдвига у стенок в стандартных системах вращения).
- **Механика 2048**: распространённый приём — реализовать только сдвиг влево, а остальные направления получать поворотом поля, сдвигом влево и обратным поворотом.
- **Клеточные автоматы** (генерация пещер, симуляции «Жизни»): обновление сетки на месте с кодированием старого и нового состояния в одной ячейке.

## Типичные ошибки

- При транспонировании пройти по всем `j`, а не только `j > i`, — каждая пара поменяется дважды, и матрица вернётся к исходной.
- Перепутать порядок шагов: «развернуть строки, затем транспонировать» даёт поворот **против** часовой стрелки.
- В спирали не проверить `top <= bottom` / `left <= right` перед обратными проходами — дубликаты на прямоугольных матрицах.
- В Set Matrix Zeroes обработать первую строку и столбец раньше остальных — метки затрутся, и обнулится лишнее.
- Путать `m[row][col]` и `(x, y)`: `x` — столбец, `y` — строка.
- Обходить большую матрицу по столбцам во внутреннем цикле и удивляться, что «тот же O(n²)» в несколько раз медленнее.
- Предполагать, что матрица квадратная или непустая: проверяйте `len(m) == 0` и `len(m[0])`.
