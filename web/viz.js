// Пошаговые интерактивные визуализации алгоритмов.
// В статье: <div data-viz="binary-search"></div>
(function () {
  const REG = {};
  const reg = (name, title, build) => { REG[name] = { title, build }; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const range = (lo, hi, c) => { const o = {}; for (let i = lo; i <= hi; i++) o[i] = c; return o; };
  const merge = (...os) => Object.assign({}, ...os);
  let uid = 0;

  // ---------- renderers ----------
  function arrHTML(arr, cls = {}, ptr = {}, ptrB = {}, showIdx = true) {
    return '<div class="v-arr">' + arr.map((v, i) => `<div class="v-cell">
      <div class="ptr">${ptr[i] ? esc(ptr[i]) : ''}</div>
      <div class="box ${cls[i] ? 'c-' + cls[i] : ''}">${v === null || v === undefined ? '' : esc(v)}</div>
      ${showIdx ? `<div class="idx">${i}</div>` : ''}
      ${ptrB && Object.keys(ptrB).length ? `<div class="ptr below">${ptrB[i] ? esc(ptrB[i]) : ''}</div>` : ''}
    </div>`).join('') + '</div>';
  }
  function gridHTML(f) {
    const R = f.grid.length, Cn = f.grid[0].length;
    const hasRh = !!f.rh, hasCh = !!f.ch;
    let h = `<div class="v-grid" style="grid-template-columns:repeat(${Cn + (hasRh ? 1 : 0)}, 38px)">`;
    if (hasCh) { if (hasRh) h += '<div></div>'; for (const c of f.ch) h += `<div class="box" style="border:0;background:none;color:var(--muted)">${esc(c)}</div>`; }
    for (let r = 0; r < R; r++) {
      if (hasRh) h += `<div class="box" style="border:0;background:none;color:var(--muted)">${esc(f.rh[r])}</div>`;
      for (let c = 0; c < Cn; c++) {
        const k = f.gcls && f.gcls[r + ',' + c];
        const v = f.grid[r][c];
        h += `<div class="box ${k ? 'c-' + k : ''}">${v === null || v === undefined ? '' : esc(v)}</div>`;
      }
    }
    return h + '</div>';
  }
  function graphSVG(f) {
    const W = f.w || 560, H = f.h || 260, r = f.r || 20, id = 'm' + (++uid);
    const pos = Object.fromEntries(f.nodes.map(n => [n.id, n]));
    const hidden = id2 => f.ncls && f.ncls[id2] === 'hide';
    let s = `<svg class="v-graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
    for (const e of f.edges) {
      if (hidden(e.a) || hidden(e.b)) continue;
      const A = pos[e.a], B = pos[e.b];
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const x1 = A.x + dx / L * r, y1 = A.y + dy / L * r, x2 = B.x - dx / L * (r + (e.dir ? 3 : 0)), y2 = B.y - dy / L * (r + (e.dir ? 3 : 0));
      const k = (f.ecls && (f.ecls[e.a + '-' + e.b] || (!e.dir && f.ecls[e.b + '-' + e.a]))) || '';
      s += `<line class="e ${k ? 'c-' + k : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${e.dir ? `marker-end="url(#${id})"` : ''}/>`;
      if (e.w !== undefined) {
        const mx = (A.x + B.x) / 2 - dy / L * 11, my = (A.y + B.y) / 2 + dx / L * 11;
        s += `<text class="ew" x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" ${e.w < 0 ? 'style="fill:var(--hard)"' : ''}>${esc(e.w)}</text>`;
      }
    }
    for (const n of f.nodes) {
      if (hidden(n.id)) continue;
      const k = f.ncls && f.ncls[n.id];
      s += `<g class="n ${k ? 'c-' + k : ''}"><circle cx="${n.x}" cy="${n.y}" r="${r}"/>`;
      if (f.ring && f.ring[n.id]) s += `<circle cx="${n.x}" cy="${n.y}" r="${r - 5}" style="fill:none"/>`;
      s += `<text x="${n.x}" y="${n.y}" ${String(n.label).length > 3 ? 'style="font-size:10px"' : ''}>${esc(n.label ?? n.id)}</text>`;
      if (f.nsub && f.nsub[n.id] !== undefined && f.nsub[n.id] !== '') s += `<text class="sub" x="${n.x}" y="${n.y + (f.subUp ? -r - 10 : r + 12)}">${esc(f.nsub[n.id])}</text>`;
      s += '</g>';
    }
    return s + '</svg>';
  }
  function intervalsSVG(f) {
    const W = 560, max = f.max, lane = 26, H = f.items.length * lane + 34, sx = x => 20 + x / max * (W - 40);
    let s = `<svg class="v-graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
    for (let x = 0; x <= max; x += 2) s += `<line x1="${sx(x)}" x2="${sx(x)}" y1="4" y2="${H - 22}" style="stroke:var(--line);stroke-width:1"/><text class="ew" x="${sx(x)}" y="${H - 8}" text-anchor="middle">${x}</text>`;
    const col = { active: 'var(--medium)', found: 'var(--accent)', win: 'var(--blue)', dim: 'var(--dim)', bad: 'var(--hard)' };
    f.items.forEach((it, i) => {
      const y = 8 + i * lane;
      s += `<rect x="${sx(it.s)}" y="${y}" width="${Math.max(4, sx(it.e) - sx(it.s))}" height="18" rx="5" style="fill:${col[it.cls] || 'var(--panel2)'};stroke:var(--line);opacity:${it.cls === 'dim' ? .35 : .9}"/>`;
      s += `<text x="${sx(it.s) + 6}" y="${y + 9}" dominant-baseline="central" style="font-size:11px;font-weight:700;fill:${it.cls && it.cls !== 'dim' ? '#0b1020' : 'var(--text)'}">${esc(it.label || `[${it.s},${it.e}]`)}</text>`;
    });
    return s + '</svg>';
  }
  function auxHTML(aux) {
    return '<div class="v-aux">' + aux.map(g => `<div class="grp"><div class="gl">${esc(g.label)}</div>
      <div class="items ${g.vertical ? 'vertical' : ''}">${(g.items || []).map((x, i) => `<span class="${g.hl && g.hl.includes(i) ? 'hl' : ''}">${esc(x)}</span>`).join('') || '<span style="opacity:.4">∅</span>'}</div></div>`).join('') + '</div>';
  }
  function renderFrame(f) {
    let h = '';
    if (f.type === 'array') h += arrHTML(f.arr, f.cls, f.ptr, f.ptrB, f.idx !== false);
    if (f.type === 'grid') h += gridHTML(f);
    if (f.type === 'graph') h += graphSVG(f);
    if (f.type === 'intervals') h += intervalsSVG(f);
    if (f.rows) h += '<div style="margin-top:12px">' + f.rows.map(r => `<div class="v-row"><span class="rl">${esc(r.label)}</span>${arrHTML(r.arr, r.cls, r.ptr || {}, {}, !!r.idx)}</div>`).join('') + '</div>';
    if (f.aux) h += auxHTML(f.aux);
    return h;
  }

  // ---------- player ----------
  function mount(el, name) {
    const v = REG[name];
    if (!v) { el.innerHTML = `<div class="viz"><div class="viz-note">Нет визуализации «${esc(name)}»</div></div>`; return; }
    const frames = v.build();
    let i = 0, timer = null, speed = 1;
    el.innerHTML = `<div class="viz"><div class="viz-head"><span class="ttl">${esc(v.title)}</span>
      <button class="small" data-c="reset" title="В начало">⟲</button><button class="small" data-c="prev" title="Шаг назад">◀</button>
      <button class="small primary" data-c="play">▶ Пуск</button><button class="small" data-c="next" title="Шаг вперёд">▶|</button>
      <select data-c="speed" style="width:auto;padding:3px 6px"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
      <span class="small muted" data-c="cnt"></span></div>
      <div class="viz-progress"><span></span></div><div class="viz-stage"></div><div class="viz-note"></div></div>`;
    const q = s => el.querySelector(s);
    const draw = () => {
      const f = frames[i];
      q('.viz-stage').innerHTML = renderFrame(f);
      q('.viz-note').innerHTML = f.note || '';
      q('[data-c=cnt]').textContent = `шаг ${i + 1}/${frames.length}`;
      q('.viz-progress span').style.width = ((i + 1) / frames.length * 100) + '%';
    };
    const stop = () => { clearInterval(timer); timer = null; q('[data-c=play]').textContent = '▶ Пуск'; };
    const play = () => {
      if (i >= frames.length - 1) i = 0;
      q('[data-c=play]').textContent = '⏸ Пауза';
      draw();
      timer = setInterval(() => {
        if (!document.body.contains(el)) return stop();
        if (i >= frames.length - 1) return stop();
        i++; draw();
      }, 1100 / speed);
    };
    el.addEventListener('click', e => {
      const c = e.target.closest('[data-c]'); if (!c) return;
      const k = c.dataset.c;
      if (k === 'play') timer ? stop() : play();
      if (k === 'next') { stop(); if (i < frames.length - 1) i++; draw(); }
      if (k === 'prev') { stop(); if (i > 0) i--; draw(); }
      if (k === 'reset') { stop(); i = 0; draw(); }
    });
    q('[data-c=speed]').onchange = e => { speed = +e.target.value; if (timer) { stop(); play(); } };
    draw();
  }

  // ---------- helpers for trees ----------
  // level-order массив -> узлы/рёбра с координатами
  function treeFromLevel(vals, W = 560, top = 30, dy = 62) {
    const nodes = [], edges = [];
    vals.forEach((v, i) => {
      if (v === null) return;
      const d = Math.floor(Math.log2(i + 1)), pos = i + 1 - 2 ** d;
      nodes.push({ id: i, label: v, x: (pos + 0.5) * W / 2 ** d, y: top + d * dy });
      if (i > 0) edges.push({ a: Math.floor((i - 1) / 2), b: i });
    });
    return { nodes, edges };
  }
  const G = (base, extra) => Object.assign({ type: 'graph' }, base, extra);

  // =====================================================================
  // Массивы
  // =====================================================================
  reg('binary-search', 'Бинарный поиск: ищем 23', () => {
    const a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], t = 23, F = [];
    let l = 0, r = a.length - 1;
    F.push({ type: 'array', arr: a, cls: range(l, r, 'win'), ptr: { [l]: 'L', [r]: 'R' }, note: `Массив отсортирован. Ищем <b>${t}</b>. Границы поиска: L=${l}, R=${r} — весь массив.` });
    while (l <= r) {
      const m = (l + r) >> 1;
      const dim = merge(range(0, l - 1, 'dim'), range(r + 1, a.length - 1, 'dim'));
      F.push({ type: 'array', arr: a, cls: merge(range(l, r, 'win'), dim, { [m]: 'active' }), ptr: merge({ [l]: 'L', [r]: 'R' }, { [m]: (m === l ? 'L ' : m === r ? 'R ' : '') + 'M' }), note: `mid = L + (R−L)/2 = <b>${m}</b>, a[mid] = <b>${a[m]}</b>. Сравниваем с ${t}.` });
      if (a[m] === t) {
        F.push({ type: 'array', arr: a, cls: merge(range(0, a.length - 1, 'dim'), { [m]: 'found' }), ptr: { [m]: 'M' }, note: `a[${m}] = ${t} — <b>найдено</b> за ${F.length - 1} сравнения вместо ${m + 1} при линейном поиске. В общем случае — ⌈log₂ n⌉ шагов.` });
        break;
      }
      if (a[m] < t) { F.push({ type: 'array', arr: a, cls: merge(dim, range(l, m, 'dim'), range(m + 1, r, 'win')), ptr: { [m + 1]: 'L', [r]: 'R' }, note: `${a[m]} < ${t} → искомое правее. Отбрасываем левую половину: <b>L = mid + 1 = ${m + 1}</b>.` }); l = m + 1; }
      else { F.push({ type: 'array', arr: a, cls: merge(dim, range(m, r, 'dim'), range(l, m - 1, 'win')), ptr: { [l]: 'L', [m - 1]: 'R' }, note: `${a[m]} > ${t} → искомое левее. <b>R = mid − 1 = ${m - 1}</b>.` }); r = m - 1; }
    }
    return F;
  });

  reg('two-pointers', 'Два указателя: пара с суммой 14', () => {
    const a = [1, 3, 4, 6, 8, 11, 15], t = 14, F = [];
    let l = 0, r = a.length - 1;
    F.push({ type: 'array', arr: a, cls: {}, ptr: { [l]: 'L', [r]: 'R' }, note: `Массив отсортирован, ищем две позиции с суммой <b>${t}</b>. L — в начале, R — в конце.` });
    while (l < r) {
      const s = a[l] + a[r];
      const dim = merge(range(0, l - 1, 'dim'), range(r + 1, a.length - 1, 'dim'));
      if (s === t) { F.push({ type: 'array', arr: a, cls: merge(dim, { [l]: 'found', [r]: 'found' }), ptr: { [l]: 'L', [r]: 'R' }, note: `${a[l]} + ${a[r]} = ${s} — <b>нашли</b>. O(n) времени и O(1) памяти: каждый шаг навсегда исключает один элемент.` }); break; }
      if (s < t) { F.push({ type: 'array', arr: a, cls: merge(dim, { [l]: 'active', [r]: 'active' }), ptr: { [l]: 'L', [r]: 'R' }, note: `${a[l]} + ${a[r]} = ${s} < ${t}. Сумму надо увеличить, а a[L] с любым другим элементом даст ещё меньше → <b>L++</b>.` }); l++; }
      else { F.push({ type: 'array', arr: a, cls: merge(dim, { [l]: 'active', [r]: 'active' }), ptr: { [l]: 'L', [r]: 'R' }, note: `${a[l]} + ${a[r]} = ${s} > ${t}. Сумму надо уменьшить: a[R] слишком велик для любой пары → <b>R−−</b>.` }); r--; }
    }
    return F;
  });

  reg('sliding-window', 'Скользящее окно: самая длинная подстрока без повторов', () => {
    const s = 'abcabcbb'.split(''), F = [];
    const last = {};
    let l = 0, best = 0, bestL = 0;
    F.push({ type: 'array', arr: s, cls: {}, ptr: {}, note: 'Строка «abcabcbb». Окно [L..R] всегда содержит уникальные символы. R расширяет окно, L сжимает его при повторе.', aux: [{ label: 'символы в окне', items: [] }, { label: 'лучшая длина', items: ['0'] }] });
    for (let r = 0; r < s.length; r++) {
      const c = s[r];
      let note = `R=${r}, добавляем «${c}».`;
      if (last[c] !== undefined && last[c] >= l) {
        note += ` «${c}» уже в окне (индекс ${last[c]}) → сдвигаем <b>L = ${last[c] + 1}</b>.`;
        l = last[c] + 1;
      }
      last[c] = r;
      if (r - l + 1 > best) { best = r - l + 1; bestL = l; note += ` Новый рекорд: <b>${best}</b>.`; }
      F.push({ type: 'array', arr: s, cls: merge(range(0, l - 1, 'dim'), range(l, r, 'win'), { [r]: 'active' }), ptr: l === r ? { [l]: 'L R' } : { [l]: 'L', [r]: 'R' }, note, aux: [{ label: 'символы в окне', items: s.slice(l, r + 1) }, { label: 'лучшая длина', items: [String(best)] }] });
    }
    F.push({ type: 'array', arr: s, cls: range(bestL, bestL + best - 1, 'found'), ptr: {}, note: `Ответ: <b>${best}</b> («${s.slice(bestL, bestL + best).join('')}»). Каждый символ входит и выходит из окна не более одного раза → O(n).` });
    return F;
  });

  reg('hash-buckets', 'Хеш-таблица: вставка ключей (цепочки)', () => {
    const keys = [17, 42, 5, 28, 33, 12, 47], M = 5, F = [];
    const b = Array.from({ length: M }, () => []);
    const aux = (hl) => b.map((x, i) => ({ label: 'bucket ' + i, items: x.map(String), vertical: true, hl: hl === i ? [x.length - 1] : [] }));
    F.push({ type: 'array', arr: keys, cls: {}, ptr: {}, note: `Вставляем ключи в таблицу из ${M} корзин. Номер корзины = hash(key) mod ${M}. Здесь hash(x) = x.`, aux: aux(-1) });
    keys.forEach((k, i) => {
      const h = k % M; b[h].push(k);
      F.push({ type: 'array', arr: keys, cls: merge(range(0, i - 1, 'dim'), { [i]: 'active' }), ptr: { [i]: 'key' }, note: `${k} mod ${M} = <b>${h}</b> → кладём в корзину ${h}${b[h].length > 1 ? ` — <b>коллизия</b>, добавляем в цепочку (длина ${b[h].length})` : ''}.`, aux: aux(h) });
    });
    F.push({ type: 'array', arr: keys, cls: range(0, keys.length - 1, 'dim'), ptr: {}, note: `Поиск ключа = вычислить хеш и просмотреть одну короткую цепочку → в среднем O(1). При росте заполнения (load factor) таблицу увеличивают и перехешируют — так делает и Go map (рост при среднем 6.5 элементах на bucket).`, aux: aux(-1) });
    return F;
  });

  reg('two-sum-map', 'Two Sum через map: один проход', () => {
    const a = [3, 8, 5, 2, 7], t = 9, F = [], seen = [];
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, note: `Ищем два числа с суммой ${t}. Для каждого x ищем в map «дополнение» ${t} − x среди уже просмотренных.`, aux: [{ label: 'map: значение → индекс', items: [] }] });
    for (let i = 0; i < a.length; i++) {
      const need = t - a[i];
      const j = seen.findIndex(s => s[0] === need);
      if (j >= 0) {
        F.push({ type: 'array', arr: a, cls: { [i]: 'found', [seen[j][1]]: 'found' }, ptr: { [i]: 'i', [seen[j][1]]: 'j' }, note: `x=${a[i]}, нужно ${need} — <b>есть в map</b> (индекс ${seen[j][1]}). Ответ [${seen[j][1]}, ${i}]. Один проход, O(n).`, aux: [{ label: 'map: значение → индекс', items: seen.map(s => s[0] + '→' + s[1]), hl: [j] }] });
        break;
      }
      seen.push([a[i], i]);
      F.push({ type: 'array', arr: a, cls: merge(range(0, i - 1, 'vis'), { [i]: 'active' }), ptr: { [i]: 'i' }, note: `x=${a[i]}, нужно ${need} — в map нет. Запоминаем ${a[i]}→${i}.`, aux: [{ label: 'map: значение → индекс', items: seen.map(s => s[0] + '→' + s[1]), hl: [seen.length - 1] }] });
    }
    return F;
  });

  reg('prefix-sum', 'Префиксные суммы: сумма на отрезке за O(1)', () => {
    const a = [3, 1, 4, 1, 5, 9, 2], F = [], p = [0];
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, rows: [{ label: 'prefix', arr: [0], cls: {}, idx: true }], note: 'prefix[i] = сумма первых i элементов. prefix[0] = 0.' });
    for (let i = 0; i < a.length; i++) {
      p.push(p[i] + a[i]);
      F.push({ type: 'array', arr: a, cls: { [i]: 'active' }, ptr: {}, rows: [{ label: 'prefix', arr: [...p], cls: { [i]: 'vis', [i + 1]: 'active' }, idx: true }], note: `prefix[${i + 1}] = prefix[${i}] + a[${i}] = ${p[i]} + ${a[i]} = <b>${p[i + 1]}</b>` });
    }
    const L = 2, R = 5;
    F.push({ type: 'array', arr: a, cls: range(L, R, 'found'), ptr: { [L]: 'L', [R]: 'R' }, rows: [{ label: 'prefix', arr: p, cls: { [R + 1]: 'found', [L]: 'bad' }, idx: true }], note: `Запрос: сумма a[${L}..${R}] = prefix[${R + 1}] − prefix[${L}] = ${p[R + 1]} − ${p[L]} = <b>${p[R + 1] - p[L]}</b>. Любой запрос — O(1) после O(n) подготовки.` });
    return F;
  });

  reg('kadane', 'Алгоритм Кадане: максимальная сумма подмассива', () => {
    const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4], F = [];
    let cur = 0, best = -Infinity, s = 0, bs = 0, be = 0;
    const curRow = [], bestRow = [];
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, note: 'Идём слева направо. cur — лучшая сумма подмассива, <b>заканчивающегося</b> здесь. Если cur стал отрицательным — выгоднее начать заново.' });
    for (let i = 0; i < a.length; i++) {
      let note;
      if (cur + a[i] < a[i]) { cur = a[i]; s = i; note = `Хвост был отрицательным → начинаем новый подмассив с a[${i}]=${a[i]}.`; }
      else { cur += a[i]; note = `Продолжаем: cur = ${cur - a[i]} + ${a[i]} = ${cur}.`; }
      if (cur > best) { best = cur; bs = s; be = i; note += ` <b>Новый максимум ${best}</b>.`; }
      curRow.push(cur); bestRow.push(best);
      F.push({ type: 'array', arr: a, cls: merge(range(s, i, 'win'), { [i]: 'active' }), ptr: { [s]: 'start' }, rows: [{ label: 'cur', arr: [...curRow, ...Array(a.length - i - 1).fill('')], cls: { [i]: 'active' } }, { label: 'best', arr: [...bestRow, ...Array(a.length - i - 1).fill('')], cls: {} }], note });
    }
    F.push({ type: 'array', arr: a, cls: range(bs, be, 'found'), ptr: {}, note: `Ответ: <b>${best}</b> — подмассив [${a.slice(bs, be + 1).join(', ')}]. Один проход, O(n), O(1) памяти.` });
    return F;
  });

  reg('jump-game', 'Жадность: Jump Game — максимальная достижимая позиция', () => {
    const a = [2, 3, 1, 1, 4], F = [];
    let far = 0;
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, note: 'a[i] — длина прыжка из i. Жадно поддерживаем <b>far</b> — самую дальнюю достижимую клетку.' });
    for (let i = 0; i < a.length; i++) {
      if (i > far) { F.push({ type: 'array', arr: a, cls: { [i]: 'bad' }, ptr: { [i]: 'i' }, note: 'i > far — сюда не допрыгнуть.' }); break; }
      const old = far; far = Math.max(far, i + a[i]);
      F.push({ type: 'array', arr: a, cls: merge(range(0, Math.min(far, a.length - 1), 'win'), { [i]: 'active' }), ptr: { [i]: 'i', [Math.min(far, a.length - 1)]: (i === Math.min(far, a.length - 1) ? 'i ' : '') + 'far' }, note: `Из ${i} можно прыгнуть до ${i + a[i]}. far = max(${old}, ${i + a[i]}) = <b>${far}</b>.${far >= a.length - 1 ? ' Конец достижим — <b>true</b>!' : ''}` });
      if (far >= a.length - 1) break;
    }
    return F;
  });

  reg('quickselect', 'Quickselect: 2-й по величине элемент', () => {
    const a = [3, 2, 1, 5, 6, 4], F = [], k = 2, target = a.length - k;
    F.push({ type: 'array', arr: [...a], cls: {}, ptr: {}, note: `k-й наибольший = элемент, который стоял бы на позиции n−k = ${target} в отсортированном массиве. Разбиваем (partition) как в quicksort, но рекурсируем только в одну сторону.` });
    let lo = 0, hi = a.length - 1;
    while (lo <= hi) {
      const pv = a[hi]; let i = lo;
      F.push({ type: 'array', arr: [...a], cls: merge(range(lo, hi, 'win'), { [hi]: 'active' }), ptr: { [hi]: 'pivot', [lo]: 'i' }, note: `Отрезок [${lo}..${hi}]. Опорный элемент pivot = ${pv}. Всё меньшее pivot переносим влево.` });
      for (let j = lo; j < hi; j++) {
        if (a[j] < pv) { [a[i], a[j]] = [a[j], a[i]]; i++; }
        F.push({ type: 'array', arr: [...a], cls: merge(range(lo, hi, 'win'), range(lo, i - 1, 'vis'), { [hi]: 'active' }), ptr: merge({ [hi]: 'pivot' }, { [j]: 'j' }, { [i]: (i === j ? 'j i' : 'i') }), note: `a[j]=${a[j]} ${a[j] < pv || i > lo && a[i - 1] === a[j] ? '' : ''}${'< ' + pv + ' ?'} → зона «меньше pivot» = [${lo}..${i - 1}].` });
      }
      [a[i], a[hi]] = [a[hi], a[i]];
      F.push({ type: 'array', arr: [...a], cls: merge(range(lo, hi, 'win'), { [i]: 'found' }), ptr: { [i]: 'p' }, note: `pivot ${pv} встал на своё итоговое место <b>${i}</b>. ${i === target ? 'Это и есть позиция n−k — <b>ответ ' + a[i] + '</b>.' : i < target ? `${i} < ${target} → ищем справа.` : `${i} > ${target} → ищем слева.`}` });
      if (i === target) break;
      if (i < target) lo = i + 1; else hi = i - 1;
    }
    return F;
  });

  // =====================================================================
  // Стек
  // =====================================================================
  reg('stack-parens', 'Стек: проверка скобок «{[()()]}»', () => {
    const s = '{[()()]}'.split(''), F = [], st = [];
    const pair = { ')': '(', ']': '[', '}': '{' };
    F.push({ type: 'array', arr: s, cls: {}, ptr: {}, note: 'Открывающие скобки кладём в стек (LIFO). Закрывающая должна совпасть с вершиной стека.', aux: [{ label: 'стек', items: [], vertical: true }] });
    s.forEach((c, i) => {
      let note;
      if (pair[c]) { const top = st.pop(); note = `«${c}» закрывает «${top}» с вершины — пара совпала, <b>pop</b>.`; }
      else { st.push(c); note = `«${c}» — открывающая, <b>push</b>.`; }
      F.push({ type: 'array', arr: s, cls: merge(range(0, i - 1, 'dim'), { [i]: 'active' }), ptr: { [i]: 'i' }, note, aux: [{ label: 'стек', items: [...st], vertical: true, hl: [st.length - 1] }] });
    });
    F.push({ type: 'array', arr: s, cls: range(0, s.length - 1, 'found'), ptr: {}, note: 'Строка закончилась, стек пуст → скобки <b>сбалансированы</b>. Так же работают парсеры JSON/HTML и call stack.', aux: [{ label: 'стек', items: [], vertical: true }] });
    return F;
  });

  reg('monotonic-stack', 'Монотонный стек: Daily Temperatures', () => {
    const a = [73, 74, 75, 71, 69, 72, 76, 73], F = [], st = [], res = Array(a.length).fill(0);
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, rows: [{ label: 'ответ', arr: [...res] }], note: 'Для каждого дня — через сколько дней будет теплее. В стеке храним индексы дней, ждущих ответа; температуры в стеке <b>убывают</b>.', aux: [{ label: 'стек (индексы)', items: [] }] });
    for (let i = 0; i < a.length; i++) {
      while (st.length && a[st[st.length - 1]] < a[i]) {
        const j = st.pop(); res[j] = i - j;
        F.push({ type: 'array', arr: a, cls: { [i]: 'active', [j]: 'found' }, ptr: { [i]: 'i', [j]: 'pop' }, rows: [{ label: 'ответ', arr: [...res], cls: { [j]: 'found' } }], note: `${a[i]} > ${a[j]} (день ${j}) → для дня ${j} ответ ${i} − ${j} = <b>${i - j}</b>. pop.`, aux: [{ label: 'стек (индексы)', items: st.map(x => x + ':' + a[x]) }] });
      }
      st.push(i);
      F.push({ type: 'array', arr: a, cls: { [i]: 'active' }, ptr: { [i]: 'i' }, rows: [{ label: 'ответ', arr: [...res] }], note: `push ${i} (${a[i]}). Стек остаётся убывающим.`, aux: [{ label: 'стек (индексы)', items: st.map(x => x + ':' + a[x]), hl: [st.length - 1] }] });
    }
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, rows: [{ label: 'ответ', arr: res, cls: range(0, a.length - 1, 'found') }], note: 'Каждый индекс один раз кладётся и один раз снимается → O(n) вместо O(n²). Оставшиеся в стеке дни тёплого дня не дождались (0).', aux: [{ label: 'стек (индексы)', items: st.map(x => x + ':' + a[x]) }] });
    return F;
  });

  // =====================================================================
  // Связные списки
  // =====================================================================
  reg('linked-list-reverse', 'Разворот связного списка', () => {
    const n = 5, F = [];
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i, label: i + 1, x: 60 + i * 110, y: 80 }));
    const next = [1, 2, 3, 4, null];
    const edges = () => next.map((t, i) => t === null ? null : { a: i, b: t, dir: true }).filter(Boolean);
    const sub = (prev, cur) => { const o = {}; if (prev !== null) o[prev] = 'prev'; if (cur !== null) o[cur] = (o[cur] ? o[cur] + '/' : '') + 'cur'; return o; };
    let prev = null, cur = 0;
    F.push(G({ nodes, edges: edges(), nsub: sub(prev, cur), h: 150 }, { note: 'prev = nil, cur = head. На каждом шаге разворачиваем одну стрелку: cur.Next = prev.' }));
    while (cur !== null) {
      const nx = next[cur];
      next[cur] = prev;
      F.push(G({ nodes, edges: edges(), nsub: sub(prev, cur), ncls: { [cur]: 'active' }, ecls: prev !== null ? { [cur + '-' + prev]: 'active' } : {}, h: 150 }, { note: `next := cur.Next (${nx === null ? 'nil' : nx + 1}); <b>cur.Next = prev</b> (${prev === null ? 'nil' : prev + 1}).` }));
      prev = cur; cur = nx;
      F.push(G({ nodes, edges: edges(), nsub: sub(prev, cur), ncls: { [prev]: 'vis' }, h: 150 }, { note: `Сдвигаемся: prev = ${prev + 1}, cur = ${cur === null ? 'nil' : cur + 1}.` }));
    }
    F.push(G({ nodes, edges: edges(), nsub: { 4: 'new head' }, ncls: { 4: 'found' }, h: 150 }, { note: 'cur == nil → новая голова = prev. O(n) времени, O(1) памяти.' }));
    return F;
  });

  reg('floyd-cycle', 'Черепаха и заяц: поиск цикла (Флойд)', () => {
    const F = [];
    const nodes = [{ id: 0, label: 1, x: 50, y: 130 }, { id: 1, label: 2, x: 140, y: 130 }, { id: 2, label: 3, x: 240, y: 130 },
      { id: 3, label: 4, x: 320, y: 50 }, { id: 4, label: 5, x: 440, y: 60 }, { id: 5, label: 6, x: 470, y: 180 }, { id: 6, label: 7, x: 340, y: 215 }];
    const next = [1, 2, 3, 4, 5, 6, 2];
    const edges = next.map((t, i) => ({ a: i, b: t, dir: true }));
    const show = (s, f, note, extra = {}) => { const sub = {}; sub[s] = 'S'; sub[f] = (sub[f] ? 'S F' : 'F'); F.push(G({ nodes, edges, nsub: sub, ncls: merge({ [s]: 'win', [f]: 'active' }, extra), h: 250 }, { note })); };
    let s = 0, f = 0;
    show(s, f, 'Медленный указатель S идёт на 1 шаг, быстрый F — на 2. Если есть цикл, F догонит S внутри цикла.');
    do { s = next[s]; f = next[next[f]]; show(s, f, s === f ? `<b>Встретились</b> в узле ${s + 1} → цикл есть.` : `S → ${s + 1}, F → ${f + 1}.`, s === f ? { [s]: 'found' } : {}); } while (s !== f);
    s = 0;
    show(s, f, 'Фаза 2: ставим S в голову, F оставляем в точке встречи. Теперь оба идут по 1 шагу.');
    while (s !== f) { s = next[s]; f = next[f]; show(s, f, s === f ? `Встретились в узле <b>${s + 1}</b> — это <b>вход в цикл</b>. O(n) времени, O(1) памяти.` : `S → ${s + 1}, F → ${f + 1}.`, s === f ? { [s]: 'found' } : {}); }
    return F;
  });

  // =====================================================================
  // Деревья
  // =====================================================================
  const TREE = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7];
  reg('tree-dfs', 'DFS по дереву: in-order обход BST', () => {
    const { nodes, edges } = treeFromLevel(TREE), F = [], order = [], vis = {};
    F.push(G({ nodes, edges, h: 250 }, { note: 'In-order: левое поддерево → узел → правое. Для BST даёт элементы по возрастанию. Рекурсия = неявный стек.', aux: [{ label: 'порядок посещения', items: [] }] }));
    const go = (i, path) => {
      if (i >= TREE.length || TREE[i] === null) return;
      F.push(G({ nodes, edges, h: 250, ncls: merge(vis, Object.fromEntries(path.map(p => [p, 'win'])), { [i]: 'active' }) }, { note: `Заходим в ${TREE[i]}: сначала идём влево.`, aux: [{ label: 'порядок посещения', items: [...order] }, { label: 'стек вызовов', items: [...path, i].map(x => TREE[x]) }] }));
      go(2 * i + 1, [...path, i]);
      order.push(TREE[i]); vis[i] = 'found';
      F.push(G({ nodes, edges, h: 250, ncls: merge(vis, Object.fromEntries(path.map(p => [p, 'win'])), { [i]: 'found' }) }, { note: `Левое поддерево ${TREE[i]} обработано → <b>посещаем ${TREE[i]}</b>.`, aux: [{ label: 'порядок посещения', items: [...order], hl: [order.length - 1] }, { label: 'стек вызовов', items: [...path, i].map(x => TREE[x]) }] }));
      go(2 * i + 2, [...path, i]);
    };
    go(0, []);
    F.push(G({ nodes, edges, h: 250, ncls: vis }, { note: 'Готово: получили отсортированную последовательность. Каждый узел посещён один раз → O(n), память O(h).', aux: [{ label: 'порядок посещения', items: order }] }));
    return F;
  });

  reg('tree-bfs', 'BFS по дереву: обход по уровням', () => {
    const { nodes, edges } = treeFromLevel(TREE), F = [], vis = {}, levels = [];
    let q = [0];
    F.push(G({ nodes, edges, h: 250, ncls: { 0: 'win' } }, { note: 'Очередь (FIFO) начинается с корня. Обрабатываем уровень целиком: берём len(queue) элементов.', aux: [{ label: 'очередь', items: [8] }] }));
    while (q.length) {
      const nq = [], lvl = [];
      for (const i of q) {
        lvl.push(TREE[i]); vis[i] = 'found';
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < TREE.length && TREE[c] !== null) nq.push(c);
      }
      levels.push(lvl);
      F.push(G({ nodes, edges, h: 250, ncls: merge(vis, Object.fromEntries(q.map(x => [x, 'active'])), Object.fromEntries(nq.map(x => [x, 'win']))) }, { note: `Уровень ${levels.length - 1}: [${lvl.join(', ')}]. Их дети добавлены в очередь.`, aux: [{ label: 'очередь', items: nq.map(x => TREE[x]) }, { label: 'уровни', items: levels.map(l => '[' + l.join(',') + ']') }] }));
      q = nq;
    }
    F.push(G({ nodes, edges, h: 250, ncls: vis }, { note: 'Очередь пуста. BFS находит кратчайший путь (в рёбрах) до каждого узла — это его главная суперсила.', aux: [{ label: 'уровни', items: levels.map(l => '[' + l.join(',') + ']') }] }));
    return F;
  });

  reg('bst-search', 'BST: поиск 5 и вставка 9', () => {
    const vals = [...TREE, null, null, null, null];
    let { nodes, edges } = treeFromLevel(vals), F = [];
    const walk = (t, ins) => {
      let i = 0; const path = [];
      while (i < vals.length && vals[i] !== null) {
        path.push(i);
        const cmp = t < vals[i] ? 'меньше → влево' : t > vals[i] ? 'больше → вправо' : 'равно';
        F.push(G({ nodes, edges, h: 250, ncls: merge(Object.fromEntries(path.map(p => [p, 'win'])), { [i]: t === vals[i] ? 'found' : 'active' }) }, { note: `${ins ? 'Вставка' : 'Поиск'} ${t}: сравниваем с ${vals[i]} — ${cmp}.${t === vals[i] ? ' <b>Найдено</b> за ' + path.length + ' сравнения.' : ''}` }));
        if (t === vals[i]) return;
        i = t < vals[i] ? 2 * i + 1 : 2 * i + 2;
      }
      if (ins) {
        while (vals.length <= i) vals.push(null);
        vals[i] = t;
        ({ nodes, edges } = treeFromLevel(vals));
        F.push(G({ nodes, edges, h: 250, ncls: { [i]: 'found' } }, { note: `Пустое место → вставляем <b>${t}</b>. Поиск и вставка — O(h): O(log n) для сбалансированного дерева, O(n) для «палки».` }));
      }
    };
    F.push(G({ nodes, edges, h: 250 }, { note: 'Свойство BST: всё в левом поддереве меньше узла, всё в правом — больше.' }));
    walk(5, false);
    walk(9, true);
    return F;
  });

  reg('heap', 'Min-heap: вставка с просеиванием вверх', () => {
    const F = [], h = [];
    const pos = i => { const d = Math.floor(Math.log2(i + 1)), p = i + 1 - 2 ** d; return { x: (p + 0.5) * 560 / 2 ** d, y: 30 + d * 62 }; };
    const frame = (cls, note) => {
      const nodes = h.map((v, i) => ({ id: i, label: v, ...pos(i) }));
      const edges = h.map((_, i) => i ? { a: (i - 1) >> 1, b: i } : null).filter(Boolean);
      F.push(G({ nodes, edges, h: 230, ncls: cls }, { note, rows: [{ label: 'массив', arr: [...h], cls, idx: true }] }));
    };
    F.push(G({ nodes: [], edges: [], h: 60 }, { note: 'Куча хранится в обычном массиве: дети i — это 2i+1 и 2i+2, родитель — (i−1)/2. Свойство: родитель ≤ детей.' }));
    for (const v of [5, 3, 8, 1, 9, 2]) {
      h.push(v); let i = h.length - 1;
      frame({ [i]: 'active' }, `Push ${v}: кладём в конец массива (позиция ${i}).`);
      while (i > 0 && h[(i - 1) >> 1] > h[i]) {
        const p = (i - 1) >> 1;
        [h[p], h[i]] = [h[i], h[p]];
        frame({ [p]: 'active', [i]: 'win' }, `${h[p]} < ${h[i]} (родитель) → меняем местами. Просеивание вверх, не больше log n шагов.`);
        i = p;
      }
      frame({ [i]: 'found' }, `${v} на месте. Минимум всегда в корне: <b>${h[0]}</b>.`);
    }
    // pop
    const top = h[0]; h[0] = h.pop(); let i = 0;
    frame({ 0: 'active' }, `Pop: забираем минимум ${top}, на его место ставим последний элемент ${h[0]}.`);
    for (; ;) {
      let m = i; const l = 2 * i + 1, r = 2 * i + 2;
      if (l < h.length && h[l] < h[m]) m = l;
      if (r < h.length && h[r] < h[m]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]];
      frame({ [i]: 'win', [m]: 'active' }, `Просеивание вниз: меняем с меньшим ребёнком.`);
      i = m;
    }
    frame({ 0: 'found' }, `Куча восстановлена, новый минимум <b>${h[0]}</b>. Push/Pop — O(log n), Peek — O(1).`);
    return F;
  });

  reg('trie', 'Префиксное дерево: вставка car, cat, cart, dog, do', () => {
    const words = ['car', 'cat', 'cart', 'dog', 'do'], F = [];
    // строим полное дерево, чтобы заранее знать раскладку
    const root = { id: 'r', ch: {}, label: '·' }; let cnt = 0;
    for (const w of words) { let n = root; for (const c of w) { n = n.ch[c] || (n.ch[c] = { id: 'n' + (++cnt), ch: {}, label: c }); } }
    const nodes = [], edges = []; let leaf = 0;
    const lay = (n, d) => {
      const kids = Object.values(n.ch);
      if (!kids.length) { n.x = 60 + leaf++ * 110; } else { kids.forEach(k => { lay(k, d + 1); edges.push({ a: n.id, b: k.id, dir: true }); }); n.x = (kids[0].x + kids[kids.length - 1].x) / 2; }
      n.y = 25 + d * 55; nodes.push({ id: n.id, label: n.label, x: n.x, y: n.y });
    };
    lay(root, 0);
    const created = { r: true }, ends = {};
    const cls = (extra) => { const o = {}; for (const nd of nodes) o[nd.id] = created[nd.id] ? '' : 'hide'; return merge(o, extra); };
    F.push(G({ nodes, edges, w: 560, h: 290, ncls: cls({}) }, { note: 'Каждый узел — один символ, путь от корня — префикс. Слова с общим префиксом делят узлы.' }));
    for (const w of words) {
      let n = root; const path = [];
      for (const c of w) {
        const isNew = !created[n.ch[c].id];
        n = n.ch[c]; created[n.id] = true; path.push(n.id);
        F.push(G({ nodes, edges, w: 560, h: 290, ring: { ...ends }, ncls: cls(merge(Object.fromEntries(path.map(p => [p, 'win'])), { [n.id]: isNew ? 'active' : 'vis' })) }, { note: `«${w}»: символ «${c}» — ${isNew ? '<b>создаём узел</b>' : 'узел уже есть (общий префикс), идём по нему'}.` }));
      }
      ends[n.id] = true;
      F.push(G({ nodes, edges, w: 560, h: 290, ring: { ...ends }, ncls: cls({ [n.id]: 'found' }) }, { note: `Помечаем конец слова «${w}» (двойной круг). Вставка/поиск — O(длина слова), независимо от числа слов.` }));
    }
    return F;
  });

  // =====================================================================
  // Перебор с возвратом
  // =====================================================================
  reg('backtracking', 'Backtracking: дерево решений для подмножеств [1,2,3]', () => {
    const labels = [];
    const build = (i, d, cur) => { labels[i] = cur.length ? cur.join('') : '∅'; if (d === 3) return; build(2 * i + 1, d + 1, [...cur, d + 1]); build(2 * i + 2, d + 1, cur); };
    build(0, 0, []);
    const { nodes, edges } = treeFromLevel(labels, 560, 25, 62);
    const F = [], res = [], vis = {};
    F.push(G({ nodes, edges, h: 230 }, { note: 'На каждом уровне решаем про один элемент: <b>взять</b> (влево) или <b>не брать</b> (вправо). Листья — все 2³ = 8 подмножеств.', aux: [{ label: 'результат', items: [] }] }));
    const go = (i, d, path) => {
      const ecl = {}; for (let k = 1; k < path.length; k++) ecl[path[k - 1] + '-' + path[k]] = 'active';
      if (d === 3) {
        res.push(labels[i]); vis[i] = 'found';
        F.push(G({ nodes, edges, h: 230, ecls: ecl, ncls: merge(vis, Object.fromEntries(path.map(p => [p, 'win'])), { [i]: 'found' }) }, { note: `Лист: добавляем {${labels[i] === '∅' ? '' : labels[i].split('').join(',')}} в ответ. Возврат (backtrack) — отменяем последний выбор.`, aux: [{ label: 'результат', items: [...res], hl: [res.length - 1] }] }));
        return;
      }
      vis[i] = 'vis';
      F.push(G({ nodes, edges, h: 230, ecls: ecl, ncls: merge(vis, Object.fromEntries(path.map(p => [p, 'win'])), { [i]: 'active' }) }, { note: `Текущий путь: {${labels[i] === '∅' ? '' : labels[i].split('').join(',')}}. Решаем про элемент ${d + 1}.`, aux: [{ label: 'результат', items: [...res] }] }));
      go(2 * i + 1, d + 1, [...path, 2 * i + 1]);
      go(2 * i + 2, d + 1, [...path, 2 * i + 2]);
    };
    go(0, 0, [0]);
    F.push(G({ nodes, edges, h: 230, ncls: vis }, { note: 'Все 8 подмножеств найдены. Сложность O(n·2ⁿ). Отсечения (pruning) позволяют не заходить в заведомо плохие ветки.', aux: [{ label: 'результат', items: res }] }));
    return F;
  });

  // =====================================================================
  // Графы на сетке
  // =====================================================================
  reg('grid-bfs', 'BFS на сетке: кратчайший путь волной', () => {
    const W = '#';
    const g = ['..#....', '..#.##.', '....#..', '.##.#.#', '...#...', '.#...#.'].map(r => r.split(''));
    const R = g.length, Cc = g[0].length, F = [];
    const dist = g.map(r => r.map(() => null)), par = {};
    const base = () => { const o = {}; g.forEach((r, i) => r.forEach((c, j) => { if (c === W) o[i + ',' + j] = 'wall'; })); return o; };
    const view = () => dist.map((r, i) => r.map((d, j) => g[i][j] === W ? '' : d === null ? '' : d));
    let q = [[0, 0]]; dist[0][0] = 0;
    const target = [R - 1, Cc - 1];
    F.push({ type: 'grid', grid: view(), gcls: merge(base(), { '0,0': 'active', [target + '']: 'bad' }), note: 'Старт — левый верхний угол, цель — правый нижний. BFS расходится «волнами»: сначала все клетки на расстоянии 1, потом 2…', aux: [{ label: 'размер очереди', items: ['1'] }] });
    let d = 0, found = false;
    while (q.length && !found) {
      const nq = [];
      for (const [r, c] of q) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= Cc || g[nr][nc] === W || dist[nr][nc] !== null) continue;
        dist[nr][nc] = d + 1; par[nr + ',' + nc] = r + ',' + c; nq.push([nr, nc]);
        if (nr === target[0] && nc === target[1]) found = true;
      }
      d++;
      const o = base();
      dist.forEach((row, i) => row.forEach((x, j) => { if (x !== null) o[i + ',' + j] = 'vis'; }));
      nq.forEach(([r, c]) => o[r + ',' + c] = 'active');
      if (!found) o[target + ''] = 'bad';
      F.push({ type: 'grid', grid: view(), gcls: o, note: `Волна ${d}: ${nq.length} новых клеток на расстоянии ${d}.${found ? ' <b>Цель достигнута!</b>' : ''}`, aux: [{ label: 'размер очереди', items: [String(nq.length)] }] });
      q = nq;
    }
    const o = base();
    dist.forEach((row, i) => row.forEach((x, j) => { if (x !== null) o[i + ',' + j] = 'vis'; }));
    let k = target + '';
    while (k) { o[k] = 'found'; k = par[k]; }
    F.push({ type: 'grid', grid: view(), gcls: o, note: `Восстанавливаем путь по ссылкам на родителя. Длина кратчайшего пути = <b>${dist[R - 1][Cc - 1]}</b>. Каждая клетка обработана один раз: O(R·C).` });
    return F;
  });

  reg('grid-dfs', 'DFS на сетке: подсчёт островов', () => {
    const g = ['11000', '11010', '00110', '00000', '10011'].map(r => r.split(''));
    const R = g.length, Cc = g[0].length, F = [], color = {};
    const palette = ['found', 'win', 'vis', 'active'];
    const view = () => g.map(r => [...r]);
    const cls = (cur) => { const o = {}; g.forEach((r, i) => r.forEach((c, j) => { if (c === '0') o[i + ',' + j] = 'dim'; })); Object.assign(o, color); if (cur) o[cur] = 'active'; return o; };
    F.push({ type: 'grid', grid: view(), gcls: cls(), note: '1 — суша, 0 — вода. Идём по клеткам; встретив непосещённую сушу, запускаем DFS и «заливаем» весь остров.', aux: [{ label: 'островов', items: ['0'] }] });
    let islands = 0;
    for (let i = 0; i < R; i++) for (let j = 0; j < Cc; j++) {
      if (g[i][j] !== '1' || color[i + ',' + j]) continue;
      islands++;
      const c = palette[(islands - 1) % palette.length];
      const stack = [[i, j]];
      F.push({ type: 'grid', grid: view(), gcls: cls(i + ',' + j), note: `Клетка (${i},${j}) — новая суша → <b>остров №${islands}</b>, запускаем DFS.`, aux: [{ label: 'островов', items: [String(islands)] }] });
      while (stack.length) {
        const [r, cc] = stack.pop();
        if (r < 0 || cc < 0 || r >= R || cc >= Cc || g[r][cc] !== '1' || color[r + ',' + cc]) continue;
        color[r + ',' + cc] = c;
        F.push({ type: 'grid', grid: view(), gcls: cls(), note: `DFS: помечаем (${r},${cc}) и идём к соседям.`, aux: [{ label: 'островов', items: [String(islands)] }, { label: 'стек DFS', items: stack.map(x => x.join(',')) }] });
        stack.push([r + 1, cc], [r - 1, cc], [r, cc + 1], [r, cc - 1]);
      }
    }
    F.push({ type: 'grid', grid: view(), gcls: cls(), note: `Итого <b>${islands}</b> острова. Каждая клетка посещена один раз — O(R·C).`, aux: [{ label: 'островов', items: [String(islands)] }] });
    return F;
  });

  // =====================================================================
  // Графы
  // =====================================================================
  reg('union-find', 'Union-Find: объединение множеств со сжатием путей', () => {
    const n = 8, parent = [...Array(n).keys()], rank = Array(n).fill(0), F = [];
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i, label: i, x: 45 + i * 67, y: 70 + (i % 2) * 90 }));
    const frame = (ncls, note, ecls = {}) => F.push(G({ nodes, edges: parent.map((p, i) => p !== i ? { a: i, b: p, dir: true } : null).filter(Boolean), ncls, ecls, h: 230 }, { note, rows: [{ label: 'parent', arr: [...parent], idx: true }] }));
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    frame({}, 'Изначально каждый элемент — сам себе корень (отдельное множество). Стрелка = ссылка на родителя.');
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [1, 3], [0, 2], [5, 7], [3, 7]]) {
      const ra = find(a), rb = find(b);
      if (ra === rb) { frame({ [a]: 'bad', [b]: 'bad' }, `union(${a},${b}): уже в одном множестве — это был бы <b>цикл</b>.`); continue; }
      let root = ra, child = rb;
      if (rank[ra] < rank[rb]) { root = rb; child = ra; }
      parent[child] = root; if (rank[ra] === rank[rb]) rank[root]++;
      frame({ [a]: 'active', [b]: 'active', [root]: 'found' }, `union(${a},${b}): корни ${ra} и ${rb}. Подвешиваем меньшее дерево (по рангу) к большему: parent[${child}] = <b>${root}</b>.`, { [child + '-' + root]: 'active' });
    }
    // самый глубокий узел — на нём сжатие путей видно лучше всего
    const depth = x => { let d = 0; while (parent[x] !== x) { x = parent[x]; d++; } return d; };
    let deep = 0; for (let i = 0; i < n; i++) if (depth(i) > depth(deep)) deep = i;
    const path = []; for (let x = deep; ; x = parent[x]) { path.push(x); if (parent[x] === x) break; }
    frame(Object.fromEntries(path.map(x => [x, 'active'])), `find(${deep}): путь до корня ${path.join(' → ')} (глубина ${path.length - 1}).`);
    const r = find(deep);
    frame(merge(Object.fromEntries(path.map(x => [x, 'win'])), { [r]: 'found' }), `После find(${deep}) со <b>сжатием путей</b> узлы на пути перевешены ближе к корню ${r} — следующие поиски короче. Вместе с объединением по рангу — амортизированно O(α(n)), почти O(1).`);
    return F;
  });

  const CG = { // граф курсов
    nodes: [{ id: 'go', label: 'Go', x: 60, y: 120 }, { id: 'ds', label: 'DS', x: 190, y: 50 }, { id: 'sql', label: 'SQL', x: 190, y: 190 }, { id: 'net', label: 'Net', x: 320, y: 230 }, { id: 'api', label: 'API', x: 340, y: 110 }, { id: 'k8s', label: 'K8s', x: 490, y: 160 }],
    edges: [['go', 'ds'], ['go', 'sql'], ['ds', 'api'], ['sql', 'api'], ['net', 'api'], ['api', 'k8s'], ['net', 'k8s']].map(([a, b]) => ({ a, b, dir: true })),
  };
  reg('topological-sort', 'Топологическая сортировка (алгоритм Кана)', () => {
    const indeg = {}, F = [], order = [], done = {};
    CG.nodes.forEach(n => indeg[n.id] = 0);
    CG.edges.forEach(e => indeg[e.b]++);
    let q = CG.nodes.filter(n => !indeg[n.id]).map(n => n.id);
    const fr = (cls, note, ecls = {}) => F.push(G(CG, { h: 270, ncls: merge(done, cls), nsub: { ...indeg }, ecls, note, aux: [{ label: 'очередь (indeg = 0)', items: [...q] }, { label: 'порядок', items: [...order] }] }));
    fr(Object.fromEntries(q.map(x => [x, 'win'])), 'Под узлами — входящая степень (сколько курсов-пререквизитов осталось). Узлы с 0 можно проходить сразу — кладём в очередь.');
    while (q.length) {
      const u = q.shift(); order.push(u); done[u] = 'found';
      const ecls = {};
      for (const e of CG.edges.filter(e => e.a === u)) { indeg[e.b]--; ecls[e.a + '-' + e.b] = 'active'; if (!indeg[e.b]) q.push(e.b); }
      fr(merge(Object.fromEntries(q.map(x => [x, 'win'])), { [u]: 'active' }), `Берём <b>${u}</b> из очереди → в ответ. Уменьшаем indeg его соседей; у кого стало 0 — в очередь.`, ecls);
    }
    fr({}, `Порядок: <b>${order.join(' → ')}</b>. Если бы в ответ попали не все узлы — в графе есть цикл (Course Schedule = false). O(V+E).`);
    return F;
  });

  const WG = {
    nodes: [{ id: 'A', x: 60, y: 130 }, { id: 'B', x: 190, y: 45 }, { id: 'C', x: 190, y: 215 }, { id: 'D', x: 350, y: 45 }, { id: 'E', x: 350, y: 215 }, { id: 'F', x: 490, y: 130 }],
    edges: [['A', 'B', 4], ['A', 'C', 2], ['B', 'C', 1], ['B', 'D', 5], ['C', 'D', 8], ['C', 'E', 10], ['D', 'E', 2], ['D', 'F', 6], ['E', 'F', 3]].map(([a, b, w]) => ({ a, b, w })),
  };
  reg('dijkstra', 'Дейкстра: кратчайшие пути от A', () => {
    const dist = {}, prev = {}, fin = {}, F = [];
    WG.nodes.forEach(n => dist[n.id] = Infinity);
    dist.A = 0;
    let pq = [[0, 'A']];
    const sub = () => Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, v === Infinity ? '∞' : v]));
    const tree = () => Object.fromEntries(Object.entries(prev).map(([k, p]) => [p + '-' + k, 'found']));
    const fr = (ncls, ecls, note) => F.push(G(WG, { h: 270, ncls: merge(fin, ncls), nsub: sub(), ecls: merge(tree(), ecls), note, aux: [{ label: 'min-куча (dist, узел)', items: [...pq].sort((a, b) => a[0] - b[0]).map(([d, v]) => d + ':' + v), hl: [0] }] }));
    fr({ A: 'active' }, {}, 'dist[A] = 0, остальные ∞. Кладём (0, A) в приоритетную очередь.');
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, u] = pq.shift();
      if (fin[u]) { fr({}, {}, `(${d}, ${u}) устарел — ${u} уже зафиксирован, пропускаем.`); continue; }
      fin[u] = 'found';
      fr({ [u]: 'active' }, {}, `Достаём минимум: <b>${u}</b> с dist=${d}. Это расстояние окончательное (веса неотрицательны).`);
      for (const e of WG.edges.filter(e => e.a === u || e.b === u)) {
        const v = e.a === u ? e.b : e.a;
        if (fin[v]) continue;
        const nd = d + e.w;
        if (nd < dist[v]) {
          const old = dist[v]; dist[v] = nd; prev[v] = u; pq.push([nd, v]);
          fr({ [u]: 'active', [v]: 'win' }, { [u + '-' + v]: 'active' }, `Релаксация ${u}→${v}: ${d} + ${e.w} = ${nd} < ${old === Infinity ? '∞' : old} → <b>dist[${v}] = ${nd}</b>.`);
        } else {
          fr({ [u]: 'active', [v]: 'bad' }, { [u + '-' + v]: 'bad' }, `${u}→${v}: ${d} + ${e.w} = ${nd} ≥ ${dist[v]} — не улучшает.`);
        }
      }
    }
    fr({}, {}, 'Все узлы зафиксированы. Зелёные рёбра — дерево кратчайших путей. O((V+E) log V) с кучей.');
    return F;
  });

  reg('bellman-ford', 'Беллман–Форд: отрицательные веса', () => {
    const nodes = [{ id: 'S', x: 60, y: 130 }, { id: 'A', x: 220, y: 45 }, { id: 'B', x: 220, y: 215 }, { id: 'C', x: 380, y: 130 }, { id: 'D', x: 510, y: 130 }];
    const edges = [['S', 'A', 6], ['S', 'B', 5], ['B', 'A', -3], ['A', 'C', 2], ['B', 'C', 4], ['C', 'D', 3]].map(([a, b, w]) => ({ a, b, w, dir: true }));
    const dist = { S: 0, A: Infinity, B: Infinity, C: Infinity, D: Infinity }, F = [];
    const sub = () => Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, v === Infinity ? '∞' : v]));
    F.push(G({ nodes, edges, h: 270, nsub: sub(), ncls: { S: 'found' } }, { note: 'Дейкстра ломается на отрицательных весах. Беллман–Форд просто V−1 раз «релаксирует» все рёбра подряд.' }));
    for (let round = 1; round < nodes.length; round++) {
      let changed = false;
      for (const e of edges) {
        if (dist[e.a] === Infinity) continue;
        if (dist[e.a] + e.w < dist[e.b]) {
          const old = dist[e.b]; dist[e.b] = dist[e.a] + e.w; changed = true;
          F.push(G({ nodes, edges, h: 270, nsub: sub(), ncls: { [e.a]: 'active', [e.b]: 'win' }, ecls: { [e.a + '-' + e.b]: 'active' } }, { note: `Раунд ${round}: ${e.a}→${e.b} (${e.w}): ${dist[e.a]} + ${e.w} = ${dist[e.b]} < ${old === Infinity ? '∞' : old} → обновили.` }));
        }
      }
      if (!changed) { F.push(G({ nodes, edges, h: 270, nsub: sub(), ncls: Object.fromEntries(nodes.map(n => [n.id, 'found'])) }, { note: `Раунд ${round}: ничего не изменилось — можно остановиться раньше. Итог: кратчайшие расстояния от S. O(V·E).` })); break; }
    }
    F.push(G({ nodes, edges, h: 270, nsub: sub(), ncls: Object.fromEntries(nodes.map(n => [n.id, 'found'])) }, { note: 'Если на V-м раунде что-то ещё улучшается — есть <b>отрицательный цикл</b>. Так ищут арбитраж валют: веса = −log(курса).' }));
    return F;
  });

  reg('kruskal', 'Минимальное остовное дерево (Краскал)', () => {
    const F = [], parent = {}, chosen = {}, rej = {};
    WG.nodes.forEach(n => parent[n.id] = n.id);
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const sorted = [...WG.edges].sort((a, b) => a.w - b.w);
    let total = 0;
    const fr = (ecls, ncls, note) => F.push(G(WG, { h: 270, ecls: merge(rej, chosen, ecls), ncls, note, aux: [{ label: 'рёбра по весу', items: sorted.map(e => e.a + e.b + ':' + e.w) }, { label: 'вес дерева', items: [String(total)] }] }));
    fr({}, {}, 'Сортируем рёбра по весу и берём по одному, если ребро не создаёт цикл (проверка через Union-Find).');
    for (const e of sorted) {
      const k = e.a + '-' + e.b;
      if (find(e.a) !== find(e.b)) {
        parent[find(e.a)] = find(e.b); chosen[k] = 'found'; total += e.w;
        fr({ [k]: 'found' }, { [e.a]: 'active', [e.b]: 'active' }, `${e.a}–${e.b} (${e.w}): разные компоненты → <b>берём</b>.`);
      } else {
        rej[k] = 'dim';
        fr({ [k]: 'bad' }, { [e.a]: 'bad', [e.b]: 'bad' }, `${e.a}–${e.b} (${e.w}): уже связаны → создаст цикл, <b>пропускаем</b>.`);
      }
    }
    fr({}, {}, `Готово: ${WG.nodes.length - 1} рёбер, суммарный вес <b>${total}</b> — минимально возможный способ связать все узлы. O(E log E).`);
    return F;
  });

  // =====================================================================
  // DP
  // =====================================================================
  reg('coin-change', 'DP: Coin Change — монеты {1, 3, 4}, сумма 6', () => {
    const coins = [1, 3, 4], A = 6, dp = [0, ...Array(A).fill(Infinity)], F = [];
    const show = v => v === Infinity ? '∞' : v;
    F.push({ type: 'array', arr: dp.map(show), cls: { 0: 'found' }, ptr: {}, note: 'dp[x] — минимум монет для суммы x. dp[0] = 0. Жадный алгоритм (4+1+1 = 3 монеты) здесь <b>ошибается</b>, DP — нет.' });
    for (let x = 1; x <= A; x++) {
      const tries = [];
      for (const c of coins) if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
      for (const c of coins) if (c <= x) tries.push(`dp[${x - c}]+1 = ${show(dp[x - c] + 1)}`);
      const deps = {}; coins.forEach(c => { if (c <= x) deps[x - c] = 'vis'; });
      F.push({ type: 'array', arr: dp.map(show), cls: merge(deps, { [x]: 'active' }), ptr: { [x]: 'x' }, note: `dp[${x}] = min(${tries.join(', ')}) = <b>${show(dp[x])}</b>` });
    }
    F.push({ type: 'array', arr: dp.map(show), cls: { [A]: 'found' }, ptr: {}, note: `Ответ dp[6] = <b>${dp[A]}</b> (3+3). Каждая подзадача решается один раз: O(amount · coins).` });
    return F;
  });

  reg('lcs', 'DP 2D: наибольшая общая подпоследовательность', () => {
    const a = 'ACE', b = 'ABCDE', F = [];
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    const view = (ri, ci) => dp.map((r, i) => r.map((v, j) => (i < ri || (i === ri && j <= ci) || i === 0 || j === 0) ? v : ''));
    F.push({ type: 'grid', grid: view(0, b.length), rh: ['', ...a], ch: ['', ...b], gcls: {}, note: 'dp[i][j] — LCS первых i символов «ACE» и первых j символов «ABCDE». Нулевая строка и столбец = 0.' });
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      let note, deps;
      if (a[i - 1] === b[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; deps = { [(i - 1) + ',' + (j - 1)]: 'vis' }; note = `«${a[i - 1]}» = «${b[j - 1]}» → диагональ + 1 = <b>${dp[i][j]}</b>`; }
      else { dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); deps = { [(i - 1) + ',' + j]: 'vis', [i + ',' + (j - 1)]: 'vis' }; note = `«${a[i - 1]}» ≠ «${b[j - 1]}» → max(сверху ${dp[i - 1][j]}, слева ${dp[i][j - 1]}) = <b>${dp[i][j]}</b>`; }
      F.push({ type: 'grid', grid: view(i, j), rh: ['', ...a], ch: ['', ...b], gcls: merge(deps, { [i + ',' + j]: 'active' }), note });
    }
    F.push({ type: 'grid', grid: view(a.length, b.length), rh: ['', ...a], ch: ['', ...b], gcls: { [a.length + ',' + b.length]: 'found' }, note: `Ответ — правый нижний угол: <b>${dp[a.length][b.length]}</b> («ACE»). O(n·m). Тот же принцип — в diff, git и сравнении ДНК.` });
    return F;
  });

  reg('knapsack', 'DP: рюкзак 0/1 (вместимость 4)', () => {
    const items = [[1, 15], [3, 20], [4, 30]], W = 4, F = [];
    const dp = Array.from({ length: items.length + 1 }, () => Array(W + 1).fill(0));
    const rh = ['∅', ...items.map(([w, v]) => `${w}кг/${v}`)];
    const view = (ri, ci) => dp.map((r, i) => r.map((v, j) => (i < ri || (i === ri && j <= ci) || i === 0) ? v : ''));
    F.push({ type: 'grid', grid: view(0, W), rh, ch: [...Array(W + 1).keys()].map(String), gcls: {}, note: 'Строка — сколько первых предметов можно брать, столбец — вместимость. dp[i][w] — лучшая стоимость.' });
    for (let i = 1; i <= items.length; i++) for (let w = 0; w <= W; w++) {
      const [wi, vi] = items[i - 1];
      dp[i][w] = dp[i - 1][w];
      const deps = { [(i - 1) + ',' + w]: 'vis' };
      let note = `Не берём предмет ${i}: ${dp[i - 1][w]}.`;
      if (wi <= w) {
        deps[(i - 1) + ',' + (w - wi)] = 'vis';
        const take = dp[i - 1][w - wi] + vi;
        note += ` Берём: dp[${i - 1}][${w - wi}] + ${vi} = ${take}.`;
        if (take > dp[i][w]) dp[i][w] = take;
      } else note += ` Взять нельзя — не влезает (${wi} > ${w}).`;
      F.push({ type: 'grid', grid: view(i, w), rh, ch: [...Array(W + 1).keys()].map(String), gcls: merge(deps, { [i + ',' + w]: 'active' }), note: note + ` → <b>${dp[i][w]}</b>` });
    }
    F.push({ type: 'grid', grid: view(items.length, W), rh, ch: [...Array(W + 1).keys()].map(String), gcls: { [items.length + ',' + W]: 'found' }, note: `Максимум <b>${dp[items.length][W]}</b> (предметы 1кг + 3кг). O(n·W) — псевдополиномиально.` });
    return F;
  });

  // =====================================================================
  // Интервалы
  // =====================================================================
  reg('merge-intervals', 'Слияние интервалов', () => {
    const iv = [[1, 3], [8, 10], [2, 6], [15, 18], [9, 12]], F = [];
    F.push({ type: 'intervals', max: 20, items: iv.map(([s, e]) => ({ s, e })), note: 'Исходные интервалы в произвольном порядке.' });
    const sorted = [...iv].sort((a, b) => a[0] - b[0]);
    F.push({ type: 'intervals', max: 20, items: sorted.map(([s, e]) => ({ s, e })), note: 'Шаг 1: сортируем по началу — O(n log n). Теперь пересекающиеся интервалы стоят рядом.', aux: [{ label: 'результат', items: [] }] });
    const res = [];
    sorted.forEach(([s, e], i) => {
      let note;
      if (res.length && s <= res[res.length - 1][1]) { const last = res[res.length - 1]; last[1] = Math.max(last[1], e); note = `[${s},${e}] начинается до конца [${last[0]},…] → <b>сливаем</b>: конец = max = ${last[1]}.`; }
      else { res.push([s, e]); note = `[${s},${e}] не пересекается с предыдущим → <b>новый</b> интервал.`; }
      F.push({ type: 'intervals', max: 20, items: [...sorted.map(([a, b], k) => ({ s: a, e: b, cls: k === i ? 'active' : k < i ? 'dim' : '' })), ...res.map(([a, b]) => ({ s: a, e: b, cls: 'found', label: `→ [${a},${b}]` }))], note, aux: [{ label: 'результат', items: res.map(r => `[${r[0]},${r[1]}]`) }] });
    });
    return F;
  });

  // =====================================================================
  // Биты и математика
  // =====================================================================
  const bits = (n, w = 4) => (n >>> 0).toString(2).padStart(w, '0').split('');
  reg('xor-single', 'XOR: найти единственное число без пары', () => {
    const a = [4, 1, 2, 1, 2], F = [];
    let x = 0;
    F.push({ type: 'array', arr: a, cls: {}, ptr: {}, rows: [{ label: 'acc', arr: bits(x) }], note: 'Свойства XOR: a⊕a = 0, a⊕0 = a, порядок не важен. Значит, пары взаимно уничтожатся.' });
    a.forEach((v, i) => {
      const before = x; x ^= v;
      const flip = {}; bits(v).forEach((b, k) => { if (b === '1') flip[k] = 'active'; });
      F.push({ type: 'array', arr: a, cls: { [i]: 'active' }, ptr: { [i]: 'i' }, rows: [{ label: before + '', arr: bits(before) }, { label: '⊕ ' + v, arr: bits(v), cls: flip }, { label: '= ' + x, arr: bits(x), cls: Object.fromEntries(bits(x).map((b, k) => [k, b === '1' ? 'found' : ''])) }], note: `${before} ⊕ ${v} = <b>${x}</b>` });
    });
    F.push({ type: 'array', arr: a, cls: { 0: 'found' }, ptr: {}, rows: [{ label: 'ответ', arr: bits(x), cls: range(0, 3, 'found') }], note: `Ответ <b>${x}</b>. O(n) времени, O(1) памяти — без map.` });
    return F;
  });

  reg('popcount', 'Трюк n & (n−1): подсчёт единичных битов', () => {
    let n = 44, F = [], c = 0;
    F.push({ type: 'array', arr: bits(n, 8), cls: Object.fromEntries(bits(n, 8).map((b, k) => [k, b === '1' ? 'win' : ''])), ptr: {}, idx: false, note: `n = ${n}. n & (n−1) обнуляет <b>младшую единицу</b>. Сколько раз сможем — столько единиц.` });
    while (n) {
      const m = n - 1, r = n & m; c++;
      F.push({ type: 'array', arr: bits(n, 8), idx: false, cls: Object.fromEntries(bits(n, 8).map((b, k) => [k, b === '1' ? 'win' : ''])), ptr: {}, rows: [{ label: 'n−1', arr: bits(m, 8) }, { label: '& =', arr: bits(r, 8), cls: Object.fromEntries(bits(r, 8).map((b, k) => [k, b === '1' ? 'found' : ''])) }], note: `${n} & ${m} = ${r}. Счётчик = <b>${c}</b>.` });
      n = r;
    }
    F.push({ type: 'array', arr: bits(0, 8), idx: false, cls: {}, ptr: {}, note: `n = 0 → ответ <b>${c}</b>. Итераций столько, сколько единиц. В Go есть bits.OnesCount — это одна инструкция POPCNT.` });
    return F;
  });

  reg('fast-pow', 'Быстрое возведение в степень: 3¹³', () => {
    let base = 3, e = 13, res = 1, F = [];
    const eb = bits(13, 4);
    F.push({ type: 'array', arr: eb, idx: false, cls: {}, ptr: {}, note: '13 = 1101₂ = 8 + 4 + 1, значит 3¹³ = 3⁸ · 3⁴ · 3¹. Идём по битам справа, каждый раз возводя основание в квадрат.', aux: [{ label: 'result', items: ['1'] }, { label: 'base', items: ['3'] }] });
    let k = 3;
    while (e > 0) {
      const bit = e & 1;
      if (bit) res *= base;
      F.push({ type: 'array', arr: eb, idx: false, cls: merge(range(k + 1, 3, 'dim'), { [k]: bit ? 'found' : 'active' }), ptr: { [k]: 'бит' }, note: bit ? `Бит = 1 → result *= base (${base}) → <b>${res}</b>.` : `Бит = 0 → result не меняем.`, aux: [{ label: 'result', items: [String(res)] }, { label: 'base', items: [String(base)] }] });
      base *= base; e >>= 1; k--;
      if (e) F.push({ type: 'array', arr: eb, idx: false, cls: range(k + 1, 3, 'dim'), ptr: {}, note: `base = base² = <b>${base}</b>, сдвигаем степень вправо.`, aux: [{ label: 'result', items: [String(res)] }, { label: 'base', items: [String(base)] }] });
    }
    F.push({ type: 'array', arr: eb, idx: false, cls: range(0, 3, 'dim'), ptr: {}, note: `3¹³ = <b>${res}</b> за 4 шага вместо 12 умножений. O(log n). На этом стоит RSA: modpow с числами в 2048 бит.`, aux: [{ label: 'result', items: [String(res)] }] });
    return F;
  });

  window.VIZ = { mount, list: () => Object.keys(REG), REG };
})();
