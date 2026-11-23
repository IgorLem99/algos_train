// Мини-рендерер Markdown + подсветка Go. Без внешних зависимостей.
(function () {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
        const ext = /^https?:/.test(u);
        return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
      });
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + esc(codes[+i]) + '</code>');
    return s;
  }

  const GO_KW = new Set('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'.split(' '));
  const GO_TY = new Set('bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr any comparable'.split(' '));
  const GO_BI = new Set('append cap clear close complex copy delete imag len make max min new panic print println real recover true false nil iota'.split(' '));

  function highlightGo(code) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|`[^`]*`|'(?:\\.|[^'\\\n])+')|\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?|0x[0-9a-fA-F]+)\b|([A-Za-z_][A-Za-z0-9_]*)(\s*\()?/g;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      last = re.lastIndex;
      if (m[1]) out += `<span class="t-co">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="t-st">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="t-nu">${esc(m[3])}</span>`;
      else if (m[4]) {
        const w = m[4], paren = m[5] || '';
        if (GO_KW.has(w)) out += `<span class="t-kw">${w}</span>` + esc(paren);
        else if (GO_TY.has(w)) out += `<span class="t-ty">${w}</span>` + esc(paren);
        else if (GO_BI.has(w)) out += `<span class="t-ty">${w}</span>` + esc(paren);
        else if (paren) out += `<span class="t-fn">${w}</span>` + esc(paren);
        else if (/^[A-Z]/.test(w)) out += `<span class="t-ty">${w}</span>`;
        else out += w;
      }
    }
    return out + esc(code.slice(last));
  }

  function codeBlock(code, lang) {
    const body = (!lang || lang === 'go') ? highlightGo(code) : esc(code);
    return `<pre class="code"><button class="copy small" data-copy>Копировать</button><code>${body}</code></pre>`;
  }

  function table(lines) {
    const cells = l => l.trim().replace(/\\\|/g, '\u0001').replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/\u0001/g, '|'));
    const head = cells(lines[0]);
    let h = '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
    for (const l of lines.slice(2)) h += '<tr>' + cells(l).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
    return h + '</tbody></table>';
  }

  function render(src) {
    const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
    let html = '', i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();
      if (!t) { i++; continue; }
      if (t.startsWith('```')) {
        const lang = t.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
        i++;
        html += codeBlock(buf.join('\n'), lang);
        continue;
      }
      let m;
      if ((m = /^(#{1,4})\s+(.*)$/.exec(t))) {
        const lvl = m[1].length, text = m[2];
        const id = 'h-' + text.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '');
        html += `<h${lvl} id="${id}">${inline(text)}</h${lvl}>`;
        i++; continue;
      }
      if (t.startsWith('<')) { // сырой HTML-блок до пустой строки
        const buf = [];
        while (i < lines.length && lines[i].trim()) buf.push(lines[i++]);
        html += buf.join('\n');
        continue;
      }
      if (t.startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
        const buf = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) buf.push(lines[i++]);
        html += table(buf);
        continue;
      }
      if (t.startsWith('>')) {
        const buf = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) buf.push(lines[i++].trim().replace(/^>\s?/, ''));
        html += '<blockquote>' + render(buf.join('\n')) + '</blockquote>';
        continue;
      }
      if (/^([-*]|\d+\.)\s/.test(t)) {
        const ordered = /^\d+\./.test(t);
        const items = [];
        while (i < lines.length) {
          const l = lines[i], lt = l.trim();
          if (/^([-*]|\d+\.)\s/.test(lt) && !/^\s{2,}/.test(l)) items.push(lt.replace(/^([-*]|\d+\.)\s+/, ''));
          else if (lt && /^\s{2,}/.test(l) && items.length) items[items.length - 1] += ' ' + lt;
          else break;
          i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        html += `<${tag}>` + items.map(x => `<li>${inline(x)}</li>`).join('') + `</${tag}>`;
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|[-*]\s|\d+\.\s|<|\|)/.test(lines[i].trim())) buf.push(lines[i++].trim());
      if (!buf.length) { buf.push(lines[i++].trim()); }
      html += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return html;
  }

  window.MD = { render, inline, esc, highlightGo, codeBlock };
})();
