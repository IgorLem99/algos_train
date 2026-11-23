---
id: number-of-islands
title: Number of Islands
difficulty: Medium
category: Graphs
leetcode: 200
lists: neetcode150, blind75
algorithms: graph-dfs, graph-bfs, union-find
order: 80
---
Дана сетка `grid` из `'1'` (суша) и `'0'` (вода). Верни количество островов — групп суши, соединённых по горизонтали или вертикали. Всё за пределами сетки — вода.

**Пример:** `grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]` → `3`

**Ограничения:** `1 ≤ m, n ≤ 300`.

<details><summary>Подсказка</summary>Каждый раз, найдя непосещённую сушу, увеличь счётчик и «затопи» весь её остров обходом.</details>

### DFS с затоплением
Проходим по сетке; встретив `'1'`, увеличиваем счётчик и рекурсивно превращаем весь остров в `'0'`, чтобы не посчитать его снова.

**Сложность:** время O(m·n), память O(m·n) на рекурсию в худшем случае.

```go
func numIslands(grid [][]byte) int {
	m, n := len(grid), len(grid[0])
	var sink func(r, c int)
	sink = func(r, c int) {
		if r < 0 || c < 0 || r >= m || c >= n || grid[r][c] != '1' {
			return
		}
		grid[r][c] = '0' // помечаем посещённой
		sink(r+1, c)
		sink(r-1, c)
		sink(r, c+1)
		sink(r, c-1)
	}
	count := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if grid[r][c] == '1' {
				count++
				sink(r, c)
			}
		}
	}
	return count
}
```

### BFS
То же, но остров обходим очередью — нет риска переполнить стек на больших сетках. Клетку помечаем в момент добавления в очередь, иначе она может попасть туда несколько раз.

**Сложность:** время O(m·n), память O(min(m, n)) на очередь.

```go
func numIslands(grid [][]byte) int {
	m, n := len(grid), len(grid[0])
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	count := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if grid[r][c] != '1' {
				continue
			}
			count++
			grid[r][c] = '0'
			queue := [][2]int{{r, c}}
			for len(queue) > 0 {
				p := queue[0]
				queue = queue[1:]
				for _, d := range dirs {
					nr, nc := p[0]+d[0], p[1]+d[1]
					if nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == '1' {
						grid[nr][nc] = '0' // помечаем при добавлении
						queue = append(queue, [2]int{nr, nc})
					}
				}
			}
		}
	}
	return count
}
```

### Union-Find
Каждая клетка суши — отдельное множество, счётчик = число клеток суши. Объединяем соседние клетки суши (достаточно правого и нижнего соседа); каждое успешное объединение уменьшает число компонент на 1.

**Сложность:** время O(m·n·α(m·n)), память O(m·n).

```go
func numIslands(grid [][]byte) int {
	m, n := len(grid), len(grid[0])
	parent := make([]int, m*n)
	rank := make([]int, m*n)
	count := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			parent[r*n+c] = r*n + c
			if grid[r][c] == '1' {
				count++
			}
		}
	}
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]] // сжатие пути (halving)
			x = parent[x]
		}
		return x
	}
	union := func(a, b int) {
		ra, rb := find(a), find(b)
		if ra == rb {
			return
		}
		if rank[ra] < rank[rb] {
			ra, rb = rb, ra
		}
		parent[rb] = ra
		if rank[ra] == rank[rb] {
			rank[ra]++
		}
		count-- // два острова слились в один
	}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if grid[r][c] != '1' {
				continue
			}
			if r+1 < m && grid[r+1][c] == '1' {
				union(r*n+c, (r+1)*n+c)
			}
			if c+1 < n && grid[r][c+1] == '1' {
				union(r*n+c, r*n+c+1)
			}
		}
	}
	return count
}
```

---
id: max-area-of-island
title: Max Area of Island
difficulty: Medium
category: Graphs
leetcode: 695
lists: neetcode150
algorithms: graph-dfs, graph-bfs
order: 81
---
Дана бинарная матрица `grid` (`1` — суша, `0` — вода). Площадь острова — число клеток в нём (связность по 4 направлениям). Верни максимальную площадь острова или `0`, если островов нет.

**Пример:** `grid = [[1,1,0],[0,1,0],[0,0,1]]` → `3`

**Пример:** `grid = [[0,0,0,0]]` → `0`

**Ограничения:** `1 ≤ m, n ≤ 50`.

<details><summary>Подсказка</summary>Тот же обход, что в Number of Islands, только DFS возвращает размер острова.</details>

### DFS, возвращающий площадь
DFS из клетки суши обнуляет её и возвращает `1 + сумма площадей` из четырёх соседей. Берём максимум по всем запускам.

**Сложность:** время O(m·n), память O(m·n) на рекурсию.

