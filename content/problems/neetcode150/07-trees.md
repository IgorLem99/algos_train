---
id: invert-binary-tree
title: Invert Binary Tree
difficulty: Easy
category: Trees
leetcode: 226
lists: neetcode150, blind75
algorithms: tree-traversal
order: 46
---
Дан корень бинарного дерева `root`. Инвертируй дерево (поменяй местами левого и правого потомка у каждого узла) и верни корень.

**Пример:** `root = [4,2,7,1,3,6,9]` → `[4,7,2,9,6,3,1]`

**Ограничения:** число узлов `0 ≤ n ≤ 100`, `-100 ≤ Val ≤ 100`.

<details><summary>Подсказка</summary>Зеркальное отражение дерева — это swap детей у каждого узла; порядок обхода не важен.</details>

### Рекурсивный DFS
Для каждого узла меняем местами потомков и рекурсивно инвертируем оба поддерева. Пустой узел — база рекурсии.

**Сложность:** время O(n), память O(h), где h — высота дерева.

```go
func invertTree(root *TreeNode) *TreeNode {
	if root == nil {
		return nil
	}
	root.Left, root.Right = invertTree(root.Right), invertTree(root.Left)
	return root
}
```

### Итеративный BFS
Обходим дерево очередью; для каждого извлечённого узла меняем детей местами и кладём непустых детей в очередь. Не зависит от глубины стека.

**Сложность:** время O(n), память O(w), где w — максимальная ширина уровня.

```go
func invertTree(root *TreeNode) *TreeNode {
	if root == nil {
		return nil
	}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		node.Left, node.Right = node.Right, node.Left
		if node.Left != nil {
			queue = append(queue, node.Left)
		}
		if node.Right != nil {
			queue = append(queue, node.Right)
		}
	}
	return root
}
```

---
id: maximum-depth-of-binary-tree
title: Maximum Depth of Binary Tree
difficulty: Easy
category: Trees
leetcode: 104
lists: neetcode150, blind75
algorithms: tree-traversal
order: 47
---
Дан корень бинарного дерева. Верни его максимальную глубину — число узлов на самом длинном пути от корня до листа.

**Пример:** `root = [3,9,20,null,null,15,7]` → `3`

**Ограничения:** число узлов `0 ≤ n ≤ 10⁴`.

<details><summary>Подсказка</summary>Глубина узла = 1 + max(глубина левого, глубина правого); у пустого дерева глубина 0.</details>

### Рекурсивный DFS
Глубина дерева равна `1 + max(depth(left), depth(right))`, для `nil` — 0.

**Сложность:** время O(n), память O(h).

```go
func maxDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}
	return 1 + max(maxDepth(root.Left), maxDepth(root.Right))
}
```

### Итеративный BFS по уровням
Обходим дерево по уровням; число обработанных уровней и есть глубина.

**Сложность:** время O(n), память O(w), где w — максимальная ширина.

```go
func maxDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}
	depth := 0
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		depth++
		// обрабатываем ровно один уровень
		for size := len(queue); size > 0; size-- {
			node := queue[0]
			queue = queue[1:]
			if node.Left != nil {
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
	}
	return depth
}
```

---
id: diameter-of-binary-tree
title: Diameter of Binary Tree
difficulty: Easy
category: Trees
leetcode: 543
lists: neetcode150
algorithms: tree-traversal
order: 48
---
Дан корень бинарного дерева. Верни длину диаметра — самого длинного пути между любыми двумя узлами (в рёбрах). Путь не обязан проходить через корень.

**Пример:** `root = [1,2,3,4,5]` → `3` (путь `4 → 2 → 1 → 3`)

**Ограничения:** число узлов `1 ≤ n ≤ 10⁴`.

<details><summary>Подсказка</summary>Самый длинный путь «через» узел равен height(left) + height(right); высоту можно считать в том же обходе.</details>

### Высота для каждого узла отдельно
Диаметр — максимум из трёх: путь через корень (`height(L) + height(R)`), диаметр левого и диаметр правого поддерева. Высота пересчитывается заново для каждого узла, поэтому на вырожденном дереве выходит O(n²).

