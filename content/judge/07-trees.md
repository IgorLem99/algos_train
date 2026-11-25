---
id: invert-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func invertTree(root *TreeNode) *TreeNode {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want []any
	}{
		{[]any{4, 2, 7, 1, 3, 6, 9}, []any{4, 7, 2, 9, 6, 3, 1}},
		{[]any{2, 1, 3}, []any{2, 3, 1}},
		{[]any{}, []any{}},
		{[]any{1}, []any{1}},
		{[]any{1, 2}, []any{1, nil, 2}},
		{[]any{1, nil, 2}, []any{1, 2}},
		{[]any{1, 2, 3, 4, 5, nil, 6, 7}, []any{1, 3, 2, 6, nil, 5, 4, nil, nil, nil, nil, nil, 7}},
		{[]any{-5, -3, 0, nil, -100, 100}, []any{-5, 0, -3, nil, 100, -100}},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return invertTree(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	// случайное дерево: узел i подвешивается на свободное место к случайному узлу с меньшим номером
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(201) - 100}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	var mirror func(n *TreeNode) *TreeNode
	mirror = func(n *TreeNode) *TreeNode {
		if n == nil {
			return nil
		}
		return &TreeNode{Val: n.Val, Left: mirror(n.Right), Right: mirror(n.Left)}
	}
	chain := func(n int, right bool) *TreeNode {
		var root *TreeNode
		for i := n - 1; i >= 0; i-- {
			if right {
				root = &TreeNode{Val: i % 201 - 100, Right: root}
			} else {
				root = &TreeNode{Val: i % 201 - 100, Left: root}
			}
		}
		return root
	}
	t.Case("root = левая цепочка из 5000 узлов", chain(5000, true), func() any {
		return invertTree(chain(5000, false))
	})
	t.Case("root = случайное дерево из 10000 узлов", JTreeVals(mirror(randTree(10000, 777))), func() any {
		return invertTree(randTree(10000, 777))
	})
}
```

---
id: maximum-depth-of-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func maxDepth(root *TreeNode) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want int
	}{
		{[]any{3, 9, 20, nil, nil, 15, 7}, 3},
		{[]any{1, nil, 2}, 2},
		{[]any{}, 0},
		{[]any{0}, 1},
		{[]any{1, 2, 3, 4, nil, nil, 5, 6, nil, nil, 7}, 4},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return maxDepth(JTree(c.tree...))
		})
	}
	// вырожденное дерево-«палка» глубиной 5000
	t.Case("root = цепочка из 5000 узлов", 5000, func() any {
		root := &TreeNode{Val: 0}
		cur := root
		for i := 1; i < 5000; i++ {
			cur.Right = &TreeNode{Val: i}
			cur = cur.Right
		}
		return maxDepth(root)
	})
}
```

