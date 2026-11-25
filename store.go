package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // драйвер "pgx"
	_ "modernc.org/sqlite"             // драйвер "sqlite" (чистый Go, без cgo)
)

// Store — доступ к БД. Поддерживаются PostgreSQL (продакшен, несколько
// экземпляров приложения) и SQLite (локальный запуск без внешних сервисов).
// Запросы пишутся с плейсхолдерами $1, $2…; для SQLite они переводятся в ?1, ?2.
type Store struct {
	db     *sql.DB
	sqlite bool
}

var (
	ErrNotFound = errors.New("не найдено")
	ErrExists   = errors.New("уже существует")
)

func OpenStore(ctx context.Context, dsn string) (*Store, error) {
	s := &Store{}
	var err error
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		s.db, err = sql.Open("pgx", dsn)
		if err != nil {
			return nil, err
		}
		s.db.SetMaxOpenConns(envIntDef("DB_MAX_CONNS", 25))
		s.db.SetMaxIdleConns(envIntDef("DB_MAX_CONNS", 25))
		s.db.SetConnMaxLifetime(30 * time.Minute)
		s.db.SetConnMaxIdleTime(5 * time.Minute)
	} else {
		path := strings.TrimPrefix(dsn, "sqlite://")
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, err
		}
		s.sqlite = true
		q := "?_pragma=journal_mode(WAL)&_pragma=busy_timeout(10000)&_pragma=foreign_keys(1)&_pragma=synchronous(NORMAL)&_txlock=immediate"
		s.db, err = sql.Open("sqlite", "file:"+filepath.ToSlash(path)+q)
		if err != nil {
			return nil, err
		}
		// SQLite допускает одного писателя; один пул соединений исключает SQLITE_BUSY
		s.db.SetMaxOpenConns(1)
	}
	pctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	for {
		if err = s.db.PingContext(pctx); err == nil {
			break
		}
		select {
		case <-pctx.Done():
			return nil, fmt.Errorf("БД недоступна: %w", err)
		case <-time.After(time.Second):
		}
	}
	if err := s.migrate(ctx); err != nil {
		return nil, fmt.Errorf("миграции: %w", err)
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) Kind() string {
	if s.sqlite {
		return "sqlite"
	}
	return "postgres"
}

var rePlaceholder = regexp.MustCompile(`\$(\d+)`)

func (s *Store) q(query string) string {
	if s.sqlite {
		return rePlaceholder.ReplaceAllString(query, "?$1")
	}
	return query
}

func (s *Store) exec(ctx context.Context, query string, args ...any) (sql.Result, error) {
	return s.db.ExecContext(ctx, s.q(query), args...)
}

func (s *Store) queryRow(ctx context.Context, query string, args ...any) *sql.Row {
	return s.db.QueryRowContext(ctx, s.q(query), args...)
}

func (s *Store) query(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	return s.db.QueryContext(ctx, s.q(query), args...)
}

func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

// ---------- миграции ----------

var migrations = []string{
	`CREATE TABLE IF NOT EXISTS users (
		id BIGSERIAL PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		name TEXT NOT NULL DEFAULT '',
		pass_hash TEXT NOT NULL,
		created_at BIGINT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS sessions (
		token_hash TEXT PRIMARY KEY,
		user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		created_at BIGINT NOT NULL,
		expires_at BIGINT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
	CREATE INDEX IF NOT EXISTS sessions_expires ON sessions(expires_at);
	CREATE TABLE IF NOT EXISTS progress (
		user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
		data TEXT NOT NULL,
		updated_at BIGINT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS drafts (
		user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		problem_id TEXT NOT NULL,
		code TEXT NOT NULL,
		updated_at BIGINT NOT NULL,
		PRIMARY KEY (user_id, problem_id)
	);
	CREATE TABLE IF NOT EXISTS submissions (
		id BIGSERIAL PRIMARY KEY,
		user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		problem_id TEXT NOT NULL,
		code TEXT NOT NULL,
		status TEXT NOT NULL,
		passed INTEGER NOT NULL,
		total INTEGER NOT NULL,
		time_ms INTEGER NOT NULL,
		result TEXT NOT NULL,
		created_at BIGINT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS submissions_user_problem ON submissions(user_id, problem_id, id);
	CREATE INDEX IF NOT EXISTS submissions_user ON submissions(user_id, id);
	CREATE TABLE IF NOT EXISTS custom_problems (
		id TEXT PRIMARY KEY,
		doc TEXT NOT NULL,
		judge TEXT NOT NULL DEFAULT '',
		created_by BIGINT,
		updated_at BIGINT NOT NULL
	);`,
}

