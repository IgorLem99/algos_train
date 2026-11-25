---
id: maximum-subarray
---
```go starter
func maxSubArray(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: максимум (префикс[j] - минимальный префикс до j)
	ref := func(a []int) int {
		best := a[0]
		sum, minPref := 0, 0
		for _, v := range a {
			sum += v
			if sum-minPref > best {
				best = sum - minPref
			}
			if sum < minPref {
				minPref = sum
			}
		}
		return best
	}
	run := func(a []int, w int) {
		name := fmt.Sprintf("nums = %v", a)
		if len(a) > 30 {
			name = fmt.Sprintf("nums: %d случайных элементов", len(a))
		}
		t.Case(name, w, func() any { return maxSubArray(JClone(a)) })
	}
	run([]int{-2, 1, -3, 4, -1, 2, 1, -5, 4}, 6)
	run([]int{1}, 1)
	run([]int{5, 4, -1, 7, 8}, 23)
	run([]int{-1}, -1)
	run([]int{-3, -1, -2}, -1)
	run([]int{0, 0, 0}, 0)
	run([]int{-2, -1}, -1)
	run([]int{1, -1, 1, -1, 1}, 1)
	run([]int{-1, 2, -1, 2, -1}, 3)
	run([]int{8, -19, 5, -4, 20}, 21)
	run([]int{10000, -10000, 10000}, 10000)
	run([]int{-10000, -10000, -9999}, -9999)
	x := uint32(1357)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	for _, p := range [][2]int{{10, 20}, {200, 20001}, {20000, 20001}} {
		a := make([]int, p[0])
		for i := range a {
			a[i] = next(p[1]) - p[1]/2
		}
		run(a, ref(a))
	}
	// длинный положительный участок посреди отрицательных
	a := make([]int, 20000)
	for i := range a {
		a[i] = -10000
	}
	for i := 5000; i < 15000; i++ {
		a[i] = 1
	}
	run(a, 10000)
	// все элементы положительные: сумма всего массива
	b := make([]int, 20000)
	for i := range b {
		b[i] = 10000
	}
	run(b, 200000000)
}
```

---
id: jump-game
---
```go starter
func canJump(nums []int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: достижимость по клеткам, перебор всех прыжков
	ref := func(a []int) bool {
		n := len(a)
		reach := make([]bool, n)
		reach[0] = true
		for i := 0; i < n; i++ {
			if !reach[i] {
				continue
			}
			for j := i + 1; j <= i+a[i] && j < n; j++ {
				reach[j] = true
			}
		}
		return reach[n-1]
	}
	run := func(a []int, w bool) {
		name := fmt.Sprintf("nums = %v", a)
		if len(a) > 30 {
			name = fmt.Sprintf("nums: %d элементов", len(a))
		}
		t.Case(name, w, func() any { return canJump(JClone(a)) })
	}
	run([]int{2, 3, 1, 1, 4}, true)
	run([]int{3, 2, 1, 0, 4}, false)
	run([]int{0}, true)
	run([]int{0, 1}, false)
	run([]int{1, 0}, true)
	run([]int{1, 0, 1}, false)
	run([]int{2, 0, 0}, true)
	run([]int{2, 0, 1, 0}, true)
	run([]int{1, 1, 1, 1, 1}, true)
	run([]int{5, 0, 0, 0, 0, 0}, true)
	run([]int{1, 2, 0, 1}, true)
	run([]int{3, 0, 8, 2, 0, 0, 1}, true)
	run([]int{2, 5, 0, 0}, true)
	run([]int{4, 2, 0, 0, 1, 1, 4, 4, 4, 0, 4, 0}, true)
	n := 10000
	ones := make([]int, n)
	for i := range ones {
		ones[i] = 1
	}
	run(ones, true)
	z := append([]int{}, ones...)
	z[n/2] = 0
	run(z, false)
	z2 := append([]int{}, ones...)
	z2[n-2] = 0
	run(z2, false)
	z3 := append([]int{}, ones...)
	z3[n-1] = 0
	run(z3, true)
	big := make([]int, n)
	big[0] = 100000
	run(big, true)
	x := uint32(808)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	for i := 0; i < 6; i++ {
		a := make([]int, n)
		for j := range a {
			if next(3) == 0 {
				a[j] = next(12)
			} else {
				a[j] = next(2)
			}
		}
		run(a, ref(a))
	}
	// случайные «разреженные» массивы, где ответ чаще false
	for i := 0; i < 6; i++ {
		a := make([]int, n)
		for j := range a {
			if next(40) == 0 {
				a[j] = next(30)
			}
		}
		a[0] = next(5) + 1
		run(a, ref(a))
	}
}
```

