---
id: implement-trie-prefix-tree
title: Implement Trie (Prefix Tree)
difficulty: Medium
category: Tries
leetcode: 208
lists: neetcode150, blind75
algorithms: trie
order: 61
---
Реализуй префиксное дерево `Trie` с операциями: `Insert(word)` — вставить строку, `Search(word)` — есть ли строка целиком, `StartsWith(prefix)` — есть ли хотя бы одна строка с таким префиксом.

**Пример:** `Insert("apple"); Search("apple") → true; Search("app") → false; StartsWith("app") → true; Insert("app"); Search("app") → true`

**Ограничения:** строки из строчных латинских букв, длина `1 ≤ L ≤ 2000`, до `3·10⁴` вызовов.

<details><summary>Подсказка</summary>Каждый узел хранит детей по буквам и флаг «здесь заканчивается слово».</details>

### Множество слов и перебор для префикса
`Search` — проверка в множестве; `StartsWith` — линейный проход по всем словам с `strings.HasPrefix`. Просто, но `StartsWith` медленный.

**Сложность:** `Insert`/`Search` — O(L); `StartsWith` — O(N·L) по N словам; память O(N·L).

```go
type Trie struct {
	words map[string]bool
}

func Constructor() Trie {
	return Trie{words: map[string]bool{}}
}

func (this *Trie) Insert(word string) {
	this.words[word] = true
}

func (this *Trie) Search(word string) bool {
	return this.words[word]
}

func (this *Trie) StartsWith(prefix string) bool {
	for w := range this.words {
		if strings.HasPrefix(w, prefix) {
			return true
		}
	}
	return false
}
```

### Префиксное дерево на массивах
Каждый узел — массив из 26 указателей на детей и флаг конца слова. Все операции идут по буквам строки и стоят O(L), независимо от числа слов.

**Сложность:** время O(L) на операцию, память O(суммарная длина слов · 26) в худшем случае.

```go
type Trie struct {
	next [26]*Trie
	end  bool
}

func Constructor() Trie {
	return Trie{}
}

func (this *Trie) Insert(word string) {
	cur := this
	for i := 0; i < len(word); i++ {
		c := word[i] - 'a'
		if cur.next[c] == nil {
			cur.next[c] = &Trie{}
		}
		cur = cur.next[c]
	}
	cur.end = true
}

// find возвращает узел, в котором заканчивается s, либо nil.
func (this *Trie) find(s string) *Trie {
	cur := this
	for i := 0; i < len(s); i++ {
		cur = cur.next[s[i]-'a']
		if cur == nil {
			return nil
		}
	}
	return cur
}

func (this *Trie) Search(word string) bool {
	n := this.find(word)
	return n != nil && n.end
}

func (this *Trie) StartsWith(prefix string) bool {
	return this.find(prefix) != nil
}
```

---
id: design-add-and-search-words-data-structure
title: Design Add and Search Words Data Structure
difficulty: Medium
category: Tries
leetcode: 211
lists: neetcode150, blind75
algorithms: trie, backtracking
order: 62
---
Реализуй `WordDictionary`: `AddWord(word)` добавляет слово, `Search(word)` проверяет, есть ли в словаре слово, совпадающее с шаблоном `word`, где `.` совпадает с любой одной буквой.

**Пример:** `AddWord("bad"); AddWord("dad"); Search("pad") → false; Search("b..") → true; Search(".ad") → true`

**Ограничения:** длина `1 ≤ L ≤ 25`, не более 2 точек в шаблоне, до `10⁴` вызовов.

<details><summary>Подсказка</summary>В trie на символе `.` пробуй всех существующих детей — это небольшой backtracking.</details>

### Списки слов по длине
Храним слова, сгруппированные по длине. Для `Search` проверяем только слова той же длины, сравнивая символы с учётом `.`.

**Сложность:** `AddWord` O(L); `Search` O(N·L) в худшем случае.

```go
type WordDictionary struct {
	byLen map[int][]string
}

func Constructor() WordDictionary {
	return WordDictionary{byLen: map[int][]string{}}
}

func (this *WordDictionary) AddWord(word string) {
	this.byLen[len(word)] = append(this.byLen[len(word)], word)
}

func (this *WordDictionary) Search(word string) bool {
	for _, w := range this.byLen[len(word)] {
		ok := true
		for i := 0; i < len(word); i++ {
			if word[i] != '.' && word[i] != w[i] {
				ok = false
				break
			}
		}
		if ok {
			return true
		}
	}
	return false
}
```

### Trie с DFS на символе «.»
Слова хранятся в trie. Обычная буква — один шаг вниз; точка — перебор всех непустых детей с рекурсивным поиском остатка шаблона.

