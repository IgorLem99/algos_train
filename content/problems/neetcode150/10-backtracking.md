---
id: subsets
title: Subsets
difficulty: Medium
category: Backtracking
leetcode: 78
lists: neetcode150
algorithms: backtracking, bit-manipulation
order: 71
---
Дан массив `nums` из **различных** целых чисел. Верни все возможные подмножества (булеан). Дубликатов подмножеств быть не должно, порядок ответа любой.

**Пример:** `nums = [1,2,3]` → `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`

**Пример:** `nums = [0]` → `[[],[0]]`

**Ограничения:** `1 ≤ n ≤ 10`, `-10 ≤ nums[i] ≤ 10`, все числа различны.

<details><summary>Подсказка</summary>Для каждого элемента ровно два варианта: взять или не взять — это дерево глубины n с 2ⁿ листьями.</details>

### Бэктрекинг «взять / не взять»
Рекурсивно решаем для каждого элемента, включать ли его в текущее подмножество. Дойдя до конца массива, сохраняем **копию** текущего набора — сам срез дальше будет меняться.

**Сложность:** время O(n·2ⁿ), память O(n) на рекурсию (без учёта ответа).

```go
func subsets(nums []int) [][]int {
	var res [][]int
	var cur []int
	var dfs func(i int)
	dfs = func(i int) {
		if i == len(nums) {
			res = append(res, append([]int{}, cur...)) // копия!
			return
		}
		// берём nums[i]
		cur = append(cur, nums[i])
		dfs(i + 1)
		cur = cur[:len(cur)-1]
		// не берём nums[i]
		dfs(i + 1)
	}
	dfs(0)
	return res
}
```

### Итеративное наращивание
Начинаем с `[[]]`. Каждый новый элемент дописываем ко всем уже имеющимся подмножествам — их количество удваивается.

**Сложность:** время O(n·2ⁿ), память O(1) сверх ответа.

```go
func subsets(nums []int) [][]int {
	res := [][]int{{}}
	for _, x := range nums {
		n := len(res) // фиксируем размер: расширяем только «старые» подмножества
		for i := 0; i < n; i++ {
			s := make([]int, len(res[i])+1)
			copy(s, res[i])
			s[len(s)-1] = x
			res = append(res, s)
		}
	}
	return res
}
```

### Битовые маски
Подмножества биективно соответствуют числам от 0 до 2ⁿ−1: i-й бит маски говорит, входит ли `nums[i]`.

**Сложность:** время O(n·2ⁿ), память O(1) сверх ответа.

```go
func subsets(nums []int) [][]int {
	n := len(nums)
	res := make([][]int, 0, 1<<n)
	for mask := 0; mask < 1<<n; mask++ {
		s := []int{}
		for i := 0; i < n; i++ {
			if mask>>i&1 == 1 {
				s = append(s, nums[i])
			}
		}
		res = append(res, s)
	}
	return res
}
```

---
id: combination-sum
title: Combination Sum
difficulty: Medium
category: Backtracking
leetcode: 39
lists: neetcode150
algorithms: backtracking, knapsack
order: 72
---
Дан массив **различных** чисел `candidates` и число `target`. Верни все уникальные комбинации чисел из `candidates` с суммой `target`. Каждое число можно брать **неограниченное** число раз. Комбинации, отличающиеся только порядком, считаются одинаковыми.

**Пример:** `candidates = [2,3,6,7], target = 7` → `[[2,2,3],[7]]`

**Пример:** `candidates = [2,3,5], target = 8` → `[[2,2,2,2],[2,3,3],[3,5]]`

**Ограничения:** `1 ≤ n ≤ 30`, `2 ≤ candidates[i] ≤ 40`, `1 ≤ target ≤ 40`.

<details><summary>Подсказка</summary>Чтобы не получить перестановки одной комбинации, выбирай числа только с индексом ≥ текущего.</details>

### Бэктрекинг с индексом старта
Перебираем, какое число добавить следующим, но только начиная с индекса `start` — так комбинации строятся в неубывающем порядке индексов и не повторяются. Рекурсивный вызов идёт с тем же `i`, потому что число можно брать снова.

**Сложность:** время O(n^(T/m)), где T — target, m — минимальный кандидат; память O(T/m).

