package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

const (
	sessionCookie = "at_session"
	sessionTTL    = 30 * 24 * time.Hour
	bcryptCost    = 11
)

// ---------- пароли ----------

// bcrypt намеренно медленный (~100 мс CPU). Ограничиваем число одновременных
// хэширований, чтобы поток логинов не съел весь процессор.
var hashSem = make(chan struct{}, 8)

func hashPassword(ctx context.Context, pw string) (string, error) {
	select {
	case hashSem <- struct{}{}:
	case <-ctx.Done():
		return "", ctx.Err()
	}
	defer func() { <-hashSem }()
	h, err := bcrypt.GenerateFromPassword([]byte(pw), bcryptCost)
	return string(h), err
}

// хэш для несуществующих пользователей — чтобы время ответа не выдавало, есть ли email
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("timing-equalizer"), bcryptCost)

func checkPassword(ctx context.Context, hash, pw string) bool {
	select {
	case hashSem <- struct{}{}:
	case <-ctx.Done():
		return false
	}
	defer func() { <-hashSem }()
	if hash == "" {
		bcrypt.CompareHashAndPassword(dummyHash, []byte(pw))
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

var reEmail = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

func normEmail(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func validatePassword(pw string) error {
	switch {
	case utf8.RuneCountInString(pw) < 8:
		return errors.New("пароль должен быть не короче 8 символов")
	case len(pw) > 72:
		return errors.New("пароль слишком длинный (максимум 72 байта)")
	}
	return nil
}

// ---------- сессии ----------

func newToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

// В БД хранится только SHA-256 токена: утечка базы не даёт войти чужими сессиями.
func tokenHash(tok string) string {
	h := sha256.Sum256([]byte(tok))
	return hex.EncodeToString(h[:])
}

// sessionCache снимает с БД запрос на каждый API-вызов. Запись живёт 30 с,
// поэтому выход на другом экземпляре приложения применяется с задержкой до 30 с.
type sessionCache struct {
	mu sync.Mutex
	m  map[string]cachedSession
}

type cachedSession struct {
	user    User
	expires int64 // срок сессии в БД, мс
	until   time.Time
}

func (c *sessionCache) get(h string) (User, int64, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.m[h]
	if !ok || time.Now().After(e.until) {
		return User{}, 0, false
	}
	return e.user, e.expires, true
}

func (c *sessionCache) put(h string, u User, exp int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.m) > 100000 {
		c.m = map[string]cachedSession{}
	}
	c.m[h] = cachedSession{u, exp, time.Now().Add(30 * time.Second)}
}

func (c *sessionCache) drop(h string) {
	c.mu.Lock()
	delete(c.m, h)
	c.mu.Unlock()
}

func (c *sessionCache) dropUser(id int64) {
	c.mu.Lock()
	for k, v := range c.m {
		if v.user.ID == id {
			delete(c.m, k)
		}
	}
	c.mu.Unlock()
}

type ctxKey int

const userKey ctxKey = 1

func currentUser(r *http.Request) *User {
	u, _ := r.Context().Value(userKey).(*User)
	return u
}

// authenticate кладёт пользователя в контекст, если cookie сессии валидна.
func (a *App) authenticate(r *http.Request) *http.Request {
	c, err := r.Cookie(sessionCookie)
	if err != nil || c.Value == "" || len(c.Value) > 100 {
		return r
	}
	h := tokenHash(c.Value)
	u, exp, ok := a.sessions.get(h)
	if !ok {
		uu, e, err := a.store.SessionUser(r.Context(), h)
		if err != nil {
			if !errors.Is(err, ErrNotFound) {
				slog.Error("session lookup", "err", err)
			}
			return r
		}
		u, exp = *uu, e
		// скользящий срок: продлеваем, если прошло больше суток с выдачи/продления
		if time.Until(time.UnixMilli(exp)) < sessionTTL-24*time.Hour {
			if err := a.store.ExtendSession(r.Context(), h, sessionTTL); err == nil {
				exp = time.Now().Add(sessionTTL).UnixMilli()
			}
		}
		a.sessions.put(h, u, exp)
	}
	u.Admin = a.isAdmin(&u)
	return r.WithContext(context.WithValue(r.Context(), userKey, &u))
}

func (a *App) isAdmin(u *User) bool {
	if len(a.cfg.AdminEmails) == 0 {
		return u.ID == 1 // администратор по умолчанию — первый зарегистрированный
	}
	return a.cfg.AdminEmails[u.Email]
}

func (a *App) setSessionCookie(w http.ResponseWriter, tok string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    tok,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   a.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (a *App) startSession(w http.ResponseWriter, r *http.Request, u *User) error {
	tok := newToken()
	if err := a.store.CreateSession(r.Context(), tokenHash(tok), u.ID, sessionTTL); err != nil {
		return err
	}
	a.setSessionCookie(w, tok, int(sessionTTL.Seconds()))
	return nil
}

// ---------- ограничение частоты запросов ----------

// rateLimiter — token bucket на ключ (IP, email, пользователь). В памяти процесса:
// при нескольких экземплярах лимит действует на каждый отдельно.
type rateLimiter struct {
	mu    sync.Mutex
	rate  float64 // токенов в секунду
	burst float64
	m     map[string]*bucket
}

type bucket struct {
	tokens float64
	last   time.Time
}

func newRateLimiter(perMinute, burst int) *rateLimiter {
	rl := &rateLimiter{rate: float64(perMinute) / 60, burst: float64(burst), m: map[string]*bucket{}}
	go func() {
		for range time.Tick(5 * time.Minute) {
			rl.mu.Lock()
			for k, b := range rl.m {
				if time.Since(b.last) > 30*time.Minute {
					delete(rl.m, k)
				}
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	b, ok := rl.m[key]
	if !ok {
		b = &bucket{tokens: rl.burst, last: now}
		rl.m[key] = b
	}
	b.tokens = min(rl.burst, b.tokens+now.Sub(b.last).Seconds()*rl.rate)
	b.last = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// clientIP — адрес клиента. За обратным прокси (TRUST_PROXY=1) берётся последний
// адрес из X-Forwarded-For — его добавил наш прокси, подделать его клиент не может.
func (a *App) clientIP(r *http.Request) string {
	if a.cfg.TrustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[len(parts)-1])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ---------- обработчики ----------

type authReq struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

func (a *App) handleRegister(w http.ResponseWriter, r *http.Request) {
	if !a.cfg.AllowSignup {
		httpErr(w, 403, "регистрация закрыта")
		return
	}
	if !a.authLimit.allow("ip:" + a.clientIP(r)) {
		httpErr(w, 429, "слишком много попыток, подождите минуту")
		return
	}
	var req authReq
	if !readJSON(w, r, &req, 4<<10) {
		return
	}
	email := normEmail(req.Email)
	name := strings.TrimSpace(req.Name)
	if !reEmail.MatchString(email) || len(email) > 254 {
		httpErr(w, 400, "некорректный email")
		return
	}
	if name == "" {
		name = strings.SplitN(email, "@", 2)[0]
	}
	if utf8.RuneCountInString(name) > 60 {
		httpErr(w, 400, "имя слишком длинное")
		return
	}
	if err := validatePassword(req.Password); err != nil {
		httpErr(w, 400, err.Error())
		return
	}
	hash, err := hashPassword(r.Context(), req.Password)
	if err != nil {
		httpErr(w, 500, "ошибка сервера")
		return
	}
	u, err := a.store.CreateUser(r.Context(), email, name, hash)
	if errors.Is(err, ErrExists) {
		httpErr(w, 409, "пользователь с таким email уже зарегистрирован")
		return
	}
	if err != nil {
		a.fail(w, r, err)
		return
	}
	if err := a.startSession(w, r, u); err != nil {
		a.fail(w, r, err)
		return
	}
	slog.Info("регистрация", "user", u.ID)
	u.Admin = a.isAdmin(u)
	writeJSON(w, 200, u)
}

func (a *App) handleLogin(w http.ResponseWriter, r *http.Request) {
	ip := a.clientIP(r)
	if !a.authLimit.allow("ip:" + ip) {
		httpErr(w, 429, "слишком много попыток, подождите минуту")
		return
	}
	var req authReq
	if !readJSON(w, r, &req, 4<<10) {
		return
	}
	email := normEmail(req.Email)
	// отдельный лимит на email — от подбора пароля с разных IP
	if !a.loginLimit.allow("email:" + email) {
		httpErr(w, 429, "слишком много попыток входа для этого email, попробуйте позже")
		return
	}
	u, err := a.store.UserByEmail(r.Context(), email)
	if err != nil && !errors.Is(err, ErrNotFound) {
		a.fail(w, r, err)
		return
	}
	hash := ""
	if u != nil {
		hash = u.PassHash
	}
	if !checkPassword(r.Context(), hash, req.Password) {
		httpErr(w, 401, "неверный email или пароль")
		return
	}
	if err := a.startSession(w, r, u); err != nil {
		a.fail(w, r, err)
		return
	}
	u.Admin = a.isAdmin(u)
	writeJSON(w, 200, u)
}

func (a *App) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		h := tokenHash(c.Value)
		a.sessions.drop(h)
		_ = a.store.DeleteSession(r.Context(), h)
	}
	a.setSessionCookie(w, "", -1)
	writeJSON(w, 200, map[string]bool{"ok": true})
}

func (a *App) handleMe(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	if u == nil {
		httpErr(w, 401, "нужно войти")
		return
	}
	writeJSON(w, 200, u)
}

func (a *App) handleUpdateMe(w http.ResponseWriter, r *http.Request) {
	u := currentUser(r)
	var req struct {
		Name        string `json:"name"`
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
		LogoutOther bool   `json:"logoutOther"`
	}
	if !readJSON(w, r, &req, 4<<10) {
		return
	}
	ctx := r.Context()
	if name := strings.TrimSpace(req.Name); name != "" && name != u.Name {
		if utf8.RuneCountInString(name) > 60 {
			httpErr(w, 400, "имя слишком длинное")
			return
		}
		if err := a.store.SetName(ctx, u.ID, name); err != nil {
			a.fail(w, r, err)
			return
		}
		u.Name = name
	}
	keep := ""
	if c, err := r.Cookie(sessionCookie); err == nil {
		keep = tokenHash(c.Value)
	}
	if req.NewPassword != "" {
		if !a.loginLimit.allow("email:" + u.Email) {
			httpErr(w, 429, "слишком много попыток, попробуйте позже")
			return
		}
		if !checkPassword(ctx, u.PassHash, req.OldPassword) {
			httpErr(w, 400, "текущий пароль указан неверно")
			return
		}
		if err := validatePassword(req.NewPassword); err != nil {
			httpErr(w, 400, err.Error())
			return
		}
		hash, err := hashPassword(ctx, req.NewPassword)
		if err != nil {
			a.fail(w, r, err)
			return
		}
		if err := a.store.SetPassword(ctx, u.ID, hash); err != nil {
			a.fail(w, r, err)
			return
		}
		req.LogoutOther = true // после смены пароля остальные сессии завершаем
	}
	if req.LogoutOther {
		if err := a.store.DeleteUserSessions(ctx, u.ID, keep); err != nil {
			a.fail(w, r, err)
			return
		}
	}
	a.sessions.dropUser(u.ID)
	writeJSON(w, 200, u)
}
