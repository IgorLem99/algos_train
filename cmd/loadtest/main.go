// Нагрузочный тест AlgoTrain: имитирует пользователей, которые открывают
// страницы, сохраняют прогресс и черновики и отправляют решения.
//
//	go run ./cmd/loadtest -url https://localhost:8443 -insecure -users 10 -workers 200 -runners 10 -d 30s
//
// Аккаунты создаются заранее (регистрация ограничена по частоте с одного IP).
package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net"
	"net/http"
	"net/http/cookiejar"
	"os"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

var (
	base     = flag.String("url", "http://127.0.0.1:7341", "адрес приложения")
	insecure = flag.Bool("insecure", false, "не проверять TLS-сертификат (локальный Caddy)")
	nUsers   = flag.Int("users", 10, "сколько аккаунтов создать")
	workers  = flag.Int("workers", 100, "параллельных «читателей» (страницы, прогресс, черновики)")
	runners  = flag.Int("runners", 5, "параллельных отправителей решений")
	dur      = flag.Duration("d", 30*time.Second, "длительность")
	connect  = flag.String("connect", "", "подключаться к host:port вместо адреса из -url (проверка до настройки DNS)")
)

type stat struct {
	mu    sync.Mutex
	lat   map[string][]time.Duration
	errs  map[string]int
	codes map[string]map[int]int
	why   map[string]int // тексты сетевых ошибок
}

func (s *stat) add(name string, d time.Duration, code int, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lat[name] = append(s.lat[name], d)
	if s.codes[name] == nil {
		s.codes[name] = map[int]int{}
	}
	s.codes[name][code]++
	if err != nil || code >= 500 {
		s.errs[name]++
	}
	if err != nil {
		msg := err.Error()
		if i := strings.LastIndex(msg, ": "); i >= 0 {
			msg = msg[i+2:]
		}
		s.why[msg]++
	}
}

type user struct {
	c    *http.Client
	etag string
}

func newClient() *http.Client {
	jar, _ := cookiejar.New(nil)
	tr := &http.Transport{MaxIdleConnsPerHost: 1000, MaxConnsPerHost: 0, IdleConnTimeout: 90 * time.Second}
	if *connect != "" {
		var d net.Dialer
		tr.DialContext = func(ctx context.Context, network, _ string) (net.Conn, error) {
			return d.DialContext(ctx, network, *connect)
		}
	}
	if *insecure {
		tr.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	}
	return &http.Client{Jar: jar, Transport: tr, Timeout: 120 * time.Second}
}

func do(c *http.Client, method, path string, body any, hdr map[string]string) (int, []byte, http.Header, error) {
	var rd io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rd = bytes.NewReader(b)
	}
	req, _ := http.NewRequest(method, *base+path, rd)
	req.Header.Set("X-Requested-With", "AlgoTrain")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	resp, err := c.Do(req)
	if err != nil {
		return 0, nil, nil, err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, b, resp.Header, nil
}

const solution = `func twoSum(nums []int, target int) []int {
	m := map[int]int{}
	for i, x := range nums {
		if j, ok := m[target-x]; ok {
			return []int{j, i}
		}
		m[x] = i
	}
	return nil
}`