**Сложность:** время O(n²) в худшем случае, память O(h).

```go
func height(n *TreeNode) int {
	if n == nil {
		return 0
	}
	return 1 + max(height(n.Left), height(n.Right))
}

func diameterOfBinaryTree(root *TreeNode) int {
	if root == nil {
		return 0
	}
	through := height(root.Left) + height(root.Right)
	return max(through, diameterOfBinaryTree(root.Left), diameterOfBinaryTree(root.Right))
}
```

### Один проход DFS
DFS возвращает высоту поддерева, а по пути обновляет глобальный максимум `height(L) + height(R)` для текущего узла. Каждый узел посещается один раз.

**Сложность:** время O(n), память O(h).

```go
func diameterOfBinaryTree(root *TreeNode) int {
	best := 0
	var height func(n *TreeNode) int
	height = func(n *TreeNode) int {
		if n == nil {
			return 0
		}
		l, r := height(n.Left), height(n.Right)
		best = max(best, l+r) // путь через текущий узел
		return 1 + max(l, r)
	}
	height(root)
	return best
}
```

---
id: balanced-binary-tree
title: Balanced Binary Tree
difficulty: Easy
category: Trees
leetcode: 110
lists: neetcode150
algorithms: tree-traversal
order: 49
---
Определи, является ли бинарное дерево height-balanced: для каждого узла высоты левого и правого поддеревьев отличаются не более чем на 1.

**Пример:** `root = [3,9,20,null,null,15,7]` → `true`; `root = [1,2,2,3,3,null,null,4,4]` → `false`

**Ограничения:** число узлов `0 ≤ n ≤ 5000`.

<details><summary>Подсказка</summary>Пусть функция высоты возвращает специальное значение (например, -1), если поддерево уже несбалансировано.</details>

### Сверху вниз с пересчётом высот
Для каждого узла считаем высоты обоих поддеревьев, проверяем разницу и рекурсивно проверяем детей. Высоты считаются многократно — O(n²) на вырожденном дереве.

**Сложность:** время O(n²) в худшем случае, память O(h).

```go
func height(n *TreeNode) int {
	if n == nil {
		return 0
	}
	return 1 + max(height(n.Left), height(n.Right))
}

func isBalanced(root *TreeNode) bool {
	if root == nil {
		return true
	}
	diff := height(root.Left) - height(root.Right)
	if diff < -1 || diff > 1 {
		return false
	}
	return isBalanced(root.Left) && isBalanced(root.Right)
}
```

### Снизу вверх за один проход
DFS возвращает высоту, либо `-1`, если в поддереве нарушен баланс. Как только встретили `-1`, сразу пробрасываем его наверх.

**Сложность:** время O(n), память O(h).

```go
func isBalanced(root *TreeNode) bool {
	var check func(n *TreeNode) int
	check = func(n *TreeNode) int {
		if n == nil {
			return 0
		}
		l := check(n.Left)
		if l == -1 {
			return -1
		}
		r := check(n.Right)
		if r == -1 {
			return -1
		}
		if l-r > 1 || r-l > 1 {
			return -1
		}
		return 1 + max(l, r)
	}
	return check(root) != -1
}
```

---
id: same-tree
title: Same Tree
difficulty: Easy
category: Trees
leetcode: 100
lists: neetcode150, blind75
algorithms: tree-traversal
order: 50
---
Даны корни двух бинарных деревьев `p` и `q`. Проверь, что деревья одинаковы по структуре и значениям узлов.

**Пример:** `p = [1,2,3], q = [1,2,3]` → `true`; `p = [1,2], q = [1,null,2]` → `false`

**Ограничения:** число узлов `0 ≤ n ≤ 100`.

<details><summary>Подсказка</summary>Обходи оба дерева синхронно; разбери случаи «оба nil», «один nil», «значения различаются».</details>