---
id: diameter-of-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func diameterOfBinaryTree(root *TreeNode) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want int
	}{
		{[]any{1, 2, 3, 4, 5}, 3},
		{[]any{1, 2}, 1},
		{[]any{1}, 0},
		{[]any{1, 2, nil, 3, nil, 4, nil, 5}, 4},
		{[]any{1, 2, nil, 3, 4, 5, nil, nil, 6, 7, nil, nil, 8}, 6},
		{[]any{-1, -2, -3, nil, nil, -4, -5}, 3},
		{[]any{4, -7, -3, nil, nil, -9, -3, 9, -7, -4, nil, 6, nil, -6, -6, nil, nil, 0, 6, 5, nil, 9, nil, nil, -1, -4, nil, nil, nil, -2}, 8},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return diameterOfBinaryTree(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(201) - 100}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	chain := func(n int, right bool) *TreeNode {
		var root *TreeNode
		for i := n - 1; i >= 0; i-- {
			if right {
				root = &TreeNode{Val: i, Right: root}
			} else {
				root = &TreeNode{Val: i, Left: root}
			}
		}
		return root
	}
	// эталон: максимум по узлам суммы высот поддеревьев (высоты с мемоизацией)
	brute := func(root *TreeNode) int {
		h := map[*TreeNode]int{}
		var height func(n *TreeNode) int
		height = func(n *TreeNode) int {
			if n == nil {
				return 0
			}
			if v, ok := h[n]; ok {
				return v
			}
			h[n] = 1 + max(height(n.Left), height(n.Right))
			return h[n]
		}
		best := 0
		var walk func(n *TreeNode)
		walk = func(n *TreeNode) {
			if n == nil {
				return
			}
			best = max(best, height(n.Left)+height(n.Right))
			walk(n.Left)
			walk(n.Right)
		}
		walk(root)
		return best
	}
	t.Case("root = цепочка из 5000 узлов", 4999, func() any {
		return diameterOfBinaryTree(chain(5000, false))
	})
	t.Case("root = корень и две цепочки по 2500 узлов", 5000, func() any {
		return diameterOfBinaryTree(&TreeNode{Val: 0, Left: chain(2500, false), Right: chain(2500, true)})
	})
	t.Case("root = случайное дерево из 10000 узлов", brute(randTree(10000, 4242)), func() any {
		return diameterOfBinaryTree(randTree(10000, 4242))
	})
}
```

---
id: balanced-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isBalanced(root *TreeNode) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want bool
	}{
		{[]any{3, 9, 20, nil, nil, 15, 7}, true},
		{[]any{1, 2, 2, 3, 3, nil, nil, 4, 4}, false},
		{[]any{}, true},
		{[]any{1}, true},
		{[]any{1, 2}, true},
		{[]any{1, 2, nil, 3}, false},
		{[]any{1, nil, 2, nil, 3}, false},
		{[]any{1, 2, 2, 3, nil, nil, 3, 4, nil, nil, 4}, false},
		{[]any{1, 2, 3, 4, 5, 6, nil, 8}, true},
		{[]any{-1, -2, -3, -4, nil, nil, -5, -6, nil, nil, -7}, false},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return isBalanced(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: i}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	// полное дерево: дети узла i — 2i+1 и 2i+2
	complete := func(n int) *TreeNode {
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: i}
		}
		for i := range nodes {
			if 2*i+1 < n {
				nodes[i].Left = nodes[2*i+1]
			}
			if 2*i+2 < n {
				nodes[i].Right = nodes[2*i+2]
			}
		}
		return nodes[0]
	}
	chain := func(n int, right bool) *TreeNode {
		var root *TreeNode
		for i := n - 1; i >= 0; i-- {
			if right {
				root = &TreeNode{Val: i, Right: root}
			} else {
				root = &TreeNode{Val: i, Left: root}
			}
		}
		return root
	}
	// эталон: высоты с мемоизацией, проверка разницы в каждом узле
	brute := func(root *TreeNode) bool {
		h := map[*TreeNode]int{}
		var height func(n *TreeNode) int
		height = func(n *TreeNode) int {
			if n == nil {
				return 0
			}
			if v, ok := h[n]; ok {
				return v
			}
			h[n] = 1 + max(height(n.Left), height(n.Right))
			return h[n]
		}
		ok := true
		var walk func(n *TreeNode)
		walk = func(n *TreeNode) {
			if n == nil {
				return
			}
			d := height(n.Left) - height(n.Right)
			if d < -1 || d > 1 {
				ok = false
			}
			walk(n.Left)
			walk(n.Right)
		}
		walk(root)
		return ok
	}
	t.Case("root = полное дерево из 5000 узлов", true, func() any {
		return isBalanced(complete(5000))
	})
	t.Case("root = цепочка из 5000 узлов", false, func() any {
		return isBalanced(chain(5000, true))
	})
	t.Case("root = корень и две цепочки по 2000 узлов", false, func() any {
		return isBalanced(&TreeNode{Val: 0, Left: chain(2000, false), Right: chain(2000, true)})
	})
	t.Case("root = полное дерево из 4095 узлов, к самому левому листу подвешена цепочка из 2", false, func() any {
		root := complete(4095)
		cur := root
		for cur.Left != nil {
			cur = cur.Left
		}
		cur.Left = chain(2, false)
		return isBalanced(root)
	})
	t.Case("root = случайное дерево из 5000 узлов", brute(randTree(5000, 99)), func() any {
		return isBalanced(randTree(5000, 99))
	})
}
```