func main() {
	flag.Parse()
	st := &stat{lat: map[string][]time.Duration{}, errs: map[string]int{}, codes: map[string]map[int]int{}, why: map[string]int{}}
	stamp := time.Now().UnixNano()
	var users []*user
	for i := 0; i < *nUsers; i++ {
		u := &user{c: newClient()}
		code, b, _, err := do(u.c, "POST", "/api/auth/register", map[string]string{
			"email": fmt.Sprintf("load-%d-%d@algotrain.test", stamp, i), "password": fmt.Sprintf("load-pass-%d", stamp),
		}, nil)
		if err != nil || code != 200 {
			fmt.Fprintf(os.Stderr, "регистрация %d: %v %d %s\n", i, err, code, b)
			os.Exit(1)
		}
		users = append(users, u)
	}
	progress := map[string]any{"problems": map[string]any{}, "settings": map[string]any{}}
	pm := progress["problems"].(map[string]any)
	for i := 0; i < 120; i++ {
		pm[fmt.Sprintf("problem-%d", i)] = map[string]any{"stage": 2, "start": "2026-11-01", "due": "2026-11-30",
			"history": []map[string]any{{"d": "2026-11-01", "t": "solve"}, {"d": "2026-11-02", "t": "review", "stage": 1, "ok": true}}}
	}

	deadline := time.Now().Add(*dur)
	var wg sync.WaitGroup
	var reqs atomic.Int64
	for w := 0; w < *workers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			u := users[w%len(users)]
			r := rand.New(rand.NewSource(int64(w)))
			for time.Now().Before(deadline) {
				var name, method, path string
				var body any
				hdr := map[string]string{}
				switch x := r.Intn(100); {
				case x < 25:
					name, method, path = "GET /api/content (ETag)", "GET", "/api/content"
					if u.etag != "" {
						hdr["If-None-Match"] = u.etag
					}
				case x < 30:
					name, method, path = "GET /api/content (полный)", "GET", "/api/content"
				case x < 50:
					name, method, path = "GET /api/progress", "GET", "/api/progress"
				case x < 60:
					name, method, path = "GET /api/submissions/summary", "GET", "/api/submissions/summary"
				case x < 70:
					name, method, path = "GET /api/me", "GET", "/api/me"
				case x < 85:
					name, method, path, body = "PUT /api/progress", "PUT", "/api/progress", progress
				case x < 95:
					name, method, path, body = "PUT /api/drafts", "PUT", "/api/drafts/two-sum", map[string]string{"code": solution}
				default:
					name, method, path = "GET /app.js (static)", "GET", "/app.js"
				}
				t0 := time.Now()
				code, _, h, err := do(u.c, method, path, body, hdr)
				st.add(name, time.Since(t0), code, err)
				reqs.Add(1)
				if path == "/api/content" && h != nil && h.Get("ETag") != "" {
					u.etag = h.Get("ETag")
				}
			}
		}(w)
	}
	for w := 0; w < *runners; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			u := users[w%len(users)]
			for time.Now().Before(deadline) {
				mode := "run"
				if w%2 == 0 {
					mode = "submit"
				}
				t0 := time.Now()
				code, b, _, err := do(u.c, "POST", "/api/run/two-sum", map[string]string{"code": solution, "mode": mode}, nil)
				name := "POST /api/run (" + mode + ")"
				if code == 200 && !strings.Contains(string(b), `"status":"accepted"`) {
					name += " НЕ ПРИНЯТО"
				}
				st.add(name, time.Since(t0), code, err)
				if code == 429 || code == 503 {
					time.Sleep(time.Second)
				}
			}
		}(w)
	}
	wg.Wait()

	total := time.Duration(*dur)
	fmt.Printf("\nДлительность %v, пользователей %d, читателей %d, отправителей %d\n", total, *nUsers, *workers, *runners)
	fmt.Printf("%-34s %8s %7s %8s %8s %8s %8s  %s\n", "запрос", "кол-во", "RPS", "p50", "p95", "p99", "ошибок", "коды")
	var names []string
	for n := range st.lat {
		names = append(names, n)
	}
	sort.Strings(names)
	var all int
	for _, n := range names {
		l := st.lat[n]
		sort.Slice(l, func(i, j int) bool { return l[i] < l[j] })
		q := func(p float64) time.Duration { return l[int(float64(len(l)-1)*p)].Round(100 * time.Microsecond) }
		all += len(l)
		fmt.Printf("%-34s %8d %7.0f %8v %8v %8v %8d  %v\n", n, len(l), float64(len(l))/total.Seconds(), q(.5), q(.95), q(.99), st.errs[n], st.codes[n])
	}
	fmt.Printf("Всего %d запросов, %.0f RPS\n", all, float64(all)/total.Seconds())
	for msg, n := range st.why {
		fmt.Printf("  сетевая ошибка ×%d: %s\n", n, msg)
	}
}