### Рекурсивный DFS
Если оба узла `nil` — равны; если один `nil` или значения разные — нет; иначе сравниваем левые и правые поддеревья.

**Сложность:** время O(n), память O(h).

```go
func isSameTree(p *TreeNode, q *TreeNode) bool {
	if p == nil && q == nil {
		return true
	}
	if p == nil || q == nil || p.Val != q.Val {
		return false
	}
	return isSameTree(p.Left, q.Left) && isSameTree(p.Right, q.Right)
}
```

### Итеративно со стеком пар
Кладём в стек пару корней; на каждом шаге достаём пару, сравниваем и добавляем пары детей.

**Сложность:** время O(n), память O(h).

```go
func isSameTree(p *TreeNode, q *TreeNode) bool {
	type pair struct{ a, b *TreeNode }
	stack := []pair{{p, q}}
	for len(stack) > 0 {
		cur := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if cur.a == nil && cur.b == nil {
			continue
		}
		if cur.a == nil || cur.b == nil || cur.a.Val != cur.b.Val {
			return false
		}
		stack = append(stack, pair{cur.a.Left, cur.b.Left}, pair{cur.a.Right, cur.b.Right})
	}
	return true
}
```

---
id: subtree-of-another-tree
title: Subtree of Another Tree
difficulty: Easy
category: Trees
leetcode: 572
lists: neetcode150, blind75
algorithms: tree-traversal
order: 51
---
Даны корни `root` и `subRoot`. Верни `true`, если в `root` есть поддерево (узел со всеми потомками), идентичное `subRoot`.

**Пример:** `root = [3,4,5,1,2], subRoot = [4,1,2]` → `true`

**Ограничения:** `1 ≤ |root| ≤ 2000`, `1 ≤ |subRoot| ≤ 1000`.

<details><summary>Подсказка</summary>Либо проверь «одинаково ли дерево» в каждом узле root, либо сведи задачу к поиску подстроки в сериализациях.</details>

### Проверка Same Tree в каждом узле
Обходим `root`; в каждом узле проверяем, совпадает ли поддерево с `subRoot` (как в Same Tree).

**Сложность:** время O(m·n), память O(h).

```go
func isSame(a, b *TreeNode) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil || a.Val != b.Val {
		return false
	}
	return isSame(a.Left, b.Left) && isSame(a.Right, b.Right)
}

func isSubtree(root *TreeNode, subRoot *TreeNode) bool {
	if root == nil {
		return false
	}
	if isSame(root, subRoot) {
		return true
	}
	return isSubtree(root.Left, subRoot) || isSubtree(root.Right, subRoot)
}
```

### Сериализация и поиск подстроки
Сериализуем оба дерева в preorder с маркерами `#` для nil; перед каждым значением ставим запятую, чтобы `12` не совпало с `2`. Тогда `subRoot` — поддерево `root` ровно когда его строка является подстрокой строки `root`. Поиск подстроки в стандартной библиотеке работает быстро на практике.

**Сложность:** время O(m + n) для сериализации плюс поиск подстроки, память O(m + n).

```go
func isSubtree(root *TreeNode, subRoot *TreeNode) bool {
	var ser func(n *TreeNode, sb *strings.Builder)
	ser = func(n *TreeNode, sb *strings.Builder) {
		if n == nil {
			sb.WriteString(",#")
			return
		}
		sb.WriteByte(',')
		sb.WriteString(strconv.Itoa(n.Val))
		ser(n.Left, sb)
		ser(n.Right, sb)
	}
	var a, b strings.Builder
	ser(root, &a)
	ser(subRoot, &b)
	return strings.Contains(a.String(), b.String())
}
```

---
id: lowest-common-ancestor-of-a-binary-search-tree
title: Lowest Common Ancestor of a Binary Search Tree
difficulty: Medium
category: Trees
leetcode: 235
lists: neetcode150, blind75
algorithms: bst, tree-traversal
order: 52
---
Дано BST и два узла `p`, `q`. Найди их наименьшего общего предка (LCA) — самый глубокий узел, у которого `p` и `q` лежат в поддереве (узел может быть предком самого себя).