```go
func maxAreaOfIsland(grid [][]int) int {
	m, n := len(grid), len(grid[0])
	var area func(r, c int) int
	area = func(r, c int) int {
		if r < 0 || c < 0 || r >= m || c >= n || grid[r][c] != 1 {
			return 0
		}
		grid[r][c] = 0 // посещена
		return 1 + area(r+1, c) + area(r-1, c) + area(r, c+1) + area(r, c-1)
	}
	best := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			best = max(best, area(r, c))
		}
	}
	return best
}
```

### BFS
Обходим каждый остров очередью и считаем, сколько клеток через неё прошло.

**Сложность:** время O(m·n), память O(m·n).

```go
func maxAreaOfIsland(grid [][]int) int {
	m, n := len(grid), len(grid[0])
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	best := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if grid[r][c] != 1 {
				continue
			}
			grid[r][c] = 0
			queue := [][2]int{{r, c}}
			size := 0
			for len(queue) > 0 {
				p := queue[0]
				queue = queue[1:]
				size++
				for _, d := range dirs {
					nr, nc := p[0]+d[0], p[1]+d[1]
					if nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1 {
						grid[nr][nc] = 0
						queue = append(queue, [2]int{nr, nc})
					}
				}
			}
			best = max(best, size)
		}
	}
	return best
}
```

---
id: clone-graph
title: Clone Graph
difficulty: Medium
category: Graphs
leetcode: 133
lists: neetcode150, blind75
algorithms: graph-dfs, graph-bfs, hashing
order: 82
---
Дана ссылка на вершину связного неориентированного графа. Верни **глубокую копию** графа. Вершина содержит значение `Val` и список соседей `Neighbors`. Значения уникальны и равны 1..n.

**Пример:** `adjList = [[2,4],[1,3],[2,4],[1,3]]` → `[[2,4],[1,3],[2,4],[1,3]]` (новые объекты)

**Пример:** `adjList = []` → `[]`

**Ограничения:** `0 ≤ n ≤ 100`, без петель и кратных рёбер.

<details><summary>Подсказка</summary>Нужна хеш-таблица «оригинал → копия»: она же служит множеством посещённых и разрывает циклы.</details>

### DFS с картой оригинал → копия
Рекурсивно клонируем вершину и её соседей. Копию кладём в карту **до** обхода соседей — иначе на цикле рекурсия не остановится.

**Сложность:** время O(V + E), память O(V).

```go
type Node struct {
	Val       int
	Neighbors []*Node
}

func cloneGraph(node *Node) *Node {
	clones := map[*Node]*Node{}
	var clone func(n *Node) *Node
	clone = func(n *Node) *Node {
		if n == nil {
			return nil
		}
		if c, ok := clones[n]; ok {
			return c
		}
		c := &Node{Val: n.Val}
		clones[n] = c // запоминаем до обхода соседей — разрываем циклы
		for _, nb := range n.Neighbors {
			c.Neighbors = append(c.Neighbors, clone(nb))
		}
		return c
	}
	return clone(node)
}
```

### BFS
Создаём копию вершины при первом её обнаружении и кладём оригинал в очередь. Извлекая вершину, достраиваем список соседей её копии.

**Сложность:** время O(V + E), память O(V).

```go
type Node struct {
	Val       int
	Neighbors []*Node
}

func cloneGraph(node *Node) *Node {
	if node == nil {
		return nil
	}
	clones := map[*Node]*Node{node: &Node{Val: node.Val}}
	queue := []*Node{node}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		for _, nb := range cur.Neighbors {
			if _, ok := clones[nb]; !ok {
				clones[nb] = &Node{Val: nb.Val}
				queue = append(queue, nb)
			}
			clones[cur].Neighbors = append(clones[cur].Neighbors, clones[nb])
		}
	}
	return clones[node]
}
```

---
id: walls-and-gates
title: Walls and Gates
difficulty: Medium
category: Graphs
leetcode: 286
lists: neetcode150
algorithms: graph-bfs
order: 83
---
Дана сетка `rooms`: `-1` — стена, `0` — ворота, `INF = 2147483647` — пустая комната. Заполни каждую пустую комнату расстоянием до **ближайших** ворот (шаги по 4 направлениям). Если ворота недостижимы — оставь `INF`. Изменяй сетку на месте.

**Пример:** `rooms = [[INF,-1,0,INF],[INF,INF,INF,-1],[INF,-1,INF,-1],[0,-1,INF,INF]]` → `[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]`

**Ограничения:** `1 ≤ m, n ≤ 250`.

<details><summary>Подсказка</summary>Запусти BFS сразу из всех ворот: первое посещение комнаты и есть кратчайшее расстояние.</details>

### Мультиисточниковый BFS
Кладём в очередь все ворота одновременно и расходимся волной. Комната получает расстояние при первом посещении — это гарантированно расстояние до ближайших ворот, поэтому каждую клетку обрабатываем ровно один раз.