---
id: jump-game-ii
---
```go starter
func jump(nums []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: dp справа налево — минимум прыжков от i до конца
	ref := func(a []int) int {
		n := len(a)
		dp := make([]int, n)
		for i := n - 2; i >= 0; i-- {
			dp[i] = 1 << 30
			for j := i + 1; j <= i+a[i] && j < n; j++ {
				dp[i] = min(dp[i], dp[j]+1)
			}
		}
		return dp[0]
	}
	run := func(a []int, w int) {
		name := fmt.Sprintf("nums = %v", a)
		if len(a) > 30 {
			name = fmt.Sprintf("nums: %d элементов", len(a))
		}
		t.Case(name, w, func() any { return jump(JClone(a)) })
	}
	run([]int{2, 3, 1, 1, 4}, 2)
	run([]int{2, 3, 0, 1, 4}, 2)
	run([]int{0}, 0)
	run([]int{1}, 0)
	run([]int{1, 2}, 1)
	run([]int{2, 1}, 1)
	run([]int{1, 1, 1, 1}, 3)
	run([]int{10, 1, 1, 1, 1}, 1)
	run([]int{1, 2, 3}, 2)
	run([]int{3, 2, 1}, 1)
	run([]int{1, 2, 1, 1, 1}, 3)
	run([]int{5, 9, 3, 2, 1, 0, 2, 3, 3, 1, 0, 0}, 3)
	run([]int{2, 3, 1, 1, 4, 1, 1, 1, 1, 1}, 4)
	n := 10000
	ones := make([]int, n)
	for i := range ones {
		ones[i] = 1
	}
	run(ones, n-1)
	big := make([]int, n)
	for i := range big {
		big[i] = 1000
	}
	run(big, (n-1+999)/1000)
	x := uint32(246)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	for _, hi := range []int{3, 10, 50, 1000} {
		a := make([]int, n)
		for i := range a {
			a[i] = next(hi) + 1
		}
		run(a, ref(a))
	}
}
```