**Пример:** `root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8` → `6`; `p = 2, q = 4` → `2`

**Ограничения:** `2 ≤ n ≤ 10⁵`, все значения уникальны, `p ≠ q`, оба узла есть в дереве.

<details><summary>Подсказка</summary>Пока оба значения меньше (больше) текущего, идём влево (вправо); первый узел, где пути расходятся, — ответ.</details>

### Рекурсивный спуск
Если оба значения меньше значения узла — LCA в левом поддереве; если оба больше — в правом; иначе узел «разделяет» `p` и `q` и является ответом.

**Сложность:** время O(h), память O(h).

```go
func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
	if p.Val < root.Val && q.Val < root.Val {
		return lowestCommonAncestor(root.Left, p, q)
	}
	if p.Val > root.Val && q.Val > root.Val {
		return lowestCommonAncestor(root.Right, p, q)
	}
	return root
}
```

### Итеративный спуск
То же самое циклом: рекурсия не нужна, память O(1).

**Сложность:** время O(h), память O(1).

```go
func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
	cur := root
	for cur != nil {
		switch {
		case p.Val < cur.Val && q.Val < cur.Val:
			cur = cur.Left
		case p.Val > cur.Val && q.Val > cur.Val:
			cur = cur.Right
		default:
			return cur
		}
	}
	return nil
}
```

---
id: binary-tree-level-order-traversal
title: Binary Tree Level Order Traversal
difficulty: Medium
category: Trees
leetcode: 102
lists: neetcode150, blind75
algorithms: tree-traversal, graph-bfs
order: 53
---
Верни обход бинарного дерева по уровням: список списков значений слева направо, уровень за уровнем.

**Пример:** `root = [3,9,20,null,null,15,7]` → `[[3],[9,20],[15,7]]`

**Ограничения:** число узлов `0 ≤ n ≤ 2000`.

<details><summary>Подсказка</summary>В BFS перед обработкой уровня запомни размер очереди — это число узлов текущего уровня.</details>

### BFS с очередью
На каждой итерации обрабатываем ровно `len(queue)` узлов — один уровень, собирая их значения и добавляя детей.

**Сложность:** время O(n), память O(w), где w — максимальная ширина.

```go
func levelOrder(root *TreeNode) [][]int {
	res := [][]int{}
	if root == nil {
		return res
	}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		size := len(queue)
		level := make([]int, 0, size)
		for i := 0; i < size; i++ {
			node := queue[0]
			queue = queue[1:]
			level = append(level, node.Val)
			if node.Left != nil {
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
		res = append(res, level)
	}
	return res
}
```

### DFS с передачей глубины
Рекурсивно спускаемся, передавая глубину; при первом заходе на новую глубину создаём новый список. Левое поддерево обходим раньше правого, поэтому порядок слева направо сохраняется.

**Сложность:** время O(n), память O(h) (не считая результата).

```go
func levelOrder(root *TreeNode) [][]int {
	res := [][]int{}
	var dfs func(n *TreeNode, depth int)
	dfs = func(n *TreeNode, depth int) {
		if n == nil {
			return
		}
		if depth == len(res) {
			res = append(res, nil)
		}
		res[depth] = append(res[depth], n.Val)
		dfs(n.Left, depth+1)
		dfs(n.Right, depth+1)
	}
	dfs(root, 0)
	return res
}
```

---
id: binary-tree-right-side-view
title: Binary Tree Right Side View
difficulty: Medium
category: Trees
leetcode: 199
lists: neetcode150
algorithms: tree-traversal, graph-bfs
order: 54
---
Представь, что смотришь на дерево справа. Верни значения узлов, которые видны сверху вниз.

**Пример:** `root = [1,2,3,null,5,null,4]` → `[1,3,4]`

**Ограничения:** число узлов `0 ≤ n ≤ 100`.

<details><summary>Подсказка</summary>Виден последний узел каждого уровня — или первый узел, достигнутый на данной глубине при обходе «сначала правое».</details>