**Сложность:** время O(m·n), память O(m·n).

```go
func wallsAndGates(rooms [][]int) {
	const INF = 2147483647
	if len(rooms) == 0 {
		return
	}
	m, n := len(rooms), len(rooms[0])
	var queue [][2]int
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if rooms[r][c] == 0 {
				queue = append(queue, [2]int{r, c})
			}
		}
	}
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	for len(queue) > 0 {
		p := queue[0]
		queue = queue[1:]
		for _, d := range dirs {
			r, c := p[0]+d[0], p[1]+d[1]
			if r < 0 || c < 0 || r >= m || c >= n || rooms[r][c] != INF {
				continue // вне сетки, стена, ворота или уже посчитано
			}
			rooms[r][c] = rooms[p[0]][p[1]] + 1 // первое посещение = кратчайший путь
			queue = append(queue, [2]int{r, c})
		}
	}
}
```

### DFS из каждых ворот с отсечением
Из каждых ворот идём DFS и записываем расстояние, только если оно меньше уже записанного. Проще в написании, но одна клетка может переписываться много раз.

**Сложность:** время O((m·n)²) в худшем случае, память O(m·n).

```go
func wallsAndGates(rooms [][]int) {
	if len(rooms) == 0 {
		return
	}
	m, n := len(rooms), len(rooms[0])
	var dfs func(r, c, d int)
	dfs = func(r, c, d int) {
		if r < 0 || c < 0 || r >= m || c >= n || rooms[r][c] <= d {
			return // стена, ворота или уже есть путь не длиннее
		}
		rooms[r][c] = d
		dfs(r+1, c, d+1)
		dfs(r-1, c, d+1)
		dfs(r, c+1, d+1)
		dfs(r, c-1, d+1)
	}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if rooms[r][c] == 0 {
				dfs(r+1, c, 1)
				dfs(r-1, c, 1)
				dfs(r, c+1, 1)
				dfs(r, c-1, 1)
			}
		}
	}
}
```

---
id: rotting-oranges
title: Rotting Oranges
difficulty: Medium
category: Graphs
leetcode: 994
lists: neetcode150
algorithms: graph-bfs, matrix
order: 84
---
Дана сетка: `0` — пусто, `1` — свежий апельсин, `2` — гнилой. Каждую минуту свежие апельсины, соседние (по 4 направлениям) с гнилыми, тоже гниют. Верни минимальное число минут, после которого свежих не останется, или `-1`, если это невозможно.

**Пример:** `grid = [[2,1,1],[1,1,0],[0,1,1]]` → `4`

**Пример:** `grid = [[2,1,1],[0,1,1],[1,0,1]]` → `-1`

**Ограничения:** `1 ≤ m, n ≤ 10`.

<details><summary>Подсказка</summary>BFS сразу из всех гнилых апельсинов по уровням: номер уровня — минута.</details>

### Мультиисточниковый BFS по уровням
Все гнилые апельсины — стартовый уровень. Каждый уровень BFS — одна минута: заражаем свежих соседей и считаем, сколько свежих осталось. Если после окончания волны свежие остались — они недостижимы.

**Сложность:** время O(m·n), память O(m·n).

```go
func orangesRotting(grid [][]int) int {
	m, n := len(grid), len(grid[0])
	var queue [][2]int
	fresh := 0
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			switch grid[r][c] {
			case 1:
				fresh++
			case 2:
				queue = append(queue, [2]int{r, c})
			}
		}
	}
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	minutes := 0
	for len(queue) > 0 && fresh > 0 {
		minutes++ // весь текущий уровень заражает соседей за одну минуту
		var next [][2]int
		for _, p := range queue {
			for _, d := range dirs {
				r, c := p[0]+d[0], p[1]+d[1]
				if r >= 0 && c >= 0 && r < m && c < n && grid[r][c] == 1 {
					grid[r][c] = 2
					fresh--
					next = append(next, [2]int{r, c})
				}
			}
		}
		queue = next
	}
	if fresh > 0 {
		return -1
	}
	return minutes
}
```

### Пошаговая симуляция с метками времени
Без очереди: храним в клетке время заражения (`2` — изначально, `t+1` — сгнил на шаге t). На каждом проходе апельсины со значением `t` заражают соседей значением `t+1`. Когда проход ничего не изменил, процесс закончился.

**Сложность:** время O((m·n)²), память O(1).

```go
func orangesRotting(grid [][]int) int {
	m, n := len(grid), len(grid[0])
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	t := 2
	for {
		changed := false
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				if grid[r][c] != t {
					continue
				}
				for _, d := range dirs {
					nr, nc := r+d[0], c+d[1]
					if nr >= 0 && nc >= 0 && nr < m && nc < n && grid[nr][nc] == 1 {
						grid[nr][nc] = t + 1 // сгниёт на следующей минуте
						changed = true
					}
				}
			}
		}
		if !changed {
			break
		}
		t++
	}
	for _, row := range grid {
		for _, v := range row {
			if v == 1 {
				return -1
			}
		}
	}
	return t - 2
}
```