func (s *Store) migrate(ctx context.Context) error {
	conn, err := s.db.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()
	if !s.sqlite {
		// несколько экземпляров приложения стартуют одновременно — мигрирует один
		if _, err := conn.ExecContext(ctx, `SELECT pg_advisory_lock(734101)`); err != nil {
			return err
		}
		defer conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock(734101)`)
	}
	if _, err := conn.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`); err != nil {
		return err
	}
	var v int
	err = conn.QueryRowContext(ctx, `SELECT version FROM schema_version`).Scan(&v)
	if errors.Is(err, sql.ErrNoRows) {
		if _, err := conn.ExecContext(ctx, `INSERT INTO schema_version (version) VALUES (0)`); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}
	for i := v; i < len(migrations); i++ {
		m := migrations[i]
		if s.sqlite {
			m = strings.ReplaceAll(m, "BIGSERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
		}
		tx, err := conn.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		for _, stmt := range strings.Split(m, ";") {
			if strings.TrimSpace(stmt) == "" {
				continue
			}
			if _, err := tx.ExecContext(ctx, stmt); err != nil {
				tx.Rollback()
				return fmt.Errorf("миграция %d: %w", i+1, err)
			}
		}
		if _, err := tx.ExecContext(ctx, s.q(`UPDATE schema_version SET version = $1`), i+1); err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	m := strings.ToLower(err.Error())
	return strings.Contains(m, "unique") || strings.Contains(m, "duplicate key") || strings.Contains(m, "23505")
}

func nowMs() int64 { return time.Now().UnixMilli() }

// ---------- пользователи и сессии ----------

type User struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	PassHash  string `json:"-"`
	CreatedAt int64  `json:"createdAt"`
	Admin     bool   `json:"admin"`
}

func (s *Store) CreateUser(ctx context.Context, email, name, hash string) (*User, error) {
	u := &User{Email: email, Name: name, PassHash: hash, CreatedAt: nowMs()}
	err := s.queryRow(ctx, `INSERT INTO users (email, name, pass_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id`,
		email, name, hash, u.CreatedAt).Scan(&u.ID)
	if isUniqueViolation(err) {
		return nil, ErrExists
	}
	return u, err
}

func (s *Store) userBy(ctx context.Context, where string, arg any) (*User, error) {
	u := &User{}
	err := s.queryRow(ctx, `SELECT id, email, name, pass_hash, created_at FROM users WHERE `+where, arg).
		Scan(&u.ID, &u.Email, &u.Name, &u.PassHash, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

func (s *Store) UserByEmail(ctx context.Context, email string) (*User, error) {
	return s.userBy(ctx, `email = $1`, email)
}

func (s *Store) UserByID(ctx context.Context, id int64) (*User, error) {
	return s.userBy(ctx, `id = $1`, id)
}

func (s *Store) SetPassword(ctx context.Context, id int64, hash string) error {
	_, err := s.exec(ctx, `UPDATE users SET pass_hash = $1 WHERE id = $2`, hash, id)
	return err
}

func (s *Store) SetName(ctx context.Context, id int64, name string) error {
	_, err := s.exec(ctx, `UPDATE users SET name = $1 WHERE id = $2`, name, id)
	return err
}

func (s *Store) CreateSession(ctx context.Context, tokenHash string, userID int64, ttl time.Duration) error {
	now := nowMs()
	_, err := s.exec(ctx, `INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)`,
		tokenHash, userID, now, now+ttl.Milliseconds())
	return err
}

// SessionUser возвращает пользователя сессии и время её истечения (мс).
func (s *Store) SessionUser(ctx context.Context, tokenHash string) (*User, int64, error) {
	u := &User{}
	var exp int64
	err := s.queryRow(ctx, `SELECT u.id, u.email, u.name, u.pass_hash, u.created_at, s.expires_at
		FROM sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = $1 AND s.expires_at > $2`, tokenHash, nowMs()).
		Scan(&u.ID, &u.Email, &u.Name, &u.PassHash, &u.CreatedAt, &exp)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, 0, ErrNotFound
	}
	return u, exp, err
}

func (s *Store) ExtendSession(ctx context.Context, tokenHash string, ttl time.Duration) error {
	_, err := s.exec(ctx, `UPDATE sessions SET expires_at = $1 WHERE token_hash = $2`, nowMs()+ttl.Milliseconds(), tokenHash)
	return err
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, tokenHash)
	return err
}

// DeleteUserSessions удаляет все сессии пользователя, кроме keep (если задан).
func (s *Store) DeleteUserSessions(ctx context.Context, userID int64, keep string) error {
	_, err := s.exec(ctx, `DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`, userID, keep)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) (int64, error) {
	r, err := s.exec(ctx, `DELETE FROM sessions WHERE expires_at < $1`, nowMs())
	if err != nil {
		return 0, err
	}
	return r.RowsAffected()
}

// ---------- прогресс и черновики ----------

func (s *Store) GetProgress(ctx context.Context, userID int64) (string, int64, error) {
	var data string
	var upd int64
	err := s.queryRow(ctx, `SELECT data, updated_at FROM progress WHERE user_id = $1`, userID).Scan(&data, &upd)
	if errors.Is(err, sql.ErrNoRows) {
		return "{}", 0, nil
	}
	return data, upd, err
}

func (s *Store) PutProgress(ctx context.Context, userID int64, data string) (int64, error) {
	now := nowMs()
	_, err := s.exec(ctx, `INSERT INTO progress (user_id, data, updated_at) VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`, userID, data, now)
	return now, err
}

func (s *Store) GetDraft(ctx context.Context, userID int64, problemID string) (string, int64, error) {
	var code string
	var upd int64
	err := s.queryRow(ctx, `SELECT code, updated_at FROM drafts WHERE user_id = $1 AND problem_id = $2`, userID, problemID).Scan(&code, &upd)
	if errors.Is(err, sql.ErrNoRows) {
		return "", 0, ErrNotFound
	}
	return code, upd, err
}

func (s *Store) PutDraft(ctx context.Context, userID int64, problemID, code string) error {
	_, err := s.exec(ctx, `INSERT INTO drafts (user_id, problem_id, code, updated_at) VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, problem_id) DO UPDATE SET code = excluded.code, updated_at = excluded.updated_at`,
		userID, problemID, code, nowMs())
	return err
}

// ---------- отправки решений ----------

type Submission struct {
	ID        int64  `json:"id"`
	ProblemID string `json:"problemId"`
	Status    string `json:"status"`
	Passed    int    `json:"passed"`
	Total     int    `json:"total"`
	TimeMs    int    `json:"timeMs"`
	CreatedAt int64  `json:"createdAt"`
	Code      string `json:"code,omitempty"`
	Result    string `json:"-"`
}

func (s *Store) AddSubmission(ctx context.Context, userID int64, sub *Submission) error {
	sub.CreatedAt = nowMs()
	return s.queryRow(ctx, `INSERT INTO submissions (user_id, problem_id, code, status, passed, total, time_ms, result, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
		userID, sub.ProblemID, sub.Code, sub.Status, sub.Passed, sub.Total, sub.TimeMs, sub.Result, sub.CreatedAt).Scan(&sub.ID)
}

// ListSubmissions — последние отправки пользователя (по задаче, если problemID задан), без кода.
func (s *Store) ListSubmissions(ctx context.Context, userID int64, problemID string, limit int) ([]Submission, error) {
	q := `SELECT id, problem_id, status, passed, total, time_ms, created_at FROM submissions WHERE user_id = $1`
	args := []any{userID}
	if problemID != "" {
		q += ` AND problem_id = $2`
		args = append(args, problemID)
	}
	q += fmt.Sprintf(` ORDER BY id DESC LIMIT %d`, limit)
	rows, err := s.query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Submission{}
	for rows.Next() {
		var x Submission
		if err := rows.Scan(&x.ID, &x.ProblemID, &x.Status, &x.Passed, &x.Total, &x.TimeMs, &x.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, x)
	}
	return out, rows.Err()
}

func (s *Store) GetSubmission(ctx context.Context, userID, id int64) (*Submission, error) {
	x := &Submission{}
	err := s.queryRow(ctx, `SELECT id, problem_id, status, passed, total, time_ms, created_at, code, result
		FROM submissions WHERE user_id = $1 AND id = $2`, userID, id).
		Scan(&x.ID, &x.ProblemID, &x.Status, &x.Passed, &x.Total, &x.TimeMs, &x.CreatedAt, &x.Code, &x.Result)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return x, err
}

type SubmissionStat struct {
	Count    int   `json:"count"`
	Accepted bool  `json:"accepted"`
	Last     int64 `json:"last"`
}

// SubmissionSummary — по каждой задаче: сколько отправок, есть ли принятая, когда последняя.
func (s *Store) SubmissionSummary(ctx context.Context, userID int64) (map[string]SubmissionStat, error) {
	rows, err := s.query(ctx, `SELECT problem_id, COUNT(*),
		SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END), MAX(created_at)
		FROM submissions WHERE user_id = $1 GROUP BY problem_id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]SubmissionStat{}
	for rows.Next() {
		var id string
		var st SubmissionStat
		var acc int64
		if err := rows.Scan(&id, &st.Count, &acc, &st.Last); err != nil {
			return nil, err
		}
		st.Accepted = acc > 0
		out[id] = st
	}
	return out, rows.Err()
}