---
id: gas-station
---
```go starter
func canCompleteCircuit(gas []int, cost []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	// допустимый ответ: -1, если суммарно топлива не хватает, иначе любой стартовый индекс,
	// с которого симуляция не уходит в минус
	valid := func(gas, cost []int, got int) bool {
		n := len(gas)
		total := 0
		for i := range gas {
			total += gas[i] - cost[i]
		}
		if total < 0 {
			return got == -1
		}
		if got < 0 || got >= n {
			return false
		}
		tank := 0
		for k := 0; k < n; k++ {
			i := (got + k) % n
			tank += gas[i] - cost[i]
			if tank < 0 {
				return false
			}
		}
		return true
	}
	exact := func(gas, cost []int, w int) {
		t.Case(fmt.Sprintf("gas = %v, cost = %v", gas, cost), w, func() any {
			return canCompleteCircuit(JClone(gas), JClone(cost))
		})
	}
	flex := func(name string, gas, cost []int) {
		total := 0
		for i := range gas {
			total += gas[i] - cost[i]
		}
		want := "-1 (суммарно топлива не хватает)"
		if total >= 0 {
			want = "индекс стартовой заправки, с которой можно проехать круг"
		}
		t.Check(name, want, func() (any, bool) {
			got := canCompleteCircuit(JClone(gas), JClone(cost))
			return got, valid(gas, cost, got)
		})
	}
	exact([]int{1, 2, 3, 4, 5}, []int{3, 4, 5, 1, 2}, 3)
	exact([]int{2, 3, 4}, []int{3, 4, 3}, -1)
	exact([]int{5}, []int{4}, 0)
	exact([]int{5, 1, 2, 3, 4}, []int{4, 4, 1, 5, 1}, 4)
	exact([]int{1}, []int{2}, -1)
	exact([]int{2}, []int{2}, 0)
	exact([]int{0, 0, 5}, []int{1, 1, 0}, 2)
	exact([]int{4, 5, 2, 6, 5, 3}, []int{3, 2, 7, 3, 2, 9}, -1)
	exact([]int{3, 1, 1}, []int{1, 2, 2}, 0)
	exact([]int{1, 1, 1, 1, 10}, []int{2, 2, 2, 2, 2}, 4)
	flex("gas = [2 2 2], cost = [2 2 2] (подходит любой старт)", []int{2, 2, 2}, []int{2, 2, 2})
	x := uint32(97531)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	t.Check("100 случайных малых входов", "для каждого входа -1 или корректный старт", func() (any, bool) {
		for k := 0; k < 100; k++ {
			n := next(8) + 1
			g, c := make([]int, n), make([]int, n)
			for i := range g {
				g[i], c[i] = next(6), next(6)
			}
			got := canCompleteCircuit(JClone(g), JClone(c))
			if !valid(g, c, got) {
				return fmt.Sprintf("gas = %v, cost = %v → %d", g, c, got), false
			}
		}
		return "все ответы корректны", true
	})
	n := 100000
	g, c := make([]int, n), make([]int, n)
	for i := range g {
		g[i], c[i] = next(1000), next(1000)
	}
	total := 0
	for i := range g {
		total += g[i] - c[i]
	}
	if total < 0 {
		g[0] += -total
	}
	flex("100000 случайных заправок (суммарно хватает)", g, c)
	g2, c2 := make([]int, n), append([]int{}, c...)
	for i := range g2 {
		g2[i] = min(g[i], c[i])
	}
	c2[7]++
	flex("100000 заправок, суммарно не хватает на 1+", g2, c2)
	// затраты только в первой половине, топливо только во второй: единственный старт — n/2
	m := 20000
	g3, c3 := make([]int, m), make([]int, m)
	for i := 0; i < m/2; i++ {
		c3[i] = 1
	}
	for i := m / 2; i < m; i++ {
		g3[i] = 1
	}
	t.Case("20000 заправок: первая половина тратит 1, вторая даёт 1", m/2, func() any {
		return canCompleteCircuit(JClone(g3), JClone(c3))
	})
}
```

---
id: hand-of-straights
---
```go starter
func isNStraightHand(hand []int, groupSize int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: берём минимальную оставшуюся карту и снимаем с руки группу из подряд идущих
	ref := func(hand []int, g int) bool {
		if len(hand)%g != 0 {
			return false
		}
		cnt := map[int]int{}
		for _, v := range hand {
			cnt[v]++
		}
		for left := len(hand); left > 0; left -= g {
			lo, found := 0, false
			for v, c := range cnt {
				if c > 0 && (!found || v < lo) {
					lo, found = v, true
				}
			}
			for k := 0; k < g; k++ {
				if cnt[lo+k] == 0 {
					return false
				}
				cnt[lo+k]--
			}
		}
		return true
	}
	run := func(hand []int, g int, w bool) {
		name := fmt.Sprintf("hand = %v, groupSize = %d", hand, g)
		if len(hand) > 30 {
			name = fmt.Sprintf("hand: %d карт, groupSize = %d", len(hand), g)
		}
		t.Case(name, w, func() any { return isNStraightHand(JClone(hand), g) })
	}
	run([]int{1, 2, 3, 6, 2, 3, 4, 7, 8}, 3, true)
	run([]int{1, 2, 3, 4, 5}, 4, false)
	run([]int{1, 2, 3, 4, 5, 6}, 2, true)
	run([]int{1}, 1, true)
	run([]int{5, 5, 5}, 1, true)
	run([]int{1, 2, 3, 4}, 4, true)
	run([]int{1, 1, 2, 2, 3, 3}, 3, true)
	run([]int{1, 1, 2, 2, 3, 4}, 3, false)
	run([]int{1, 2, 4, 6}, 2, false)
	run([]int{1, 3}, 2, false)
	run([]int{0, 0}, 2, false)
	run([]int{8, 10, 12}, 3, false)
	run([]int{9, 8, 7, 6, 5, 4}, 3, true)
	run([]int{1, 2, 3, 3, 4, 5}, 3, true)
	run([]int{1, 2, 3, 3, 4, 4, 5, 6}, 4, true)
	run([]int{1, 2, 3, 3, 4, 4, 5, 6}, 2, true)
	run([]int{1000000000, 999999999, 999999998}, 3, true)
	run([]int{1000000000, 999999999, 999999997}, 3, false)
	x := uint32(1123)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	// набор, заведомо разбиваемый на группы: случайные начала + подряд идущие значения
	build := func(groups, g, span int) []int {
		var h []int
		for i := 0; i < groups; i++ {
			s := next(span)
			for k := 0; k < g; k++ {
				h = append(h, s+k)
			}
		}
		for i := len(h) - 1; i > 0; i-- {
			j := next(i + 1)
			h[i], h[j] = h[j], h[i]
		}
		return h
	}
	// несколько небольших случайных рук: ответ — по эталону
	t.Case("300 случайных малых рук", 300, func() any {
		bad := 0
		for k := 0; k < 300; k++ {
			g := next(3) + 1
			h := build(next(4)+1, g, 6)
			if next(2) == 0 {
				h[next(len(h))] = next(8)
			}
			if isNStraightHand(JClone(h), g) != ref(h, g) {
				bad++
			}
		}
		return 300 - bad
	})
	for _, p := range [][3]int{{2000, 5, 100}, {1000, 10, 1000000000}, {100, 100, 50}} {
		h := build(p[0], p[1], p[2])
		run(h, p[1], true)
		h2 := JClone(h)
		h2[next(len(h2))] += 1
		run(h2, p[1], ref(h2, p[1]))
	}
	h := make([]int, 10000)
	for i := range h {
		h[i] = i
	}
	run(h, 10000, true)
	run(h, 5000, true)
	run(h, 1, true)
	run(h[:9999], 3, true)
	run(h[:9999], 2, false)
}
```