```go
func combinationSum(candidates []int, target int) [][]int {
	var res [][]int
	var cur []int
	var dfs func(start, remain int)
	dfs = func(start, remain int) {
		if remain == 0 {
			res = append(res, append([]int(nil), cur...))
			return
		}
		for i := start; i < len(candidates); i++ {
			if candidates[i] > remain {
				continue
			}
			cur = append(cur, candidates[i])
			dfs(i, remain-candidates[i]) // i, а не i+1: число можно взять повторно
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0, target)
	return res
}
```

### Сортировка и отсечение
Отсортируем кандидатов: как только очередное число больше остатка, все следующие тоже больше — цикл можно прервать `break`. На практике заметно сокращает дерево перебора.

**Сложность:** время O(n^(T/m)) в худшем случае, память O(T/m).

```go
func combinationSum(candidates []int, target int) [][]int {
	sort.Ints(candidates)
	var res [][]int
	var cur []int
	var dfs func(start, remain int)
	dfs = func(start, remain int) {
		if remain == 0 {
			res = append(res, append([]int(nil), cur...))
			return
		}
		for i := start; i < len(candidates) && candidates[i] <= remain; i++ {
			cur = append(cur, candidates[i])
			dfs(i, remain-candidates[i])
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0, target)
	return res
}
```

### ДП как в рюкзаке без ограничений
`dp[t]` — список всех комбинаций с суммой `t`. Внешний цикл по числам, внутренний по суммам (как в unbounded knapsack) — тогда каждая комбинация собирается в одном порядке и перестановки не появляются.

**Сложность:** время O(n·T·K), где K — число комбинаций; память O(T·K).

```go
func combinationSum(candidates []int, target int) [][]int {
	dp := make([][][]int, target+1)
	dp[0] = [][]int{{}}
	for _, c := range candidates { // сначала числа, потом суммы — без перестановок
		for t := c; t <= target; t++ {
			for _, comb := range dp[t-c] {
				nc := make([]int, len(comb)+1)
				copy(nc, comb)
				nc[len(comb)] = c
				dp[t] = append(dp[t], nc)
			}
		}
	}
	return dp[target]
}
```

---
id: combination-sum-ii
title: Combination Sum II
difficulty: Medium
category: Backtracking
leetcode: 40
lists: neetcode150
algorithms: backtracking, sorting-selection
order: 73
---
Дан массив `candidates` (числа могут **повторяться**) и `target`. Верни все уникальные комбинации с суммой `target`, где каждый элемент массива используется **не более одного раза**. В ответе не должно быть одинаковых комбинаций.

**Пример:** `candidates = [10,1,2,7,6,1,5], target = 8` → `[[1,1,6],[1,2,5],[1,7],[2,6]]`

**Пример:** `candidates = [2,5,2,1,2], target = 5` → `[[1,2,2],[5]]`

**Ограничения:** `1 ≤ n ≤ 100`, `1 ≤ candidates[i] ≤ 50`, `1 ≤ target ≤ 30`.

<details><summary>Подсказка</summary>Отсортируй массив и на одном уровне рекурсии не начинай ветку с числа, равного предыдущему.</details>

### Сортировка и пропуск дубликатов на уровне
После сортировки одинаковые числа стоят рядом. На одном уровне рекурсии (выбор очередного элемента) берём каждое значение только первым из одинаковых — иначе получим ту же комбинацию дважды. Отсортированность также даёт `break`, когда число больше остатка.

**Сложность:** время O(n·2ⁿ), память O(n).

```go
func combinationSum2(candidates []int, target int) [][]int {
	sort.Ints(candidates)
	var res [][]int
	var cur []int
	var dfs func(start, remain int)
	dfs = func(start, remain int) {
		if remain == 0 {
			res = append(res, append([]int(nil), cur...))
			return
		}
		for i := start; i < len(candidates); i++ {
			if i > start && candidates[i] == candidates[i-1] {
				continue // то же значение на том же уровне — дубликат комбинации
			}
			if candidates[i] > remain {
				break
			}
			cur = append(cur, candidates[i])
			dfs(i+1, remain-candidates[i])
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0, target)
	return res
}
```

### Перебор по различным значениям с кратностями
Сжимаем массив в пары «значение → сколько раз встречается». Для каждого различного значения решаем, сколько его копий взять: 0, 1, …, cnt. Дубликаты не возникают в принципе, так как значения перебираются по порядку.

**Сложность:** время O(∏(cntᵢ+1)) в худшем случае, память O(n).