---
id: same-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isSameTree(p *TreeNode, q *TreeNode) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		p, q []any
		want bool
	}{
		{[]any{1, 2, 3}, []any{1, 2, 3}, true},
		{[]any{1, 2}, []any{1, nil, 2}, false},
		{[]any{1, 2, 1}, []any{1, 1, 2}, false},
		{[]any{}, []any{}, true},
		{[]any{1}, []any{}, false},
		{[]any{}, []any{1}, false},
		{[]any{0}, []any{1}, false},
		{[]any{1, nil, -5}, []any{1, nil, -5}, true},
		{[]any{1, 2, 3, 4}, []any{1, 2, 3, nil, 4}, false},
		{[]any{5, 5, 5, 5, 5}, []any{5, 5, 5, 5, 5}, true},
		{[]any{5, 5, 5, 5, 5}, []any{5, 5, 5, 5, 5, 5}, false},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("p = %s, q = %s", JShow(c.p), JShow(c.q)), c.want, func() any {
			return isSameTree(JTree(c.p...), JTree(c.q...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	// случайное дерево; последний добавленный узел — всегда лист
	randNodes := func(n int, seed uint32) []*TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(2001) - 1000}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes
	}
	t.Case("p, q = одинаковые случайные деревья из 10000 узлов", true, func() any {
		return isSameTree(randNodes(10000, 31)[0], randNodes(10000, 31)[0])
	})
	t.Case("p, q = случайные деревья из 10000 узлов, отличаются значением одного листа", false, func() any {
		b := randNodes(10000, 31)
		b[len(b)-1].Val += 1
		return isSameTree(randNodes(10000, 31)[0], b[0])
	})
	t.Case("p, q = случайные деревья из 10000 узлов, у q лишний лист", false, func() any {
		b := randNodes(10000, 31)
		b[len(b)-1].Left = &TreeNode{Val: 0}
		return isSameTree(randNodes(10000, 31)[0], b[0])
	})
}
```

---
id: subtree-of-another-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isSubtree(root *TreeNode, subRoot *TreeNode) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		root, sub []any
		want      bool
	}{
		{[]any{3, 4, 5, 1, 2}, []any{4, 1, 2}, true},
		{[]any{3, 4, 5, 1, 2, nil, nil, nil, nil, 0}, []any{4, 1, 2}, false},
		{[]any{1, 1}, []any{1}, true},
		{[]any{1}, []any{1}, true},
		{[]any{1}, []any{2}, false},
		{[]any{12}, []any{2}, false},
		{[]any{2}, []any{12}, false},
		{[]any{-2}, []any{2}, false},
		{[]any{1, nil, 2}, []any{2}, true},
		{[]any{1, 2, 3}, []any{1, 2}, false},
		{[]any{1, 2, 3}, []any{1, 2, 3}, true},
		{[]any{3, 4, 5, 1, nil, 2}, []any{3, 1, 2}, false},
		{[]any{1, 2, 3, nil, nil, 4, 5}, []any{3, 4, 5}, true},
		{[]any{1, 2, 3, nil, nil, 4, 5}, []any{3, 4}, false},
		{[]any{4, 1, nil, 1}, []any{1, 1}, true},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("root = %s, subRoot = %s", JShow(c.root), JShow(c.sub)), c.want, func() any {
			return isSubtree(JTree(c.root...), JTree(c.sub...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	// случайное дерево со значениями из [1, k]
	randNodes := func(n, k int, seed uint32) []*TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: 1 + r(k)}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes
	}
	chain := func(n int) *TreeNode {
		var root *TreeNode
		for i := 0; i < n; i++ {
			root = &TreeNode{Val: 1, Left: root}
		}
		return root
	}
	// эталон: сравнение с subRoot в каждом узле
	var same func(a, b *TreeNode) bool
	same = func(a, b *TreeNode) bool {
		if a == nil || b == nil {
			return a == b
		}
		return a.Val == b.Val && same(a.Left, b.Left) && same(a.Right, b.Right)
	}
	brute := func(root, sub *TreeNode) bool {
		found := false
		var walk func(n *TreeNode)
		walk = func(n *TreeNode) {
			if n == nil || found {
				return
			}
			found = same(n, sub)
			walk(n.Left)
			walk(n.Right)
		}
		walk(root)
		return found
	}
	t.Case("root = случайное дерево из 2000 узлов (значения 1..2), subRoot = копия поддерева узла №3", true, func() any {
		return isSubtree(randNodes(2000, 2, 5)[0], randNodes(2000, 2, 5)[3])
	})
	t.Case("root = случайное дерево из 2000 узлов (значения 1..2), subRoot = копия поддерева с изменённым листом", false, func() any {
		sub := randNodes(2000, 2, 5)[3]
		leaf := sub
		for leaf.Left != nil || leaf.Right != nil {
			if leaf.Left != nil {
				leaf = leaf.Left
			} else {
				leaf = leaf.Right
			}
		}
		leaf.Val = 3
		return isSubtree(randNodes(2000, 2, 5)[0], sub)
	})
	t.Case("root = случайное дерево из 2000 единиц, subRoot = случайное дерево из 1000 единиц",
		brute(randNodes(2000, 1, 8)[0], randNodes(1000, 1, 9)[0]), func() any {
			return isSubtree(randNodes(2000, 1, 8)[0], randNodes(1000, 1, 9)[0])
		})
	t.Case("root = цепочка из 2000 единиц, subRoot = цепочка из 1000 единиц", true, func() any {
		return isSubtree(chain(2000), chain(1000))
	})
	t.Case("root = цепочка из 2000 единиц, subRoot = цепочка из 1000 единиц с лишним правым листом", false, func() any {
		sub := chain(1000)
		sub.Right = &TreeNode{Val: 1}
		return isSubtree(chain(2000), sub)
	})
}
```

---
id: lowest-common-ancestor-of-a-binary-search-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val   int
 *     Left  *TreeNode
 *     Right *TreeNode
 * }
 */
