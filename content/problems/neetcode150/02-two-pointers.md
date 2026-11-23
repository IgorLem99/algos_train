---
id: valid-palindrome
title: Valid Palindrome
difficulty: Easy
category: Two Pointers
leetcode: 125
lists: neetcode150, blind75
algorithms: two-pointers
order: 10
---
Строка `s` — палиндром, если после приведения к нижнему регистру и удаления всех не буквенно-цифровых символов она читается одинаково в обе стороны. Проверь это.

**Пример:** `s = "A man, a plan, a canal: Panama"` → `true`; `s = "race a car"` → `false`

**Ограничения:** `1 ≤ len ≤ 2·10⁵`, ASCII-символы.

<details><summary>Подсказка</summary>Два указателя с концов; пропускай «мусорные» символы прямо на ходу, не создавая новую строку.</details>

### Очистка и сравнение с реверсом
Собираем только буквы и цифры в нижнем регистре, затем сравниваем строку с её перевёрнутой копией.

**Сложность:** время O(n), память O(n).

```go
func isPalindrome(s string) bool {
	clean := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c >= 'A' && c <= 'Z':
			clean = append(clean, c+'a'-'A')
		case c >= 'a' && c <= 'z', c >= '0' && c <= '9':
			clean = append(clean, c)
		}
	}
	rev := slices.Clone(clean)
	slices.Reverse(rev)
	return slices.Equal(clean, rev)
}
```

### Два указателя
Идём с обоих концов навстречу, пропуская недопустимые символы, и сравниваем символы в нижнем регистре.

**Сложность:** время O(n), память O(1).

```go
func isPalindrome(s string) bool {
	isAlnum := func(c byte) bool {
		return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9'
	}
	lower := func(c byte) byte {
		if c >= 'A' && c <= 'Z' {
			return c + 'a' - 'A'
		}
		return c
	}
	l, r := 0, len(s)-1
	for l < r {
		if !isAlnum(s[l]) {
			l++
		} else if !isAlnum(s[r]) {
			r--
		} else {
			if lower(s[l]) != lower(s[r]) {
				return false
			}
			l++
			r--
		}
	}
	return true
}
```

---
id: two-sum-ii-input-array-is-sorted
title: Two Sum II - Input Array Is Sorted
difficulty: Medium
category: Two Pointers
leetcode: 167
lists: neetcode150
algorithms: two-pointers, binary-search
order: 11
---
Дан отсортированный по возрастанию массив `numbers` (индексация с 1) и `target`. Верни индексы `[i, j]` (1-based, `i < j`) двух чисел с суммой `target`. Решение единственно; доп. память O(1).

**Пример:** `numbers = [2,7,11,15], target = 9` → `[1,2]`

**Ограничения:** `2 ≤ n ≤ 3·10⁴`, `-1000 ≤ numbers[i] ≤ 1000`

<details><summary>Подсказка</summary>Если сумма крайних слишком велика — сдвинь правый указатель, мала — левый.</details>

### Бинарный поиск дополнения
Для каждого `numbers[i]` бинарным поиском ищем `target − numbers[i]` правее `i`.

**Сложность:** время O(n log n), память O(1).

```go
func twoSum(numbers []int, target int) []int {
	for i := 0; i < len(numbers)-1; i++ {
		rest := target - numbers[i]
		j, found := slices.BinarySearch(numbers[i+1:], rest)
		if found {
			// j — смещение внутри среза numbers[i+1:], плюс 1 для 1-индексации
			return []int{i + 1, i + 1 + j + 1}
		}
	}
	return nil
}
```

### Два указателя
Указатели на концах. Сумма больше `target` — уменьшаем правую границу (самое большое число не подходит ни с кем из оставшихся), меньше — двигаем левую.

**Сложность:** время O(n), память O(1).

```go
func twoSum(numbers []int, target int) []int {
	l, r := 0, len(numbers)-1
	for l < r {
		sum := numbers[l] + numbers[r]
		switch {
		case sum == target:
			return []int{l + 1, r + 1}
		case sum < target:
			l++
		default:
			r--
		}
	}
	return nil
}
```

---
id: 3sum
title: 3Sum
difficulty: Medium
category: Two Pointers
leetcode: 15
lists: neetcode150, blind75
algorithms: two-pointers, sorting-selection
order: 12
---
Дан массив `nums`. Верни все уникальные тройки `[a, b, c]` с индексами `i, j, k` попарно различными и суммой `0`. Дубликатов троек быть не должно.

**Пример:** `nums = [-1,0,1,2,-1,-4]` → `[[-1,-1,2],[-1,0,1]]`

**Ограничения:** `3 ≤ n ≤ 3000`, `-10⁵ ≤ nums[i] ≤ 10⁵`

<details><summary>Подсказка</summary>Отсортируй массив: фиксируй первый элемент, для остальных — two sum на двух указателях; пропускай повторы.</details>

### Сортировка, перебор и хеш-множество
Сортируем, перебираем пары `(i, j)` и ищем третье число в множестве; тройки дедуплицируем через карту с ключом-массивом.

**Сложность:** время O(n²), память O(n).

```go
func threeSum(nums []int) [][]int {
	slices.Sort(nums)
	seen := make(map[[3]int]struct{})
	res := [][]int{}
	for i := 0; i < len(nums)-2; i++ {
		set := make(map[int]struct{})
		for j := i + 1; j < len(nums); j++ {
			need := -nums[i] - nums[j]
			if _, ok := set[need]; ok {
				key := [3]int{nums[i], need, nums[j]}
				if _, dup := seen[key]; !dup {
					seen[key] = struct{}{}
					res = append(res, []int{nums[i], need, nums[j]})
				}
			}
			set[nums[j]] = struct{}{}
		}
	}
	return res
}
```

