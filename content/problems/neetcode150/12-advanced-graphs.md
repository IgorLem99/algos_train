---
id: network-delay-time
title: Network Delay Time
difficulty: Medium
category: Advanced Graphs
leetcode: 743
lists: neetcode150
algorithms: dijkstra, bellman-ford, heap
order: 93
---
Дана сеть из `n` узлов `1..n` и список направленных рёбер `times[i] = [u, v, w]` — сигнал идёт от `u` к `v` за время `w`. Сигнал отправляют из узла `k`. Верни минимальное время, за которое его получат **все** узлы, или `-1`, если это невозможно.

**Пример:** `times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2` → `2`

**Пример:** `times = [[1,2,1]], n = 2, k = 2` → `-1`

**Ограничения:** `1 ≤ n ≤ 100`, `1 ≤ len(times) ≤ 6000`, `0 ≤ w ≤ 100`.

<details><summary>Подсказка</summary>Нужны кратчайшие расстояния от k до всех вершин; ответ — максимальное из них.</details>

### Дейкстра с кучей
Веса неотрицательные — классический Дейкстра. Достаём из min-кучи вершину с наименьшим расстоянием и релаксируем её рёбра. Устаревшие записи в куче (расстояние больше уже найденного) просто пропускаем.

**Сложность:** время O(E·log E), память O(V + E).

```go
type item struct{ node, dist int }

type minHeap []item

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].dist < h[j].dist }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func networkDelayTime(times [][]int, n int, k int) int {
	adj := make([][][2]int, n+1) // adj[u] = {v, w}
	for _, t := range times {
		adj[t[0]] = append(adj[t[0]], [2]int{t[1], t[2]})
	}
	dist := make([]int, n+1)
	for i := range dist {
		dist[i] = math.MaxInt
	}
	dist[k] = 0
	h := &minHeap{{k, 0}}
	for h.Len() > 0 {
		cur := heap.Pop(h).(item)
		if cur.dist > dist[cur.node] {
			continue // устаревшая запись
		}
		for _, e := range adj[cur.node] {
			if nd := cur.dist + e[1]; nd < dist[e[0]] {
				dist[e[0]] = nd
				heap.Push(h, item{e[0], nd})
			}
		}
	}
	res := 0
	for i := 1; i <= n; i++ {
		if dist[i] == math.MaxInt {
			return -1 // узел недостижим
		}
		res = max(res, dist[i])
	}
	return res
}
```

### Беллман — Форд
До `n−1` раз проходим по всем рёбрам и релаксируем их: кратчайший путь содержит не больше `n−1` ребра. Если за проход ничего не изменилось — можно остановиться раньше. Проще Дейкстры и работает с отрицательными весами, но медленнее.

**Сложность:** время O(V·E), память O(V).

```go
func networkDelayTime(times [][]int, n int, k int) int {
	const inf = math.MaxInt / 2 // запас, чтобы inf + w не переполнилось
	dist := make([]int, n+1)
	for i := range dist {
		dist[i] = inf
	}
	dist[k] = 0
	for round := 1; round < n; round++ {
		changed := false
		for _, t := range times {
			if dist[t[0]]+t[2] < dist[t[1]] {
				dist[t[1]] = dist[t[0]] + t[2]
				changed = true
			}
		}
		if !changed {
			break
		}
	}
	res := 0
	for i := 1; i <= n; i++ {
		if dist[i] == inf {
			return -1
		}
		res = max(res, dist[i])
	}
	return res
}
```

---
id: reconstruct-itinerary
title: Reconstruct Itinerary
difficulty: Hard
category: Advanced Graphs
leetcode: 332
lists: neetcode150
algorithms: graph-dfs, backtracking
order: 94
---
Дан список авиабилетов `tickets[i] = [from, to]`. Восстанови маршрут, который начинается в `"JFK"` и использует **все** билеты ровно по одному разу. Если маршрутов несколько — верни лексикографически наименьший. Гарантируется, что хотя бы один маршрут существует.

