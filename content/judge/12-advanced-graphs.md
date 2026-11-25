---
id: network-delay-time
---
```go starter
func networkDelayTime(times [][]int, n int, k int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		times [][]int
		n, k  int
		want  int
	}{
		{[][]int{{2, 1, 1}, {2, 3, 1}, {3, 4, 1}}, 4, 2, 2},
		{[][]int{{1, 2, 1}}, 2, 2, -1},
		{[][]int{{1, 2, 1}}, 2, 1, 1},
		{[][]int{}, 1, 1, 0},
		{[][]int{{1, 2, 0}, {2, 3, 0}}, 3, 1, 0},
		{[][]int{{1, 2, 1}, {2, 3, 2}, {1, 3, 4}}, 3, 1, 3},
		{[][]int{{1, 2, 1}, {2, 1, 3}}, 3, 2, -1},
		{[][]int{{1, 2, 100}, {1, 3, 1}, {3, 4, 1}, {4, 2, 1}}, 4, 1, 3},
		{[][]int{{3, 2, 5}, {2, 1, 5}, {1, 3, 5}}, 3, 1, 10},
		{[][]int{{1, 2, 7}, {1, 3, 2}, {3, 2, 3}, {2, 4, 1}, {3, 4, 10}, {4, 5, 0}}, 5, 1, 6},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("times = %s, n = %d, k = %d", JShow(c.times), c.n, c.k), c.want, func() any {
			return networkDelayTime(JClone2(c.times), c.n, c.k)
		})
	}

	// эталон: Флойд — Уоршелл
	brute := func(times [][]int, n, k int) int {
		const inf = 1 << 40
		d := make([][]int, n+1)
		for i := range d {
			d[i] = make([]int, n+1)
			for j := range d[i] {
				d[i][j] = inf
			}
			d[i][i] = 0
		}
		for _, e := range times {
			d[e[0]][e[1]] = min(d[e[0]][e[1]], e[2])
		}
		for m := 1; m <= n; m++ {
			for i := 1; i <= n; i++ {
				for j := 1; j <= n; j++ {
					d[i][j] = min(d[i][j], d[i][m]+d[m][j])
				}
			}
		}
		res := 0
		for v := 1; v <= n; v++ {
			if d[k][v] >= inf {
				return -1
			}
			res = max(res, d[k][v])
		}
		return res
	}
	seed := uint64(19937)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(n, m, maxW, skip int) [][]int {
		has := map[[2]int]bool{}
		var e [][]int
		for len(e) < m {
			u, v := 1+rnd(n), 1+rnd(n)
			if u == v || v == skip || has[[2]int{u, v}] {
				continue
			}
			has[[2]int{u, v}] = true
			e = append(e, []int{u, v, rnd(maxW + 1)})
		}
		return e
	}
	for _, s := range []struct{ n, m, maxW, k, skip int }{{30, 200, 100, 1, 0}, {100, 6000, 100, 17, 0}, {100, 1000, 100, 5, 0}, {100, 3000, 100, 42, 77}} {
		e := gen(s.n, s.m, s.maxW, s.skip)
		want := brute(e, s.n, s.k)
		name := fmt.Sprintf("n = %d, k = %d, %d случайных рёбер с весами 0..%d", s.n, s.k, s.m, s.maxW)
		if s.skip > 0 {
			name += fmt.Sprintf(", в узел %d рёбер нет", s.skip)
		}
		t.Case(name, want, func() any {
			return networkDelayTime(JClone2(e), s.n, s.k)
		})
	}
	// цепочка 1→2→…→100 по весу 1, рёбра в обратном порядке, плюс дорогие «короткие пути»
	var chain [][]int
	for v := 99; v >= 1; v-- {
		chain = append(chain, []int{v, v + 1, 1})
		if v+2 <= 100 {
			chain = append(chain, []int{v, v + 2, 100})
		}
	}
	t.Case("n = 100, k = 1, цепочка 1→…→100 (вес 1) + рёбра v→v+2 (вес 100)", brute(chain, 100, 1), func() any {
		return networkDelayTime(JClone2(chain), 100, 1)
	})
}
```

