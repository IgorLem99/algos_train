// Лёгкий редактор кода: textarea поверх подсвеченного <pre>.
// Подсветка Go, номера строк, автоотступ, автозакрытие скобок, Tab/Shift+Tab,
// Ctrl+/ — комментарий, Ctrl+Enter — отправить, Ctrl+' — запустить.
// Правки идут через execCommand('insertText'), поэтому Ctrl+Z работает как обычно.
(function () {
  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', '`': '`' };
  const CLOSERS = new Set([')', ']', '}', '"', '`']);

  function create(host, opts = {}) {
    host.innerHTML = `<div class="ed">
      <div class="ed-gutter" aria-hidden="true"><div class="ed-lines"></div></div>
      <div class="ed-main">
        <pre class="ed-hl" aria-hidden="true"><code></code></pre>
        <textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Код решения"></textarea>
      </div>
    </div>`;
    const ta = host.querySelector('.ed-ta');
    const hl = host.querySelector('.ed-hl');
    const code = hl.querySelector('code');
    const lines = host.querySelector('.ed-lines');
    let errors = {}; // номер строки → сообщение
    let lineCount = 0;
    let raf = 0;

    function render() {
      raf = 0;
      code.innerHTML = MD.highlightGo(ta.value) + '\n';
      const n = ta.value.split('\n').length;
      if (n !== lineCount || lines._errVersion !== errors) {
        lineCount = n;
        lines._errVersion = errors;
        let h = '';
        for (let i = 1; i <= n; i++) {
          const e = errors[i];
          h += e ? `<div class="err" title="${MD.esc(e)}">${i}</div>` : `<div>${i}</div>`;
        }
        lines.innerHTML = h;
      }
      sync();
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(render); }
    function sync() {
      hl.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
      lines.style.transform = `translateY(${-ta.scrollTop}px)`;
    }

    function insert(text) {
      ta.focus();
      if (!document.execCommand('insertText', false, text)) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
      }
    }
    const lineStart = pos => ta.value.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = pos => { const i = ta.value.indexOf('\n', pos); return i < 0 ? ta.value.length : i; };

    // Заменить строки, затронутые выделением, результатом fn(строка)
    function mapLines(fn) {
      const s = ta.selectionStart, e = ta.selectionEnd;
      const a = lineStart(s);
      const b = lineEnd(e > s && ta.value[e - 1] === '\n' ? e - 1 : e);
      const src = ta.value.slice(a, b).split('\n');
      const out = src.map(fn);
      ta.setSelectionRange(a, b);
      insert(out.join('\n'));
      ta.setSelectionRange(a, a + out.join('\n').length);
    }

    ta.addEventListener('keydown', ev => {
      const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key === 'Enter') { ev.preventDefault(); opts.onSubmit && opts.onSubmit(); return; }
      if (mod && (ev.key === "'" || ev.code === 'Quote')) { ev.preventDefault(); opts.onRun && opts.onRun(); return; }
      if (mod && (ev.key === 's' || ev.key === 'ы')) { ev.preventDefault(); opts.onSave && opts.onSave(); return; }
      if (mod && (ev.key === '/' || ev.code === 'Slash')) {
        ev.preventDefault();
        const ls = v.slice(lineStart(s), lineEnd(e)).split('\n').filter(l => l.trim());
        const all = ls.length && ls.every(l => /^\s*\/\//.test(l));
        mapLines(l => all ? l.replace(/^(\s*)\/\/ ?/, '$1') : (l.trim() ? l.replace(/^(\s*)/, '$1// ') : l));
        return;
      }
      if (ev.key === 'Tab') {
        ev.preventDefault();
        if (ev.shiftKey) mapLines(l => l.replace(/^(\t| {1,4})/, ''));
        else if (v.slice(s, e).includes('\n')) mapLines(l => l ? '\t' + l : l);
        else insert('\t');
        return;
      }
      if (ev.key === 'Enter' && !mod && !ev.shiftKey && !ev.altKey) {
        ev.preventDefault();
        const ls = lineStart(s);
        const indent = /^[\t ]*/.exec(v.slice(ls, s))[0];
        const before = v.slice(ls, s).trimEnd().slice(-1);
        const after = v[e];
        if ('{(['.includes(before) && before) {
          if (after && after === PAIRS[before]) {
            insert('\n' + indent + '\t\n' + indent);
            const p = s + 1 + indent.length + 1;
            ta.setSelectionRange(p, p);
          } else insert('\n' + indent + '\t');
        } else insert('\n' + indent);
        return;
      }
      if (ev.key === 'Backspace' && s === e && s > 0 && PAIRS[v[s - 1]] && v[s] === PAIRS[v[s - 1]]) {
        ev.preventDefault();
        ta.setSelectionRange(s - 1, s + 1);
        insert('');
        return;
      }
      if (ev.key.length === 1 && !mod && !ev.altKey) {
        const k = ev.key;
        if (CLOSERS.has(k) && s === e && v[s] === k) { // перескочить через закрывающую
          ev.preventDefault();
          ta.setSelectionRange(s + 1, s + 1);
          return;
        }
        if (k === '}' && s === e && /^[\t ]+$/.test(v.slice(lineStart(s), s))) { // отступ у }
          ev.preventDefault();
          const ls = lineStart(s);
          const cur = v.slice(ls, s);
          ta.setSelectionRange(ls, s);
          insert(cur.replace(/(\t| {1,4})$/, '') + '}');
          return;
        }
        if (PAIRS[k]) {
          const next = v[e];
          const quote = k === '"' || k === '`';
          const prev = v[s - 1];
          if (s !== e && !quote) { // обернуть выделение
            ev.preventDefault();
            const sel = v.slice(s, e);
            insert(k + sel + PAIRS[k]);
            return;
          }
          if ((!next || /[\s)\]};,]/.test(next)) && !(quote && prev && /\w/.test(prev))) {
            ev.preventDefault();
            insert(k + PAIRS[k]);
            ta.setSelectionRange(s + 1, s + 1);
            return;
          }
        }
      }
    });
    ta.addEventListener('input', () => { schedule(); opts.onChange && opts.onChange(ta.value); });
    ta.addEventListener('scroll', sync);

    const api = {
      get value() { return ta.value; },
      set value(x) { ta.value = x; errors = {}; render(); },
      focus() { ta.focus(); },
      setErrors(map) { errors = map || {}; lineCount = -1; render(); },
      gotoLine(n, col = 1) {
        const ls = ta.value.split('\n');
        let pos = 0;
        for (let i = 0; i < Math.min(n - 1, ls.length); i++) pos += ls[i].length + 1;
        pos += Math.max(0, col - 1);
        ta.focus();
        ta.setSelectionRange(pos, pos);
        const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20;
        ta.scrollTop = Math.max(0, (n - 4) * lh);
        sync();
      },
    };
    ta.value = opts.value || '';
    render();
    return api;
  }

  window.Editor = { create };
})();
