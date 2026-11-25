---
id: implement-trie-prefix-tree
---
```go starter
type Trie struct {

}

func Constructor() Trie {

}

func (this *Trie) Insert(word string) {

}

func (this *Trie) Search(word string) bool {

}

func (this *Trie) StartsWith(prefix string) bool {

}

/**
 * Your Trie object will be instantiated and called as such:
 * obj := Constructor();
 * obj.Insert(word);
 * param_2 := obj.Search(word);
 * param_3 := obj.StartsWith(prefix);
 */
```

```go tests
func judgeTests(t *Judge) {
	// ops: "+слово" — Insert, "?слово" — Search, "^префикс" — StartsWith; результат — ответы на ? и ^
	run := func(ops []string) []bool {
		tr := Constructor()
		out := []bool{}
		for _, op := range ops {
			switch op[0] {
			case '+':
				tr.Insert(op[1:])
			case '?':
				out = append(out, tr.Search(op[1:]))
			case '^':
				out = append(out, tr.StartsWith(op[1:]))
			}
		}
		return out
	}
	show := func(ops []string) string {
		parts := make([]string, len(ops))
		for i, op := range ops {
			name := map[byte]string{'+': "Insert", '?': "Search", '^': "StartsWith"}[op[0]]
			parts[i] = fmt.Sprintf("%s(%q)", name, op[1:])
		}
		return strings.Join(parts, "; ")
	}
	cases := []struct {
		ops  []string
		want []bool
	}{
		{[]string{"+apple", "?apple", "?app", "^app", "+app", "?app"}, []bool{true, false, true, true}},
		{[]string{"?a", "^a", "+ab", "?a", "^a", "^ab", "?ab", "^abc", "?abc"}, []bool{false, false, false, true, true, true, false, false}},
		{[]string{"+abc", "+abd", "+b", "^ab", "?ab", "?abd", "^abe", "?b", "^ba", "+abc", "?abc"}, []bool{true, false, true, false, true, false, true}},
		{[]string{"+a", "?a", "^a", "?b", "^b", "+a", "?a"}, []bool{true, true, false, false, true}},
		{[]string{"+hello", "+help", "+hell", "^hel", "?hel", "?hell", "?help", "?helps", "^helpx", "^hello"}, []bool{true, false, true, true, false, false, true}},
		{[]string{"+zzz", "+z", "?zz", "^zz", "^zzzz", "?z", "?zzz"}, []bool{false, true, false, true, true}},
	}
	for _, c := range cases {
		t.Case(show(c.ops), c.want, func() any {
			return run(c.ops)
		})
	}

	long := strings.Repeat("q", 1999)
	t.Case(`Insert("q"×2000); Search("q"×1999); StartsWith("q"×1999); Search("q"×2000); StartsWith("q"×2000); Search("q"×2001)`,
		[]bool{false, true, true, true, false}, func() any {
			return run([]string{"+" + long + "q", "?" + long, "^" + long, "?" + long + "q", "^" + long + "q", "?" + long + "qq"})
		})

	// случайные операции против наивной модели: множество слов и множество всех их префиксов
	t.Case("20000 случайных операций Insert/Search/StartsWith (буквы a..d, длина 1..7)", "совпадает с эталоном", func() any {
		tr := Constructor()
		words := map[string]bool{}
		prefixes := map[string]bool{}
		x := uint32(8642)
		next := func(n int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(n)) }
		word := func() string {
			b := make([]byte, 1+next(7))
			for i := range b {
				b[i] = byte('a' + next(4))
			}
			return string(b)
		}
		for i := 0; i < 20000; i++ {
			w := word()
			switch next(3) {
			case 0:
				tr.Insert(w)
				words[w] = true
				for j := 1; j <= len(w); j++ {
					prefixes[w[:j]] = true
				}
			case 1:
				if got := tr.Search(w); got != words[w] {
					return fmt.Sprintf("операция %d: Search(%q) = %v, ожидалось %v", i+1, w, got, words[w])
				}
			case 2:
				if got := tr.StartsWith(w); got != prefixes[w] {
					return fmt.Sprintf("операция %d: StartsWith(%q) = %v, ожидалось %v", i+1, w, got, prefixes[w])
				}
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: design-add-and-search-words-data-structure
---
```go starter
type WordDictionary struct {

}

func Constructor() WordDictionary {

}

func (this *WordDictionary) AddWord(word string) {

}

func (this *WordDictionary) Search(word string) bool {

}