**Пример:** `tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]` → `["JFK","MUC","LHR","SFO","SJC"]`

**Пример:** `tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]` → `["JFK","ATL","JFK","SFO","ATL","SFO"]`

**Ограничения:** `1 ≤ len(tickets) ≤ 300`, коды аэропортов — 3 заглавные буквы.

<details><summary>Подсказка</summary>Это эйлеров путь в ориентированном графе. Алгоритм Хиргольцера: DFS, добавляющий вершину в ответ при выходе, затем разворот.</details>

### Бэктрекинг в лексикографическом порядке
Сортируем билеты и пробуем вылеты из текущего аэропорта по алфавиту. Первый найденный полный маршрут — лексикографически наименьший. Если зашли в тупик — откатываем билет. Одинаковые билеты на одном уровне пробуем один раз.

**Сложность:** время экспоненциальное в худшем случае, память O(E).

```go
func findItinerary(tickets [][]string) []string {
	sort.Slice(tickets, func(i, j int) bool {
		if tickets[i][0] != tickets[j][0] {
			return tickets[i][0] < tickets[j][0]
		}
		return tickets[i][1] < tickets[j][1]
	})
	adj := map[string][]int{} // аэропорт → индексы билетов по алфавиту назначения
	for i, t := range tickets {
		adj[t[0]] = append(adj[t[0]], i)
	}
	used := make([]bool, len(tickets))
	route := []string{"JFK"}
	var dfs func(a string) bool
	dfs = func(a string) bool {
		if len(route) == len(tickets)+1 {
			return true
		}
		prev := ""
		for _, i := range adj[a] {
			to := tickets[i][1]
			if used[i] || to == prev {
				continue // такой же билет уже пробовали — результат будет тем же
			}
			used[i] = true
			route = append(route, to)
			if dfs(to) {
				return true
			}
			route = route[:len(route)-1]
			used[i] = false
			prev = to
		}
		return false
	}
	dfs("JFK")
	return route
}
```

### Алгоритм Хиргольцера
Маршрут, использующий все рёбра ровно раз, — эйлеров путь. Идём DFS, всегда выбирая наименьшее непройденное направление и **удаляя** ребро. Вершину добавляем в ответ, когда из неё больше некуда лететь, — тупиковые «ответвления» так попадают в конец пути. В конце разворачиваем ответ.

**Сложность:** время O(E·log E) из-за сортировки, память O(E).

```go
func findItinerary(tickets [][]string) []string {
	adj := map[string][]string{}
	for _, t := range tickets {
		adj[t[0]] = append(adj[t[0]], t[1])
	}
	for _, dests := range adj {
		// по убыванию: наименьшее направление снимаем с конца за O(1)
		sort.Sort(sort.Reverse(sort.StringSlice(dests)))
	}
	var route []string
	var visit func(a string)
	visit = func(a string) {
		for len(adj[a]) > 0 {
			last := len(adj[a]) - 1
			next := adj[a][last]
			adj[a] = adj[a][:last] // ребро использовано
			visit(next)
		}
		route = append(route, a) // из a лететь некуда — добавляем при выходе
	}
	visit("JFK")
	slices.Reverse(route)
	return route
}
```

---
id: min-cost-to-connect-all-points
title: Min Cost to Connect All Points
difficulty: Medium
category: Advanced Graphs
leetcode: 1584
lists: neetcode150
algorithms: mst, union-find
order: 95
---
Даны точки на плоскости `points[i] = [x, y]`. Стоимость соединения двух точек — манхэттенское расстояние `|x1−x2| + |y1−y2|`. Верни минимальную стоимость, чтобы соединить все точки (между любыми двумя ровно один простой путь).

**Пример:** `points = [[0,0],[2,2],[3,10],[5,2],[7,0]]` → `20`

**Пример:** `points = [[3,12],[-2,5],[-4,1]]` → `18`

**Ограничения:** `1 ≤ n ≤ 1000`, `-10⁶ ≤ x, y ≤ 10⁶`, точки различны.

