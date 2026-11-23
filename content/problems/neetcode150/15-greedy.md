---
id: maximum-subarray
title: Maximum Subarray
difficulty: Medium
category: Greedy
leetcode: 53
lists: neetcode150, blind75
algorithms: greedy, dynamic-programming
order: 122
---
Дан массив целых чисел `nums`. Найди непрерывный подмассив (минимум один элемент) с наибольшей суммой и верни эту сумму.

**Пример:** `nums = [-2,1,-3,4,-1,2,1,-5,4]` → `6` (подмассив `[4,-1,2,1]`)

**Ограничения:** `1 ≤ n ≤ 10⁵`, `-10⁴ ≤ nums[i] ≤ 10⁴`

<details><summary>Подсказка</summary>Если сумма подмассива, оканчивающегося перед текущим элементом, отрицательна, она только мешает — лучше начать заново с текущего элемента.</details>

### Перебор всех подмассивов
Фиксируем левую границу и наращиваем правую, поддерживая текущую сумму, — берём максимум по всем парам.

**Сложность:** время O(n²), память O(1).

```go
func maxSubArray(nums []int) int {
	best := nums[0]
	for i := range nums {
		sum := 0
		for j := i; j < len(nums); j++ {
			sum += nums[j]
			best = max(best, sum)
		}
	}
	return best
}
```

### Алгоритм Кадане
`cur` — лучшая сумма подмассива, оканчивающегося в текущей позиции: либо продолжаем предыдущий (`cur + x`), либо начинаем заново (`x`).

**Сложность:** время O(n), память O(1).

```go
func maxSubArray(nums []int) int {
	best, cur := nums[0], nums[0]
	for _, x := range nums[1:] {
		cur = max(x, cur+x) // продолжить или начать с нуля
		best = max(best, cur)
	}
	return best
}
```

### Разделяй и властвуй
Для каждого отрезка храним четыре числа: сумму, лучший префикс, лучший суффикс и лучший подмассив. Лучший подмассив объединения — либо внутри левой половины, либо внутри правой, либо «суффикс левой + префикс правой».

**Сложность:** время O(n), память O(log n).

```go
type seg struct{ sum, pref, suf, best int }

func maxSubArray(nums []int) int {
	var solve func(l, r int) seg
	solve = func(l, r int) seg {
		if l == r {
			v := nums[l]
			return seg{v, v, v, v}
		}
		m := (l + r) / 2
		a, b := solve(l, m), solve(m+1, r)
		return seg{
			sum:  a.sum + b.sum,
			pref: max(a.pref, a.sum+b.pref),
			suf:  max(b.suf, b.sum+a.suf),
			best: max(a.best, b.best, a.suf+b.pref),
		}
	}
	return solve(0, len(nums)-1).best
}
```

---
id: jump-game
title: Jump Game
difficulty: Medium
category: Greedy
leetcode: 55
lists: neetcode150, blind75
algorithms: greedy, dynamic-programming
order: 123
---
Дан массив `nums`: `nums[i]` — максимальная длина прыжка из позиции `i`. Ты стоишь в индексе 0. Можно ли дойти до последнего индекса?

**Примеры:** `nums = [2,3,1,1,4]` → `true`; `nums = [3,2,1,0,4]` → `false` (всегда застреваем на индексе 3)

**Ограничения:** `1 ≤ n ≤ 10⁴`, `0 ≤ nums[i] ≤ 10⁵`

<details><summary>Подсказка</summary>Достаточно следить за самой дальней достижимой позицией; если текущий индекс правее неё — мы застряли.</details>

### Динамика: достижимость каждой позиции
`reach[i]` — достижима ли позиция `i`. Для каждой достижимой позиции помечаем все клетки, куда можно прыгнуть.

**Сложность:** время O(n²), память O(n).

```go
func canJump(nums []int) bool {
	n := len(nums)
	reach := make([]bool, n)
	reach[0] = true
	for i := 0; i < n; i++ {
		if !reach[i] {
			continue
		}
		for j := i + 1; j <= i+nums[i] && j < n; j++ {
			reach[j] = true
		}
	}
	return reach[n-1]
}
```

### Жадность: самая дальняя позиция
Идём слева направо, храним `far` — максимальный достижимый индекс. Если `i > far`, дальше пройти нельзя.

**Сложность:** время O(n), память O(1).

```go
func canJump(nums []int) bool {
	far := 0
	for i, x := range nums {
		if i > far {
			return false
		}
		far = max(far, i+x)
	}
	return true
}
```