### BFS: последний узел уровня
Обходим по уровням и берём значение последнего узла каждого уровня.

**Сложность:** время O(n), память O(w).

```go
func rightSideView(root *TreeNode) []int {
	res := []int{}
	if root == nil {
		return res
	}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		size := len(queue)
		for i := 0; i < size; i++ {
			node := queue[0]
			queue = queue[1:]
			if i == size-1 {
				res = append(res, node.Val)
			}
			if node.Left != nil {
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
	}
	return res
}
```

### DFS «сначала правое»
Идём в правого потомка раньше левого. Первый узел, достигший новой глубины, — самый правый на ней: `len(res) == depth`.

**Сложность:** время O(n), память O(h).

```go
func rightSideView(root *TreeNode) []int {
	res := []int{}
	var dfs func(n *TreeNode, depth int)
	dfs = func(n *TreeNode, depth int) {
		if n == nil {
			return
		}
		if depth == len(res) {
			res = append(res, n.Val)
		}
		dfs(n.Right, depth+1)
		dfs(n.Left, depth+1)
	}
	dfs(root, 0)
	return res
}
```

---
id: count-good-nodes-in-binary-tree
title: Count Good Nodes in Binary Tree
difficulty: Medium
category: Trees
leetcode: 1448
lists: neetcode150
algorithms: tree-traversal
order: 55
---
Узел `X` называется хорошим, если на пути от корня до `X` нет узла со значением больше `X.Val`. Верни число хороших узлов.

**Пример:** `root = [3,1,4,3,null,1,5]` → `4` (узлы 3, 4, 3, 5)

**Ограничения:** число узлов `1 ≤ n ≤ 10⁵`, `-10⁴ ≤ Val ≤ 10⁴`.

<details><summary>Подсказка</summary>Передавай вниз максимум значений на пути от корня.</details>

### Рекурсивный DFS с максимумом пути
Спускаемся, передавая максимум на пути. Узел хороший, если `Val >= maxSoFar`; для детей максимум обновляется.

**Сложность:** время O(n), память O(h).

```go
func goodNodes(root *TreeNode) int {
	var dfs func(n *TreeNode, mx int) int
	dfs = func(n *TreeNode, mx int) int {
		if n == nil {
			return 0
		}
		cnt := 0
		if n.Val >= mx {
			cnt = 1
			mx = n.Val
		}
		return cnt + dfs(n.Left, mx) + dfs(n.Right, mx)
	}
	return dfs(root, root.Val)
}
```

### Итеративный BFS с парами (узел, максимум)
Вместе с узлом храним максимум по пути до него. Подходит, когда не хочется глубокой рекурсии.

**Сложность:** время O(n), память O(w).

```go
func goodNodes(root *TreeNode) int {
	type item struct {
		node *TreeNode
		mx   int
	}
	count := 0
	queue := []item{{root, root.Val}}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		mx := cur.mx
		if cur.node.Val >= mx {
			count++
			mx = cur.node.Val
		}
		if cur.node.Left != nil {
			queue = append(queue, item{cur.node.Left, mx})
		}
		if cur.node.Right != nil {
			queue = append(queue, item{cur.node.Right, mx})
		}
	}
	return count
}
```

---
id: validate-binary-search-tree
title: Validate Binary Search Tree
difficulty: Medium
category: Trees
leetcode: 98
lists: neetcode150, blind75
algorithms: bst, tree-traversal
order: 56
---
Проверь, является ли бинарное дерево корректным BST: левое поддерево содержит только значения строго меньше, правое — строго больше значения узла, и это верно для всех узлов.

**Пример:** `root = [2,1,3]` → `true`; `root = [5,1,4,null,null,3,6]` → `false`

**Ограничения:** `1 ≤ n ≤ 10⁴`, `-2³¹ ≤ Val ≤ 2³¹ - 1`.

<details><summary>Подсказка</summary>Недостаточно сравнивать узел только с детьми: у каждого узла есть допустимый диапазон (lo, hi), который сужается при спуске.</details>

