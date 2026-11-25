---
id: kth-largest-element-in-a-stream
---
```go starter
type KthLargest struct {

}

func Constructor(k int, nums []int) KthLargest {

}

func (this *KthLargest) Add(val int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	type tc struct {
		k    int
		nums []int
		adds []int
		want []int
	}
	cases := []tc{
		{3, []int{4, 5, 8, 2}, []int{3, 5, 10, 9}, []int{4, 5, 5, 8}},
		{4, []int{7, 7, 7, 7, 8, 3}, []int{2, 10, 9, 9}, []int{7, 7, 7, 8}},
		{1, []int{}, []int{-3, -2, -4, 0, 4}, []int{-3, -2, -2, 0, 4}},
		{2, []int{0}, []int{-1, 1, -2, -4, 3}, []int{-1, 0, 0, 0, 1}},
		{3, []int{5, -1}, []int{2, 1, -1, 3, 4}, []int{-1, 1, 1, 2, 3}},
		{1, []int{-10000}, []int{10000, -10000, 9999}, []int{10000, 10000, 10000}},
		{5, []int{1, 1, 1, 1, 1, 1}, []int{1, 2, 0}, []int{1, 1, 1}},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("k = %d, nums = %v, add: %v", c.k, c.nums, c.adds), c.want, func() any {
			kl := Constructor(c.k, JClone(c.nums))
			out := []int{}
			for _, v := range c.adds {
				out = append(out, kl.Add(v))
			}
			return out
		})
	}
	// случайные операции против простой модели (отсортированный срез)
	random := func(seed int64, k, n, adds int) func() any {
		return func() any {
			r := rand.New(rand.NewSource(seed))
			nums := make([]int, n)
			for i := range nums {
				nums[i] = r.Intn(20001) - 10000
			}
			model := append([]int(nil), nums...)
			sort.Ints(model)
			kl := Constructor(k, JClone(nums))
			for i := 0; i < adds; i++ {
				v := r.Intn(20001) - 10000
				p := sort.SearchInts(model, v)
				model = append(model, 0)
				copy(model[p+1:], model[p:])
				model[p] = v
				want := model[len(model)-k]
				if got := kl.Add(v); got != want {
					return fmt.Sprintf("add #%d (%d): получено %d, ожидалось %d", i+1, v, got, want)
				}
			}
			return "совпадает с эталоном"
		}
	}
	t.Case("k = 7, nums — 50 случайных, 3000 случайных add", "совпадает с эталоном", random(1, 7, 50, 3000))
	t.Case("k = 1, nums = [], 3000 случайных add", "совпадает с эталоном", random(2, 1, 0, 3000))
	t.Case("k = 5000, nums — 10000 случайных, 10000 случайных add", "совпадает с эталоном", random(3, 5000, 10000, 10000))
}
```

---
id: last-stone-weight
---
```go starter
func lastStoneWeight(stones []int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		stones []int
		want   int
	}{
		{[]int{2, 7, 4, 1, 8, 1}, 1},
		{[]int{1}, 1},
		{[]int{2, 2}, 0},
		{[]int{1000}, 1000},
		{[]int{3, 7, 2}, 2},
		{[]int{10, 4, 2, 10}, 2},
		{[]int{1, 1, 1}, 1},
		{[]int{1000, 1}, 999},
		{[]int{5, 5, 5, 5}, 0},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("stones = %v", c.stones), c.want, func() any {
			return lastStoneWeight(JClone(c.stones))
		})
	}
	// эталон — прямая симуляция с сортировкой
	simulate := func(s []int) int {
		s = append([]int(nil), s...)
		for len(s) > 1 {
			sort.Ints(s)
			n := len(s)
			d := s[n-1] - s[n-2]
			s = s[:n-2]
			if d > 0 {
				s = append(s, d)
			}
		}
		if len(s) == 0 {
			return 0
		}
		return s[0]
	}
	r := rand.New(rand.NewSource(7))
	for i := 0; i < 3; i++ {
		s := make([]int, 30)
		for j := range s {
			s[j] = r.Intn(1000) + 1
		}
		t.Case(fmt.Sprintf("stones = %v", s), simulate(s), func() any {
			return lastStoneWeight(JClone(s))
		})
	}
}
```

