---
id: number-of-islands
---
```go starter
func numIslands(grid [][]byte) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		grid []string
		want int
	}{
		{[]string{"11000", "11000", "00100", "00011"}, 3},
		{[]string{"11110", "11010", "11000", "00000"}, 1},
		{[]string{"10101"}, 3},
		{[]string{"1"}, 1},
		{[]string{"0"}, 0},
		{[]string{"000", "000", "000"}, 0},
		{[]string{"111", "111"}, 1},
		{[]string{"1010", "0101", "1010", "0101"}, 8},
		{[]string{"1", "0", "1", "1"}, 2},
		{[]string{"11111", "10001", "10101", "10001", "11111"}, 2},
		{[]string{"11111", "00001", "11101", "10001", "11111"}, 1},
	}
	for _, c := range cases {
		t.Case("grid = "+JShow(c.grid), c.want, func() any {
			return numIslands(JBoard(c.grid...))
		})
	}

	// простой подсчёт: BFS с явной очередью и отдельной матрицей посещённых
	count := func(g [][]byte) int {
		m, n := len(g), len(g[0])
		seen := make([][]bool, m)
		for i := range seen {
			seen[i] = make([]bool, n)
		}
		res := 0
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				if g[r][c] != '1' || seen[r][c] {
					continue
				}
				res++
				seen[r][c] = true
				q := [][2]int{{r, c}}
				for len(q) > 0 {
					p := q[0]
					q = q[1:]
					for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
						nr, nc := p[0]+d[0], p[1]+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && g[nr][nc] == '1' && !seen[nr][nc] {
							seen[nr][nc] = true
							q = append(q, [2]int{nr, nc})
						}
					}
				}
			}
		}
		return res
	}
	seed := uint64(88172645463325252)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n int, f func(r, c int) bool) [][]byte {
		g := make([][]byte, m)
		for r := range g {
			g[r] = make([]byte, n)
			for c := range g[r] {
				g[r][c] = '0'
				if f(r, c) {
					g[r][c] = '1'
				}
			}
		}
		return g
	}

	rand1 := gen(300, 300, func(r, c int) bool { return rnd(100) < 55 })
	w1 := count(JClone2(rand1))
	t.Case("grid = 300×300, случайная (55% суши)", w1, func() any {
		return numIslands(JClone2(rand1))
	})
	rand2 := gen(200, 300, func(r, c int) bool { return rnd(100) < 30 })
	w2 := count(JClone2(rand2))
	t.Case("grid = 200×300, случайная (30% суши)", w2, func() any {
		return numIslands(JClone2(rand2))
	})
	t.Case("grid = 300×300, вся суша", 1, func() any {
		return numIslands(gen(300, 300, func(r, c int) bool { return true }))
	})
	t.Case("grid = 300×300, шахматная доска", 45000, func() any {
		return numIslands(gen(300, 300, func(r, c int) bool { return (r+c)%2 == 0 }))
	})
	// «змейка»: один длинный извилистый остров
	t.Case("grid = 299×300, змейка из суши", 1, func() any {
		return numIslands(gen(299, 300, func(r, c int) bool {
			if r%2 == 0 {
				return true
			}
			if r%4 == 1 {
				return c == 299
			}
			return c == 0
		}))
	})
}
```

---
id: max-area-of-island
---
```go starter
func maxAreaOfIsland(grid [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		grid [][]int
		want int
	}{
		{[][]int{{1, 1, 0}, {0, 1, 0}, {0, 0, 1}}, 3},
		{[][]int{{0, 0, 0, 0}}, 0},
		{[][]int{
			{0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0},
			{0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0},
			{0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0},
			{0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0},
			{0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0},
			{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0},
			{0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0},
			{0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0},
		}, 6},
		{[][]int{{1}}, 1},
		{[][]int{{0}}, 0},
		{[][]int{{1, 0, 1}, {0, 1, 0}, {1, 0, 1}}, 1},
		{[][]int{{1, 1}, {1, 1}}, 4},
		{[][]int{{1, 1, 0, 1}, {1, 1, 0, 1}, {0, 0, 0, 1}, {1, 1, 1, 1}}, 7},
		{[][]int{{1}, {1}, {0}, {1}, {1}, {1}}, 3},
	}
	for _, c := range cases {
		t.Case("grid = "+JShow(c.grid), c.want, func() any {
			return maxAreaOfIsland(JClone2(c.grid))
		})
	}

	// простой подсчёт: BFS с отдельной матрицей посещённых
	best := func(g [][]int) int {
		m, n := len(g), len(g[0])
		seen := make([][]bool, m)
		for i := range seen {
			seen[i] = make([]bool, n)
		}
		res := 0
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				if g[r][c] != 1 || seen[r][c] {
					continue
				}
				seen[r][c] = true
				q := [][2]int{{r, c}}
				for i := 0; i < len(q); i++ {
					p := q[i]
					for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
						nr, nc := p[0]+d[0], p[1]+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && g[nr][nc] == 1 && !seen[nr][nc] {
							seen[nr][nc] = true
							q = append(q, [2]int{nr, nc})
						}
					}
				}
				res = max(res, len(q))
			}
		}
		return res
	}
	seed := uint64(2463534242)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n, p int) [][]int {
		g := make([][]int, m)
		for r := range g {
			g[r] = make([]int, n)
			for c := range g[r] {
				if rnd(100) < p {
					g[r][c] = 1
				}
			}
		}
		return g
	}
	for _, s := range []struct{ m, n, p int }{{50, 50, 50}, {50, 50, 58}, {200, 200, 55}, {300, 300, 45}} {
		g := gen(s.m, s.n, s.p)
		want := best(g)
		t.Case(fmt.Sprintf("grid = %d×%d, случайная (%d%% суши)", s.m, s.n, s.p), want, func() any {
			return maxAreaOfIsland(JClone2(g))
		})
	}
	t.Case("grid = 300×300, вся суша", 90000, func() any {
		g := make([][]int, 300)
		for r := range g {
			g[r] = make([]int, 300)
			for c := range g[r] {
				g[r][c] = 1
			}
		}
		return maxAreaOfIsland(g)
	})
}
```

---
id: clone-graph
---
```go types
type Node struct {
	Val       int
	Neighbors []*Node
}
```

```go starter
/**
 * Definition for a Node.
 * type Node struct {
 *     Val int
 *     Neighbors []*Node
 * }
 */
func cloneGraph(node *Node) *Node {

}
```