### Рекурсия с границами
Для каждого узла храним открытый интервал `(lo, hi)`. Идя влево, сужаем верхнюю границу до `Val`, вправо — нижнюю. Границы — указатели, чтобы корректно обрабатывать крайние значения `int`.

**Сложность:** время O(n), память O(h).

```go
func isValidBST(root *TreeNode) bool {
	var check func(n *TreeNode, lo, hi *int) bool
	check = func(n *TreeNode, lo, hi *int) bool {
		if n == nil {
			return true
		}
		if lo != nil && n.Val <= *lo {
			return false
		}
		if hi != nil && n.Val >= *hi {
			return false
		}
		return check(n.Left, lo, &n.Val) && check(n.Right, &n.Val, hi)
	}
	return check(root, nil, nil)
}
```

### Inorder со сравнением с предыдущим
Inorder-обход BST выдаёт значения строго по возрастанию. Обходим итеративно и проверяем, что каждое значение больше предыдущего.

**Сложность:** время O(n), память O(h).

```go
func isValidBST(root *TreeNode) bool {
	var stack []*TreeNode
	var prev *TreeNode
	cur := root
	for cur != nil || len(stack) > 0 {
		for cur != nil {
			stack = append(stack, cur)
			cur = cur.Left
		}
		cur = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if prev != nil && cur.Val <= prev.Val {
			return false
		}
		prev = cur
		cur = cur.Right
	}
	return true
}
```

---
id: kth-smallest-element-in-a-bst
title: Kth Smallest Element in a BST
difficulty: Medium
category: Trees
leetcode: 230
lists: neetcode150, blind75
algorithms: bst, tree-traversal
order: 57
---
Дано BST и число `k`. Верни `k`-е по величине значение (нумерация с 1).

**Пример:** `root = [3,1,4,null,2], k = 1` → `1`; `root = [5,3,6,2,4,null,null,1], k = 3` → `3`

**Ограничения:** `1 ≤ k ≤ n ≤ 10⁴`.

<details><summary>Подсказка</summary>Inorder-обход BST даёт значения по возрастанию — останавливайся на k-м.</details>

### Полный inorder в срез
Делаем inorder-обход, собираем все значения в срез и берём элемент с индексом `k-1`.

**Сложность:** время O(n), память O(n).

```go
func kthSmallest(root *TreeNode, k int) int {
	var vals []int
	var inorder func(n *TreeNode)
	inorder = func(n *TreeNode) {
		if n == nil {
			return
		}
		inorder(n.Left)
		vals = append(vals, n.Val)
		inorder(n.Right)
	}
	inorder(root)
	return vals[k-1]
}
```

### Итеративный inorder с ранней остановкой
Идём по левой ветке со стеком; при извлечении узла уменьшаем `k`. Когда `k` дошло до нуля — это ответ, остальное дерево не обходим.

**Сложность:** время O(h + k), память O(h).

```go
func kthSmallest(root *TreeNode, k int) int {
	var stack []*TreeNode
	cur := root
	for cur != nil || len(stack) > 0 {
		for cur != nil {
			stack = append(stack, cur)
			cur = cur.Left
		}
		cur = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		k--
		if k == 0 {
			return cur.Val
		}
		cur = cur.Right
	}
	return -1
}
```

---
id: construct-binary-tree-from-preorder-and-inorder-traversal
title: Construct Binary Tree from Preorder and Inorder Traversal
difficulty: Medium
category: Trees
leetcode: 105
lists: neetcode150, blind75
algorithms: tree-traversal, hashing
order: 58
---
Даны массивы `preorder` и `inorder` одного дерева с уникальными значениями. Восстанови и верни дерево.

**Пример:** `preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]` → `[3,9,20,null,null,15,7]`

**Ограничения:** `1 ≤ n ≤ 3000`, значения уникальны.

<details><summary>Подсказка</summary>Первый элемент preorder — корень; его позиция в inorder делит остальное на левое и правое поддеревья.</details>