### Сортировка и два указателя
Сортируем. Для каждого `nums[i]` (пропуская повторы) двигаем `l` и `r` по остатку массива; при нахождении тройки пропускаем одинаковые значения слева. Если `nums[i] > 0`, дальше суммы быть не может.

**Сложность:** время O(n²), память O(1) без учёта сортировки и ответа.

```go
func threeSum(nums []int) [][]int {
	slices.Sort(nums)
	res := [][]int{}
	for i := 0; i < len(nums)-2; i++ {
		if nums[i] > 0 {
			break
		}
		if i > 0 && nums[i] == nums[i-1] {
			continue
		}
		l, r := i+1, len(nums)-1
		for l < r {
			sum := nums[i] + nums[l] + nums[r]
			switch {
			case sum < 0:
				l++
			case sum > 0:
				r--
			default:
				res = append(res, []int{nums[i], nums[l], nums[r]})
				l++
				for l < r && nums[l] == nums[l-1] {
					l++
				}
			}
		}
	}
	return res
}
```

---
id: container-with-most-water
title: Container With Most Water
difficulty: Medium
category: Two Pointers
leetcode: 11
lists: neetcode150, blind75
algorithms: two-pointers, greedy
order: 13
---
Дан массив высот `height`; i-я вертикальная линия идёт от `(i, 0)` до `(i, height[i])`. Выбери две линии так, чтобы вместе с осью X они вмещали максимум воды, и верни этот объём.

**Пример:** `height = [1,8,6,2,5,4,8,3,7]` → `49`

**Ограничения:** `2 ≤ n ≤ 10⁵`, `0 ≤ height[i] ≤ 10⁴`

<details><summary>Подсказка</summary>Объём ограничен более низкой стенкой — двигать выгодно именно её.</details>

### Перебор всех пар
Для каждой пары считаем `min(h[i], h[j]) * (j - i)`.

**Сложность:** время O(n²), память O(1).

```go
func maxArea(height []int) int {
	best := 0
	for i := 0; i < len(height); i++ {
		for j := i + 1; j < len(height); j++ {
			best = max(best, min(height[i], height[j])*(j-i))
		}
	}
	return best
}
```

### Два указателя
Начинаем с самой широкой пары. Сдвигаем указатель с меньшей высотой: сдвиг большей стенки не может увеличить объём, ведь ширина уменьшается, а высота всё равно ограничена меньшей стенкой.

**Сложность:** время O(n), память O(1).

```go
func maxArea(height []int) int {
	l, r := 0, len(height)-1
	best := 0
	for l < r {
		best = max(best, min(height[l], height[r])*(r-l))
		if height[l] < height[r] {
			l++
		} else {
			r--
		}
	}
	return best
}
```

---
id: trapping-rain-water
title: Trapping Rain Water
difficulty: Hard
category: Two Pointers
leetcode: 42
lists: neetcode150
algorithms: two-pointers, dynamic-programming, monotonic-stack
order: 14
---
Дан массив высот столбиков `height` (ширина каждого 1). Посчитай, сколько единиц воды задержится между ними после дождя.

**Пример:** `height = [0,1,0,2,1,0,1,3,2,1,2,1]` → `6`

**Ограничения:** `1 ≤ n ≤ 2·10⁴`, `0 ≤ height[i] ≤ 10⁵`

<details><summary>Подсказка</summary>Над столбиком i воды `min(maxLeft, maxRight) − height[i]`.</details>

### Префиксные и суффиксные максимумы
Предвычисляем `maxL[i]` и `maxR[i]` и суммируем `min(maxL, maxR) − height[i]`.

**Сложность:** время O(n), память O(n).

```go
func trap(height []int) int {
	n := len(height)
	if n == 0 {
		return 0
	}
	maxL := make([]int, n)
	maxR := make([]int, n)
	maxL[0] = height[0]
	for i := 1; i < n; i++ {
		maxL[i] = max(maxL[i-1], height[i])
	}
	maxR[n-1] = height[n-1]
	for i := n - 2; i >= 0; i-- {
		maxR[i] = max(maxR[i+1], height[i])
	}
	total := 0
	for i := range height {
		total += min(maxL[i], maxR[i]) - height[i]
	}
	return total
}
```

### Монотонный стек
Храним индексы с убывающими высотами. Когда приходит столбик выше вершины, вершина — «дно» ямы: берём новую вершину как левую стенку и добавляем слой воды шириной между стенками.

**Сложность:** время O(n), память O(n).

```go
func trap(height []int) int {
	stack := []int{}
	total := 0
	for i, h := range height {
		for len(stack) > 0 && h > height[stack[len(stack)-1]] {
			bottom := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			if len(stack) == 0 {
				break
			}
			left := stack[len(stack)-1]
			width := i - left - 1
			total += width * (min(h, height[left]) - height[bottom])
		}
		stack = append(stack, i)
	}
	return total
}
```

### Два указателя
Хранится максимум слева и справа. Двигаем сторону с меньшим максимумом: для неё уровень воды уже определён этим меньшим максимумом.

**Сложность:** время O(n), память O(1).

```go
func trap(height []int) int {
	l, r := 0, len(height)-1
	maxL, maxR := 0, 0
	total := 0
	for l < r {
		if height[l] < height[r] {
			maxL = max(maxL, height[l])
			total += maxL - height[l]
			l++
		} else {
			maxR = max(maxR, height[r])
			total += maxR - height[r]
			r--
		}
	}
	return total
}
```