```go tests
func judgeTests(t *Judge) {
	// build строит граф по списку смежности (вершины 1..n), возвращает все вершины
	build := func(adj [][]int) []*Node {
		nodes := make([]*Node, len(adj))
		for i := range nodes {
			nodes[i] = &Node{Val: i + 1}
		}
		for i, nb := range adj {
			for _, v := range nb {
				nodes[i].Neighbors = append(nodes[i].Neighbors, nodes[v-1])
			}
		}
		return nodes
	}
	// toAdj — список смежности графа, достижимого из root
	toAdj := func(root *Node, n int) ([][]int, string) {
		res := make([][]int, n)
		byVal := map[int]*Node{}
		seen := map[*Node]bool{root: true}
		q := []*Node{root}
		for len(q) > 0 {
			cur := q[0]
			q = q[1:]
			if cur.Val < 1 || cur.Val > n {
				return nil, fmt.Sprintf("лишняя вершина со значением %d", cur.Val)
			}
			if _, dup := byVal[cur.Val]; dup {
				return nil, fmt.Sprintf("две разные вершины со значением %d", cur.Val)
			}
			byVal[cur.Val] = cur
			row := []int{}
			for _, nb := range cur.Neighbors {
				if nb == nil {
					return nil, fmt.Sprintf("nil в списке соседей вершины %d", cur.Val)
				}
				row = append(row, nb.Val)
				if !seen[nb] {
					seen[nb] = true
					q = append(q, nb)
				}
			}
			res[cur.Val-1] = row
		}
		if len(byVal) != n {
			return nil, fmt.Sprintf("в копии %d вершин из %d", len(byVal), n)
		}
		return res, ""
	}
	check := func(name string, adj [][]int) {
		t.Check(name, JShow(adj)+" (новые объекты)", func() (any, bool) {
			if len(adj) == 0 {
				got := cloneGraph(nil)
				if got != nil {
					return fmt.Sprintf("вершина %d вместо nil", got.Val), false
				}
				return [][]int{}, true
			}
			nodes := build(adj)
			got := cloneGraph(nodes[0])
			if got == nil {
				return "nil", false
			}
			orig := map[*Node]bool{}
			for _, nd := range nodes {
				orig[nd] = true
			}
			// ни одна вершина копии не должна быть исходным объектом
			seen := map[*Node]bool{got: true}
			q := []*Node{got}
			for len(q) > 0 {
				cur := q[0]
				q = q[1:]
				if orig[cur] {
					return fmt.Sprintf("вершина %d — исходный объект, а не копия", cur.Val), false
				}
				for _, nb := range cur.Neighbors {
					if nb != nil && !seen[nb] {
						seen[nb] = true
						q = append(q, nb)
					}
				}
			}
			if got.Val != 1 {
				return fmt.Sprintf("возвращена копия вершины %d, а не 1", got.Val), false
			}
			res, bad := toAdj(got, len(adj))
			if bad != "" {
				return bad, false
			}
			// исходный граф не должен измениться
			if o, bad := toAdj(nodes[0], len(adj)); bad != "" || JShow(o) != JShow(adj) {
				return "исходный граф изменён", false
			}
			return res, JShow(res) == JShow(adj)
		})
	}
	check("adjList = [[2,4],[1,3],[2,4],[1,3]]", [][]int{{2, 4}, {1, 3}, {2, 4}, {1, 3}})
	check("adjList = [] (node = nil)", [][]int{})
	check("adjList = [[]]", [][]int{{}})
	check("adjList = [[2],[1]]", [][]int{{2}, {1}})
	check("adjList = [[2,3],[1,3],[1,2]]", [][]int{{2, 3}, {1, 3}, {1, 2}})
	check("adjList = [[2,3,4,5],[1],[1],[1],[1]]", [][]int{{2, 3, 4, 5}, {1}, {1}, {1}, {1}})
	check("adjList = [[5],[3,4],[2],[2,5],[4,1]]", [][]int{{5}, {3, 4}, {2}, {2, 5}, {4, 1}})

	// путь из 100 вершин
	path := make([][]int, 100)
	for i := range path {
		path[i] = []int{}
		if i > 0 {
			path[i] = append(path[i], i)
		}
		if i < 99 {
			path[i] = append(path[i], i+2)
		}
	}
	check("adjList = путь 1-2-…-100", path)
	// полный граф на 100 вершинах
	full := make([][]int, 100)
	for i := range full {
		full[i] = []int{}
		for j := 100; j >= 1; j-- {
			if j != i+1 {
				full[i] = append(full[i], j)
			}
		}
	}
	check("adjList = полный граф на 100 вершинах", full)
	// случайный связный граф: случайное дерево + лишние рёбра
	seed := uint64(1234567)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	n := 100
	has := map[[2]int]bool{}
	rg := make([][]int, n)
	for i := range rg {
		rg[i] = []int{}
	}
	add := func(a, b int) {
		if a == b || has[[2]int{a, b}] {
			return
		}
		has[[2]int{a, b}], has[[2]int{b, a}] = true, true
		rg[a-1] = append(rg[a-1], b)
		rg[b-1] = append(rg[b-1], a)
	}
	for v := 2; v <= n; v++ {
		add(v, 1+rnd(v-1))
	}
	for i := 0; i < 300; i++ {
		add(1+rnd(n), 1+rnd(n))
	}
	check("adjList = случайный связный граф, 100 вершин", rg)
}
```

---
id: walls-and-gates
---
```go starter
func wallsAndGates(rooms [][]int) {

}
```