func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {

}
```

```go tests
func judgeTests(t *Judge) {
	val := func(n *TreeNode) any {
		if n == nil {
			return nil
		}
		return n.Val
	}
	ex := []any{6, 2, 8, 0, 4, 7, 9, nil, nil, 3, 5}
	cases := []struct {
		tree       []any
		p, q, want int
	}{
		{ex, 2, 8, 6},
		{ex, 2, 4, 2},
		{[]any{2, 1}, 2, 1, 2},
		{[]any{2, 1}, 1, 2, 2},
		{ex, 3, 5, 4},
		{ex, 0, 5, 2},
		{ex, 5, 0, 2},
		{ex, 7, 9, 8},
		{ex, 3, 9, 6},
		{ex, 4, 3, 4},
		{ex, 6, 5, 6},
		{[]any{0, -5, 5, -8, -3}, -8, -3, -5},
		{[]any{0, -5, 5, -8, -3}, -3, 5, 0},
		{[]any{3, 1, 4, nil, 2}, 2, 4, 3},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("root = %s, p = %d, q = %d", JShow(c.tree), c.p, c.q), c.want, func() any {
			root := JTree(c.tree...)
			return val(lowestCommonAncestor(root, JFind(root, c.p), JFind(root, c.q)))
		})
	}

	chain := func(n int, right bool) *TreeNode {
		// right: 1 → 2 → … → n (BST-цепочка вправо); иначе n → n-1 → … → 1 влево
		var root *TreeNode
		for i := 1; i <= n; i++ {
			if right {
				root = &TreeNode{Val: n + 1 - i, Right: root}
			} else {
				root = &TreeNode{Val: i, Left: root}
			}
		}
		return root
	}
	// поиск узла в BST по значению
	find := func(root *TreeNode, v int) *TreeNode {
		for root != nil && root.Val != v {
			if v < root.Val {
				root = root.Left
			} else {
				root = root.Right
			}
		}
		return root
	}
	t.Case("root = цепочка вправо 1..5000, p = 4999, q = 5000", 4999, func() any {
		root := chain(5000, true)
		return val(lowestCommonAncestor(root, find(root, 4999), find(root, 5000)))
	})
	t.Case("root = цепочка влево 5000..1, p = 1, q = 2", 2, func() any {
		root := chain(5000, false)
		return val(lowestCommonAncestor(root, find(root, 1), find(root, 2)))
	})
	t.Case("сбалансированное BST из значений 0..99999, 3000 случайных пар p, q", "все ответы верны", func() any {
		var build func(lo, hi int) *TreeNode
		build = func(lo, hi int) *TreeNode {
			if lo > hi {
				return nil
			}
			m := (lo + hi) / 2
			return &TreeNode{Val: m, Left: build(lo, m-1), Right: build(m+1, hi)}
		}
		root := build(0, 99999)
		// путь от корня до значения v
		path := func(v int) []*TreeNode {
			var out []*TreeNode
			for cur := root; cur != nil; {
				out = append(out, cur)
				if v == cur.Val {
					break
				}
				if v < cur.Val {
					cur = cur.Left
				} else {
					cur = cur.Right
				}
			}
			return out
		}
		x := uint32(2024)
		next := func() int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % 100000) }
		for i := 0; i < 3000; i++ {
			a, b := next(), next()
			if a == b {
				continue
			}
			pa, pb := path(a), path(b)
			var want *TreeNode
			for j := 0; j < len(pa) && j < len(pb) && pa[j] == pb[j]; j++ {
				want = pa[j]
			}
			got := lowestCommonAncestor(root, pa[len(pa)-1], pb[len(pb)-1])
			if got == nil || got.Val != want.Val {
				return fmt.Sprintf("p = %d, q = %d: ожидалось %d, получено %s", a, b, want.Val, JShow(val(got)))
			}
		}
		return "все ответы верны"
	})
}
```

---
id: binary-tree-level-order-traversal
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func levelOrder(root *TreeNode) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want [][]int
	}{
		{[]any{3, 9, 20, nil, nil, 15, 7}, [][]int{{3}, {9, 20}, {15, 7}}},
		{[]any{1}, [][]int{{1}}},
		{[]any{}, [][]int{}},
		{[]any{1, 2, nil, 3, nil, 4}, [][]int{{1}, {2}, {3}, {4}}},
		{[]any{1, nil, 2, nil, 3}, [][]int{{1}, {2}, {3}}},
		{[]any{1, 2, 3, 4, nil, nil, 5}, [][]int{{1}, {2, 3}, {4, 5}}},
		{[]any{-1, -2, -3, nil, -4, -5}, [][]int{{-1}, {-2, -3}, {-4, -5}}},
		{[]any{0, 0, 0, 0, 0, 0, 0}, [][]int{{0}, {0, 0}, {0, 0, 0, 0}}},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return levelOrder(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(2001) - 1000}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	// эталон: preorder «сначала левое» раскладывает значения по глубинам слева направо
	brute := func(root *TreeNode) [][]int {
		res := [][]int{}
		var dfs func(n *TreeNode, d int)
		dfs = func(n *TreeNode, d int) {
			if n == nil {
				return
			}
			if d == len(res) {
				res = append(res, []int{})
			}
			res[d] = append(res[d], n.Val)
			dfs(n.Left, d+1)
			dfs(n.Right, d+1)
		}
		dfs(root, 0)
		return res
	}
	t.Case("root = цепочка из 2000 узлов (зигзаг)", func() [][]int {
		res := make([][]int, 2000)
		for i := range res {
			res[i] = []int{i}
		}
		return res
	}(), func() any {
		var root *TreeNode
		for i := 1999; i >= 0; i-- {
			if i%2 == 0 {
				root = &TreeNode{Val: i, Left: root}
			} else {
				root = &TreeNode{Val: i, Right: root}
			}
		}
		return levelOrder(root)
	})
	t.Case("root = случайное дерево из 10000 узлов", brute(randTree(10000, 555)), func() any {
		return levelOrder(randTree(10000, 555))
	})
}
```