---
id: pacific-atlantic-water-flow
title: Pacific Atlantic Water Flow
difficulty: Medium
category: Graphs
leetcode: 417
lists: neetcode150, blind75
algorithms: graph-dfs, graph-bfs
order: 85
---
Дана матрица высот `heights` `m × n`. Тихий океан омывает верхний и левый края, Атлантический — нижний и правый. Вода течёт в соседнюю клетку, если её высота **не больше** текущей. Верни координаты всех клеток, из которых вода может попасть в оба океана.

**Пример:** `heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]` → `[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]`

**Пример:** `heights = [[1]]` → `[[0,0]]`

**Ограничения:** `1 ≤ m, n ≤ 200`, `0 ≤ heights[i][j] ≤ 10⁵`.

<details><summary>Подсказка</summary>Иди наоборот: от берега каждого океана «вверх по течению» (в клетки не ниже текущей) и пересеки два множества.</details>

### Обратный DFS от берегов
Вместо запуска из каждой клетки запускаем DFS от краёв каждого океана и поднимаемся в соседей с высотой `≥` текущей. Получаем две матрицы достижимости; ответ — клетки, отмеченные в обеих.

**Сложность:** время O(m·n), память O(m·n).

```go
func pacificAtlantic(heights [][]int) [][]int {
	m, n := len(heights), len(heights[0])
	newGrid := func() [][]bool {
		g := make([][]bool, m)
		for i := range g {
			g[i] = make([]bool, n)
		}
		return g
	}
	pac, atl := newGrid(), newGrid()
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	var dfs func(r, c int, seen [][]bool)
	dfs = func(r, c int, seen [][]bool) {
		if seen[r][c] {
			return
		}
		seen[r][c] = true
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			// поднимаемся только в клетки не ниже — вода из них стечёт к нам
			if nr >= 0 && nc >= 0 && nr < m && nc < n && heights[nr][nc] >= heights[r][c] {
				dfs(nr, nc, seen)
			}
		}
	}
	for r := 0; r < m; r++ {
		dfs(r, 0, pac)
		dfs(r, n-1, atl)
	}
	for c := 0; c < n; c++ {
		dfs(0, c, pac)
		dfs(m-1, c, atl)
	}
	res := [][]int{}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if pac[r][c] && atl[r][c] {
				res = append(res, []int{r, c})
			}
		}
	}
	return res
}
```

### Мультиисточниковый BFS от берегов
Та же идея, но каждый океан обходим BFS, стартуя сразу со всех клеток его берега. Без рекурсии — безопасно для больших матриц.

**Сложность:** время O(m·n), память O(m·n).

```go
func pacificAtlantic(heights [][]int) [][]int {
	m, n := len(heights), len(heights[0])
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	bfs := func(starts [][2]int) [][]bool {
		seen := make([][]bool, m)
		for i := range seen {
			seen[i] = make([]bool, n)
		}
		for _, s := range starts {
			seen[s[0]][s[1]] = true
		}
		queue := starts
		for len(queue) > 0 {
			p := queue[0]
			queue = queue[1:]
			for _, d := range dirs {
				nr, nc := p[0]+d[0], p[1]+d[1]
				if nr >= 0 && nc >= 0 && nr < m && nc < n && !seen[nr][nc] && heights[nr][nc] >= heights[p[0]][p[1]] {
					seen[nr][nc] = true
					queue = append(queue, [2]int{nr, nc})
				}
			}
		}
		return seen
	}
	var pacStart, atlStart [][2]int
	for r := 0; r < m; r++ {
		pacStart = append(pacStart, [2]int{r, 0})
		atlStart = append(atlStart, [2]int{r, n - 1})
	}
	for c := 0; c < n; c++ {
		pacStart = append(pacStart, [2]int{0, c})
		atlStart = append(atlStart, [2]int{m - 1, c})
	}
	pac, atl := bfs(pacStart), bfs(atlStart)
	res := [][]int{}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if pac[r][c] && atl[r][c] {
				res = append(res, []int{r, c})
			}
		}
	}
	return res
}
```

---
id: surrounded-regions
title: Surrounded Regions
difficulty: Medium
category: Graphs
leetcode: 130
lists: neetcode150
algorithms: graph-dfs, union-find
order: 86
---
Дана матрица `board` из `'X'` и `'O'`. Область из `'O'` (связность по 4 направлениям) **окружена**, если она не касается края доски. Замени все окружённые области на `'X'`, изменяя доску на месте.

**Пример:** `board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]` → `[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]`

**Ограничения:** `1 ≤ m, n ≤ 200`.

<details><summary>Подсказка</summary>Проще найти неокружённые: это все `'O'`, достижимые от края. Остальные — захватываем.</details>