```go tests
func judgeTests(t *Judge) {
	const INF = 2147483647
	cases := []struct {
		rooms [][]int
		want  [][]int
	}{
		{
			[][]int{{INF, -1, 0, INF}, {INF, INF, INF, -1}, {INF, -1, INF, -1}, {0, -1, INF, INF}},
			[][]int{{3, -1, 0, 1}, {2, 2, 1, -1}, {1, -1, 2, -1}, {0, -1, 3, 4}},
		},
		{[][]int{{-1}}, [][]int{{-1}}},
		{[][]int{{INF}}, [][]int{{INF}}},
		{[][]int{{0}}, [][]int{{0}}},
		{[][]int{{0, INF, INF, INF, 0}}, [][]int{{0, 1, 2, 1, 0}}},
		{[][]int{{0, -1, INF}, {-1, INF, INF}}, [][]int{{0, -1, INF}, {-1, INF, INF}}},
		{[][]int{{INF, INF}, {INF, INF}}, [][]int{{INF, INF}, {INF, INF}}},
		{
			[][]int{{0, INF, INF}, {-1, -1, INF}, {INF, INF, INF}, {INF, -1, -1}, {INF, INF, 0}},
			[][]int{{0, 1, 2}, {-1, -1, 3}, {4, 5, 4}, {3, -1, -1}, {2, 1, 0}},
		},
	}
	for _, c := range cases {
		t.Case("rooms = "+JShow(c.rooms), c.want, func() any {
			g := JClone2(c.rooms)
			wallsAndGates(g)
			return g
		})
	}

	// эталон: отдельный BFS из каждых ворот, в клетке — минимум
	brute := func(rooms [][]int) [][]int {
		m, n := len(rooms), len(rooms[0])
		res := JClone2(rooms)
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				if rooms[r][c] != 0 {
					continue
				}
				dist := make([][]int, m)
				for i := range dist {
					dist[i] = make([]int, n)
					for j := range dist[i] {
						dist[i][j] = -1
					}
				}
				dist[r][c] = 0
				q := [][2]int{{r, c}}
				for i := 0; i < len(q); i++ {
					p := q[i]
					for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
						nr, nc := p[0]+d[0], p[1]+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && dist[nr][nc] < 0 && rooms[nr][nc] == INF {
							dist[nr][nc] = dist[p[0]][p[1]] + 1
							res[nr][nc] = min(res[nr][nc], dist[nr][nc])
							q = append(q, [2]int{nr, nc})
						}
					}
				}
			}
		}
		return res
	}
	same := func(got, want [][]int) string {
		if len(got) != len(want) {
			return "другой размер сетки"
		}
		for r := range want {
			if len(got[r]) != len(want[r]) {
				return "другой размер сетки"
			}
			for c := range want[r] {
				if got[r][c] != want[r][c] {
					return fmt.Sprintf("клетка (%d,%d): %d, ожидалось %d", r, c, got[r][c], want[r][c])
				}
			}
		}
		return "совпадает с эталоном"
	}
	seed := uint64(987654321)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n, wallPct, gates int) [][]int {
		g := make([][]int, m)
		for r := range g {
			g[r] = make([]int, n)
			for c := range g[r] {
				g[r][c] = INF
				if rnd(100) < wallPct {
					g[r][c] = -1
				}
			}
		}
		for i := 0; i < gates; i++ {
			g[rnd(m)][rnd(n)] = 0
		}
		return g
	}
	for _, s := range []struct{ m, n, wall, gates int }{{30, 30, 20, 5}, {100, 100, 30, 10}, {120, 150, 25, 3}} {
		g := gen(s.m, s.n, s.wall, s.gates)
		want := brute(g)
		t.Case(fmt.Sprintf("rooms = %d×%d, %d%% стен, %d ворот (случайно)", s.m, s.n, s.wall, s.gates), "совпадает с эталоном", func() any {
			got := JClone2(g)
			wallsAndGates(got)
			return same(got, want)
		})
	}
	// ворота в углу пустой сетки: расстояние = r + c
	t.Case("rooms = 60×60 без стен, ворота в (0,0)", "совпадает с эталоном", func() any {
		g := make([][]int, 60)
		want := make([][]int, 60)
		for r := range g {
			g[r] = make([]int, 60)
			want[r] = make([]int, 60)
			for c := range g[r] {
				g[r][c] = INF
				want[r][c] = r + c
			}
		}
		g[0][0] = 0
		wallsAndGates(g)
		return same(g, want)
	})
}
```

---
id: rotting-oranges
---
```go starter
func orangesRotting(grid [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		grid [][]int
		want int
	}{
		{[][]int{{2, 1, 1}, {1, 1, 0}, {0, 1, 1}}, 4},
		{[][]int{{2, 1, 1}, {0, 1, 1}, {1, 0, 1}}, -1},
		{[][]int{{0, 2}}, 0},
		{[][]int{{0}}, 0},
		{[][]int{{1}}, -1},
		{[][]int{{2}}, 0},
		{[][]int{{2, 2}, {1, 1}}, 1},
		{[][]int{{1, 2, 1, 1, 1}}, 3},
		{[][]int{{2, 1, 1, 1, 2}}, 2},
		{[][]int{{1, 1}, {1, 1}}, -1},
		{[][]int{{2, 0, 1}}, -1},
		{[][]int{{2, 1, 1}, {1, 1, 1}, {0, 1, 2}}, 2},
	}
	for _, c := range cases {
		t.Case("grid = "+JShow(c.grid), c.want, func() any {
			return orangesRotting(JClone2(c.grid))
		})
	}

	// эталон: прямая поминутная симуляция
	simulate := func(src [][]int) int {
		g := JClone2(src)
		m, n := len(g), len(g[0])
		minutes := 0
		for {
			var next [][2]int
			for r := 0; r < m; r++ {
				for c := 0; c < n; c++ {
					if g[r][c] != 1 {
						continue
					}
					for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
						nr, nc := r+d[0], c+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && g[nr][nc] == 2 {
							next = append(next, [2]int{r, c})
							break
						}
					}
				}
			}
			if len(next) == 0 {
				break
			}
			for _, p := range next {
				g[p[0]][p[1]] = 2
			}
			minutes++
		}
		for _, row := range g {
			for _, v := range row {
				if v == 1 {
					return -1
				}
			}
		}
		return minutes
	}
	// змейка 10×10: апельсины гниют по одному пути
	snake := make([][]int, 10)
	for r := range snake {
		snake[r] = make([]int, 10)
		for c := range snake[r] {
			switch {
			case r%2 == 0:
				snake[r][c] = 1
			case r%4 == 1 && c == 9, r%4 == 3 && c == 0:
				snake[r][c] = 1
			}
		}
	}
	snake[0][0] = 2
	wantSnake := simulate(snake)
	t.Case("grid = 10×10, змейка из апельсинов, гнилой в (0,0)", wantSnake, func() any {
		return orangesRotting(JClone2(snake))
	})
	seed := uint64(55555)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n, emptyPct, rotten int) [][]int {
		g := make([][]int, m)
		for r := range g {
			g[r] = make([]int, n)
			for c := range g[r] {
				if rnd(100) >= emptyPct {
					g[r][c] = 1
				}
			}
		}
		for i := 0; i < rotten; i++ {
			g[rnd(m)][rnd(n)] = 2
		}
		return g
	}
	for _, s := range []struct{ m, n, empty, rotten int }{{10, 10, 10, 2}, {10, 10, 35, 3}, {60, 60, 5, 4}, {100, 100, 2, 3}} {
		g := gen(s.m, s.n, s.empty, s.rotten)
		want := simulate(g)
		t.Case(fmt.Sprintf("grid = %d×%d, %d%% пустых, %d гнилых (случайно)", s.m, s.n, s.empty, s.rotten), want, func() any {
			return orangesRotting(JClone2(g))
		})
	}
}
```