```go
func combinationSum2(candidates []int, target int) [][]int {
	cnt := map[int]int{}
	for _, c := range candidates {
		cnt[c]++
	}
	vals := make([]int, 0, len(cnt))
	for v := range cnt {
		vals = append(vals, v)
	}
	sort.Ints(vals)

	var res [][]int
	var cur []int
	var dfs func(i, remain int)
	dfs = func(i, remain int) {
		if remain == 0 {
			res = append(res, append([]int(nil), cur...))
			return
		}
		if i == len(vals) || vals[i] > remain {
			return
		}
		v, n := vals[i], len(cur)
		// берём v один, два, ... cnt[v] раз
		for k := 1; k <= cnt[v] && k*v <= remain; k++ {
			cur = append(cur, v)
			dfs(i+1, remain-k*v)
		}
		cur = cur[:n]
		dfs(i+1, remain) // не берём v вовсе
	}
	dfs(0, target)
	return res
}
```

---
id: permutations
title: Permutations
difficulty: Medium
category: Backtracking
leetcode: 46
lists: neetcode150
algorithms: backtracking
order: 74
---
Дан массив `nums` из **различных** чисел. Верни все возможные перестановки в любом порядке.

**Пример:** `nums = [1,2,3]` → `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`

**Пример:** `nums = [0,1]` → `[[0,1],[1,0]]`

**Ограничения:** `1 ≤ n ≤ 6`, все числа различны.

<details><summary>Подсказка</summary>На каждой позиции перебирай любой ещё не использованный элемент.</details>

### Бэктрекинг с массивом used
Строим перестановку по позициям: на очередную позицию ставим любой ещё не использованный элемент, рекурсивно заполняем остальное и откатываем выбор.

**Сложность:** время O(n·n!), память O(n).

```go
func permute(nums []int) [][]int {
	var res [][]int
	cur := make([]int, 0, len(nums))
	used := make([]bool, len(nums))
	var dfs func()
	dfs = func() {
		if len(cur) == len(nums) {
			res = append(res, append([]int(nil), cur...))
			return
		}
		for i, x := range nums {
			if used[i] {
				continue
			}
			used[i] = true
			cur = append(cur, x)
			dfs()
			cur = cur[:len(cur)-1]
			used[i] = false
		}
	}
	dfs()
	return res
}
```

### Перестановки обменами
Префикс `nums[:k]` уже зафиксирован; на позицию `k` по очереди ставим каждый элемент из хвоста обменом `nums[k] ↔ nums[i]` и после рекурсии меняем обратно. Не нужны ни `used`, ни отдельный буфер.

**Сложность:** время O(n·n!), память O(n).

```go
func permute(nums []int) [][]int {
	var res [][]int
	var dfs func(k int)
	dfs = func(k int) {
		if k == len(nums) {
			res = append(res, append([]int(nil), nums...))
			return
		}
		for i := k; i < len(nums); i++ {
			nums[k], nums[i] = nums[i], nums[k]
			dfs(k + 1)
			nums[k], nums[i] = nums[i], nums[k] // откат
		}
	}
	dfs(0)
	return res
}
```

### Итеративная вставка
Перестановки из первых i чисел расширяем следующим числом, вставляя его во все i+1 позиций каждой перестановки.

**Сложность:** время O(n·n!), память O(n·n!) на промежуточные списки.

```go
func permute(nums []int) [][]int {
	res := [][]int{{}}
	for _, x := range nums {
		var next [][]int
		for _, p := range res {
			for pos := 0; pos <= len(p); pos++ {
				q := make([]int, 0, len(p)+1)
				q = append(q, p[:pos]...)
				q = append(q, x)
				q = append(q, p[pos:]...)
				next = append(next, q)
			}
		}
		res = next
	}
	return res
}
```

---
id: subsets-ii
title: Subsets II
difficulty: Medium
category: Backtracking
leetcode: 90
lists: neetcode150
algorithms: backtracking, sorting-selection
order: 75
---
Дан массив `nums`, который может содержать **дубликаты**. Верни все возможные подмножества без повторяющихся подмножеств, в любом порядке.

**Пример:** `nums = [1,2,2]` → `[[],[1],[1,2],[1,2,2],[2],[2,2]]`

**Пример:** `nums = [0]` → `[[],[0]]`

**Ограничения:** `1 ≤ n ≤ 10`, `-10 ≤ nums[i] ≤ 10`.

<details><summary>Подсказка</summary>Отсортируй и на одном уровне рекурсии пропускай значение, равное предыдущему.</details>