---
id: reconstruct-itinerary
---
```go starter
func findItinerary(tickets [][]string) []string {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tickets [][]string
		want    []string
	}{
		{[][]string{{"MUC", "LHR"}, {"JFK", "MUC"}, {"SFO", "SJC"}, {"LHR", "SFO"}}, []string{"JFK", "MUC", "LHR", "SFO", "SJC"}},
		{[][]string{{"JFK", "SFO"}, {"JFK", "ATL"}, {"SFO", "ATL"}, {"ATL", "JFK"}, {"ATL", "SFO"}}, []string{"JFK", "ATL", "JFK", "SFO", "ATL", "SFO"}},
		{[][]string{{"JFK", "KUL"}, {"JFK", "NRT"}, {"NRT", "JFK"}}, []string{"JFK", "NRT", "JFK", "KUL"}},
		{[][]string{{"JFK", "AAA"}}, []string{"JFK", "AAA"}},
		{[][]string{{"JFK", "ATL"}, {"ATL", "JFK"}, {"JFK", "ATL"}, {"ATL", "JFK"}}, []string{"JFK", "ATL", "JFK", "ATL", "JFK"}},
		{[][]string{{"EZE", "AXA"}, {"TIA", "ANU"}, {"ANU", "JFK"}, {"JFK", "ANU"}, {"ANU", "EZE"}, {"TIA", "ANU"}, {"AXA", "TIA"}, {"TIA", "JFK"}, {"ANU", "TIA"}, {"JFK", "TIA"}},
			[]string{"JFK", "ANU", "EZE", "AXA", "TIA", "ANU", "JFK", "TIA", "ANU", "TIA", "JFK"}},
		{[][]string{{"JFK", "AAA"}, {"AAA", "JFK"}, {"JFK", "BBB"}, {"JFK", "CCC"}, {"CCC", "JFK"}}, []string{"JFK", "AAA", "JFK", "CCC", "JFK", "BBB"}},
		{[][]string{{"JFK", "BBB"}, {"BBB", "AAA"}, {"AAA", "BBB"}, {"BBB", "JFK"}, {"JFK", "AAA"}}, []string{"JFK", "AAA", "BBB", "JFK", "BBB", "AAA"}},
	}
	for _, c := range cases {
		t.Case("tickets = "+JShow(c.tickets), c.want, func() any {
			return findItinerary(JClone2(c.tickets))
		})
	}

	// эталон: жадно берём наименьшее направление, если после этого все оставшиеся
	// билеты ещё достижимы из нового аэропорта (иначе маршрут не завершить)
	smallest := func(tickets [][]string) []string {
		m := len(tickets)
		used := make([]bool, m)
		reachAll := func(from string) bool {
			seen := map[string]bool{from: true}
			stack := []string{from}
			for len(stack) > 0 {
				a := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				for i, tk := range tickets {
					if !used[i] && tk[0] == a && !seen[tk[1]] {
						seen[tk[1]] = true
						stack = append(stack, tk[1])
					}
				}
			}
			for i, tk := range tickets {
				if !used[i] && !seen[tk[0]] {
					return false
				}
			}
			return true
		}
		route := []string{"JFK"}
		cur := "JFK"
		for step := 0; step < m; step++ {
			var cand []int
			for i, tk := range tickets {
				if !used[i] && tk[0] == cur {
					cand = append(cand, i)
				}
			}
			sort.Slice(cand, func(a, b int) bool { return tickets[cand[a]][1] < tickets[cand[b]][1] })
			chosen := -1
			for _, i := range cand {
				used[i] = true
				if reachAll(tickets[i][1]) {
					chosen = i
					break
				}
				used[i] = false
			}
			if chosen < 0 {
				return nil
			}
			cur = tickets[chosen][1]
			route = append(route, cur)
		}
		return route
	}
	seed := uint64(3141592653)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	// случайное блуждание из JFK: его рёбра образуют эйлеров путь
	walk := func(airports []string, steps int) [][]string {
		cur := "JFK"
		var tk [][]string
		for len(tk) < steps {
			next := airports[rnd(len(airports))]
			if next == cur {
				continue
			}
			tk = append(tk, []string{cur, next})
			cur = next
		}
		for i := len(tk) - 1; i > 0; i-- {
			j := rnd(i + 1)
			tk[i], tk[j] = tk[j], tk[i]
		}
		return tk
	}
	for _, s := range []struct {
		airports []string
		steps    int
	}{
		{[]string{"JFK", "ATL", "SFO"}, 40},
		{[]string{"JFK", "ATL", "SFO", "LAX", "MUC", "LHR"}, 150},
		{[]string{"JFK", "ATL", "SFO", "LAX", "MUC", "LHR", "NRT", "KUL", "EZE", "AXA"}, 300},
		{[]string{"JFK", "AAA", "ZZZ"}, 300},
	} {
		tk := walk(s.airports, s.steps)
		want := smallest(tk)
		t.Case(fmt.Sprintf("tickets = %d билетов (случайный маршрут по %d аэропортам)", s.steps, len(s.airports)), want, func() any {
			return findItinerary(JClone2(tk))
		})
	}
	// ловушка для жадного решения без отката: тупик с наименьшим кодом
	var trap [][]string
	for i := 0; i < 149; i++ {
		trap = append(trap, []string{"JFK", "BBB"}, []string{"BBB", "JFK"})
	}
	trap = append(trap, []string{"JFK", "AAA"})
	want := smallest(trap)
	t.Case("tickets = 149×(JFK→BBB, BBB→JFK) + JFK→AAA", want, func() any {
		return findItinerary(JClone2(trap))
	})
}
```