### Срезы и линейный поиск корня
Корень — `preorder[0]`. Ищем его в `inorder` линейно, получаем размер левого поддерева и рекурсивно строим оба поддерева на срезах. Линейный поиск на каждом уровне даёт O(n²) на вырожденном дереве.

**Сложность:** время O(n²), память O(h).

```go
func buildTree(preorder []int, inorder []int) *TreeNode {
	if len(preorder) == 0 {
		return nil
	}
	root := &TreeNode{Val: preorder[0]}
	mid := 0
	for inorder[mid] != preorder[0] {
		mid++
	}
	root.Left = buildTree(preorder[1:mid+1], inorder[:mid])
	root.Right = buildTree(preorder[mid+1:], inorder[mid+1:])
	return root
}
```

### Хеш-таблица индексов и общий указатель в preorder
Запоминаем `значение → индекс в inorder`. Двигаем единый указатель по `preorder` (корень очередного поддерева) и передаём границы `[l, r]` в `inorder`. Левое поддерево строим раньше правого — так порядок в preorder совпадает.

**Сложность:** время O(n), память O(n).

```go
func buildTree(preorder []int, inorder []int) *TreeNode {
	idx := make(map[int]int, len(inorder))
	for i, v := range inorder {
		idx[v] = i
	}
	pre := 0
	var build func(l, r int) *TreeNode
	build = func(l, r int) *TreeNode {
		if l > r {
			return nil
		}
		v := preorder[pre]
		pre++
		m := idx[v]
		node := &TreeNode{Val: v}
		node.Left = build(l, m-1)
		node.Right = build(m+1, r)
		return node
	}
	return build(0, len(inorder)-1)
}
```

---
id: binary-tree-maximum-path-sum
title: Binary Tree Maximum Path Sum
difficulty: Hard
category: Trees
leetcode: 124
lists: neetcode150, blind75
algorithms: tree-traversal, dynamic-programming
order: 59
---
Путь в бинарном дереве — последовательность узлов, где соседние связаны ребром, каждый узел встречается не более раза; путь не обязан проходить через корень и содержит минимум один узел. Верни максимальную сумму значений узлов на пути.

**Пример:** `root = [-10,9,20,null,null,15,7]` → `42` (путь `15 → 20 → 7`)

**Ограничения:** `1 ≤ n ≤ 3·10⁴`, `-1000 ≤ Val ≤ 1000`.

<details><summary>Подсказка</summary>Для каждого узла посчитай лучший «спуск вниз» из него; отрицательные ветки отбрасывай (берись за них как за 0).</details>

### Лучший спуск пересчитывается для каждого узла
Для каждого узла считаем `down(n)` — максимальную сумму пути, идущего вниз из `n`. Лучший путь с вершиной в `n`: `n.Val + max(0, down(L)) + max(0, down(R))`. Обходим все узлы и берём максимум. `down` вызывается заново для каждого узла — O(n²) на вырожденном дереве.

**Сложность:** время O(n²) в худшем случае, память O(h).

```go
func maxPathSum(root *TreeNode) int {
	var down func(n *TreeNode) int
	down = func(n *TreeNode) int {
		if n == nil {
			return 0
		}
		return n.Val + max(0, down(n.Left), down(n.Right))
	}
	best := root.Val
	var visit func(n *TreeNode)
	visit = func(n *TreeNode) {
		if n == nil {
			return
		}
		through := n.Val + max(0, down(n.Left)) + max(0, down(n.Right))
		best = max(best, through)
		visit(n.Left)
		visit(n.Right)
	}
	visit(root)
	return best
}
```

### Один проход DFS
DFS возвращает «выигрыш» от спуска из узла: `Val + max(gainL, gainR)`, где отрицательные выигрыши заменены на 0. В той же точке обновляем глобальный ответ величиной `Val + gainL + gainR` — путь, «изгибающийся» в этом узле.

**Сложность:** время O(n), память O(h).