### Жадность с конца
Цель — последний индекс. Двигаем её влево: если из позиции `i` можно допрыгнуть до цели, то цель становится `i`. В конце проверяем, что цель дошла до 0.

**Сложность:** время O(n), память O(1).

```go
func canJump(nums []int) bool {
	goal := len(nums) - 1
	for i := len(nums) - 2; i >= 0; i-- {
		if i+nums[i] >= goal {
			goal = i
		}
	}
	return goal == 0
}
```

---
id: jump-game-ii
title: Jump Game II
difficulty: Medium
category: Greedy
leetcode: 45
lists: neetcode150
algorithms: greedy, graph-bfs, dynamic-programming
order: 124
---
Дан массив `nums`: `nums[i]` — максимальная длина прыжка из `i`. Верни минимальное число прыжков, чтобы дойти из индекса 0 до последнего. Гарантируется, что последний индекс достижим.

**Примеры:** `nums = [2,3,1,1,4]` → `2`; `nums = [2,3,0,1,4]` → `2`

**Ограничения:** `1 ≤ n ≤ 10⁴`, `0 ≤ nums[i] ≤ 1000`

<details><summary>Подсказка</summary>Это BFS по «окнам»: все позиции, достижимые за k прыжков, образуют отрезок.</details>

### Динамика
`dp[i]` — минимум прыжков до `i`. Из каждой позиции обновляем все клетки, до которых можно допрыгнуть.

**Сложность:** время O(n²), память O(n).

```go
func jump(nums []int) int {
	n := len(nums)
	const inf = 1 << 30
	dp := make([]int, n)
	for i := 1; i < n; i++ {
		dp[i] = inf
	}
	for i := 0; i < n; i++ {
		for j := i + 1; j <= i+nums[i] && j < n; j++ {
			dp[j] = min(dp[j], dp[i]+1)
		}
	}
	return dp[n-1]
}
```

### Жадность: BFS по уровням
`curEnd` — граница текущего «уровня» (позиции, достижимые за `jumps` прыжков), `far` — самая дальняя позиция, достижимая из уровня. Дойдя до `curEnd`, обязаны сделать ещё один прыжок и расширить уровень до `far`.

**Сложность:** время O(n), память O(1).

```go
func jump(nums []int) int {
	jumps, curEnd, far := 0, 0, 0
	for i := 0; i < len(nums)-1; i++ {
		far = max(far, i+nums[i])
		if i == curEnd { // уровень закончился — прыгаем
			jumps++
			curEnd = far
		}
	}
	return jumps
}
```

---
id: gas-station
title: Gas Station
difficulty: Medium
category: Greedy
leetcode: 134
lists: neetcode150
algorithms: greedy
order: 125
---
По кругу расположены `n` заправок: на `i`-й можно взять `gas[i]` топлива, переезд до `i+1` стоит `cost[i]`. Бак пустой и неограниченный. Верни индекс заправки, с которой можно проехать весь круг по часовой стрелке, или `-1`. Ответ единственный, если существует.

**Пример:** `gas = [1,2,3,4,5], cost = [3,4,5,1,2]` → `3`

**Ограничения:** `1 ≤ n ≤ 10⁵`

<details><summary>Подсказка</summary>Если не хватило топлива на пути от `s` до `j`, то и любой старт между `s` и `j` не подойдёт.</details>

### Перебор стартовых точек
Для каждого старта симулируем проезд по кругу.

**Сложность:** время O(n²), память O(1).

```go
func canCompleteCircuit(gas []int, cost []int) int {
	n := len(gas)
	for s := 0; s < n; s++ {
		tank := 0
		ok := true
		for k := 0; k < n; k++ {
			i := (s + k) % n
			tank += gas[i] - cost[i]
			if tank < 0 {
				ok = false
				break
			}
		}
		if ok {
			return s
		}
	}
	return -1
}
```

### Жадность за один проход
Если суммарно `gas < cost` — ответа нет. Иначе едем, накапливая бак; когда он уходит в минус, никакой старт до текущей точки не годится, поэтому новый кандидат — следующая станция. Из-за гарантии, что суммарного топлива хватает, последний кандидат и есть ответ.

**Сложность:** время O(n), память O(1).

```go
func canCompleteCircuit(gas []int, cost []int) int {
	total, tank, start := 0, 0, 0
	for i := range gas {
		d := gas[i] - cost[i]
		total += d
		tank += d
		if tank < 0 {
			start = i + 1
			tank = 0
		}
	}
	if total < 0 {
		return -1
	}
	return start
}
```