---
id: min-cost-to-connect-all-points
---
```go starter
func minCostConnectPoints(points [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		points [][]int
		want   int
	}{
		{[][]int{{0, 0}, {2, 2}, {3, 10}, {5, 2}, {7, 0}}, 20},
		{[][]int{{3, 12}, {-2, 5}, {-4, 1}}, 18},
		{[][]int{{0, 0}}, 0},
		{[][]int{{0, 0}, {1, 1}}, 2},
		{[][]int{{-1000000, -1000000}, {1000000, 1000000}}, 4000000},
		{[][]int{{0, 0}, {1, 0}, {2, 0}, {3, 0}, {10, 0}}, 10},
		{[][]int{{0, 0}, {0, 5}, {5, 0}, {5, 5}}, 15},
		{[][]int{{2, -3}, {-17, -8}, {13, 8}, {-17, -15}}, 53},
	}
	for _, c := range cases {
		t.Case("points = "+JShow(c.points), c.want, func() any {
			return minCostConnectPoints(JClone2(c.points))
		})
	}

	// эталон: Краскал по всем парам с простейшим DSU
	brute := func(p [][]int) int {
		n := len(p)
		type edge struct{ w, a, b int }
		var es []edge
		dist := func(i, j int) int {
			dx, dy := p[i][0]-p[j][0], p[i][1]-p[j][1]
			if dx < 0 {
				dx = -dx
			}
			if dy < 0 {
				dy = -dy
			}
			return dx + dy
		}
		for i := 0; i < n; i++ {
			for j := i + 1; j < n; j++ {
				es = append(es, edge{dist(i, j), i, j})
			}
		}
		sort.Slice(es, func(a, b int) bool { return es[a].w < es[b].w })
		comp := make([]int, n)
		for i := range comp {
			comp[i] = i
		}
		root := func(x int) int {
			for comp[x] != x {
				x = comp[x]
			}
			return x
		}
		total := 0
		for _, e := range es {
			ra, rb := root(e.a), root(e.b)
			if ra != rb {
				comp[ra] = rb
				total += e.w
			}
		}
		return total
	}
	seed := uint64(271828)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	gen := func(n, r int) [][]int {
		seen := map[[2]int]bool{}
		var p [][]int
		for len(p) < n {
			x, y := rnd(2*r+1)-r, rnd(2*r+1)-r
			if !seen[[2]int{x, y}] {
				seen[[2]int{x, y}] = true
				p = append(p, []int{x, y})
			}
		}
		return p
	}
	for _, s := range []struct{ n, r int }{{50, 100}, {300, 1000000}, {1000, 1000000}, {1000, 30}} {
		p := gen(s.n, s.r)
		want := brute(p)
		t.Case(fmt.Sprintf("points = %d случайных точек, |x|, |y| ≤ %d", s.n, s.r), want, func() any {
			return minCostConnectPoints(JClone2(p))
		})
	}
}
```