### DFS от границы
Запускаем DFS от каждой `'O'` на краю и помечаем всю её область временным символом `'S'` (спасена). Затем одним проходом: оставшиеся `'O'` → `'X'`, а `'S'` → обратно `'O'`.

**Сложность:** время O(m·n), память O(m·n) на рекурсию.

```go
func solve(board [][]byte) {
	m, n := len(board), len(board[0])
	var mark func(r, c int)
	mark = func(r, c int) {
		if r < 0 || c < 0 || r >= m || c >= n || board[r][c] != 'O' {
			return
		}
		board[r][c] = 'S' // связана с краем — не захватывается
		mark(r+1, c)
		mark(r-1, c)
		mark(r, c+1)
		mark(r, c-1)
	}
	for r := 0; r < m; r++ {
		mark(r, 0)
		mark(r, n-1)
	}
	for c := 0; c < n; c++ {
		mark(0, c)
		mark(m-1, c)
	}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			switch board[r][c] {
			case 'O':
				board[r][c] = 'X'
			case 'S':
				board[r][c] = 'O'
			}
		}
	}
}
```

### Union-Find с фиктивной вершиной «край»
Заводим дополнительную вершину `edge = m·n`. Каждую `'O'` на краю объединяем с ней, соседние `'O'` — между собой. В конце захватываем все `'O'`, чей корень не совпадает с корнем `edge`.

**Сложность:** время O(m·n·α(m·n)), память O(m·n).

```go
func solve(board [][]byte) {
	m, n := len(board), len(board[0])
	parent := make([]int, m*n+1)
	for i := range parent {
		parent[i] = i
	}
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	union := func(a, b int) {
		parent[find(a)] = find(b)
	}
	edge := m * n // фиктивная вершина «связано с краем»
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if board[r][c] != 'O' {
				continue
			}
			id := r*n + c
			if r == 0 || c == 0 || r == m-1 || c == n-1 {
				union(id, edge)
			}
			if r+1 < m && board[r+1][c] == 'O' {
				union(id, id+n)
			}
			if c+1 < n && board[r][c+1] == 'O' {
				union(id, id+1)
			}
		}
	}
	safe := find(edge)
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if board[r][c] == 'O' && find(r*n+c) != safe {
				board[r][c] = 'X'
			}
		}
	}
}
```

---
id: course-schedule
title: Course Schedule
difficulty: Medium
category: Graphs
leetcode: 207
lists: neetcode150, blind75
algorithms: topological-sort, graph-dfs
order: 87
---
Есть `numCourses` курсов `0..numCourses-1` и список `prerequisites`, где `[a, b]` означает: чтобы пройти `a`, нужно сначала пройти `b`. Можно ли пройти все курсы?

**Пример:** `numCourses = 2, prerequisites = [[1,0]]` → `true`

**Пример:** `numCourses = 2, prerequisites = [[1,0],[0,1]]` → `false` (цикл)

**Ограничения:** `1 ≤ numCourses ≤ 2000`, `0 ≤ len(prerequisites) ≤ 5000`, все пары различны.

<details><summary>Подсказка</summary>Курсы — вершины, зависимости — рёбра. Пройти все можно тогда и только тогда, когда в графе нет цикла.</details>

### Алгоритм Кана (BFS по входящим степеням)
Строим рёбра `b → a` и считаем входящие степени. В очередь кладём курсы без пререквизитов; «проходя» курс, уменьшаем степени его последователей. Если удалось пройти все `numCourses` — цикла нет.

**Сложность:** время O(V + E), память O(V + E).

```go
func canFinish(numCourses int, prerequisites [][]int) bool {
	adj := make([][]int, numCourses)
	indeg := make([]int, numCourses)
	for _, p := range prerequisites {
		adj[p[1]] = append(adj[p[1]], p[0])
		indeg[p[0]]++
	}
	var queue []int
	for i, d := range indeg {
		if d == 0 {
			queue = append(queue, i)
		}
	}
	taken := 0
	for len(queue) > 0 {
		u := queue[0]
		queue = queue[1:]
		taken++
		for _, v := range adj[u] {
			indeg[v]--
			if indeg[v] == 0 { // все пререквизиты v пройдены
				queue = append(queue, v)
			}
		}
	}
	return taken == numCourses // в цикле степени никогда не обнулятся
}
```

### DFS с тремя цветами
Вершина бывает: 0 — не посещена, 1 — в текущем стеке рекурсии, 2 — полностью обработана. Если DFS приходит в вершину с цветом 1, найдено обратное ребро — цикл.

**Сложность:** время O(V + E), память O(V + E).