<details><summary>Подсказка</summary>Это минимальное остовное дерево полного графа. Граф плотный — Прим за O(n²) без кучи подходит идеально.</details>

### Алгоритм Прима за O(n²)
Растим дерево от точки 0. Для каждой точки вне дерева храним `dist` — минимальное расстояние до дерева. На каждом шаге добавляем ближайшую точку и обновляем `dist` остальных через неё. Для полного графа это оптимальнее, чем куча.

**Сложность:** время O(n²), память O(n).

```go
func minCostConnectPoints(points [][]int) int {
	n := len(points)
	dist := make([]int, n) // dist[v] — минимальное ребро от v до дерева
	for i := range dist {
		dist[i] = math.MaxInt
	}
	inTree := make([]bool, n)
	dist[0] = 0
	total := 0
	for step := 0; step < n; step++ {
		u := -1
		for v := 0; v < n; v++ {
			if !inTree[v] && (u == -1 || dist[v] < dist[u]) {
				u = v
			}
		}
		inTree[u] = true
		total += dist[u]
		for v := 0; v < n; v++ {
			if !inTree[v] {
				d := abs(points[u][0]-points[v][0]) + abs(points[u][1]-points[v][1])
				dist[v] = min(dist[v], d)
			}
		}
	}
	return total
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
```

### Алгоритм Краскала
Выписываем все n·(n−1)/2 рёбер, сортируем по весу и добавляем по возрастанию, если ребро соединяет разные компоненты (проверка через DSU). Останавливаемся на n−1 ребре.

**Сложность:** время O(n²·log n), память O(n²).

```go
func minCostConnectPoints(points [][]int) int {
	n := len(points)
	type edge struct{ w, u, v int }
	edges := make([]edge, 0, n*(n-1)/2)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			w := abs(points[i][0]-points[j][0]) + abs(points[i][1]-points[j][1])
			edges = append(edges, edge{w, i, j})
		}
	}
	sort.Slice(edges, func(a, b int) bool { return edges[a].w < edges[b].w })

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
	total, used := 0, 0
	for _, e := range edges {
		if used == n-1 {
			break // дерево построено
		}
		ru, rv := find(e.u), find(e.v)
		if ru == rv {
			continue // ребро замкнуло бы цикл
		}
		parent[ru] = rv
		total += e.w
		used++
	}
	return total
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
```

---
id: swim-in-rising-water
title: Swim in Rising Water
difficulty: Hard
category: Advanced Graphs
leetcode: 778
lists: neetcode150
algorithms: dijkstra, binary-search, union-find
order: 96
---
Дана сетка `n × n`, `grid[i][j]` — высота клетки (все высоты — перестановка `0..n²−1`). В момент `t` уровень воды равен `t`, и плыть между соседними клетками можно, если высоты обеих `≤ t`. Верни минимальное `t`, при котором можно доплыть из `(0,0)` в `(n−1,n−1)`.

**Пример:** `grid = [[0,2],[1,3]]` → `3`

**Пример:** `grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]` → `16`

**Ограничения:** `1 ≤ n ≤ 50`.

<details><summary>Подсказка</summary>Нужен путь, минимизирующий максимальную высоту на нём. Дейкстра, где «длина пути» — максимум, а не сумма.</details>

### Дейкстра по максимуму на пути
Стоимость пути — максимальная высота на нём. Достаём из min-кучи клетку с наименьшей такой стоимостью и расширяемся в соседей со стоимостью `max(t, высота соседа)`. Первое извлечение правого нижнего угла — ответ.

**Сложность:** время O(n²·log n), память O(n²).

```go
type cell struct{ t, r, c int }

type minHeap []cell

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].t < h[j].t }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(cell)) }
func (h *minHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func swimInWater(grid [][]int) int {
	n := len(grid)
	seen := make([][]bool, n)
	for i := range seen {
		seen[i] = make([]bool, n)
	}
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	h := &minHeap{{grid[0][0], 0, 0}}
	seen[0][0] = true
	for {
		cur := heap.Pop(h).(cell)
		if cur.r == n-1 && cur.c == n-1 {
			return cur.t
		}
		for _, d := range dirs {
			nr, nc := cur.r+d[0], cur.c+d[1]
			if nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc] {
				continue
			}
			seen[nr][nc] = true
			// время пути = максимальная высота на нём
			heap.Push(h, cell{max(cur.t, grid[nr][nc]), nr, nc})
		}
	}
}
```