/**
 * Your WordDictionary object will be instantiated and called as such:
 * obj := Constructor();
 * obj.AddWord(word);
 * param_2 := obj.Search(word);
 */
```

```go tests
func judgeTests(t *Judge) {
	// ops: "+слово" — AddWord, "?шаблон" — Search; результат — ответы на Search
	run := func(ops []string) []bool {
		d := Constructor()
		out := []bool{}
		for _, op := range ops {
			if op[0] == '+' {
				d.AddWord(op[1:])
			} else {
				out = append(out, d.Search(op[1:]))
			}
		}
		return out
	}
	show := func(ops []string) string {
		parts := make([]string, len(ops))
		for i, op := range ops {
			if op[0] == '+' {
				parts[i] = fmt.Sprintf("AddWord(%q)", op[1:])
			} else {
				parts[i] = fmt.Sprintf("Search(%q)", op[1:])
			}
		}
		return strings.Join(parts, "; ")
	}
	cases := []struct {
		ops  []string
		want []bool
	}{
		{[]string{"+bad", "+dad", "?pad", "?b..", "?.ad"}, []bool{false, true, true}},
		{[]string{"+bad", "+dad", "+mad", "?pad", "?bad", "?.ad", "?b.."}, []bool{false, true, true, true}},
		{[]string{"?a", "?.", "+a", "?.", "?a", "?..", "?b"}, []bool{false, false, true, true, false, false}},
		{[]string{"+abc", "?ab", "?ab.", "?abcd", "?a.c", "?...", "?..", "?.b.", "?..d"}, []bool{false, true, false, true, true, false, true, false}},
		{[]string{"+at", "+and", "+an", "+add", "?a", "?.at", "+bat", "?.at", "?an.", "?a.d.", "?b.", "?a.d", "?."}, []bool{false, false, true, true, false, false, true, false}},
		{[]string{"+abcdefghijklmnopqrstuvwxy", "?.bcdefghijklmnopqrstuvwx.", "?abcdefghijklmnopqrstuvwxy", "?abcdefghijklmnopqrstuvwx", "?.bcdefghijklmnopqrstuvwxz"}, []bool{true, true, false, false}},
		{[]string{"+ab", "+ab", "+ac", "?a.", "?.b", "?.c", "?.d", "?.."}, []bool{true, true, true, false, true}},
	}
	for _, c := range cases {
		t.Case(show(c.ops), c.want, func() any {
			return run(c.ops)
		})
	}

	// случайные операции против наивной модели: список слов и посимвольное сравнение с шаблоном
	t.Case("10000 случайных операций AddWord/Search (буквы a..d, длина 1..5, до 2 точек)", "совпадает с эталоном", func() any {
		d := Constructor()
		var words []string
		x := uint32(97531)
		next := func(n int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(n)) }
		match := func(pat string) bool {
			for _, w := range words {
				if len(w) != len(pat) {
					continue
				}
				ok := true
				for i := 0; i < len(w); i++ {
					if pat[i] != '.' && pat[i] != w[i] {
						ok = false
					}
				}
				if ok {
					return true
				}
			}
			return false
		}
		for i := 0; i < 10000; i++ {
			b := make([]byte, 1+next(5))
			for j := range b {
				b[j] = byte('a' + next(4))
			}
			if next(2) == 0 {
				d.AddWord(string(b))
				words = append(words, string(b))
				continue
			}
			for k := next(3); k > 0; k-- {
				b[next(len(b))] = '.'
			}
			if got, want := d.Search(string(b)), match(string(b)); got != want {
				return fmt.Sprintf("операция %d: Search(%q) = %v, ожидалось %v", i+1, string(b), got, want)
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: word-search-ii
---
```go starter
func findWords(board [][]byte, words []string) []string {

}
```

```go tests
func judgeTests(t *Judge) {
	// эталон: для каждого слова отдельный поиск с возвратом
	brute := func(board [][]byte, words []string) []string {
		m, n := len(board), len(board[0])
		used := make([][]bool, m)
		for i := range used {
			used[i] = make([]bool, n)
		}
		var dfs func(r, c int, w string) bool
		dfs = func(r, c int, w string) bool {
			if r < 0 || r >= m || c < 0 || c >= n || used[r][c] || board[r][c] != w[0] {
				return false
			}
			if len(w) == 1 {
				return true
			}
			used[r][c] = true
			ok := dfs(r+1, c, w[1:]) || dfs(r-1, c, w[1:]) || dfs(r, c+1, w[1:]) || dfs(r, c-1, w[1:])
			used[r][c] = false
			return ok
		}
		res := []string{}
		for _, w := range words {
			found := false
			for r := 0; r < m && !found; r++ {
				for c := 0; c < n && !found; c++ {
					found = dfs(r, c, w)
				}
			}
			if found {
				res = append(res, w)
			}
		}
		return res
	}
	ex := []string{"oaan", "etae", "ihkr", "iflv"}
	cases := []struct {
		board []string
		words []string
		want  []string
	}{
		{ex, []string{"oath", "pea", "eat", "rain"}, []string{"eat", "oath"}},
		{[]string{"ab", "cd"}, []string{"abcb"}, []string{}},
		{[]string{"a"}, []string{"a"}, []string{"a"}},
		{[]string{"a"}, []string{"b", "aa"}, []string{}},
		{[]string{"aa"}, []string{"aaa"}, []string{}},
		{[]string{"aa"}, []string{"a", "aa", "aaa"}, []string{"a", "aa"}},
		{[]string{"ab", "cd"}, []string{"ab", "cb", "ad", "bd", "ac", "ca", "da", "bc", "db", "adcb", "dabc", "abb", "acdb"}, []string{"ab", "bd", "ac", "ca", "db", "acdb"}},
		{ex, []string{"oa", "oaa", "oath", "oathk", "oathf", "eat", "eata", "eatak", "hk", "kh", "taa", "z", "rain", "nae", "vlfi"}, nil},
		{[]string{"abc", "aed", "afg"}, []string{"abcdefg", "gfedcbaaa", "eaabcdgfa", "befa", "dgf", "ade", "aaa", "aaaa", "bea"}, nil},
	}
	for _, c := range cases {
		want := c.want
		if want == nil {
			want = brute(JBoard(c.board...), c.words)
		}
		t.Case(fmt.Sprintf("board = %s, words = %s", JShow(c.board), JShow(c.words)), want, func() any {
			return findWords(JBoard(c.board...), JClone(c.words))
		}, JAnyOrder)
	}

	// большая случайная доска 12×12 из букв a..e: случайные слова плюс слова, снятые с путей по доске
	{
		x := uint32(13579)
		next := func(n int) int { x ^= x << 13; x ^= x >> 17; x ^= x << 5; return int(x % uint32(n)) }
		rows := make([]string, 12)
		for i := range rows {
			b := make([]byte, 12)
			for j := range b {
				b[j] = byte('a' + next(5))
			}
			rows[i] = string(b)
		}
		seen := map[string]bool{}
		var words []string
		add := func(w string) {
			if !seen[w] {
				seen[w] = true
				words = append(words, w)
			}
		}
		for len(words) < 5000 {
			b := make([]byte, 1+next(10))
			for j := range b {
				b[j] = byte('a' + next(5))
			}
			add(string(b))
		}
		dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
		for k := 0; k < 1500; k++ {
			// случайное блуждание без повторов клеток длиной до 10
			r, c := next(12), next(12)
			used := map[[2]int]bool{{r, c}: true}
			w := []byte{rows[r][c]}
			for l := 1 + next(10); len(w) < l; {
				d := dirs[next(4)]
				nr, nc := r+d[0], c+d[1]
				if nr < 0 || nr >= 12 || nc < 0 || nc >= 12 || used[[2]int{nr, nc}] {
					if next(4) == 0 {
						break
					}
					continue
				}
				r, c = nr, nc
				used[[2]int{r, c}] = true
				w = append(w, rows[r][c])
			}
			add(string(w))
		}
		want := brute(JBoard(rows...), words)
		t.Case(fmt.Sprintf("board = случайная 12×12 из букв a..e, words = %d слов длиной 1..10", len(words)), want, func() any {
			return findWords(JBoard(rows...), JClone(words))
		}, JAnyOrder)
	}

	// доска 12×12 из одних «a»: слова длиной до 10 и «ловушки», которые не находятся
	{
		rows := make([]string, 12)
		for i := range rows {
			rows[i] = strings.Repeat("a", 12)
		}
		var words []string
		for l := 1; l <= 10; l++ {
			words = append(words, strings.Repeat("a", l))
		}
		words = append(words, "aaaaaaaaab", "baaaaaaaaa", "aaaabaaaaa", "b")
		t.Case("board = 12×12 из букв a, words = [a, aa, …, a×10, aaaaaaaaab, baaaaaaaaa, aaaabaaaaa, b]", words[:10], func() any {
			return findWords(JBoard(rows...), JClone(words))
		}, JAnyOrder)
	}
}
```