---
id: binary-tree-right-side-view
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func rightSideView(root *TreeNode) []int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want []int
	}{
		{[]any{1, 2, 3, nil, 5, nil, 4}, []int{1, 3, 4}},
		{[]any{1, nil, 3}, []int{1, 3}},
		{[]any{}, []int{}},
		{[]any{1}, []int{1}},
		{[]any{1, 2, 3, 4}, []int{1, 3, 4}},
		{[]any{1, 2}, []int{1, 2}},
		{[]any{1, 2, 3, nil, 5, nil, nil, 6}, []int{1, 3, 5, 6}},
		{[]any{1, 2, 3, 4, 5, 6, 7, nil, nil, 8}, []int{1, 3, 7, 8}},
		{[]any{-1, -2, -3, -4, nil, -5}, []int{-1, -3, -5}},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return rightSideView(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(201) - 100}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	// эталон: обход «сначала левое», на каждой глубине запоминаем последний встреченный узел
	brute := func(root *TreeNode) []int {
		res := []int{}
		var dfs func(n *TreeNode, d int)
		dfs = func(n *TreeNode, d int) {
			if n == nil {
				return
			}
			if d == len(res) {
				res = append(res, 0)
			}
			res[d] = n.Val
			dfs(n.Left, d+1)
			dfs(n.Right, d+1)
		}
		dfs(root, 0)
		return res
	}
	t.Case("root = левая цепочка из 5000 узлов", func() []int {
		res := make([]int, 5000)
		for i := range res {
			res[i] = i
		}
		return res
	}(), func() any {
		var root *TreeNode
		for i := 4999; i >= 0; i-- {
			root = &TreeNode{Val: i, Left: root}
		}
		return rightSideView(root)
	})
	t.Case("root = случайное дерево из 10000 узлов", brute(randTree(10000, 1717)), func() any {
		return rightSideView(randTree(10000, 1717))
	})
}
```

---
id: count-good-nodes-in-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func goodNodes(root *TreeNode) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want int
	}{
		{[]any{3, 1, 4, 3, nil, 1, 5}, 4},
		{[]any{3, 3, nil, 4, 2}, 3},
		{[]any{1}, 1},
		{[]any{-1, -2, -3}, 1},
		{[]any{2, nil, 4, 10, 8, nil, nil, 4}, 4},
		{[]any{9, nil, 3, 6}, 1},
		{[]any{5, 5, 5, 5, nil, nil, 5}, 5},
		{[]any{-10000, 10000, -10000}, 3},
		{[]any{1, 2, 3, 4, 5, 6, 7}, 7},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return goodNodes(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(20001) - 10000}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	// эталон: для каждого узла явно проверяем весь путь от корня
	brute := func(root *TreeNode) int {
		cnt := 0
		var path []int
		var dfs func(n *TreeNode)
		dfs = func(n *TreeNode) {
			if n == nil {
				return
			}
			good := true
			for _, v := range path {
				if v > n.Val {
					good = false
				}
			}
			if good {
				cnt++
			}
			path = append(path, n.Val)
			dfs(n.Left)
			dfs(n.Right)
			path = path[:len(path)-1]
		}
		dfs(root)
		return cnt
	}
	// цепочка: на чётных позициях i/2 (растёт), на нечётных -1
	t.Case("root = цепочка из 100000 узлов [0,-1,1,-1,2,-1,…]", 50000, func() any {
		var root *TreeNode
		for i := 99999; i >= 0; i-- {
			v := -1
			if i%2 == 0 {
				v = i / 2
			}
			if i%3 == 0 {
				root = &TreeNode{Val: v, Left: root}
			} else {
				root = &TreeNode{Val: v, Right: root}
			}
		}
		return goodNodes(root)
	})
	t.Case("root = случайное дерево из 100000 узлов", brute(randTree(100000, 3131)), func() any {
		return goodNodes(randTree(100000, 3131))
	})
}
```