```go
func canFinish(numCourses int, prerequisites [][]int) bool {
	adj := make([][]int, numCourses)
	for _, p := range prerequisites {
		adj[p[1]] = append(adj[p[1]], p[0])
	}
	state := make([]int8, numCourses) // 0 — белая, 1 — серая (в стеке), 2 — чёрная
	var hasCycle func(u int) bool
	hasCycle = func(u int) bool {
		switch state[u] {
		case 1:
			return true // вернулись в вершину текущего пути — цикл
		case 2:
			return false
		}
		state[u] = 1
		for _, v := range adj[u] {
			if hasCycle(v) {
				return true
			}
		}
		state[u] = 2
		return false
	}
	for u := 0; u < numCourses; u++ {
		if hasCycle(u) {
			return false
		}
	}
	return true
}
```

---
id: course-schedule-ii
title: Course Schedule II
difficulty: Medium
category: Graphs
leetcode: 210
lists: neetcode150
algorithms: topological-sort, graph-dfs
order: 88
---
Условие как в Course Schedule, но нужно вернуть **порядок** прохождения всех курсов. Если вариантов несколько — любой; если пройти все невозможно — пустой массив.

**Пример:** `numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]` → `[0,1,2,3]` или `[0,2,1,3]`

**Пример:** `numCourses = 2, prerequisites = [[1,0],[0,1]]` → `[]`

**Ограничения:** `1 ≤ numCourses ≤ 2000`, `0 ≤ len(prerequisites) ≤ numCourses·(numCourses−1)`.

<details><summary>Подсказка</summary>Это топологическая сортировка: порядок, в котором Кан извлекает вершины, и есть ответ.</details>

### Алгоритм Кана
Тот же BFS по входящим степеням, только записываем порядок извлечения из очереди. Если записано меньше `numCourses` вершин — есть цикл.

**Сложность:** время O(V + E), память O(V + E).

```go
func findOrder(numCourses int, prerequisites [][]int) []int {
	adj := make([][]int, numCourses)
	indeg := make([]int, numCourses)
	for _, p := range prerequisites {
		adj[p[1]] = append(adj[p[1]], p[0])
		indeg[p[0]]++
	}
	order := make([]int, 0, numCourses)
	for i, d := range indeg {
		if d == 0 {
			order = append(order, i)
		}
	}
	// order одновременно служит очередью: head — её начало
	for head := 0; head < len(order); head++ {
		for _, v := range adj[order[head]] {
			indeg[v]--
			if indeg[v] == 0 {
				order = append(order, v)
			}
		}
	}
	if len(order) < numCourses {
		return []int{}
	}
	return order
}
```

### DFS: сначала пререквизиты, потом курс
Храним для каждого курса список его пререквизитов. DFS сперва проходит все пререквизиты и только после этого добавляет курс в ответ — получается корректный порядок. Серый цвет (вершина в стеке) ловит цикл.

**Сложность:** время O(V + E), память O(V + E).

```go
func findOrder(numCourses int, prerequisites [][]int) []int {
	need := make([][]int, numCourses) // need[a] — что нужно пройти до a
	for _, p := range prerequisites {
		need[p[0]] = append(need[p[0]], p[1])
	}
	state := make([]int8, numCourses) // 0 — белая, 1 — серая, 2 — чёрная
	order := make([]int, 0, numCourses)
	var visit func(u int) bool
	visit = func(u int) bool {
		if state[u] == 1 {
			return false // цикл
		}
		if state[u] == 2 {
			return true
		}
		state[u] = 1
		for _, v := range need[u] {
			if !visit(v) {
				return false
			}
		}
		state[u] = 2
		order = append(order, u) // все пререквизиты уже в ответе
		return true
	}
	for u := 0; u < numCourses; u++ {
		if !visit(u) {
			return []int{}
		}
	}
	return order
}
```

---
id: graph-valid-tree
title: Graph Valid Tree
difficulty: Medium
category: Graphs
leetcode: 261
lists: neetcode150, blind75
algorithms: union-find, graph-dfs
order: 89
---
Дано `n` вершин `0..n-1` и список неориентированных рёбер `edges`. Верни `true`, если эти рёбра образуют корректное **дерево**: граф связный и без циклов.

**Пример:** `n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]` → `true`

**Пример:** `n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]` → `false`

**Ограничения:** `1 ≤ n ≤ 2000`, `0 ≤ len(edges) ≤ 5000`, нет петель и повторных рёбер.

<details><summary>Подсказка</summary>У дерева ровно n−1 ребро. При этом условии достаточно проверить связность (или отсутствие циклов).</details>

### Union-Find
Если рёбер не `n−1` — точно не дерево. Иначе добавляем рёбра в DSU: если концы ребра уже в одном множестве, ребро замыкает цикл. Без циклов `n−1` ребро гарантирует связность.

**Сложность:** время O(n·α(n)), память O(n).

```go
func validTree(n int, edges [][]int) bool {
	if len(edges) != n-1 {
		return false
	}
	parent := make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	for _, e := range edges {
		ra, rb := find(e[0]), find(e[1])
		if ra == rb {
			return false // концы уже связаны — ребро даёт цикл
		}
		parent[ra] = rb
	}
	return true
}
```