### Сортировка и пропуск дубликатов
Каждый узел дерева рекурсии — это подмножество, поэтому сохраняем его сразу при входе. Дальше выбираем следующий элемент из хвоста, но среди равных подряд берём только первый — так одинаковые подмножества не строятся дважды.

**Сложность:** время O(n·2ⁿ), память O(n).

```go
func subsetsWithDup(nums []int) [][]int {
	sort.Ints(nums)
	var res [][]int
	var cur []int
	var dfs func(start int)
	dfs = func(start int) {
		res = append(res, append([]int{}, cur...))
		for i := start; i < len(nums); i++ {
			if i > start && nums[i] == nums[i-1] {
				continue // такое же значение на этом уровне уже пробовали
			}
			cur = append(cur, nums[i])
			dfs(i + 1)
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0)
	return res
}
```

### Итеративно: дубликат расширяет только новые подмножества
Как в Subsets, дописываем элемент ко всем имеющимся подмножествам. Но если элемент равен предыдущему, расширяем только подмножества, созданные на прошлом шаге: остальные уже были расширены этим значением.

**Сложность:** время O(n·2ⁿ), память O(1) сверх ответа.

```go
func subsetsWithDup(nums []int) [][]int {
	sort.Ints(nums)
	res := [][]int{{}}
	prevStart := 0
	for i, x := range nums {
		start := 0
		if i > 0 && x == nums[i-1] {
			start = prevStart // только подмножества, добавленные на прошлом шаге
		}
		n := len(res)
		for j := start; j < n; j++ {
			s := make([]int, len(res[j])+1)
			copy(s, res[j])
			s[len(s)-1] = x
			res = append(res, s)
		}
		prevStart = n
	}
	return res
}
```

---
id: word-search
title: Word Search
difficulty: Medium
category: Backtracking
leetcode: 79
lists: neetcode150, blind75
algorithms: backtracking, matrix
order: 76
---
Дана сетка букв `board` размера `m × n` и слово `word`. Верни `true`, если слово можно составить из последовательно **соседних** (по горизонтали или вертикали) клеток. Одну клетку нельзя использовать дважды.

**Пример:** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"` → `true`

**Пример:** тот же `board`, `word = "ABCB"` → `false`

**Ограничения:** `1 ≤ m, n ≤ 6`, `1 ≤ len(word) ≤ 15`, только латинские буквы.

<details><summary>Подсказка</summary>DFS из каждой клетки; помечай клетку как занятую на время рекурсии и снимай метку при возврате.</details>

### DFS с пометкой на месте
Из каждой клетки запускаем DFS, сравнивая букву с `word[k]`. Посещённую клетку временно заменяем на `'#'`, чтобы не использовать её повторно в текущем пути, а при возврате восстанавливаем.

**Сложность:** время O(m·n·3ᴸ), где L — длина слова; память O(L).

```go
func exist(board [][]byte, word string) bool {
	m, n := len(board), len(board[0])
	var dfs func(r, c, k int) bool
	dfs = func(r, c, k int) bool {
		if k == len(word) {
			return true
		}
		if r < 0 || c < 0 || r >= m || c >= n || board[r][c] != word[k] {
			return false
		}
		ch := board[r][c]
		board[r][c] = '#' // клетка занята текущим путём
		found := dfs(r+1, c, k+1) || dfs(r-1, c, k+1) || dfs(r, c+1, k+1) || dfs(r, c-1, k+1)
		board[r][c] = ch
		return found
	}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if dfs(r, c, 0) {
				return true
			}
		}
	}
	return false
}
```

### DFS с предварительными отсечениями
Перед перебором дешёвые проверки: если какой-то буквы в слове больше, чем на доске, — сразу `false`. Кроме того, если первая буква слова встречается на доске чаще последней, ищем слово задом наперёд: стартовых точек меньше, и ветвление обрывается раньше.

**Сложность:** время O(m·n·3ᴸ) в худшем случае, память O(L).