### Бинарный поиск по ответу + BFS
Если доплыть можно к моменту `t`, то можно и к любому большему — монотонность. Бинарным поиском ищем минимальное `t` в `[0, n²−1]`, проверяя достижимость BFS только по клеткам с высотой `≤ t`.

**Сложность:** время O(n²·log n), память O(n²).

```go
func swimInWater(grid [][]int) int {
	n := len(grid)
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	canReach := func(t int) bool {
		if grid[0][0] > t {
			return false
		}
		seen := make([]bool, n*n)
		seen[0] = true
		queue := []int{0}
		for len(queue) > 0 {
			id := queue[0]
			queue = queue[1:]
			r, c := id/n, id%n
			if r == n-1 && c == n-1 {
				return true
			}
			for _, d := range dirs {
				nr, nc := r+d[0], c+d[1]
				if nr >= 0 && nc >= 0 && nr < n && nc < n && !seen[nr*n+nc] && grid[nr][nc] <= t {
					seen[nr*n+nc] = true
					queue = append(queue, nr*n+nc)
				}
			}
		}
		return false
	}
	lo, hi := 0, n*n-1
	for lo < hi {
		mid := (lo + hi) / 2
		if canReach(mid) {
			hi = mid // mid подходит — ищем меньше
		} else {
			lo = mid + 1
		}
	}
	return lo
}
```

### Union-Find в порядке подъёма воды
Высоты — перестановка `0..n²−1`, поэтому в момент `t` «открывается» ровно одна клетка. Открываем клетки по возрастанию высоты и объединяем с уже открытыми соседями. Первый момент, когда углы оказались в одном множестве, — ответ.

**Сложность:** время O(n²·α(n²)), память O(n²).

```go
func swimInWater(grid [][]int) int {
	n := len(grid)
	pos := make([]int, n*n) // pos[h] — клетка с высотой h
	for r := 0; r < n; r++ {
		for c := 0; c < n; c++ {
			pos[grid[r][c]] = r*n + c
		}
	}
	parent := make([]int, n*n)
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
	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	for t := 0; t < n*n; t++ {
		id := pos[t]
		r, c := id/n, id%n
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] <= t { // сосед уже под водой
				parent[find(id)] = find(nr*n + nc)
			}
		}
		if find(0) == find(n*n-1) {
			return t
		}
	}
	return n*n - 1
}
```

---
id: alien-dictionary
title: Alien Dictionary
difficulty: Hard
category: Advanced Graphs
leetcode: 269
lists: neetcode150, blind75
algorithms: topological-sort, graph-dfs
order: 97
---
В инопланетном языке используются строчные латинские буквы, но в неизвестном порядке. Дан список слов `words`, отсортированный лексикографически по правилам этого языка. Восстанови порядок букв (любой подходящий). Если порядок противоречив — верни `""`.

**Пример:** `words = ["wrt","wrf","er","ett","rftt"]` → `"wertf"`

**Пример:** `words = ["z","x","z"]` → `""` (цикл z < x < z)

**Пример:** `words = ["abc","ab"]` → `""` (длинное слово перед своим префиксом)

**Ограничения:** `1 ≤ len(words) ≤ 100`, `1 ≤ len(words[i]) ≤ 100`.

<details><summary>Подсказка</summary>Соседние слова дают одно ребро: первая различающаяся буква первого слова идёт раньше. Дальше — топологическая сортировка.</details>

### Алгоритм Кана
Сравниваем каждую пару соседних слов: первая отличающаяся позиция даёт ребро `a[j] → b[j]`. Отдельно ловим некорректный случай «слово стоит перед своим собственным префиксом». Затем топологическая сортировка BFS по входящим степеням; если вывели не все буквы — есть цикл.