---
id: merge-triplets-to-form-target-triplet
---
```go starter
func mergeTriplets(triplets [][]int, target []int) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон для малых входов: замыкание множества троек относительно покомпонентного максимума
	ref := func(tr [][]int, target []int) bool {
		set := map[[3]int]bool{}
		for _, v := range tr {
			set[[3]int{v[0], v[1], v[2]}] = true
		}
		for changed := true; changed; {
			changed = false
			var cur [][3]int
			for k := range set {
				cur = append(cur, k)
			}
			for _, a := range cur {
				for _, b := range cur {
					m := [3]int{max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])}
					if !set[m] {
						set[m] = true
						changed = true
					}
				}
			}
		}
		return set[[3]int{target[0], target[1], target[2]}]
	}
	run := func(name string, tr [][]int, target []int, w bool) {
		t.Case(name, w, func() any { return mergeTriplets(JClone2(tr), JClone(target)) })
	}
	show := func(tr [][]int, target []int) string {
		return fmt.Sprintf("triplets = %v, target = %v", tr, target)
	}
	a1, t1 := [][]int{{2, 5, 3}, {1, 8, 4}, {1, 7, 5}}, []int{2, 7, 5}
	run(show(a1, t1), a1, t1, true)
	a2, t2 := [][]int{{3, 4, 5}, {4, 5, 6}}, []int{3, 2, 5}
	run(show(a2, t2), a2, t2, false)
	a3, t3 := [][]int{{2, 5, 3}, {2, 3, 4}, {1, 2, 5}, {5, 2, 3}}, []int{5, 5, 5}
	run(show(a3, t3), a3, t3, true)
	a4, t4 := [][]int{{1, 2, 3}}, []int{1, 2, 3}
	run(show(a4, t4), a4, t4, true)
	a5, t5 := [][]int{{1, 2, 3}}, []int{1, 2, 4}
	run(show(a5, t5), a5, t5, false)
	a6, t6 := [][]int{{1, 1, 1}, {2, 2, 2}}, []int{1, 1, 1}
	run(show(a6, t6), a6, t6, true)
	a7, t7 := [][]int{{1, 1, 5}, {1, 5, 1}, {5, 1, 1}}, []int{5, 5, 5}
	run(show(a7, t7), a7, t7, true)
	a8, t8 := [][]int{{1, 1, 5}, {1, 5, 1}, {5, 1, 1}, {9, 9, 9}}, []int{5, 5, 5}
	run(show(a8, t8), a8, t8, true)
	a9, t9 := [][]int{{1, 1, 5}, {1, 5, 1}, {6, 1, 1}}, []int{5, 5, 5}
	run(show(a9, t9), a9, t9, false)
	a10, t10 := [][]int{{1, 3, 4}, {2, 5, 8}}, []int{2, 5, 8}
	run(show(a10, t10), a10, t10, true)
	a11, t11 := [][]int{{3, 5, 1}, {1, 2, 3}}, []int{3, 5, 3}
	run(show(a11, t11), a11, t11, true)
	x := uint32(31415)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	t.Case("300 случайных малых входов (сверка с перебором слияний)", 300, func() any {
		ok := 0
		for k := 0; k < 300; k++ {
			n := next(6) + 1
			tr := make([][]int, n)
			for i := range tr {
				tr[i] = []int{next(4) + 1, next(4) + 1, next(4) + 1}
			}
			tg := []int{next(4) + 1, next(4) + 1, next(4) + 1}
			if mergeTriplets(JClone2(tr), JClone(tg)) == ref(tr, tg) {
				ok++
			}
		}
		return ok
	})
	n := 100000
	tr := make([][]int, n)
	for i := range tr {
		tr[i] = []int{next(1000) + 1, next(1000) + 1, next(1000) + 1}
	}
	run("100000 случайных троек, target = [1000 1000 1000]", tr, []int{1000, 1000, 1000}, func() bool {
		var f [3]bool
		for _, v := range tr {
			for k := 0; k < 3; k++ {
				if v[k] == 1000 {
					f[k] = true
				}
			}
		}
		return f[0] && f[1] && f[2]
	}())
	tr2 := make([][]int, n)
	for i := range tr2 {
		tr2[i] = []int{next(500) + 1, next(500) + 1, next(500) + 1}
	}
	tr2[n/2] = []int{500, 1, 1}
	tr2[n/3] = []int{1, 500, 1}
	tr2[n/4] = []int{1, 1, 500}
	run("100000 троек со значениями ≤ 500, target = [500 500 500]", tr2, []int{500, 500, 500}, true)
	tr3 := append([][]int{}, tr2...)
	tr3[n/4] = []int{1, 1, 501}
	run("то же, но одна нужная тройка заменена на [1 1 501]", tr3, []int{500, 500, 500}, func() bool {
		var f [3]bool
		for _, v := range tr3 {
			if v[0] > 500 || v[1] > 500 || v[2] > 500 {
				continue
			}
			for k := 0; k < 3; k++ {
				if v[k] == 500 {
					f[k] = true
				}
			}
		}
		return f[0] && f[1] && f[2]
	}())
}
```