---
id: swim-in-rising-water
---
```go starter
func swimInWater(grid [][]int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		grid [][]int
		want int
	}{
		{[][]int{{0, 2}, {1, 3}}, 3},
		{[][]int{{0, 1, 2, 3, 4}, {24, 23, 22, 21, 5}, {12, 13, 14, 15, 16}, {11, 17, 18, 19, 20}, {10, 9, 8, 7, 6}}, 16},
		{[][]int{{0}}, 0},
		{[][]int{{3, 2}, {0, 1}}, 3},
		{[][]int{{0, 3}, {2, 1}}, 2},
		{[][]int{{0, 1, 2}, {7, 8, 3}, {6, 5, 4}}, 4},
		{[][]int{{8, 1, 2}, {7, 0, 3}, {6, 5, 4}}, 8},
		{[][]int{{0, 8, 7}, {1, 6, 5}, {2, 3, 4}}, 4},
	}
	for _, c := range cases {
		t.Case("grid = "+JShow(c.grid), c.want, func() any {
			return swimInWater(JClone2(c.grid))
		})
	}

	// эталон: перебираем t по возрастанию и проверяем достижимость BFS
	brute := func(g [][]int) int {
		n := len(g)
		for t := 0; ; t++ {
			if g[0][0] > t {
				continue
			}
			seen := make([]bool, n*n)
			seen[0] = true
			q := []int{0}
			for i := 0; i < len(q); i++ {
				r, c := q[i]/n, q[i]%n
				for _, d := range [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
					nr, nc := r+d[0], c+d[1]
					if nr >= 0 && nc >= 0 && nr < n && nc < n && !seen[nr*n+nc] && g[nr][nc] <= t {
						seen[nr*n+nc] = true
						q = append(q, nr*n+nc)
					}
				}
			}
			if seen[n*n-1] {
				return t
			}
		}
	}
	seed := uint64(161803)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	perm := func(n int) [][]int {
		v := make([]int, n*n)
		for i := range v {
			v[i] = i
		}
		for i := len(v) - 1; i > 0; i-- {
			j := rnd(i + 1)
			v[i], v[j] = v[j], v[i]
		}
		g := make([][]int, n)
		for r := range g {
			g[r] = v[r*n : (r+1)*n]
		}
		return g
	}
	for _, n := range []int{10, 30, 50, 50} {
		g := perm(n)
		want := brute(g)
		t.Case(fmt.Sprintf("grid = %d×%d, случайная перестановка 0..%d", n, n, n*n-1), want, func() any {
			return swimInWater(JClone2(g))
		})
	}
	// змейка: низкие клетки образуют длинный извилистый коридор
	n := 50
	snake := make([][]int, n)
	for r := range snake {
		snake[r] = make([]int, n)
	}
	low, high := 0, 0
	var corridor [][2]int
	for r := 0; r < n; r++ {
		for c := 0; c < n; c++ {
			cc := c
			if r%4 == 2 {
				cc = n - 1 - c
			}
			switch {
			case r%2 == 0:
				corridor = append(corridor, [2]int{r, cc})
			case r%4 == 1 && c == n-1, r%4 == 3 && c == 0:
				corridor = append(corridor, [2]int{r, c})
			}
		}
	}
	inCorr := map[[2]int]bool{}
	for _, p := range corridor {
		inCorr[p] = true
		snake[p[0]][p[1]] = low
		low++
	}
	high = low
	for r := 0; r < n; r++ {
		for c := 0; c < n; c++ {
			if !inCorr[[2]int{r, c}] {
				snake[r][c] = high
				high++
			}
		}
	}
	wantSnake := brute(snake)
	t.Case("grid = 50×50, низкие клетки — извилистый коридор", wantSnake, func() any {
		return swimInWater(JClone2(snake))
	})
}
```

---
id: alien-dictionary
---
```go starter
func alienOrder(words []string) string {

}
```