**Сложность:** время O(C), где C — суммарная длина слов (алфавит фиксирован), память O(1).

```go
func alienOrder(words []string) string {
	var present [26]bool
	var adj [26][26]bool
	var indeg [26]int
	total := 0
	for _, w := range words {
		for i := 0; i < len(w); i++ {
			if !present[w[i]-'a'] {
				present[w[i]-'a'] = true
				total++
			}
		}
	}
	for i := 0; i+1 < len(words); i++ {
		a, b := words[i], words[i+1]
		j := 0
		for j < len(a) && j < len(b) && a[j] == b[j] {
			j++
		}
		if j == len(a) || j == len(b) {
			if len(a) > len(b) {
				return "" // "abc" перед "ab" — противоречие
			}
			continue
		}
		u, v := a[j]-'a', b[j]-'a'
		if !adj[u][v] { // кратные рёбра не считаем дважды
			adj[u][v] = true
			indeg[v]++
		}
	}
	var queue []int
	for c := 0; c < 26; c++ {
		if present[c] && indeg[c] == 0 {
			queue = append(queue, c)
		}
	}
	var out []byte
	for len(queue) > 0 {
		u := queue[0]
		queue = queue[1:]
		out = append(out, byte('a'+u))
		for v := 0; v < 26; v++ {
			if adj[u][v] {
				indeg[v]--
				if indeg[v] == 0 {
					queue = append(queue, v)
				}
			}
		}
	}
	if len(out) != total {
		return "" // остался цикл
	}
	return string(out)
}
```

### DFS с тремя цветами
Те же рёбра, но топологический порядок получаем через DFS: букву дописываем после обработки всех её последователей, а в конце разворачиваем. Серая вершина (в текущем стеке) при повторном входе означает цикл.

**Сложность:** время O(C), память O(1).

```go
func alienOrder(words []string) string {
	var present [26]bool
	var adj [26][26]bool
	for _, w := range words {
		for i := 0; i < len(w); i++ {
			present[w[i]-'a'] = true
		}
	}
	for i := 0; i+1 < len(words); i++ {
		a, b := words[i], words[i+1]
		j := 0
		for j < len(a) && j < len(b) && a[j] == b[j] {
			j++
		}
		if j == len(a) || j == len(b) {
			if len(a) > len(b) {
				return ""
			}
			continue
		}
		adj[a[j]-'a'][b[j]-'a'] = true
	}
	var color [26]int // 0 — белая, 1 — серая, 2 — чёрная
	var out []byte
	var dfs func(u int) bool
	dfs = func(u int) bool {
		color[u] = 1
		for v := 0; v < 26; v++ {
			if !adj[u][v] {
				continue
			}
			if color[v] == 1 {
				return false // обратное ребро — цикл
			}
			if color[v] == 0 && !dfs(v) {
				return false
			}
		}
		color[u] = 2
		out = append(out, byte('a'+u)) // все буквы «после» u уже записаны
		return true
	}
	for c := 0; c < 26; c++ {
		if present[c] && color[c] == 0 && !dfs(c) {
			return ""
		}
	}
	slices.Reverse(out)
	return string(out)
}
```

---
id: cheapest-flights-within-k-stops
title: Cheapest Flights Within K Stops
difficulty: Medium
category: Advanced Graphs
leetcode: 787
lists: neetcode150
algorithms: bellman-ford, graph-bfs, dijkstra
order: 98
---
Есть `n` городов и рейсы `flights[i] = [from, to, price]`. Найди самый дешёвый маршрут из `src` в `dst`, содержащий **не более `k` пересадок** (то есть не более `k+1` рейса). Если такого маршрута нет — верни `-1`.

**Пример:** `n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1` → `700`

**Пример:** `n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0` → `500`

**Ограничения:** `1 ≤ n ≤ 100`, `0 ≤ k < n`, `1 ≤ price ≤ 10⁴`.