---
id: validate-binary-search-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isValidBST(root *TreeNode) bool {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want bool
	}{
		{[]any{2, 1, 3}, true},
		{[]any{5, 1, 4, nil, nil, 3, 6}, false},
		{[]any{2, 2, 2}, false},
		{[]any{1}, true},
		{[]any{1, 1}, false},
		{[]any{1, nil, 1}, false},
		{[]any{0, -1}, true},
		{[]any{5, 4, 6, nil, nil, 3, 7}, false},
		{[]any{3, 1, 5, 0, 2, 4, 6, nil, nil, nil, 3}, false},
		{[]any{10, 5, 15, nil, nil, 6, 20}, false},
		{[]any{8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15}, true},
		{[]any{2147483647}, true},
		{[]any{-2147483648}, true},
		{[]any{-2147483648, nil, 2147483647}, true},
		{[]any{2147483647, -2147483648}, true},
		{[]any{2147483647, 2147483647}, false},
		{[]any{-2147483648, nil, -2147483648}, false},
		{[]any{0, -2147483648, 2147483647}, true},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return isValidBST(JTree(c.tree...))
		})
	}

	// сбалансированное BST из значений 0, 2, 4, …, 2(n-1)
	build := func(n int) *TreeNode {
		var rec func(lo, hi int) *TreeNode
		rec = func(lo, hi int) *TreeNode {
			if lo > hi {
				return nil
			}
			m := (lo + hi) / 2
			return &TreeNode{Val: 2 * m, Left: rec(lo, m-1), Right: rec(m+1, hi)}
		}
		return rec(0, n-1)
	}
	t.Case("root = сбалансированное BST из 10000 узлов", true, func() any {
		return isValidBST(build(10000))
	})
	t.Case("root = сбалансированное BST из 10000 узлов, самый левый узел правого поддерева = корню", false, func() any {
		root := build(10000)
		cur := root.Right
		for cur.Left != nil {
			cur = cur.Left
		}
		cur.Val = root.Val
		return isValidBST(root)
	})
	t.Case("root = сбалансированное BST из 10000 узлов, самый правый узел левого поддерева = корень + 1", false, func() any {
		root := build(10000)
		cur := root.Left
		for cur.Right != nil {
			cur = cur.Right
		}
		cur.Val = root.Val + 1
		return isValidBST(root)
	})
	t.Case("root = цепочка вправо из 10000 возрастающих значений", true, func() any {
		var root *TreeNode
		for i := 9999; i >= 0; i-- {
			root = &TreeNode{Val: i*3 - 15000, Right: root}
		}
		return isValidBST(root)
	})
	t.Case("root = цепочка влево из 10000 убывающих значений, 2-й и 3-й узлы равны", false, func() any {
		root := &TreeNode{Val: 0}
		for i := 1; i < 10000; i++ {
			root = &TreeNode{Val: i, Left: root}
		}
		root.Left.Left.Val = root.Left.Val
		return isValidBST(root)
	})
}
```

---
id: kth-smallest-element-in-a-bst
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func kthSmallest(root *TreeNode, k int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree    []any
		k, want int
	}{
		{[]any{3, 1, 4, nil, 2}, 1, 1},
		{[]any{5, 3, 6, 2, 4, nil, nil, 1}, 3, 3},
		{[]any{5, 3, 6, 2, 4, nil, nil, 1}, 6, 6},
		{[]any{1}, 1, 1},
		{[]any{2, 1}, 2, 2},
		{[]any{1, nil, 2}, 1, 1},
		{[]any{3, 1, 4, nil, 2}, 4, 4},
		{[]any{0, -10, 10, -20, -5}, 2, -10},
		{[]any{0, -10, 10, -20, -5}, 3, -5},
		{[]any{8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15}, 9, 9},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("root = %s, k = %d", JShow(c.tree), c.k), c.want, func() any {
			return kthSmallest(JTree(c.tree...), c.k)
		})
	}

	// сбалансированное BST из значений 0, 2, 4, …, 2(n-1)
	build := func(n int) *TreeNode {
		var rec func(lo, hi int) *TreeNode
		rec = func(lo, hi int) *TreeNode {
			if lo > hi {
				return nil
			}
			m := (lo + hi) / 2
			return &TreeNode{Val: 2 * m, Left: rec(lo, m-1), Right: rec(m+1, hi)}
		}
		return rec(0, n-1)
	}
	for _, k := range []int{1, 5000, 7777, 10000} {
		t.Case(fmt.Sprintf("root = сбалансированное BST из 0, 2, …, 19998, k = %d", k), 2*(k-1), func() any {
			return kthSmallest(build(10000), k)
		})
	}
	for _, k := range []int{1, 10000} {
		t.Case(fmt.Sprintf("root = цепочка влево 9999 → 9998 → … → 0, k = %d", k), k-1, func() any {
			root := &TreeNode{Val: 0}
			for i := 1; i < 10000; i++ {
				root = &TreeNode{Val: i, Left: root}
			}
			return kthSmallest(root, k)
		})
	}
	t.Case("root = цепочка вправо -5000 → -4999 → … → 4999, k = 10000", 4999, func() any {
		var root *TreeNode
		for i := 4999; i >= -5000; i-- {
			root = &TreeNode{Val: i, Right: root}
		}
		return kthSmallest(root, 10000)
	})
}
```