---
id: pacific-atlantic-water-flow
---
```go starter
func pacificAtlantic(heights [][]int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		heights [][]int
		want    [][]int
	}{
		{
			[][]int{{1, 2, 2, 3, 5}, {3, 2, 3, 4, 4}, {2, 4, 5, 3, 1}, {6, 7, 1, 4, 5}, {5, 1, 1, 2, 4}},
			[][]int{{0, 4}, {1, 3}, {1, 4}, {2, 2}, {3, 0}, {3, 1}, {4, 0}},
		},
		{[][]int{{1}}, [][]int{{0, 0}}},
		{[][]int{{2, 1}, {1, 2}}, [][]int{{0, 0}, {0, 1}, {1, 0}, {1, 1}}},
		{[][]int{{1, 2, 3}}, [][]int{{0, 0}, {0, 1}, {0, 2}}},
		{[][]int{{3}, {1}, {4}}, [][]int{{0, 0}, {1, 0}, {2, 0}}},
		{[][]int{{1, 1, 1}, {1, 0, 1}, {1, 1, 1}}, [][]int{{0, 0}, {0, 1}, {0, 2}, {1, 0}, {1, 2}, {2, 0}, {2, 1}, {2, 2}}},
		{[][]int{{1, 2, 3}, {8, 9, 4}, {7, 6, 5}}, [][]int{{0, 2}, {1, 0}, {1, 1}, {1, 2}, {2, 0}, {2, 1}, {2, 2}}},
		{[][]int{{10, 10, 10}, {10, 1, 10}, {10, 10, 10}}, [][]int{{0, 0}, {0, 1}, {0, 2}, {1, 0}, {1, 2}, {2, 0}, {2, 1}, {2, 2}}},
	}
	for _, c := range cases {
		t.Case("heights = "+JShow(c.heights), c.want, func() any {
			return pacificAtlantic(JClone2(c.heights))
		}, JAnyOrder)
	}

	dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	// эталон для небольших сеток: из каждой клетки «пускаем воду» BFS вниз по склону
	bruteFwd := func(h [][]int) [][]int {
		m, n := len(h), len(h[0])
		res := [][]int{}
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				seen := make([]bool, m*n)
				seen[r*n+c] = true
				q := [][2]int{{r, c}}
				pac, atl := false, false
				for i := 0; i < len(q); i++ {
					p := q[i]
					if p[0] == 0 || p[1] == 0 {
						pac = true
					}
					if p[0] == m-1 || p[1] == n-1 {
						atl = true
					}
					for _, d := range dirs {
						nr, nc := p[0]+d[0], p[1]+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && !seen[nr*n+nc] && h[nr][nc] <= h[p[0]][p[1]] {
							seen[nr*n+nc] = true
							q = append(q, [2]int{nr, nc})
						}
					}
				}
				if pac && atl {
					res = append(res, []int{r, c})
				}
			}
		}
		return res
	}
	// эталон для больших сеток: обратный BFS от каждого берега
	bruteRev := func(h [][]int) [][]int {
		m, n := len(h), len(h[0])
		flood := func(isShore func(r, c int) bool) []bool {
			seen := make([]bool, m*n)
			var q [][2]int
			for r := 0; r < m; r++ {
				for c := 0; c < n; c++ {
					if isShore(r, c) {
						seen[r*n+c] = true
						q = append(q, [2]int{r, c})
					}
				}
			}
			for i := 0; i < len(q); i++ {
				p := q[i]
				for _, d := range dirs {
					nr, nc := p[0]+d[0], p[1]+d[1]
					if nr >= 0 && nc >= 0 && nr < m && nc < n && !seen[nr*n+nc] && h[nr][nc] >= h[p[0]][p[1]] {
						seen[nr*n+nc] = true
						q = append(q, [2]int{nr, nc})
					}
				}
			}
			return seen
		}
		pac := flood(func(r, c int) bool { return r == 0 || c == 0 })
		atl := flood(func(r, c int) bool { return r == m-1 || c == n-1 })
		res := [][]int{}
		for i := range pac {
			if pac[i] && atl[i] {
				res = append(res, []int{i / n, i % n})
			}
		}
		return res
	}
	norm := func(cells [][]int) string {
		keys := make([]string, len(cells))
		for i, p := range cells {
			if len(p) != 2 {
				return "некорректная пара " + JShow(p)
			}
			keys[i] = fmt.Sprintf("%d,%d", p[0], p[1])
		}
		sort.Strings(keys)
		return strings.Join(keys, ";")
	}
	seed := uint64(777777)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n, maxH int) [][]int {
		g := make([][]int, m)
		for r := range g {
			g[r] = make([]int, n)
			for c := range g[r] {
				g[r][c] = rnd(maxH + 1)
			}
		}
		return g
	}
	big := func(name string, h [][]int, want [][]int) {
		t.Check(name, fmt.Sprintf("%d клеток (совпадают с эталоном)", len(want)), func() (any, bool) {
			got := pacificAtlantic(JClone2(h))
			if norm(got) == norm(want) {
				return fmt.Sprintf("%d клеток (совпадают с эталоном)", len(got)), true
			}
			return fmt.Sprintf("%d клеток, набор отличается от эталона", len(got)), false
		})
	}
	for _, s := range []struct{ m, n, maxH int }{{30, 30, 5}, {40, 25, 3}, {35, 35, 100000}} {
		h := gen(s.m, s.n, s.maxH)
		big(fmt.Sprintf("heights = %d×%d, случайные высоты 0..%d", s.m, s.n, s.maxH), h, bruteFwd(h))
	}
	h1 := gen(200, 200, 4)
	big("heights = 200×200, случайные высоты 0..4", h1, bruteRev(h1))
	// наклон к левому верхнему углу со случайным шумом
	slope := make([][]int, 200)
	for r := range slope {
		slope[r] = make([]int, 200)
		for c := range slope[r] {
			slope[r][c] = r + c + rnd(4)
		}
	}
	big("heights = 200×200, наклон r+c со случайным шумом 0..3", slope, bruteRev(slope))
	// плато: все высоты равны — подходят все 40000 клеток
	flat := make([][]int, 200)
	all := [][]int{}
	for r := range flat {
		flat[r] = make([]int, 200)
		for c := range flat[r] {
			flat[r][c] = 7
			all = append(all, []int{r, c})
		}
	}
	big("heights = 200×200, все высоты равны", flat, all)
	// «гора» к центру: высота = расстояние до края, подходят все клетки
	hill := make([][]int, 200)
	for r := range hill {
		hill[r] = make([]int, 200)
		for c := range hill[r] {
			hill[r][c] = min(r, c, 199-r, 199-c)
		}
	}
	big("heights = 200×200, пирамида к центру", hill, bruteRev(hill))
}
```