---
id: k-closest-points-to-origin
---
```go starter
func kClosest(points [][]int, k int) [][]int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		points [][]int
		k      int
		want   [][]int
	}{
		{[][]int{{1, 3}, {-2, 2}}, 1, [][]int{{-2, 2}}},
		{[][]int{{3, 3}, {5, -1}, {-2, 4}}, 2, [][]int{{3, 3}, {-2, 4}}},
		{[][]int{{0, 1}, {1, 0}}, 2, [][]int{{0, 1}, {1, 0}}},
		{[][]int{{0, 0}}, 1, [][]int{{0, 0}}},
		{[][]int{{10000, 10000}, {-10000, -10000}, {1, -1}}, 1, [][]int{{1, -1}}},
		{[][]int{{5, 5}, {1, 1}, {-3, 0}, {0, 2}, {4, -4}}, 3, [][]int{{1, 1}, {0, 2}, {-3, 0}}},
		{[][]int{{2, 2}, {2, 2}, {3, 3}}, 2, [][]int{{2, 2}, {2, 2}}},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("points = %v, k = %d", c.points, c.k), c.want, func() any {
			return kClosest(JClone2(c.points), c.k)
		}, JAnyOrder)
	}
	// проверка ответа: k точек из входа (с учётом кратности), и их расстояния —
	// ровно k наименьших (при равных расстояниях на границе подходит любой выбор)
	dist := func(p []int) int { return p[0]*p[0] + p[1]*p[1] }
	verify := func(points [][]int, k int, got [][]int) bool {
		if len(got) != k {
			return false
		}
		cnt := map[[2]int]int{}
		for _, p := range points {
			cnt[[2]int{p[0], p[1]}]++
		}
		gd := make([]int, 0, k)
		for _, p := range got {
			if len(p) != 2 {
				return false
			}
			key := [2]int{p[0], p[1]}
			if cnt[key] == 0 {
				return false
			}
			cnt[key]--
			gd = append(gd, dist(p))
		}
		all := make([]int, len(points))
		for i, p := range points {
			all[i] = dist(p)
		}
		sort.Ints(all)
		sort.Ints(gd)
		for i := range gd {
			if gd[i] != all[i] {
				return false
			}
		}
		return true
	}
	gen := func(seed int64, n, lim int) [][]int {
		r := rand.New(rand.NewSource(seed))
		pts := make([][]int, n)
		for i := range pts {
			pts[i] = []int{r.Intn(2*lim+1) - lim, r.Intn(2*lim+1) - lim}
		}
		return pts
	}
	big := []struct {
		name      string
		seed      int64
		n, lim, k int
	}{
		{"10000 случайных точек в [-10⁴, 10⁴], k = 100", 11, 10000, 10000, 100},
		{"10000 случайных точек в [-10⁴, 10⁴], k = 10000", 12, 10000, 10000, 10000},
		{"10000 случайных точек в [-3, 3] (много равных расстояний), k = 5000", 13, 10000, 3, 5000},
	}
	for _, b := range big {
		b := b
		pts := gen(b.seed, b.n, b.lim)
		t.Check("points = "+b.name, "k ближайших точек", func() (any, bool) {
			got := kClosest(JClone2(pts), b.k)
			ok := verify(pts, b.k, got)
			if ok {
				return fmt.Sprintf("k ближайших точек (%d шт.)", len(got)), true
			}
			return got, false
		})
	}
}
```