```go
func exist(board [][]byte, word string) bool {
	m, n := len(board), len(board[0])
	if len(word) > m*n {
		return false
	}
	var have, need [128]int
	for _, row := range board {
		for _, ch := range row {
			have[ch]++
		}
	}
	for i := 0; i < len(word); i++ {
		need[word[i]]++
	}
	for ch := range need {
		if need[ch] > have[ch] {
			return false
		}
	}
	w := []byte(word)
	if have[w[0]] > have[w[len(w)-1]] {
		slices.Reverse(w) // начинаем с более редкой буквы
	}

	var dfs func(r, c, k int) bool
	dfs = func(r, c, k int) bool {
		if k == len(w) {
			return true
		}
		if r < 0 || c < 0 || r >= m || c >= n || board[r][c] != w[k] {
			return false
		}
		board[r][c] = '#'
		found := dfs(r+1, c, k+1) || dfs(r-1, c, k+1) || dfs(r, c+1, k+1) || dfs(r, c-1, k+1)
		board[r][c] = w[k]
		return found
	}
	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			if dfs(r, c, 0) {
				return true
			}
		}
	}
	return false
}
```

---
id: palindrome-partitioning
title: Palindrome Partitioning
difficulty: Medium
category: Backtracking
leetcode: 131
lists: neetcode150
algorithms: backtracking, dynamic-programming
order: 77
---
Дана строка `s`. Разбей её на подстроки так, чтобы каждая была палиндромом, и верни **все** такие разбиения.

**Пример:** `s = "aab"` → `[["a","a","b"],["aa","b"]]`

**Пример:** `s = "a"` → `[["a"]]`

**Ограничения:** `1 ≤ len(s) ≤ 16`, только строчные латинские буквы.

<details><summary>Подсказка</summary>Перебирай длину первого куска: если он палиндром — рекурсивно разбивай остаток.</details>

### Бэктрекинг с проверкой двумя указателями
Из позиции `start` пробуем каждый конец `end`; если `s[start..end]` — палиндром, кладём его в текущее разбиение и рекурсивно разбиваем остаток.

**Сложность:** время O(n·2ⁿ), память O(n).

```go
func partition(s string) [][]string {
	isPal := func(l, r int) bool {
		for l < r {
			if s[l] != s[r] {
				return false
			}
			l++
			r--
		}
		return true
	}
	var res [][]string
	var cur []string
	var dfs func(start int)
	dfs = func(start int) {
		if start == len(s) {
			res = append(res, append([]string(nil), cur...))
			return
		}
		for end := start; end < len(s); end++ {
			if isPal(start, end) {
				cur = append(cur, s[start:end+1])
				dfs(end + 1)
				cur = cur[:len(cur)-1]
			}
		}
	}
	dfs(0)
	return res
}
```

### Бэктрекинг + таблица палиндромов (ДП)
Заранее считаем `pal[i][j]` — является ли `s[i..j]` палиндромом: `s[i] == s[j]` и внутренняя часть — палиндром. Тогда в переборе проверка становится O(1).

**Сложность:** время O(n·2ⁿ), память O(n²).

```go
func partition(s string) [][]string {
	n := len(s)
	pal := make([][]bool, n)
	for i := range pal {
		pal[i] = make([]bool, n)
	}
	for i := n - 1; i >= 0; i-- { // i идёт вниз, чтобы pal[i+1] был уже готов
		for j := i; j < n; j++ {
			pal[i][j] = s[i] == s[j] && (j-i < 2 || pal[i+1][j-1])
		}
	}

	var res [][]string
	var cur []string
	var dfs func(start int)
	dfs = func(start int) {
		if start == n {
			res = append(res, append([]string(nil), cur...))
			return
		}
		for end := start; end < n; end++ {
			if pal[start][end] {
				cur = append(cur, s[start:end+1])
				dfs(end + 1)
				cur = cur[:len(cur)-1]
			}
		}
	}
	dfs(0)
	return res
}
```

---
id: letter-combinations-of-a-phone-number
title: Letter Combinations of a Phone Number
difficulty: Medium
category: Backtracking
leetcode: 17
lists: neetcode150
algorithms: backtracking
order: 78
---
Дана строка цифр `digits` из `2–9`. Верни все буквенные комбинации, которые она может обозначать на кнопочном телефоне (2 → abc, 3 → def, …, 7 → pqrs, 9 → wxyz). Для пустой строки — пустой список.

**Пример:** `digits = "23"` → `["ad","ae","af","bd","be","bf","cd","ce","cf"]`

**Пример:** `digits = ""` → `[]`

**Ограничения:** `0 ≤ len(digits) ≤ 4`.

<details><summary>Подсказка</summary>Глубина рекурсии — номер цифры, ветвление — буквы этой цифры.</details>

### Бэктрекинг с буфером
Заполняем буфер длины `len(digits)` по позициям: на позицию i ставим по очереди каждую букву цифры `digits[i]`. Буфер переиспользуется, а в ответ попадает `string(buf)` — это уже копия.