---
id: hand-of-straights
title: Hand of Straights
difficulty: Medium
category: Greedy
leetcode: 846
lists: neetcode150
algorithms: greedy, hashing, sorting-selection
order: 126
---
Дан массив карт `hand` и число `groupSize`. Можно ли разбить карты на группы по `groupSize` карт, в каждой из которых значения идут подряд?

**Примеры:** `hand = [1,2,3,6,2,3,4,7,8], groupSize = 3` → `true`; `hand = [1,2,3,4,5], groupSize = 4` → `false`

**Ограничения:** `1 ≤ n ≤ 10⁴`, `0 ≤ hand[i] ≤ 10⁹`

<details><summary>Подсказка</summary>Минимальная оставшаяся карта обязана быть началом группы — других вариантов у неё нет.</details>

### Сортировка и поиск следующих карт
Сортируем руку. Берём первую неиспользованную карту как начало группы и ищем по порядку неиспользованные `v+1, v+2, …`.

**Сложность:** время O(n²), память O(n).

```go
func isNStraightHand(hand []int, groupSize int) bool {
	n := len(hand)
	if n%groupSize != 0 {
		return false
	}
	sorted := append([]int(nil), hand...)
	sort.Ints(sorted)
	used := make([]bool, n)
	for i := 0; i < n; i++ {
		if used[i] {
			continue
		}
		next, cnt := sorted[i], 0
		for j := i; j < n && cnt < groupSize; j++ {
			if !used[j] && sorted[j] == next {
				used[j] = true
				next++
				cnt++
			}
		}
		if cnt < groupSize {
			return false
		}
	}
	return true
}
```

### Счётчики и отсортированные значения
Считаем частоты. Идём по отсортированным различным значениям: если у `v` ещё есть карты, то все `c = cnt[v]` копий начинают группы, значит нужно уменьшить `cnt[v..v+g-1]` на `c`; нехватка — `false`.

**Сложность:** время O(n log n + u·g), где u — число различных значений; память O(n).

```go
func isNStraightHand(hand []int, groupSize int) bool {
	if len(hand)%groupSize != 0 {
		return false
	}
	cnt := make(map[int]int)
	for _, v := range hand {
		cnt[v]++
	}
	keys := make([]int, 0, len(cnt))
	for v := range cnt {
		keys = append(keys, v)
	}
	sort.Ints(keys)
	for _, v := range keys {
		c := cnt[v]
		if c == 0 {
			continue
		}
		for k := 0; k < groupSize; k++ {
			if cnt[v+k] < c {
				return false
			}
			cnt[v+k] -= c
		}
	}
	return true
}
```

---
id: merge-triplets-to-form-target-triplet
title: Merge Triplets to Form Target Triplet
difficulty: Medium
category: Greedy
leetcode: 1899
lists: neetcode150
algorithms: greedy
order: 127
---
Даны тройки `triplets[i] = [a, b, c]` и целевая тройка `target`. Операция: выбрать две тройки и заменить одну из них на покомпонентный максимум. Можно ли получить `target` как одну из троек?

**Пример:** `triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]` → `true`

**Ограничения:** `1 ≤ n ≤ 10⁵`, значения до `1000`

<details><summary>Подсказка</summary>Тройка, у которой хоть одна координата больше цели, навсегда портит результат — её нужно выбросить.</details>

### Максимум по подходящим тройкам
Оставляем только тройки, у которых все координаты `≤ target`, берём покомпонентный максимум и сравниваем с целью.

**Сложность:** время O(n), память O(1).

```go
func mergeTriplets(triplets [][]int, target []int) bool {
	res := [3]int{}
	for _, t := range triplets {
		if t[0] > target[0] || t[1] > target[1] || t[2] > target[2] {
			continue
		}
		for k := 0; k < 3; k++ {
			res[k] = max(res[k], t[k])
		}
	}
	return res[0] == target[0] && res[1] == target[1] && res[2] == target[2]
}
```

### Три флага
Не нужно хранить максимум: достаточно проверить, что для каждой координаты нашлась подходящая тройка, где эта координата в точности совпадает с целью.

**Сложность:** время O(n), память O(1).