---
id: kth-largest-element-in-an-array
---
```go starter
func findKthLargest(nums []int, k int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	cases := []struct {
		nums []int
		k    int
		want int
	}{
		{[]int{3, 2, 1, 5, 6, 4}, 2, 5},
		{[]int{3, 2, 3, 1, 2, 4, 5, 5, 6}, 4, 4},
		{[]int{1}, 1, 1},
		{[]int{2, 1}, 2, 1},
		{[]int{-1, -1}, 2, -1},
		{[]int{7, 7, 7, 7}, 3, 7},
		{[]int{-10000, 10000, 0}, 1, 10000},
		{[]int{-10000, 10000, 0}, 3, -10000},
		{[]int{5, 4, 3, 2, 1}, 5, 1},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("nums = %v, k = %d", c.nums, c.k), c.want, func() any {
			return findKthLargest(JClone(c.nums), c.k)
		})
	}
	kth := func(nums []int, k int) int {
		s := append([]int(nil), nums...)
		sort.Ints(s)
		return s[len(s)-k]
	}
	r := rand.New(rand.NewSource(5))
	rnd := make([]int, 100000)
	for i := range rnd {
		rnd[i] = r.Intn(20001) - 10000
	}
	asc := make([]int, 100000)
	for i := range asc {
		asc[i] = i/5 - 10000
	}
	same := make([]int, 10000)
	for i := range same {
		same[i] = 42
	}
	big := []struct {
		name string
		nums []int
		k    int
	}{
		{"100000 случайных чисел в [-10⁴, 10⁴]", rnd, 50000},
		{"100000 случайных чисел в [-10⁴, 10⁴]", rnd, 1},
		{"100000 чисел по возрастанию (с повторами)", asc, 100000},
		{"10000 одинаковых чисел 42", same, 5000},
	}
	for _, b := range big {
		b := b
		t.Case(fmt.Sprintf("nums = %s, k = %d", b.name, b.k), kth(b.nums, b.k), func() any {
			return findKthLargest(JClone(b.nums), b.k)
		})
	}
}
```

---
id: task-scheduler
---
```go starter
func leastInterval(tasks []byte, n int) int {

}
```

```go tests
func judgeTests(t *Judge) {
	show := func(s string) string {
		parts := make([]string, len(s))
		for i := range s {
			parts[i] = strconv.Quote(s[i : i+1])
		}
		return "[" + strings.Join(parts, ",") + "]"
	}
	cases := []struct {
		tasks string
		n     int
		want  int
	}{
		{"AAABBB", 2, 8},
		{"ACABDB", 1, 6},
		{"AAABBB", 3, 10},
		{"A", 100, 1},
		{"AAABBB", 0, 6},
		{"AAAAAABCDEFG", 2, 16},
		{"AAA", 2, 7},
		{"ABCDEFGHIJKLMNOPQRSTUVWXYZ", 100, 26},
		{"AAAAAAAAAA", 100, 910},
		{"AABBCCDDEE", 1, 10},
		{"AAABBBCCCDD", 2, 11},
	}
	for _, c := range cases {
		c := c
		t.Case(fmt.Sprintf("tasks = %s, n = %d", show(c.tasks), c.n), c.want, func() any {
			return leastInterval([]byte(c.tasks), c.n)
		})
	}
	// эталон — формула через самую частую задачу
	formula := func(tasks []byte, n int) int {
		var cnt [26]int
		mx := 0
		for _, ch := range tasks {
			cnt[ch-'A']++
			mx = max(mx, cnt[ch-'A'])
		}
		k := 0
		for _, c := range cnt {
			if c == mx {
				k++
			}
		}
		return max(len(tasks), (mx-1)*(n+1)+k)
	}
	r := rand.New(rand.NewSource(3))
	gen := func(n, letters int) []byte {
		b := make([]byte, n)
		for i := range b {
			b[i] = byte('A' + r.Intn(letters))
		}
		return b
	}
	big := []struct {
		name  string
		tasks []byte
		n     int
	}{
		{"10000 случайных букв A–Z", gen(10000, 26), 100},
		{"10000 случайных букв A–Z", gen(10000, 26), 2},
		{"10000 случайных букв A–C", gen(10000, 3), 5},
	}
	skew := gen(10000, 26)
	for i := 0; i < 5000; i++ {
		skew[i] = 'A'
	}
	big = append(big, struct {
		name  string
		tasks []byte
		n     int
	}{"5000×A + 5000 случайных букв", skew, 100})
	for _, b := range big {
		b := b
		t.Case(fmt.Sprintf("tasks = %s, n = %d", b.name, b.n), formula(b.tasks, b.n), func() any {
			return leastInterval(JClone(b.tasks), b.n)
		})
	}
}
```