**Сложность:** время O(4ⁿ·n), память O(n).

```go
func letterCombinations(digits string) []string {
	if digits == "" {
		return []string{}
	}
	letters := []string{"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}
	var res []string
	buf := make([]byte, len(digits))
	var dfs func(i int)
	dfs = func(i int) {
		if i == len(digits) {
			res = append(res, string(buf)) // string() копирует байты
			return
		}
		for _, ch := range []byte(letters[digits[i]-'0']) {
			buf[i] = ch
			dfs(i + 1)
		}
	}
	dfs(0)
	return res
}
```

### Итеративно (BFS по цифрам)
Держим список префиксов. Для каждой следующей цифры строим новый список: каждый префикс + каждая буква цифры.

**Сложность:** время O(4ⁿ·n), память O(4ⁿ·n).

```go
func letterCombinations(digits string) []string {
	if digits == "" {
		return []string{}
	}
	letters := []string{"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}
	res := []string{""}
	for i := 0; i < len(digits); i++ {
		var next []string
		for _, prefix := range res {
			for _, ch := range letters[digits[i]-'0'] {
				next = append(next, prefix+string(ch))
			}
		}
		res = next
	}
	return res
}
```

---
id: n-queens
title: N-Queens
difficulty: Hard
category: Backtracking
leetcode: 51
lists: neetcode150
algorithms: backtracking, bit-manipulation
order: 79
---
Расставь `n` ферзей на доске `n × n` так, чтобы никакие два не били друг друга. Верни все различные расстановки; каждая — список строк, где `'Q'` — ферзь, `'.'` — пустая клетка.

**Пример:** `n = 4` → `[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]`

**Пример:** `n = 1` → `[["Q"]]`

**Ограничения:** `1 ≤ n ≤ 9`.

<details><summary>Подсказка</summary>Ставь по одному ферзю в строку; занятые столбцы и диагонали храни в множествах: у диагоналей постоянны r+c и r−c.</details>

### Бэктрекинг с множествами столбцов и диагоналей
Идём по строкам и ставим ферзя в свободный столбец. Клетка `(r, c)` бьётся, если занят столбец `c`, диагональ `r+c` или антидиагональ `r−c` (сдвигаем на `n`, чтобы индекс был неотрицательным).

**Сложность:** время O(n!), память O(n).

```go
func solveNQueens(n int) [][]string {
	var res [][]string
	cols := make([]bool, n)
	diag := make([]bool, 2*n)  // r + c
	anti := make([]bool, 2*n)  // r - c + n
	pos := make([]int, n)      // pos[r] — столбец ферзя в строке r
	var dfs func(r int)
	dfs = func(r int) {
		if r == n {
			board := make([]string, n)
			for i, c := range pos {
				row := []byte(strings.Repeat(".", n))
				row[c] = 'Q'
				board[i] = string(row)
			}
			res = append(res, board)
			return
		}
		for c := 0; c < n; c++ {
			if cols[c] || diag[r+c] || anti[r-c+n] {
				continue
			}
			cols[c], diag[r+c], anti[r-c+n] = true, true, true
			pos[r] = c
			dfs(r + 1)
			cols[c], diag[r+c], anti[r-c+n] = false, false, false
		}
	}
	dfs(0)
	return res
}
```

### Бэктрекинг на битовых масках
Занятые столбцы и диагонали храним битами. При переходе на следующую строку маска одних диагоналей сдвигается влево, других — вправо. Свободные столбцы — `full &^ (cols|d1|d2)`, перебираем их по младшему биту `free & -free`.

**Сложность:** время O(n!), память O(n).

```go
func solveNQueens(n int) [][]string {
	var res [][]string
	pos := make([]int, n)
	full := 1<<n - 1
	var dfs func(r, cols, d1, d2 int)
	dfs = func(r, cols, d1, d2 int) {
		if r == n {
			board := make([]string, n)
			for i, c := range pos {
				board[i] = strings.Repeat(".", c) + "Q" + strings.Repeat(".", n-c-1)
			}
			res = append(res, board)
			return
		}
		free := full &^ (cols | d1 | d2)
		for free != 0 {
			bit := free & -free // младший свободный столбец
			free ^= bit
			pos[r] = bits.TrailingZeros(uint(bit))
			dfs(r+1, cols|bit, (d1|bit)<<1&full, (d2|bit)>>1)
		}
	}
	dfs(0, 0, 0, 0)
	return res
}
```