<details><summary>Подсказка</summary>Беллман — Форд за k+1 раундов: после i раундов известны кратчайшие пути из не более чем i рёбер — если релаксировать от копии прошлого раунда.</details>

### Беллман — Форд с k+1 раундами
Делаем ровно `k+1` раундов релаксации всех рёбер. Ключевая деталь: в раунде читаем расстояния из копии предыдущего раунда, а пишем в новый массив — иначе за один раунд путь может удлиниться сразу на несколько рёбер и нарушить ограничение пересадок.

**Сложность:** время O(k·E), память O(n).

```go
func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {
	const inf = math.MaxInt / 2
	dist := make([]int, n)
	for i := range dist {
		dist[i] = inf
	}
	dist[src] = 0
	for round := 0; round <= k; round++ {
		next := slices.Clone(dist) // читаем dist (прошлый раунд), пишем в next
		for _, f := range flights {
			u, v, w := f[0], f[1], f[2]
			if dist[u] != inf && dist[u]+w < next[v] {
				next[v] = dist[u] + w
			}
		}
		dist = next
	}
	if dist[dst] == inf {
		return -1
	}
	return dist[dst]
}
```

### BFS по числу пересадок
BFS по уровням: уровень i — маршруты из i+1 рейса. В очереди храним пару (город, стоимость именно этого маршрута) и добавляем город, только если нашли путь дешевле лучшего известного — путь дороже и с бо́льшим числом рейсов заведомо бесполезен.

**Сложность:** время O(k·E), память O(n + E).

```go
func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {
	adj := make([][][2]int, n)
	for _, f := range flights {
		adj[f[0]] = append(adj[f[0]], [2]int{f[1], f[2]})
	}
	dist := make([]int, n)
	for i := range dist {
		dist[i] = math.MaxInt
	}
	dist[src] = 0
	queue := [][2]int{{src, 0}} // {город, стоимость пути до него}
	for stops := 0; stops <= k && len(queue) > 0; stops++ {
		var next [][2]int
		for _, p := range queue {
			for _, e := range adj[p[0]] {
				if c := p[1] + e[1]; c < dist[e[0]] {
					dist[e[0]] = c
					next = append(next, [2]int{e[0], c})
				}
			}
		}
		queue = next
	}
	if dist[dst] == math.MaxInt {
		return -1
	}
	return dist[dst]
}
```

### Дейкстра по состояниям (город, число рейсов)
Достаём из кучи самый дешёвый путь. Если это `dst` — ответ найден. Город стоит раскрывать повторно, только если пришли в него за **меньшее** число рейсов, чем раньше: более ранний (дешёвый) путь с не большим числом рейсов доминирует.

**Сложность:** время O(E·k·log(E·k)), память O(E·k).

```go
type state struct{ cost, city, flights int }

type minHeap []state

func (h minHeap) Len() int           { return len(h) }
func (h minHeap) Less(i, j int) bool { return h[i].cost < h[j].cost }
func (h minHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)        { *h = append(*h, x.(state)) }
func (h *minHeap) Pop() any {
	old := *h
	x := old[len(old)-1]
	*h = old[:len(old)-1]
	return x
}

func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {
	adj := make([][][2]int, n)
	for _, f := range flights {
		adj[f[0]] = append(adj[f[0]], [2]int{f[1], f[2]})
	}
	best := make([]int, n) // наименьшее число рейсов, с которым город уже раскрыт
	for i := range best {
		best[i] = math.MaxInt
	}
	h := &minHeap{{0, src, 0}}
	for h.Len() > 0 {
		cur := heap.Pop(h).(state)
		if cur.city == dst {
			return cur.cost
		}
		if cur.flights == k+1 || cur.flights >= best[cur.city] {
			continue // лимит рейсов или уже раскрыт дешевле и не длиннее
		}
		best[cur.city] = cur.flights
		for _, e := range adj[cur.city] {
			heap.Push(h, state{cur.cost + e[1], e[0], cur.flights + 1})
		}
	}
	return -1
}
```