---
id: surrounded-regions
---
```go starter
func solve(board [][]byte) {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		board []string
		want  []string
	}{
		{[]string{"XXXX", "XOOX", "XXOX", "XOXX"}, []string{"XXXX", "XXXX", "XXXX", "XOXX"}},
		{[]string{"X"}, []string{"X"}},
		{[]string{"OO", "OO"}, []string{"OO", "OO"}},
		{[]string{"O"}, []string{"O"}},
		{[]string{"XXX", "XOX", "XXX"}, []string{"XXX", "XXX", "XXX"}},
		{[]string{"XOX", "OXO", "XOX"}, []string{"XOX", "OXO", "XOX"}},
		{[]string{"OOO", "OXO", "OOO"}, []string{"OOO", "OXO", "OOO"}},
		{[]string{"XXXXX", "XOOOX", "XOXOX", "XOOOX", "XXXXX"}, []string{"XXXXX", "XXXXX", "XXXXX", "XXXXX", "XXXXX"}},
		{[]string{"XXXXX", "XOOOX", "XOXOX", "XOOOX", "XXXOX"}, []string{"XXXXX", "XOOOX", "XOXOX", "XOOOX", "XXXOX"}},
		{[]string{"XXXX", "XOXX", "XXOX", "XXXX"}, []string{"XXXX", "XXXX", "XXXX", "XXXX"}},
		{[]string{"OXXOX", "XOOXO", "XOXOX", "OXOOO", "XXOXO"}, []string{"OXXOX", "XXXXO", "XXXOX", "OXOOO", "XXOXO"}},
	}
	for _, c := range cases {
		t.Case("board = "+JShow(c.board), JBoard(c.want...), func() any {
			b := JBoard(c.board...)
			solve(b)
			return b
		})
	}

	// эталон: для каждой области 'O' (BFS) проверяем, касается ли она края
	brute := func(src [][]byte) [][]byte {
		b := JClone2(src)
		m, n := len(b), len(b[0])
		seen := make([]bool, m*n)
		for r := 0; r < m; r++ {
			for c := 0; c < n; c++ {
				if b[r][c] != 'O' || seen[r*n+c] {
					continue
				}
				seen[r*n+c] = true
				q := [][2]int{{r, c}}
				border := false
				for i := 0; i < len(q); i++ {
					p := q[i]
					if p[0] == 0 || p[1] == 0 || p[0] == m-1 || p[1] == n-1 {
						border = true
					}
					for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
						nr, nc := p[0]+d[0], p[1]+d[1]
						if nr >= 0 && nc >= 0 && nr < m && nc < n && !seen[nr*n+nc] && src[nr][nc] == 'O' {
							seen[nr*n+nc] = true
							q = append(q, [2]int{nr, nc})
						}
					}
				}
				if !border {
					for _, p := range q {
						b[p[0]][p[1]] = 'X'
					}
				}
			}
		}
		return b
	}
	same := func(got, want [][]byte) string {
		if len(got) != len(want) {
			return "другой размер доски"
		}
		for r := range want {
			if string(got[r]) != string(want[r]) {
				for c := range want[r] {
					if c >= len(got[r]) || got[r][c] != want[r][c] {
						return fmt.Sprintf("клетка (%d,%d) отличается от эталона", r, c)
					}
				}
				return "другой размер доски"
			}
		}
		return "совпадает с эталоном"
	}
	seed := uint64(31415926)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(m, n, pct int) [][]byte {
		b := make([][]byte, m)
		for r := range b {
			b[r] = make([]byte, n)
			for c := range b[r] {
				b[r][c] = 'X'
				if rnd(100) < pct {
					b[r][c] = 'O'
				}
			}
		}
		return b
	}
	run := func(name string, b [][]byte) {
		want := brute(b)
		t.Case(name, "совпадает с эталоном", func() any {
			got := JClone2(b)
			solve(got)
			return same(got, want)
		})
	}
	run("board = 30×30, 45% 'O' (случайно)", gen(30, 30, 45))
	run("board = 200×200, 55% 'O' (случайно)", gen(200, 200, 55))
	run("board = 200×150, 40% 'O' (случайно)", gen(200, 150, 40))
	// всё 'O' — касается края, ничего не меняется
	run("board = 200×200, все 'O'", gen(200, 200, 100))
	// рамка из 'X', внутри всё 'O' — всё захватывается
	frame := gen(200, 200, 100)
	for i := 0; i < 200; i++ {
		frame[0][i], frame[199][i], frame[i][0], frame[i][199] = 'X', 'X', 'X', 'X'
	}
	run("board = 200×200, рамка 'X', внутри все 'O'", frame)
}
```