```go
func mergeTriplets(triplets [][]int, target []int) bool {
	var found [3]bool
	for _, t := range triplets {
		if t[0] > target[0] || t[1] > target[1] || t[2] > target[2] {
			continue
		}
		for k := 0; k < 3; k++ {
			if t[k] == target[k] {
				found[k] = true
			}
		}
	}
	return found[0] && found[1] && found[2]
}
```

---
id: partition-labels
title: Partition Labels
difficulty: Medium
category: Greedy
leetcode: 763
lists: neetcode150
algorithms: greedy, two-pointers
order: 128
---
Дана строка `s`. Раздели её на как можно больше частей так, чтобы каждая буква встречалась не более чем в одной части. Верни размеры частей.

**Пример:** `s = "ababcbacadefegdehijhklij"` → `[9,7,8]`

**Ограничения:** `1 ≤ |s| ≤ 500`, строчные латинские буквы

<details><summary>Подсказка</summary>Знай последнюю позицию каждой буквы: часть не может закончиться раньше, чем последняя позиция любой её буквы.</details>

### Расширение границы через поиск
Начинаем часть с `i`, конец — последнее вхождение `s[i]`; пока идём по части, расширяем конец последними вхождениями встреченных букв (ищем их заново).

**Сложность:** время O(n²), память O(1).

```go
func partitionLabels(s string) []int {
	var res []int
	i := 0
	for i < len(s) {
		end := strings.LastIndexByte(s, s[i])
		for j := i; j < end; j++ {
			end = max(end, strings.LastIndexByte(s, s[j]))
		}
		res = append(res, end-i+1)
		i = end + 1
	}
	return res
}
```

### Жадность с таблицей последних позиций
Один проход предвычисляет `last[c]`. Затем идём по строке, поддерживая `end` — максимум последних позиций уже виденных букв; когда `i == end`, часть закрыта.

**Сложность:** время O(n), память O(1) (алфавит 26).

```go
func partitionLabels(s string) []int {
	var last [26]int
	for i := 0; i < len(s); i++ {
		last[s[i]-'a'] = i
	}
	var res []int
	start, end := 0, 0
	for i := 0; i < len(s); i++ {
		end = max(end, last[s[i]-'a'])
		if i == end {
			res = append(res, end-start+1)
			start = i + 1
		}
	}
	return res
}
```

---
id: valid-parenthesis-string
title: Valid Parenthesis String
difficulty: Medium
category: Greedy
leetcode: 678
lists: neetcode150
algorithms: greedy, stack, dynamic-programming
order: 129
---
Строка содержит `'('`, `')'` и `'*'`. Звёздочка может быть `'('`, `')'` или пустой строкой. Верни, можно ли сделать строку правильной скобочной последовательностью.

**Примеры:** `s = "(*)"` → `true`; `s = "(*))"` → `true`; `s = "(()"` → `false`

**Ограничения:** `1 ≤ |s| ≤ 100`

<details><summary>Подсказка</summary>Достаточно хранить диапазон возможных значений баланса `[lo, hi]`.</details>

### Два стека индексов
Храним индексы открывающих скобок и звёздочек. `)` гасит сначала `(`, потом `*`. В конце каждой оставшейся `(` нужна звёздочка, стоящая правее неё.

**Сложность:** время O(n), память O(n).

```go
func checkValidString(s string) bool {
	var left, star []int
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '(':
			left = append(left, i)
		case '*':
			star = append(star, i)
		default:
			if len(left) > 0 {
				left = left[:len(left)-1]
			} else if len(star) > 0 {
				star = star[:len(star)-1]
			} else {
				return false
			}
		}
	}
	for len(left) > 0 && len(star) > 0 {
		if left[len(left)-1] > star[len(star)-1] {
			return false // звёздочка левее скобки не поможет
		}
		left = left[:len(left)-1]
		star = star[:len(star)-1]
	}
	return len(left) == 0
}
```

### Жадность: диапазон баланса
`lo` — минимальный возможный баланс (все `*` как `)`), `hi` — максимальный (все `*` как `(`). Если `hi < 0` — слишком много `)`. `lo` не опускаем ниже нуля. В конце нужно, чтобы 0 входил в диапазон: `lo == 0`.

**Сложность:** время O(n), память O(1).

```go
func checkValidString(s string) bool {
	lo, hi := 0, 0
	for _, c := range s {
		switch c {
		case '(':
			lo++
			hi++
		case ')':
			lo--
			hi--
		default:
			lo--
			hi++
		}
		if hi < 0 {
			return false
		}
		if lo < 0 {
			lo = 0
		}
	}
	return lo == 0
}
```