---
id: partition-labels
---
```go starter
func partitionLabels(s string) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: интервалы [первое, последнее вхождение] каждой буквы, склеиваем пересекающиеся
	ref := func(s string) []int {
		first, last := [26]int{}, [26]int{}
		for i := range first {
			first[i], last[i] = -1, -1
		}
		for i := 0; i < len(s); i++ {
			c := s[i] - 'a'
			if first[c] < 0 {
				first[c] = i
			}
			last[c] = i
		}
		res := []int{}
		start, end := 0, -1
		for i := 0; i < len(s); i++ {
			c := s[i] - 'a'
			if i > end {
				// новая часть начинается здесь
				start, end = i, last[c]
			}
			if last[c] > end {
				end = last[c]
			}
			if i == end {
				res = append(res, end-start+1)
			}
		}
		return res
	}
	run := func(s string, w []int) {
		name := fmt.Sprintf("s = %q", s)
		if len(s) > 40 {
			name = fmt.Sprintf("строка длиной %d", len(s))
		}
		t.Case(name, w, func() any { return partitionLabels(s) })
	}
	run("ababcbacadefegdehijhklij", []int{9, 7, 8})
	run("eccbbbbdec", []int{10})
	run("a", []int{1})
	run("caedbdedda", []int{1, 9})
	run("abc", []int{1, 1, 1})
	run("aaaa", []int{4})
	run("abab", []int{4})
	run("abcabc", []int{6})
	run("aabbcc", []int{2, 2, 2})
	run("abacbd", []int{5, 1})
	run("abcdcba", []int{7})
	run("zzabyy", []int{2, 1, 1, 2})
	x := uint32(5551)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	random := func(n, alpha int) string {
		b := make([]byte, n)
		for i := range b {
			b[i] = byte('a' + next(alpha))
		}
		return string(b)
	}
	for _, p := range [][2]int{{20, 3}, {100, 26}, {500, 26}} {
		s := random(p[0], p[1])
		run(s, ref(s))
	}
	// блоки с непересекающимися алфавитами (по две буквы на блок) — много частей
	var blocks string
	for b := 0; b < 13; b++ {
		l1, l2 := byte('a'+2*b), byte('a'+2*b+1)
		for i := 0; i < 300; i++ {
			if next(2) == 0 {
				blocks += string(l1)
			} else {
				blocks += string(l2)
			}
		}
	}
	run(blocks, ref(blocks))
	one := make([]byte, 3000)
	for i := range one {
		one[i] = byte('a' + i%26)
	}
	run(string(one), ref(string(one)))
	run("abcdefghijklmnopqrstuvwxyz", []int{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1})
}
```