---
id: course-schedule
---
```go starter
func canFinish(numCourses int, prerequisites [][]int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n    int
		pre  [][]int
		want bool
	}{
		{2, [][]int{{1, 0}}, true},
		{2, [][]int{{1, 0}, {0, 1}}, false},
		{1, [][]int{}, true},
		{3, [][]int{}, true},
		{1, [][]int{{0, 0}}, false},
		{3, [][]int{{1, 0}, {2, 1}, {0, 2}}, false},
		{4, [][]int{{1, 0}, {2, 0}, {3, 1}, {3, 2}}, true},
		{5, [][]int{{1, 0}, {2, 1}, {4, 3}, {3, 4}}, false},
		{5, [][]int{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}}, true},
		{6, [][]int{{1, 0}, {2, 1}, {3, 2}, {4, 3}, {5, 4}, {2, 5}}, false},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("numCourses = %d, prerequisites = %s", c.n, JShow(c.pre)), c.want, func() any {
			return canFinish(c.n, JClone2(c.pre))
		})
	}

	seed := uint64(424242)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	// случайный ацикличный граф: курс p[j] требует p[i] только при i < j
	n := 2000
	perm := make([]int, n)
	for i := range perm {
		perm[i] = i
	}
	for i := n - 1; i > 0; i-- {
		j := rnd(i + 1)
		perm[i], perm[j] = perm[j], perm[i]
	}
	has := map[[2]int]bool{}
	var dag [][]int
	addEdge := func(list *[][]int, a, b int) {
		if a == b || has[[2]int{a, b}] {
			return
		}
		has[[2]int{a, b}] = true
		*list = append(*list, []int{a, b})
	}
	for len(dag) < 5000 {
		i, j := rnd(n), rnd(n)
		if i > j {
			i, j = j, i
		}
		addEdge(&dag, perm[j], perm[i])
	}
	t.Case("numCourses = 2000, 5000 случайных зависимостей без цикла", true, func() any {
		return canFinish(n, JClone2(dag))
	})
	// цепочка через все курсы + замыкающее ребро = цикл длины 2000
	var cyc [][]int
	for i := 0; i+1 < n; i++ {
		cyc = append(cyc, []int{perm[i+1], perm[i]})
	}
	cyc = append(cyc, []int{perm[0], perm[n-1]})
	t.Case("numCourses = 2000, цепочка из всех курсов, замкнутая в цикл", false, func() any {
		return canFinish(n, JClone2(cyc))
	})
	chain := cyc[:n-1]
	t.Case("numCourses = 2000, цепочка из всех курсов", true, func() any {
		return canFinish(n, JClone2(chain))
	})
}
```

---
id: course-schedule-ii
---
```go starter
func findOrder(numCourses int, prerequisites [][]int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	// valid: при possible — перестановка 0..n-1, где каждый пререквизит раньше курса; иначе — пустой массив
	valid := func(n int, pre [][]int, possible bool, got []int) bool {
		if !possible {
			return len(got) == 0
		}
		if len(got) != n {
			return false
		}
		pos := make([]int, n)
		for i := range pos {
			pos[i] = -1
		}
		for i, v := range got {
			if v < 0 || v >= n || pos[v] != -1 {
				return false
			}
			pos[v] = i
		}
		for _, p := range pre {
			if pos[p[1]] > pos[p[0]] {
				return false
			}
		}
		return true
	}
	check := func(name string, n int, pre [][]int, possible bool) {
		want := "[] (пройти все курсы нельзя)"
		if possible {
			want = fmt.Sprintf("любая перестановка 0..%d, где каждый пререквизит идёт раньше курса", n-1)
		}
		t.Check(name, want, func() (any, bool) {
			got := findOrder(n, JClone2(pre))
			return got, valid(n, pre, possible, got)
		})
	}
	show := func(n int, pre [][]int) string {
		return fmt.Sprintf("numCourses = %d, prerequisites = %s", n, JShow(pre))
	}
	type tc struct {
		n        int
		pre      [][]int
		possible bool
	}
	for _, c := range []tc{
		{4, [][]int{{1, 0}, {2, 0}, {3, 1}, {3, 2}}, true},
		{2, [][]int{{1, 0}, {0, 1}}, false},
		{1, [][]int{}, true},
		{2, [][]int{{1, 0}}, true},
		{3, [][]int{}, true},
		{3, [][]int{{0, 1}, {0, 2}, {1, 2}}, true},
		{1, [][]int{{0, 0}}, false},
		{5, [][]int{{1, 0}, {2, 1}, {4, 3}, {3, 4}}, false},
		{6, [][]int{{5, 4}, {4, 3}, {3, 2}, {2, 1}, {1, 0}}, true},
		{4, [][]int{{1, 0}, {2, 1}, {3, 2}, {1, 3}}, false},
	} {
		check(show(c.n, c.pre), c.n, c.pre, c.possible)
	}

	seed := uint64(8675309)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	n := 2000
	perm := make([]int, n)
	for i := range perm {
		perm[i] = i
	}
	for i := n - 1; i > 0; i-- {
		j := rnd(i + 1)
		perm[i], perm[j] = perm[j], perm[i]
	}
	has := map[[2]int]bool{}
	var dag [][]int
	for len(dag) < 6000 {
		i, j := rnd(n), rnd(n)
		if i == j {
			continue
		}
		if i > j {
			i, j = j, i
		}
		if !has[[2]int{perm[j], perm[i]}] {
			has[[2]int{perm[j], perm[i]}] = true
			dag = append(dag, []int{perm[j], perm[i]})
		}
	}
	check("numCourses = 2000, 6000 случайных зависимостей без цикла", n, dag, true)
	// цепочка через все курсы задаёт единственный порядок
	var chain [][]int
	for i := 0; i+1 < n; i++ {
		chain = append(chain, []int{perm[i+1], perm[i]})
	}
	withChain := append(JClone2(chain), dag...)
	check("numCourses = 2000, цепочка из всех курсов + 6000 случайных зависимостей", n, withChain, true)
	withCycle := append(JClone2(withChain), []int{perm[0], perm[n-1]})
	check("numCourses = 2000, то же + ребро, замыкающее цикл", n, withCycle, false)
}
```