```go
func maxPathSum(root *TreeNode) int {
	best := root.Val
	var gain func(n *TreeNode) int
	gain = func(n *TreeNode) int {
		if n == nil {
			return 0
		}
		l := max(gain(n.Left), 0)
		r := max(gain(n.Right), 0)
		best = max(best, n.Val+l+r) // путь с изгибом в n
		return n.Val + max(l, r)    // наверх уходит только одна ветка
	}
	gain(root)
	return best
}
```

---
id: serialize-and-deserialize-binary-tree
title: Serialize and Deserialize Binary Tree
difficulty: Hard
category: Trees
leetcode: 297
lists: neetcode150, blind75
algorithms: tree-traversal, graph-bfs
order: 60
---
Спроектируй алгоритм, который превращает бинарное дерево в строку (`serialize`) и восстанавливает исходное дерево из строки (`deserialize`). Формат строки — на твой выбор.

**Пример:** `root = [1,2,3,null,null,4,5]` → `serialize` → строка → `deserialize` → `[1,2,3,null,null,4,5]`

**Ограничения:** число узлов `0 ≤ n ≤ 10⁴`, `-1000 ≤ Val ≤ 1000`.

<details><summary>Подсказка</summary>Preorder с явными маркерами nil однозначно задаёт дерево.</details>

### Preorder DFS с маркерами nil
Записываем узлы в порядке preorder, `nil` обозначаем `#`, элементы разделяем запятой. При десериализации читаем токены по порядку: `#` — пустое поддерево, иначе создаём узел и рекурсивно строим левое, затем правое.

**Сложность:** время O(n), память O(n).

```go
type Codec struct{}

func Constructor() Codec {
	return Codec{}
}

func (this *Codec) serialize(root *TreeNode) string {
	var sb strings.Builder
	var dfs func(n *TreeNode)
	dfs = func(n *TreeNode) {
		if n == nil {
			sb.WriteString("#,")
			return
		}
		sb.WriteString(strconv.Itoa(n.Val))
		sb.WriteByte(',')
		dfs(n.Left)
		dfs(n.Right)
	}
	dfs(root)
	return sb.String()
}

func (this *Codec) deserialize(data string) *TreeNode {
	parts := strings.Split(data, ",")
	i := 0
	var build func() *TreeNode
	build = func() *TreeNode {
		tok := parts[i]
		i++
		if tok == "#" {
			return nil
		}
		v, _ := strconv.Atoi(tok)
		node := &TreeNode{Val: v}
		node.Left = build()
		node.Right = build()
		return node
	}
	return build()
}
```

### BFS по уровням
Сериализуем уровень за уровнем (формат LeetCode), `nil` пишем как `#`. При десериализации держим очередь родителей: для каждого берём из токенов следующие два значения как левого и правого ребёнка.

**Сложность:** время O(n), память O(n).

```go
type Codec struct{}

func Constructor() Codec {
	return Codec{}
}

func (this *Codec) serialize(root *TreeNode) string {
	var out []string
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		n := queue[0]
		queue = queue[1:]
		if n == nil {
			out = append(out, "#")
			continue
		}
		out = append(out, strconv.Itoa(n.Val))
		queue = append(queue, n.Left, n.Right)
	}
	return strings.Join(out, ",")
}

func (this *Codec) deserialize(data string) *TreeNode {
	vals := strings.Split(data, ",")
	if vals[0] == "#" {
		return nil
	}
	mk := func(s string) *TreeNode {
		if s == "#" {
			return nil
		}
		v, _ := strconv.Atoi(s)
		return &TreeNode{Val: v}
	}
	root := mk(vals[0])
	queue := []*TreeNode{root}
	i := 1
	for len(queue) > 0 && i < len(vals) {
		n := queue[0]
		queue = queue[1:]
		n.Left = mk(vals[i])
		i++
		if n.Left != nil {
			queue = append(queue, n.Left)
		}
		n.Right = mk(vals[i])
		i++
		if n.Right != nil {
			queue = append(queue, n.Right)
		}
	}
	return root
}
```