```go tests
func judgeTests(t *Judge) {
	// analyze возвращает буквы слов, рёбра порядка и признак противоречия
	analyze := func(words []string) (present [26]bool, edge [26][26]bool, bad bool) {
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
					bad = true
				}
				continue
			}
			edge[a[j]-'a'][b[j]-'a'] = true
		}
		// цикл ищем через транзитивное замыкание (Флойд — Уоршелл на 26 вершинах)
		reach := edge
		for k := 0; k < 26; k++ {
			for i := 0; i < 26; i++ {
				for j := 0; j < 26; j++ {
					if reach[i][k] && reach[k][j] {
						reach[i][j] = true
					}
				}
			}
		}
		for i := 0; i < 26; i++ {
			if reach[i][i] {
				bad = true
			}
		}
		return
	}
	check := func(name string, words []string) {
		present, edge, bad := analyze(words)
		letters := ""
		for c := 0; c < 26; c++ {
			if present[c] {
				letters += string(rune('a' + c))
			}
		}
		want := "\"\" (порядок противоречив)"
		if !bad {
			want = fmt.Sprintf("любая перестановка букв %q, согласованная со словами", letters)
		}
		t.Check(name, want, func() (any, bool) {
			got := alienOrder(JClone(words))
			if bad {
				return got, got == ""
			}
			if len(got) != len(letters) {
				return got, false
			}
			var pos [26]int
			for i := range pos {
				pos[i] = -1
			}
			for i := 0; i < len(got); i++ {
				ch := got[i]
				if ch < 'a' || ch > 'z' || !present[ch-'a'] || pos[ch-'a'] != -1 {
					return got, false
				}
				pos[ch-'a'] = i
			}
			for u := 0; u < 26; u++ {
				for v := 0; v < 26; v++ {
					if edge[u][v] && pos[u] > pos[v] {
						return got, false
					}
				}
			}
			return got, true
		})
	}
	for _, w := range [][]string{
		{"wrt", "wrf", "er", "ett", "rftt"},
		{"z", "x", "z"},
		{"abc", "ab"},
		{"z", "x"},
		{"z", "z"},
		{"z"},
		{"abc"},
		{"ab", "abc"},
		{"ab", "adc"},
		{"a", "b", "c", "a"},
		{"ac", "ab", "zc", "zb"},
		{"wrt", "wrtkj", "wrf", "er", "ett", "rftt"},
		{"aba", "bba", "aaa"},
		{"b", "a", "ba"},
		{"abc", "abd", "abe", "b", "ca", "cd"},
		{"zy", "zx"},
		{"ab", "ab", "ab"},
	} {
		check("words = "+JShow(w), w)
	}

	seed := uint64(9999991)
	rnd := func(n int) int {
		seed ^= seed << 13
		seed ^= seed >> 7
		seed ^= seed << 17
		return int(seed % uint64(n))
	}
	// случайный алфавит и отсортированные по нему слова
	gen := func(alpha, count, maxLen int) []string {
		order := make([]int, 26)
		for i := range order {
			order[i] = i
		}
		for i := 25; i > 0; i-- {
			j := rnd(i + 1)
			order[i], order[j] = order[j], order[i]
		}
		rank := make([]int, 26)
		for i, c := range order {
			rank[c] = i
		}
		words := make([]string, count)
		for i := range words {
			l := 1 + rnd(maxLen)
			b := make([]byte, l)
			for k := range b {
				b[k] = byte('a' + order[rnd(alpha)])
			}
			words[i] = string(b)
		}
		sort.Slice(words, func(i, j int) bool {
			a, b := words[i], words[j]
			for k := 0; k < len(a) && k < len(b); k++ {
				if a[k] != b[k] {
					return rank[a[k]-'a'] < rank[b[k]-'a']
				}
			}
			return len(a) < len(b)
		})
		return words
	}
	check("words = 100 случайных слов длины ≤ 100 над всеми 26 буквами", gen(26, 100, 100))
	check("words = 100 случайных слов длины ≤ 3 над 26 буквами", gen(26, 100, 3))
	check("words = 100 случайных слов длины ≤ 10 над 8 буквами", gen(8, 100, 10))
	broken := gen(26, 100, 5)
	broken[40], broken[60] = broken[60], broken[40]
	check("words = 100 отсортированных слов, два из них переставлены", broken)
	pref := gen(26, 100, 4)
	pref[50] = pref[49] + "zz"
	pref[49], pref[50] = pref[50], pref[49]
	check("words = 100 отсортированных слов, слово стоит перед своим префиксом", pref)
}
```