---
id: design-twitter
---
```go starter
type Twitter struct {

}

func Constructor() Twitter {

}

func (this *Twitter) PostTweet(userId int, tweetId int) {

}

func (this *Twitter) GetNewsFeed(userId int) []int {

}

func (this *Twitter) Follow(followerId int, followeeId int) {

}

func (this *Twitter) Unfollow(followerId int, followeeId int) {

}
```

```go tests
func judgeTests(t *Judge) {
	t.Case("postTweet(1,5) getNewsFeed(1) follow(1,2) postTweet(2,6) getNewsFeed(1) unfollow(1,2) getNewsFeed(1)",
		[][]int{{5}, {6, 5}, {5}}, func() any {
			tw := Constructor()
			tw.PostTweet(1, 5)
			out := [][]int{tw.GetNewsFeed(1)}
			tw.Follow(1, 2)
			tw.PostTweet(2, 6)
			out = append(out, tw.GetNewsFeed(1))
			tw.Unfollow(1, 2)
			return append(out, tw.GetNewsFeed(1))
		})
	t.Case("getNewsFeed(1) для пользователя без твитов и подписок", [][]int{{}}, func() any {
		tw := Constructor()
		return [][]int{tw.GetNewsFeed(1)}
	})
	t.Case("пользователь 1 публикует твиты 0..11, getNewsFeed(1) — только 10 свежих", [][]int{{11, 10, 9, 8, 7, 6, 5, 4, 3, 2}}, func() any {
		tw := Constructor()
		for i := 0; i <= 11; i++ {
			tw.PostTweet(1, i)
		}
		return [][]int{tw.GetNewsFeed(1)}
	})
	t.Case("follow(1,2), твиты 2 и 3 вперемешку; getNewsFeed(1), getNewsFeed(2), getNewsFeed(3)",
		[][]int{{103, 101, 100}, {103, 101}, {104, 102}}, func() any {
			tw := Constructor()
			tw.Follow(1, 2)
			tw.PostTweet(1, 100)
			tw.PostTweet(2, 101)
			tw.PostTweet(3, 102)
			tw.PostTweet(2, 103)
			tw.PostTweet(3, 104)
			return [][]int{tw.GetNewsFeed(1), tw.GetNewsFeed(2), tw.GetNewsFeed(3)}
		})
	t.Case("follow(1,1) — свои твиты не дублируются; unfollow(1,1) — свои твиты остаются",
		[][]int{{2, 1}, {2, 1}}, func() any {
			tw := Constructor()
			tw.PostTweet(1, 1)
			tw.Follow(1, 1)
			tw.PostTweet(1, 2)
			out := [][]int{tw.GetNewsFeed(1)}
			tw.Unfollow(1, 1)
			return append(out, tw.GetNewsFeed(1))
		})
	t.Case("unfollow(1,2) без подписки; повторный follow(1,2)", [][]int{{7}, {8, 7}}, func() any {
		tw := Constructor()
		tw.PostTweet(2, 7)
		tw.Unfollow(1, 2)
		tw.Follow(1, 2)
		tw.Follow(1, 2)
		out := [][]int{tw.GetNewsFeed(1)}
		tw.PostTweet(1, 8)
		return append(out, tw.GetNewsFeed(1))
	})
	t.Case("tweetId = 0 и подписка на 3 авторов с 5 твитами каждый", [][]int{{14, 13, 12, 11, 10, 9, 8, 7, 6, 5}}, func() any {
		tw := Constructor()
		for i := 0; i < 15; i++ {
			tw.PostTweet(2+i%3, i)
		}
		tw.Follow(1, 2)
		tw.Follow(1, 3)
		tw.Follow(1, 4)
		return [][]int{tw.GetNewsFeed(1)}
	})
	// случайные операции против наивной модели
	t.Case("20000 случайных операций (30 пользователей)", "совпадает с эталоном", func() any {
		r := rand.New(rand.NewSource(99))
		tw := Constructor()
		type post struct{ user, id int }
		var posts []post
		follows := map[[2]int]bool{}
		nextID := 0
		for i := 0; i < 20000; i++ {
			a, b := r.Intn(30)+1, r.Intn(30)+1
			switch op := r.Intn(10); {
			case op < 4:
				tw.PostTweet(a, nextID)
				posts = append(posts, post{a, nextID})
				nextID = (nextID + 7919) % 10007
			case op < 6:
				tw.Follow(a, b)
				follows[[2]int{a, b}] = true
			case op < 7:
				tw.Unfollow(a, b)
				delete(follows, [2]int{a, b})
			default:
				want := []int{}
				for j := len(posts) - 1; j >= 0 && len(want) < 10; j-- {
					if posts[j].user == a || follows[[2]int{a, posts[j].user}] {
						want = append(want, posts[j].id)
					}
				}
				got := tw.GetNewsFeed(a)
				if JShow(got) != JShow(want) {
					return fmt.Sprintf("операция %d getNewsFeed(%d): получено %s, ожидалось %s", i+1, a, JShow(got), JShow(want))
				}
			}
		}
		return "совпадает с эталоном"
	})
}
```