### DFS на связность
При `n−1` рёбрах граф — дерево тогда и только тогда, когда он связный. Запускаем DFS из вершины 0 и проверяем, что посетили все вершины.

**Сложность:** время O(n), память O(n).

```go
func validTree(n int, edges [][]int) bool {
	if len(edges) != n-1 { // у дерева ровно n−1 ребро
		return false
	}
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	seen := make([]bool, n)
	var dfs func(u int)
	dfs = func(u int) {
		seen[u] = true
		for _, v := range adj[u] {
			if !seen[v] {
				dfs(v)
			}
		}
	}
	dfs(0)
	for _, s := range seen {
		if !s {
			return false
		}
	}
	return true
}
```

---
id: number-of-connected-components-in-an-undirected-graph
title: Number of Connected Components in an Undirected Graph
difficulty: Medium
category: Graphs
leetcode: 323
lists: neetcode150, blind75
algorithms: union-find, graph-dfs
order: 90
---
Дано `n` вершин `0..n-1` и список неориентированных рёбер `edges`. Верни количество компонент связности.

**Пример:** `n = 5, edges = [[0,1],[1,2],[3,4]]` → `2`

**Пример:** `n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]` → `1`

**Ограничения:** `1 ≤ n ≤ 2000`, `1 ≤ len(edges) ≤ 5000`, нет повторных рёбер.

<details><summary>Подсказка</summary>Начни с n компонент; каждое ребро, соединяющее разные компоненты, уменьшает их число на 1.</details>

### Union-Find
Изначально каждая вершина — своя компонента, `count = n`. Для каждого ребра объединяем множества концов; если они были разными, `count--`.

**Сложность:** время O((V + E)·α(V)), память O(V).

```go
func countComponents(n int, edges [][]int) int {
	parent := make([]int, n)
	size := make([]int, n)
	for i := range parent {
		parent[i], size[i] = i, 1
	}
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	count := n
	for _, e := range edges {
		ra, rb := find(e[0]), find(e[1])
		if ra == rb {
			continue
		}
		if size[ra] < size[rb] { // меньшее дерево подвешиваем к большему
			ra, rb = rb, ra
		}
		parent[rb] = ra
		size[ra] += size[rb]
		count--
	}
	return count
}
```

### DFS по списку смежности
Строим список смежности; для каждой непосещённой вершины запускаем DFS, который отмечает всю её компоненту. Число запусков — ответ.

**Сложность:** время O(V + E), память O(V + E).

```go
func countComponents(n int, edges [][]int) int {
	adj := make([][]int, n)
	for _, e := range edges {
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	seen := make([]bool, n)
	var dfs func(u int)
	dfs = func(u int) {
		seen[u] = true
		for _, v := range adj[u] {
			if !seen[v] {
				dfs(v)
			}
		}
	}
	count := 0
	for u := 0; u < n; u++ {
		if !seen[u] {
			count++ // новая компонента
			dfs(u)
		}
	}
	return count
}
```

---
id: redundant-connection
title: Redundant Connection
difficulty: Medium
category: Graphs
leetcode: 684
lists: neetcode150
algorithms: union-find, graph-dfs
order: 91
---
Граф был деревом из `n` вершин `1..n`, к которому добавили одно лишнее ребро. Дан список рёбер `edges` длины `n`. Верни ребро, удаление которого снова делает граф деревом; если вариантов несколько — то, что встречается в списке **последним**.

**Пример:** `edges = [[1,2],[1,3],[2,3]]` → `[2,3]`

**Пример:** `edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]` → `[1,4]`

**Ограничения:** `3 ≤ n ≤ 1000`, граф связный, повторных рёбер нет.

<details><summary>Подсказка</summary>Добавляй рёбра по очереди: первое ребро, концы которого уже связаны, и есть ответ.</details>

### Union-Find
Добавляем рёбра по порядку. Первое ребро, у которого концы уже в одном множестве, замыкает единственный цикл — и оно же последнее из рёбер цикла во входном списке, поэтому именно его и нужно вернуть.

**Сложность:** время O(n·α(n)), память O(n).

```go
func findRedundantConnection(edges [][]int) []int {
	parent := make([]int, len(edges)+1) // вершины нумеруются с 1
	for i := range parent {
		parent[i] = i
	}
	find := func(x int) int {
		for parent[x] != x {
			parent[x] = parent[parent[x]]
			x = parent[x]
		}
		return x
	}
	for _, e := range edges {
		ra, rb := find(e[0]), find(e[1])
		if ra == rb {
			return e // концы уже связаны — это лишнее ребро
		}
		parent[ra] = rb
	}
	return nil
}
```

### DFS перед добавлением каждого ребра
Строим граф постепенно. Перед добавлением ребра `(u, v)` проверяем DFS, есть ли уже путь из `u` в `v`. Если есть — ребро лишнее.