// ---------- задачи, добавленные через интерфейс ----------

func (s *Store) ListCustomProblems(ctx context.Context) ([]customDoc, error) {
	rows, err := s.query(ctx, `SELECT id, doc, judge FROM custom_problems ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []customDoc
	for rows.Next() {
		var d customDoc
		if err := rows.Scan(&d.ID, &d.Doc, &d.Judge); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) CustomProblemsVersion(ctx context.Context) (string, error) {
	var n, mx int64
	err := s.queryRow(ctx, `SELECT COUNT(*), COALESCE(MAX(updated_at), 0) FROM custom_problems`).Scan(&n, &mx)
	return fmt.Sprintf("%d:%d", n, mx), err
}

func (s *Store) PutCustomProblem(ctx context.Context, d customDoc, by int64, overwrite bool) error {
	if overwrite {
		_, err := s.exec(ctx, `INSERT INTO custom_problems (id, doc, judge, created_by, updated_at) VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (id) DO UPDATE SET doc = excluded.doc, judge = excluded.judge, updated_at = excluded.updated_at`,
			d.ID, d.Doc, d.Judge, by, nowMs())
		return err
	}
	_, err := s.exec(ctx, `INSERT INTO custom_problems (id, doc, judge, created_by, updated_at) VALUES ($1, $2, $3, $4, $5)`,
		d.ID, d.Doc, d.Judge, by, nowMs())
	if isUniqueViolation(err) {
		return ErrExists
	}
	return err
}

func (s *Store) DeleteCustomProblem(ctx context.Context, id string) error {
	_, err := s.exec(ctx, `DELETE FROM custom_problems WHERE id = $1`, id)
	return err
}

func (s *Store) CountUsers(ctx context.Context) (int64, error) {
	var n int64
	err := s.queryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&n)
	return n, err
}