---
id: graph-valid-tree
---
```go starter
func validTree(n int, edges [][]int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n     int
		edges [][]int
		want  bool
	}{
		{5, [][]int{{0, 1}, {0, 2}, {0, 3}, {1, 4}}, true},
		{5, [][]int{{0, 1}, {1, 2}, {2, 3}, {1, 3}, {1, 4}}, false},
		{1, [][]int{}, true},
		{2, [][]int{}, false},
		{2, [][]int{{1, 0}}, true},
		{3, [][]int{{0, 1}, {1, 2}}, true},
		{4, [][]int{{0, 1}, {2, 3}}, false},
		{4, [][]int{{0, 1}, {1, 2}, {2, 0}}, false},
		{3, [][]int{{0, 1}, {1, 2}, {2, 0}}, false},
		{6, [][]int{{0, 1}, {0, 2}, {2, 3}, {2, 4}, {5, 4}}, true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d, edges = %s", c.n, JShow(c.edges)), c.want, func() any {
			return validTree(c.n, JClone2(c.edges))
		})
	}

	seed := uint64(1357911)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	n := 2000
	perm := make([]int, n)
	for i := range perm {
		perm[i] = i
	}
	for i := n - 1; i > 0; i-- {
		j := rnd(i + 1)
		perm[i], perm[j] = perm[j], perm[i]
	}
	shuffle := func(e [][]int) [][]int {
		e = JClone2(e)
		for i := len(e) - 1; i > 0; i-- {
			j := rnd(i + 1)
			e[i], e[j] = e[j], e[i]
		}
		return e
	}
	// случайное дерево: вершина i подвешена к случайной из 0..i-1
	var tree [][]int
	for i := 1; i < n; i++ {
		tree = append(tree, []int{perm[i], perm[rnd(i)]})
	}
	tree = shuffle(tree)
	t.Case("n = 2000, случайное дерево", true, func() any {
		return validTree(n, JClone2(tree))
	})
	// путь через все вершины — дерево
	var path [][]int
	for i := 0; i+1 < n; i++ {
		path = append(path, []int{perm[i], perm[i+1]})
	}
	t.Case("n = 2000, путь через все вершины", true, func() any {
		return validTree(n, JClone2(path))
	})
	// тот же путь без последнего ребра + ребро, замыкающее треугольник: n-1 рёбер, но цикл и отрезанная вершина
	bad := append(JClone2(path[:n-2]), []int{perm[0], perm[2]})
	bad = shuffle(bad)
	t.Case("n = 2000, 1999 рёбер: цикл из 3 вершин и изолированная вершина", false, func() any {
		return validTree(n, JClone2(bad))
	})
	// дерево с лишним ребром
	extra := append(JClone2(tree), []int{perm[0], perm[n-1]})
	t.Case("n = 2000, случайное дерево + одно лишнее ребро", false, func() any {
		return validTree(n, JClone2(extra))
	})
}
```

---
id: number-of-connected-components-in-an-undirected-graph
---
```go starter
func countComponents(n int, edges [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n     int
		edges [][]int
		want  int
	}{
		{5, [][]int{{0, 1}, {1, 2}, {3, 4}}, 2},
		{5, [][]int{{0, 1}, {1, 2}, {2, 3}, {3, 4}}, 1},
		{3, [][]int{{0, 1}, {0, 2}, {1, 2}}, 1},
		{1, [][]int{}, 1},
		{5, [][]int{}, 5},
		{4, [][]int{{2, 3}}, 3},
		{6, [][]int{{0, 1}, {1, 2}, {2, 0}, {3, 4}, {4, 5}, {5, 3}}, 2},
		{7, [][]int{{6, 0}, {5, 1}, {4, 2}}, 4},
		{4, [][]int{{0, 1}, {2, 3}, {1, 2}}, 1},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d, edges = %s", c.n, JShow(c.edges)), c.want, func() any {
			return countComponents(c.n, JClone2(c.edges))
		})
	}

	// эталон: распространение меток — пока есть ребро с разными метками, обе становятся минимальной
	brute := func(n int, edges [][]int) int {
		label := make([]int, n)
		for i := range label {
			label[i] = i
		}
		for changed := true; changed; {
			changed = false
			for _, e := range edges {
				a, b := e[0], e[1]
				if label[a] != label[b] {
					m := min(label[a], label[b])
					label[a], label[b] = m, m
					changed = true
				}
			}
		}
		distinct := map[int]bool{}
		for _, l := range label {
			distinct[l] = true
		}
		return len(distinct)
	}
	seed := uint64(24680)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(n, m int) [][]int {
		has := map[[2]int]bool{}
		var e [][]int
		for len(e) < m {
			a, b := rnd(n), rnd(n)
			if a == b || has[[2]int{a, b}] {
				continue
			}
			has[[2]int{a, b}], has[[2]int{b, a}] = true, true
			e = append(e, []int{a, b})
		}
		return e
	}
	for _, s := range []struct{ n, m int }{{2000, 1000}, {2000, 1800}, {10000, 4800}, {10000, 12000}} {
		e := gen(s.n, s.m)
		want := brute(s.n, e)
		t.Case(fmt.Sprintf("n = %d, %d случайных рёбер", s.n, s.m), want, func() any {
			return countComponents(s.n, JClone2(e))
		})
	}
	var path [][]int
	for i := 0; i+1 < 10000; i++ {
		path = append(path, []int{i, i + 1})
	}
	t.Case("n = 10000, путь 0-1-…-9999", 1, func() any {
		return countComponents(10000, JClone2(path))
	})
}
```