---
id: find-median-from-data-stream
---
```go starter
type MedianFinder struct {

}

func Constructor() MedianFinder {

}

func (this *MedianFinder) AddNum(num int) {

}

func (this *MedianFinder) FindMedian() float64 {

}
```

```go tests
func judgeTests(t *Judge) {
	// ops: число — addNum, nil — findMedian
	run := func(ops []any) func() any {
		return func() any {
			mf := Constructor()
			out := []float64{}
			for _, op := range ops {
				if op == nil {
					out = append(out, mf.FindMedian())
				} else {
					mf.AddNum(op.(int))
				}
			}
			return out
		}
	}
	show := func(ops []any) string {
		parts := make([]string, len(ops))
		for i, op := range ops {
			if op == nil {
				parts[i] = "findMedian()"
			} else {
				parts[i] = fmt.Sprintf("addNum(%d)", op)
			}
		}
		return strings.Join(parts, " ")
	}
	cases := []struct {
		ops  []any
		want []float64
	}{
		{[]any{1, 2, nil, 3, nil}, []float64{1.5, 2}},
		{[]any{5, nil}, []float64{5}},
		{[]any{-1, nil, -2, nil, -3, nil, -4, nil, -5, nil}, []float64{-1, -1.5, -2, -2.5, -3}},
		{[]any{6, nil, 10, nil, 2, nil, 6, nil, 5, nil, 0, nil}, []float64{6, 8, 6, 6, 6, 5.5}},
		{[]any{3, 3, 3, nil, 3, nil}, []float64{3, 3}},
		{[]any{100000, -100000, nil, 100000, nil}, []float64{0, 100000}},
		{[]any{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, nil, 0, nil}, []float64{5.5, 5}},
		{[]any{10, 9, 8, 7, nil, 6, nil}, []float64{8.5, 8}},
	}
	for _, c := range cases {
		t.Case(show(c.ops), c.want, run(c.ops), JFloat)
	}
	// случайные операции против простой модели (отсортированный срез)
	random := func(seed int64, adds, lim int) func() any {
		return func() any {
			r := rand.New(rand.NewSource(seed))
			mf := Constructor()
			var model []int
			for i := 0; i < adds; i++ {
				v := r.Intn(2*lim+1) - lim
				mf.AddNum(v)
				p := sort.SearchInts(model, v)
				model = append(model, 0)
				copy(model[p+1:], model[p:])
				model[p] = v
				if r.Intn(3) == 0 || i == adds-1 {
					n := len(model)
					want := float64(model[n/2])
					if n%2 == 0 {
						want = float64(model[n/2-1]+model[n/2]) / 2
					}
					if got := mf.FindMedian(); math.Abs(got-want) > 1e-5 {
						return fmt.Sprintf("после %d addNum: получено %v, ожидалось %v", i+1, got, want)
					}
				}
			}
			return "совпадает с эталоном"
		}
	}
	t.Case("2000 случайных addNum в [-10, 10] с findMedian", "совпадает с эталоном", random(1, 2000, 10))
	t.Case("30000 случайных addNum в [-10⁵, 10⁵] с findMedian", "совпадает с эталоном", random(2, 30000, 100000))
}
```