---
id: construct-binary-tree-from-preorder-and-inorder-traversal
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func buildTree(preorder []int, inorder []int) *TreeNode {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		pre, in []int
		want    []any
	}{
		{[]int{3, 9, 20, 15, 7}, []int{9, 3, 15, 20, 7}, []any{3, 9, 20, nil, nil, 15, 7}},
		{[]int{-1}, []int{-1}, []any{-1}},
		{[]int{1, 2}, []int{2, 1}, []any{1, 2}},
		{[]int{1, 2}, []int{1, 2}, []any{1, nil, 2}},
		{[]int{1, 2, 3}, []int{3, 2, 1}, []any{1, 2, nil, 3}},
		{[]int{1, 2, 3}, []int{1, 2, 3}, []any{1, nil, 2, nil, 3}},
		{[]int{1, 2, 3}, []int{2, 1, 3}, []any{1, 2, 3}},
		{[]int{1, 2, 4, 5, 3, 6, 7}, []int{4, 2, 5, 1, 6, 3, 7}, []any{1, 2, 3, 4, 5, 6, 7}},
		{[]int{-3000, 3000, 0, -1}, []int{3000, -3000, -1, 0}, []any{-3000, 3000, 0, nil, nil, -1}},
	}
	for _, c := range cases {
		t.Case(fmt.Sprintf("preorder = %v, inorder = %v", c.pre, c.in), c.want, func() any {
			return buildTree(JClone(c.pre), JClone(c.in))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	// случайное дерево с уникальными значениями -n/2 … n/2-1 в случайном порядке
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		vals := make([]int, n)
		for i := range vals {
			vals[i] = i - n/2
		}
		for i := n - 1; i > 0; i-- {
			j := r(i + 1)
			vals[i], vals[j] = vals[j], vals[i]
		}
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: vals[i]}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	chain := func(n int, right bool) *TreeNode {
		var root *TreeNode
		for i := n - 1; i >= 0; i-- {
			if right {
				root = &TreeNode{Val: i, Right: root}
			} else {
				root = &TreeNode{Val: i, Left: root}
			}
		}
		return root
	}
	orders := func(root *TreeNode) (pre, in []int) {
		var dfs func(n *TreeNode)
		dfs = func(n *TreeNode) {
			if n == nil {
				return
			}
			pre = append(pre, n.Val)
			dfs(n.Left)
			in = append(in, n.Val)
			dfs(n.Right)
		}
		dfs(root)
		return
	}
	big := []struct {
		name string
		root *TreeNode
	}{
		{"цепочка влево из 3000 узлов", chain(3000, false)},
		{"цепочка вправо из 3000 узлов", chain(3000, true)},
		{"случайное дерево из 3000 узлов", randTree(3000, 6060)},
	}
	for _, b := range big {
		pre, in := orders(b.root)
		t.Case("preorder, inorder = обходы дерева: "+b.name, JTreeVals(b.root), func() any {
			return buildTree(JClone(pre), JClone(in))
		})
	}
}
```

---
id: binary-tree-maximum-path-sum
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func maxPathSum(root *TreeNode) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		tree []any
		want int
	}{
		{[]any{-10, 9, 20, nil, nil, 15, 7}, 42},
		{[]any{1, 2, 3}, 6},
		{[]any{-3}, -3},
		{[]any{2, -1}, 2},
		{[]any{-2, -1}, -1},
		{[]any{-1, -2, -3}, -1},
		{[]any{1, -2, 3}, 4},
		{[]any{5, 4, 8, 11, nil, 13, 4, 7, 2, nil, nil, nil, 1}, 48},
		{[]any{1000, -1000, 1000}, 2000},
		{[]any{-1000, 1000, 1000}, 1000},
		{[]any{1, -2, -3, 1, 3, -2, nil, -1}, 3},
		{[]any{9, 6, -3, nil, nil, -6, 2, nil, nil, 2, nil, -6, -6, -6}, 16},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c.tree), c.want, func() any {
			return maxPathSum(JTree(c.tree...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	// случайное дерево со значениями из [lo, hi]
	randTree := func(n, lo, hi int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: lo + r(hi-lo+1)}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	// цепочка со случайными значениями из [-1000, 1000], направление чередуется
	chain := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		var root *TreeNode
		for i := 0; i < n; i++ {
			if r(2) == 0 {
				root = &TreeNode{Val: r(2001) - 1000, Left: root}
			} else {
				root = &TreeNode{Val: r(2001) - 1000, Right: root}
			}
		}
		return root
	}
	// эталон: лучший спуск из каждого узла (с мемоизацией), максимум по «изгибам»
	brute := func(root *TreeNode) int {
		memo := map[*TreeNode]int{}
		var down func(n *TreeNode) int
		down = func(n *TreeNode) int {
			if n == nil {
				return 0
			}
			if v, ok := memo[n]; ok {
				return v
			}
			memo[n] = n.Val + max(0, down(n.Left), down(n.Right))
			return memo[n]
		}
		best := root.Val
		var walk func(n *TreeNode)
		walk = func(n *TreeNode) {
			if n == nil {
				return
			}
			best = max(best, n.Val+max(0, down(n.Left))+max(0, down(n.Right)))
			walk(n.Left)
			walk(n.Right)
		}
		walk(root)
		return best
	}
	t.Case("root = цепочка из 5000 узлов со случайными значениями", brute(chain(5000, 11)), func() any {
		return maxPathSum(chain(5000, 11))
	})
	t.Case("root = случайное дерево из 30000 узлов, значения -1000..1000", brute(randTree(30000, -1000, 1000, 12)), func() any {
		return maxPathSum(randTree(30000, -1000, 1000, 12))
	})
	t.Case("root = случайное дерево из 30000 узлов, значения -1000..-1", brute(randTree(30000, -1000, -1, 13)), func() any {
		return maxPathSum(randTree(30000, -1000, -1, 13))
	})
}
```

---
id: serialize-and-deserialize-binary-tree
---
```go starter
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */

type Codec struct {

}

func Constructor() Codec {

}

// Serializes a tree to a single string.
func (this *Codec) serialize(root *TreeNode) string {

}

// Deserializes your encoded data to tree.
func (this *Codec) deserialize(data string) *TreeNode {

}

/**
 * Your Codec object will be instantiated and called as such:
 * ser := Constructor();
 * deser := Constructor();
 * data := ser.serialize(root);
 * ans := deser.deserialize(data);
 */
```

```go tests
func judgeTests(t *Judge) {
	// дерево сериализуется одним объектом Codec и восстанавливается другим
	roundTrip := func(root *TreeNode) *TreeNode {
		ser := Constructor()
		deser := Constructor()
		data := ser.serialize(root)
		return deser.deserialize(data)
	}
	cases := [][]any{
		{1, 2, 3, nil, nil, 4, 5},
		{},
		{1},
		{1, 2},
		{1, nil, 2},
		{-1000, 1000, -1, 0},
		{5, 5, 5, 5, nil, nil, 5},
		{0, 0, 0, nil, 0, 0},
		{-12, -3, 45, nil, nil, -6, 789, 10, nil, nil, -1000},
		{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15},
	}
	for _, c := range cases {
		t.Case("root = "+JShow(c), c, func() any {
			return roundTrip(JTree(c...))
		})
	}

	rng := func(seed uint32) func(n int) int {
		x := seed
		return func(n int) int {
			x ^= x << 13
			x ^= x >> 17
			x ^= x << 5
			return int(x % uint32(n))
		}
	}
	randTree := func(n int, seed uint32) *TreeNode {
		r := rng(seed)
		nodes := make([]*TreeNode, n)
		for i := range nodes {
			nodes[i] = &TreeNode{Val: r(2001) - 1000}
			for i > 0 {
				p := nodes[r(i)]
				if r(2) == 0 {
					if p.Left == nil {
						p.Left = nodes[i]
						break
					}
				} else if p.Right == nil {
					p.Right = nodes[i]
					break
				}
			}
		}
		return nodes[0]
	}
	chain := func(n int) *TreeNode {
		var root *TreeNode
		for i := 0; i < n; i++ {
			if i%2 == 0 {
				root = &TreeNode{Val: -i % 1001, Left: root}
			} else {
				root = &TreeNode{Val: i % 1001, Right: root}
			}
		}
		return root
	}
	t.Case("root = цепочка-зигзаг из 5000 узлов", JTreeVals(chain(5000)), func() any {
		return roundTrip(chain(5000))
	})
	t.Case("root = случайное дерево из 10000 узлов", JTreeVals(randTree(10000, 909)), func() any {
		return roundTrip(randTree(10000, 909))
	})
	t.Case("один Codec: serialize двух разных деревьев, затем deserialize обоих", []any{
		[]any{1, 2, 3}, []any{-7, nil, 8},
	}, func() any {
		c := Constructor()
		a := c.serialize(JTree(1, 2, 3))
		b := c.serialize(JTree(-7, nil, 8))
		return []any{c.deserialize(a), c.deserialize(b)}
	})
}
```
