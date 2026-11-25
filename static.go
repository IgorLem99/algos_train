package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"mime"
	"net/http"
	"os"
	"path"
	"strings"
)

// staticFiles раздаёт фронтенд. Встроенные в бинарник файлы готовятся при старте:
// ETag и gzip-версия считаются один раз, поэтому раздача почти бесплатна.
// В режиме разработки (папка web/ на диске) файлы читаются с диска на каждый запрос.
type staticFiles struct {
	disk  string
	files map[string]*staticFile
}

type staticFile struct {
	raw, gz []byte
	etag    string
	ctype   string
}

func newStaticFiles(fsys fs.FS, disk string) (*staticFiles, error) {
	s := &staticFiles{disk: disk, files: map[string]*staticFile{}}
	if disk != "" {
		return s, nil
	}
	err := fs.WalkDir(fsys, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		b, err := fs.ReadFile(fsys, p)
		if err != nil {
			return err
		}
		s.files["/"+p] = prepStatic(p, b)
		return nil
	})
	return s, err
}

func prepStatic(p string, b []byte) *staticFile {
	f := &staticFile{raw: b, ctype: mime.TypeByExtension(path.Ext(p))}
	if f.ctype == "" {
		f.ctype = http.DetectContentType(b)
	}
	sum := sha256.Sum256(b)
	f.etag = `"` + hex.EncodeToString(sum[:12]) + `"`
	switch path.Ext(p) {
	case ".js", ".css", ".html", ".svg", ".json", ".md", ".txt":
		var buf bytes.Buffer
		zw, _ := gzip.NewWriterLevel(&buf, gzip.BestCompression)
		zw.Write(b)
		zw.Close()
		if buf.Len() < len(b) {
			f.gz = buf.Bytes()
		}
	}
	return f
}

func (s *staticFiles) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "HEAD" {
		http.Error(w, "method not allowed", 405)
		return
	}
	p := path.Clean("/" + r.URL.Path)
	if p == "/" {
		p = "/index.html"
	}
	var f *staticFile
	if s.disk != "" {
		if strings.Contains(p, "..") {
			http.NotFound(w, r)
			return
		}
		b, err := os.ReadFile(s.disk + p)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		f = prepStatic(p, b)
	} else if f = s.files[p]; f == nil {
		http.NotFound(w, r)
		return
	}
	// no-cache = «можно кэшировать, но перепроверять»: после деплоя браузер сразу
	// получит новую версию, а без изменений ответ — пустой 304.
	serveBytes(w, r, f.raw, f.gz, f.etag, f.ctype, "no-cache")
}