**Сложность:** `AddWord` O(L); `Search` O(L) без точек и O(26^k · L) при k точках (k ≤ 2).

```go
type node struct {
	next [26]*node
	end  bool
}

type WordDictionary struct {
	root *node
}

func Constructor() WordDictionary {
	return WordDictionary{root: &node{}}
}

func (this *WordDictionary) AddWord(word string) {
	cur := this.root
	for i := 0; i < len(word); i++ {
		c := word[i] - 'a'
		if cur.next[c] == nil {
			cur.next[c] = &node{}
		}
		cur = cur.next[c]
	}
	cur.end = true
}

func (this *WordDictionary) Search(word string) bool {
	var dfs func(n *node, i int) bool
	dfs = func(n *node, i int) bool {
		if i == len(word) {
			return n.end
		}
		if word[i] == '.' {
			for _, child := range n.next {
				if child != nil && dfs(child, i+1) {
					return true
				}
			}
			return false
		}
		child := n.next[word[i]-'a']
		return child != nil && dfs(child, i+1)
	}
	return dfs(this.root, 0)
}
```

---
id: word-search-ii
title: Word Search II
difficulty: Hard
category: Tries
leetcode: 212
lists: neetcode150, blind75
algorithms: trie, backtracking
order: 63
---
Дана доска `board` из букв и список слов `words`. Верни все слова, которые можно составить из соседних (по горизонтали/вертикали) клеток; одна клетка в слове используется не более раза.

**Пример:** `board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]` → `["eat","oath"]`

**Ограничения:** `1 ≤ m, n ≤ 12`, `1 ≤ |words| ≤ 3·10⁴`, длина слова до 10.

<details><summary>Подсказка</summary>Не ищи каждое слово отдельно: положи все слова в trie и запусти один DFS от каждой клетки, спускаясь по trie вместе с обходом.</details>

### Отдельный поиск каждого слова
Для каждого слова запускаем backtracking (как в Word Search I) от каждой клетки. Работает, но много раз обходит одни и те же пути.

**Сложность:** время O(W · m·n · 4·3^(L-1)), память O(L).

```go
func findWords(board [][]byte, words []string) []string {
	m, n := len(board), len(board[0])
	dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

	var dfs func(r, c int, w string, i int) bool
	dfs = func(r, c int, w string, i int) bool {
		if board[r][c] != w[i] {
			return false
		}
		if i == len(w)-1 {
			return true
		}
		ch := board[r][c]
		board[r][c] = '#' // помечаем клетку занятой
		defer func() { board[r][c] = ch }()
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nr < m && nc >= 0 && nc < n && dfs(nr, nc, w, i+1) {
				return true
			}
		}
		return false
	}

	var res []string
	for _, w := range words {
		found := false
		for r := 0; r < m && !found; r++ {
			for c := 0; c < n && !found; c++ {
				found = dfs(r, c, w, 0)
			}
		}
		if found {
			res = append(res, w)
		}
	}
	return res
}
```

### Trie + один DFS по доске
Строим trie из всех слов (в конечном узле храним само слово). DFS от каждой клетки идёт по доске и по trie одновременно и сразу обрывается, если префикса нет в trie. Найденное слово обнуляем в узле, чтобы не добавить дубль.

**Сложность:** время O(m·n · 4·3^(L-1)) с отсечением по префиксам, память O(суммарная длина слов).

```go
type TrieNode struct {
	next [26]*TrieNode
	word string
}

func findWords(board [][]byte, words []string) []string {
	root := &TrieNode{}
	for _, w := range words {
		cur := root
		for i := 0; i < len(w); i++ {
			c := w[i] - 'a'
			if cur.next[c] == nil {
				cur.next[c] = &TrieNode{}
			}
			cur = cur.next[c]
		}
		cur.word = w
	}

	m, n := len(board), len(board[0])
	dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	var res []string

	var dfs func(r, c int, node *TrieNode)
	dfs = func(r, c int, node *TrieNode) {
		ch := board[r][c]
		if ch == '#' {
			return
		}
		nxt := node.next[ch-'a']
		if nxt == nil {
			return // такого префикса нет ни в одном слове
		}
		if nxt.word != "" {
			res = append(res, nxt.word)
			nxt.word = "" // не добавляем слово повторно
		}
		board[r][c] = '#'
		for _, d := range dirs {
			nr, nc := r+d[0], c+d[1]
			if nr >= 0 && nr < m && nc >= 0 && nc < n {
				dfs(nr, nc, nxt)
			}
		}
		board[r][c] = ch
	}

	for r := 0; r < m; r++ {
		for c := 0; c < n; c++ {
			dfs(r, c, root)
		}
	}
	return res
}
```