---
id: cheapest-flights-within-k-stops
---
```go starter
func findCheapestPrice(n int, flights [][]int, src int, dst int, k int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		n                int
		flights          [][]int
		src, dst, k      int
		want             int
	}{
		{4, [][]int{{0, 1, 100}, {1, 2, 100}, {2, 0, 100}, {1, 3, 600}, {2, 3, 200}}, 0, 3, 1, 700},
		{3, [][]int{{0, 1, 100}, {1, 2, 100}, {0, 2, 500}}, 0, 2, 0, 500},
		{3, [][]int{{0, 1, 100}, {1, 2, 100}, {0, 2, 500}}, 0, 2, 1, 200},
		{2, [][]int{{1, 0, 5}}, 0, 1, 1, -1},
		{3, [][]int{{0, 1, 1}, {1, 2, 1}}, 0, 2, 0, -1},
		{4, [][]int{{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 100}}, 0, 3, 1, 100},
		{4, [][]int{{0, 1, 1}, {1, 2, 1}, {2, 3, 1}, {0, 3, 100}}, 0, 3, 2, 3},
		{5, [][]int{{0, 1, 5}, {1, 2, 5}, {0, 3, 2}, {3, 1, 2}, {1, 4, 1}, {4, 2, 1}}, 0, 2, 2, 7},
		{4, [][]int{{0, 1, 1}, {0, 2, 5}, {1, 2, 1}, {2, 3, 1}}, 0, 3, 1, 6},
		{5, [][]int{{4, 1, 1}, {1, 2, 3}, {0, 3, 2}, {0, 4, 10}, {3, 1, 1}, {1, 4, 3}}, 2, 1, 1, -1},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("n = %d, flights = %s, src = %d, dst = %d, k = %d", c.n, JShow(c.flights), c.src, c.dst, c.k), c.want, func() any {
			return findCheapestPrice(c.n, JClone2(c.flights), c.src, c.dst, c.k)
		})
	}

	// эталон: dp[j][v] — минимальная цена ровно за j рейсов, ответ — минимум по j = 1..k+1
	brute := func(n int, flights [][]int, src, dst, k int) int {
		const inf = 1 << 60
		cur := make([]int, n)
		for i := range cur {
			cur[i] = inf
		}
		cur[src] = 0
		best := inf
		for j := 1; j <= k+1; j++ {
			nxt := make([]int, n)
			for i := range nxt {
				nxt[i] = inf
			}
			for _, f := range flights {
				if cur[f[0]] < inf {
					nxt[f[1]] = min(nxt[f[1]], cur[f[0]]+f[2])
				}
			}
			best = min(best, nxt[dst])
			cur = nxt
		}
		if best >= inf {
			return -1
		}
		return best
	}
	seed := uint64(1729)
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
			u, v := rnd(n), rnd(n)
			if u == v || has[[2]int{u, v}] {
				continue
			}
			has[[2]int{u, v}] = true
			e = append(e, []int{u, v, 1 + rnd(10000)})
		}
		return e
	}
	for _, s := range []struct{ n, m, k int }{{20, 60, 2}, {100, 400, 0}, {100, 400, 3}, {100, 1500, 10}, {100, 4000, 99}} {
		fl := gen(s.n, s.m)
		src, dst := 0, s.n-1
		want := brute(s.n, fl, src, dst, s.k)
		t.Case(fmt.Sprintf("n = %d, %d случайных рейсов, src = %d, dst = %d, k = %d", s.n, s.m, src, dst, s.k), want, func() any {
			return findCheapestPrice(s.n, JClone2(fl), src, dst, s.k)
		})
	}
	// длинная дешёвая цепочка 0→1→…→99 против прямых дорогих рейсов в 99
	var chain [][]int
	for v := 0; v < 99; v++ {
		chain = append(chain, []int{v, v + 1, 1})
		chain = append(chain, []int{v, 99, 10000 - 2*v})
	}
	for _, k := range []int{0, 50, 97, 98} {
		want := brute(100, chain, 0, 99, k)
		t.Case(fmt.Sprintf("n = 100, цепочка 0→…→99 по цене 1 + рейсы v→99 по цене 10000−2v, k = %d", k), want, func() any {
			return findCheapestPrice(100, JClone2(chain), 0, 99, k)
		})
	}
}
```