**Сложность:** время O(n²), память O(n).

```go
func findRedundantConnection(edges [][]int) []int {
	n := len(edges)
	adj := make([][]int, n+1)
	var connected func(u, target int, seen []bool) bool
	connected = func(u, target int, seen []bool) bool {
		if u == target {
			return true
		}
		seen[u] = true
		for _, v := range adj[u] {
			if !seen[v] && connected(v, target, seen) {
				return true
			}
		}
		return false
	}
	for _, e := range edges {
		if connected(e[0], e[1], make([]bool, n+1)) {
			return e // путь уже есть — ребро создаёт цикл
		}
		adj[e[0]] = append(adj[e[0]], e[1])
		adj[e[1]] = append(adj[e[1]], e[0])
	}
	return nil
}
```

---
id: word-ladder
title: Word Ladder
difficulty: Hard
category: Graphs
leetcode: 127
lists: neetcode150
algorithms: graph-bfs, hashing
order: 92
---
Даны слова `beginWord`, `endWord` и словарь `wordList`. За один шаг можно изменить ровно одну букву, при этом каждое промежуточное слово должно быть в словаре (`beginWord` — не обязательно). Верни число слов в **кратчайшей** цепочке от `beginWord` до `endWord` или `0`, если её нет.

**Пример:** `beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]` → `5` (hit → hot → dot → dog → cog)

**Пример:** тот же, но без `"cog"` в словаре → `0`

**Ограничения:** `1 ≤ len(word) ≤ 10`, `1 ≤ len(wordList) ≤ 5000`, все слова одной длины из строчных букв.

<details><summary>Подсказка</summary>Слова — вершины, рёбра — отличие в одной букве. Кратчайший путь в невзвешенном графе — BFS.</details>

### BFS с шаблонами-джокерами
Чтобы быстро находить соседей, группируем слова по шаблонам с `*` на месте одной буквы: `hot` → `*ot`, `h*t`, `ho*`. Соседи слова — все слова из его шаблонов. Дальше обычный BFS по уровням; использованный шаблон удаляем, чтобы не просматривать его снова.

**Сложность:** время O(N·L²), память O(N·L²), где N — размер словаря, L — длина слова.

```go
func ladderLength(beginWord string, endWord string, wordList []string) int {
	patterns := map[string][]string{} // "h*t" → ["hot", "hit", ...]
	hasEnd := false
	for _, w := range wordList {
		if w == endWord {
			hasEnd = true
		}
		b := []byte(w)
		for i := range b {
			ch := b[i]
			b[i] = '*'
			patterns[string(b)] = append(patterns[string(b)], w)
			b[i] = ch
		}
	}
	if !hasEnd {
		return 0
	}
	visited := map[string]bool{beginWord: true}
	queue := []string{beginWord}
	for steps := 1; len(queue) > 0; steps++ {
		var next []string
		for _, w := range queue {
			if w == endWord {
				return steps
			}
			b := []byte(w)
			for i := range b {
				ch := b[i]
				b[i] = '*'
				p := string(b)
				b[i] = ch
				for _, nw := range patterns[p] {
					if !visited[nw] {
						visited[nw] = true
						next = append(next, nw)
					}
				}
				delete(patterns, p) // все слова шаблона уже в очереди
			}
		}
		queue = next
	}
	return 0
}
```

### Двунаправленный BFS
Растим два фронта — от начала и от конца — и всегда расширяем меньший. Соседей генерируем перебором 26 букв в каждой позиции. Как только слово из одного фронта найдено в другом, пути встретились. Фронты растут экспоненциально, поэтому две «полуволны» намного дешевле одной полной.

**Сложность:** время O(N·L·26) в худшем случае, на практике значительно быстрее; память O(N).

```go
func ladderLength(beginWord string, endWord string, wordList []string) int {
	dict := make(map[string]bool, len(wordList))
	for _, w := range wordList {
		dict[w] = true
	}
	if !dict[endWord] {
		return 0
	}
	delete(dict, beginWord)
	delete(dict, endWord)
	front := map[string]bool{beginWord: true}
	back := map[string]bool{endWord: true}
	for steps := 1; len(front) > 0 && len(back) > 0; steps++ {
		if len(front) > len(back) {
			front, back = back, front // расширяем меньший фронт
		}
		next := map[string]bool{}
		for w := range front {
			b := []byte(w)
			for i := range b {
				orig := b[i]
				for ch := byte('a'); ch <= 'z'; ch++ {
					if ch == orig {
						continue
					}
					b[i] = ch
					s := string(b)
					if back[s] {
						return steps + 1 // фронты встретились
					}
					if dict[s] {
						delete(dict, s) // посещено
						next[s] = true
					}
				}
				b[i] = orig
			}
		}
		front = next
	}
	return 0
}
```