---
id: redundant-connection
---
```go starter
func findRedundantConnection(edges [][]int) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		edges [][]int
		want  []int
	}{
		{[][]int{{1, 2}, {1, 3}, {2, 3}}, []int{2, 3}},
		{[][]int{{1, 2}, {2, 3}, {3, 4}, {1, 4}, {1, 5}}, []int{1, 4}},
		{[][]int{{1, 2}, {2, 3}, {3, 1}}, []int{3, 1}},
		{[][]int{{1, 2}, {2, 3}, {3, 1}, {3, 4}}, []int{3, 1}},
		{[][]int{{3, 4}, {1, 2}, {2, 4}, {3, 5}, {2, 5}}, []int{2, 5}},
		{[][]int{{2, 1}, {3, 1}, {4, 2}, {1, 4}}, []int{1, 4}},
		{[][]int{{1, 4}, {3, 4}, {1, 3}, {1, 2}, {4, 5}}, []int{1, 3}},
	}
	for _, c := range cases {
		t.Case("edges = "+JShow(c.edges), c.want, func() any {
			return findRedundantConnection(JClone2(c.edges))
		})
	}

	// эталон: идём с конца и удаляем ребро; если остаток связный (n-1 рёбер) — это ответ
	brute := func(edges [][]int) []int {
		n := len(edges)
		for skip := n - 1; skip >= 0; skip-- {
			adj := make([][]int, n+1)
			for i, e := range edges {
				if i != skip {
					adj[e[0]] = append(adj[e[0]], e[1])
					adj[e[1]] = append(adj[e[1]], e[0])
				}
			}
			seen := make([]bool, n+1)
			seen[1] = true
			q := []int{1}
			for i := 0; i < len(q); i++ {
				for _, v := range adj[q[i]] {
					if !seen[v] {
						seen[v] = true
						q = append(q, v)
					}
				}
			}
			if len(q) == n {
				return edges[skip]
			}
		}
		return nil
	}
	seed := uint64(11235813)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(n int, longCycle bool) [][]int {
		perm := make([]int, n)
		for i := range perm {
			perm[i] = i + 1
		}
		for i := n - 1; i > 0; i-- {
			j := rnd(i + 1)
			perm[i], perm[j] = perm[j], perm[i]
		}
		var e [][]int
		for i := 1; i < n; i++ {
			p := rnd(i)
			if longCycle {
				p = i - 1 // путь
			}
			e = append(e, []int{perm[p], perm[i]})
		}
		a, b := perm[0], perm[n-1]
		for !longCycle {
			a, b = perm[rnd(n)], perm[rnd(n)]
			ok := a != b
			for _, x := range e {
				if (x[0] == a && x[1] == b) || (x[0] == b && x[1] == a) {
					ok = false
				}
			}
			if ok {
				break
			}
		}
		e = append(e, []int{min(a, b), max(a, b)})
		for i := len(e) - 1; i > 0; i-- {
			j := rnd(i + 1)
			e[i], e[j] = e[j], e[i]
		}
		for _, x := range e {
			if x[0] > x[1] {
				x[0], x[1] = x[1], x[0]
			}
		}
		return e
	}
	for _, s := range []struct {
		n    int
		long bool
		name string
	}{
		{100, false, "n = 100, случайное дерево + лишнее ребро"},
		{1000, false, "n = 1000, случайное дерево + лишнее ребро"},
		{1000, true, "n = 1000, путь + ребро между концами (цикл через все вершины)"},
	} {
		e := gen(s.n, s.long)
		want := brute(e)
		t.Case(s.name, want, func() any {
			return findRedundantConnection(JClone2(e))
		})
	}
}
```

---
id: word-ladder
---
```go starter
func ladderLength(beginWord string, endWord string, wordList []string) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		begin, end string
		list       []string
		want       int
	}{
		{"hit", "cog", []string{"hot", "dot", "dog", "lot", "log", "cog"}, 5},
		{"hit", "cog", []string{"hot", "dot", "dog", "lot", "log"}, 0},
		{"a", "c", []string{"a", "b", "c"}, 2},
		{"hot", "dot", []string{"dot"}, 2},
		{"hit", "cog", []string{"hot", "dog", "cog"}, 0},
		{"hot", "dog", []string{"hot", "dog", "dot"}, 3},
		{"abc", "xyz", []string{"xyz"}, 0},
		{"lost", "cost", []string{"most", "fist", "lost", "cost", "fish"}, 2},
		{"talk", "tail", []string{"talk", "tons", "fall", "tail", "gale", "hall", "negs", "tall", "tali"}, 3},
		{"red", "tax", []string{"ted", "tex", "red", "tax", "tad", "den", "rex", "pee"}, 4},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("beginWord = %q, endWord = %q, wordList = %s", c.begin, c.end, JShow(c.list)), c.want, func() any {
			return ladderLength(c.begin, c.end, JClone(c.list))
		})
	}

	// эталон: BFS, соседи — все слова словаря, отличающиеся ровно в одной позиции
	diff1 := func(a, b string) bool {
		d := 0
		for i := 0; i < len(a); i++ {
			if a[i] != b[i] {
				d++
			}
		}
		return d == 1
	}
	distances := func(begin string, list []string) []int {
		dist := make([]int, len(list))
		for i := range dist {
			dist[i] = -1
		}
		var q []int
		for i, w := range list {
			if diff1(begin, w) && dist[i] < 0 {
				dist[i] = 2
				q = append(q, i)
			}
		}
		for k := 0; k < len(q); k++ {
			u := q[k]
			for v, w := range list {
				if dist[v] < 0 && diff1(list[u], w) {
					dist[v] = dist[u] + 1
					q = append(q, v)
				}
			}
		}
		return dist
	}
	seed := uint64(60221409)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	randWord := func(l, alpha int) string {
		b := make([]byte, l)
		for i := range b {
			b[i] = byte('a' + rnd(alpha))
		}
		return string(b)
	}
	// разреженный словарь: самое далёкое достижимое слово
	for _, s := range []struct{ l, alpha, count int }{{5, 4, 300}, {5, 5, 1500}, {4, 8, 2500}} {
		seen := map[string]bool{}
		var list []string
		for len(list) < s.count {
			w := randWord(s.l, s.alpha)
			if !seen[w] {
				seen[w] = true
				list = append(list, w)
			}
		}
		begin := randWord(s.l, s.alpha)
		dist := distances(begin, list)
		far, want := "", 0
		for i, d := range dist {
			if d > want && list[i] != begin {
				far, want = list[i], d
			}
		}
		if far == "" {
			far, want = list[0], 0
		}
		t.Case(fmt.Sprintf("beginWord = %q, endWord = %q, wordList = %d случайных слов длины %d", begin, far, s.count, s.l), want, func() any {
			return ladderLength(begin, far, JClone(list))
		})
		// endWord, до которого не дойти: отличается от всех слов во всех позициях
		lone := strings.Repeat("z", s.l)
		with := append(JClone(list), lone)
		t.Case(fmt.Sprintf("beginWord = %q, endWord = %q (недостижимо), wordList = %d слов", begin, lone, len(with)), 0, func() any {
			return ladderLength(begin, lone, JClone(with))
		})
	}
	// длинная лестница: aaaaaaaaaa → bbbbbbbbbb по одной букве, плюс шум
	var ladder []string
	cur := []byte("aaaaaaaaaa")
	for i := 0; i < 10; i++ {
		cur[i] = 'b'
		ladder = append(ladder, string(cur))
	}
	for i := 0; i < 3000; i++ {
		ladder = append(ladder, randWord(10, 3))
	}
	want := 0
	if d := distances("aaaaaaaaaa", ladder); true {
		for i, w := range ladder {
			if w == "bbbbbbbbbb" && d[i] > 0 {
				want = d[i]
				break
			}
		}
	}
	t.Case("beginWord = \"aaaaaaaaaa\", endWord = \"bbbbbbbbbb\", лестница из 10 слов + 3000 случайных", want, func() any {
		return ladderLength("aaaaaaaaaa", "bbbbbbbbbb", JClone(ladder))
	})
}
```