---
id: valid-parenthesis-string
---
```go starter
func checkValidString(s string) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: множество достижимых балансов после каждого символа
	ref := func(s string) bool {
		cur := map[int]bool{0: true}
		for i := 0; i < len(s); i++ {
			nxt := map[int]bool{}
			for b := range cur {
				if s[i] == '(' || s[i] == '*' {
					nxt[b+1] = true
				}
				if (s[i] == ')' || s[i] == '*') && b > 0 {
					nxt[b-1] = true
				}
				if s[i] == '*' {
					nxt[b] = true
				}
			}
			cur = nxt
		}
		return cur[0]
	}
	run := func(s string, w bool) {
		name := fmt.Sprintf("s = %q", s)
		if len(s) > 40 {
			name = fmt.Sprintf("строка длиной %d", len(s))
		}
		t.Case(name, w, func() any { return checkValidString(s) })
	}
	run("(*)", true)
	run("(*))", true)
	run("(()", false)
	run("()", true)
	run("*", true)
	run("(", false)
	run(")", false)
	run("(*", true)
	run("*(", false)
	run(")*", false)
	run("*)", true)
	run("((*)", true)
	run("(((**", false)
	run("*****", true)
	run("(*()", true)
	run("(**(", false)
	run("(*)(", false)
	run("(*))(", false)
	run("()()", true)
	run("((()))", true)
	run("(*)*(*)(", false)
	run("**((*", false)
	// все строки заданной малой длины из алфавита ( ) * — сверка с эталоном
	t.Case("все 3^1 … 3^8 строк длины 1…8", "все ответы совпадают с эталоном", func() any {
		alpha := "()*"
		for n := 1; n <= 8; n++ {
			total := 1
			for i := 0; i < n; i++ {
				total *= 3
			}
			for code := 0; code < total; code++ {
				b := make([]byte, n)
				c := code
				for i := range b {
					b[i] = alpha[c%3]
					c /= 3
				}
				s := string(b)
				if checkValidString(s) != ref(s) {
					return fmt.Sprintf("s = %q: ответ %v, ожидалось %v", s, !ref(s), ref(s))
				}
			}
		}
		return "все ответы совпадают с эталоном"
	})
	x := uint32(60606)
	next := func(m int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(m)) }
	for _, p := range [][2]int{{40, 3}, {100, 3}, {100, 5}} {
		b := make([]byte, p[0])
		for i := range b {
			if next(p[1]) == 0 {
				b[i] = '*'
			} else if next(2) == 0 {
				b[i] = '('
			} else {
				b[i] = ')'
			}
		}
		run(string(b), ref(string(b)))
	}
	rep := func(c string, n int) string { return strings.Repeat(c, n) }
	run(rep("(", 25000)+rep("*", 25000), true)
	run(rep("*", 25000)+rep("(", 25000), false)
	run(rep("(", 25000)+rep("*", 24999), false)
	run(rep("*", 30000)+rep(")", 30000), true)
	run(rep(")", 1)+rep("*", 30000)+rep("(", 1), false)
	run(rep("(*", 30000)+rep(")", 30000), true)
}
```
