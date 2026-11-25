// AlgoTrain SPA
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = MD.esc;
  const app = $('#app');

  let C = { problems: [], algorithms: [], categories: [] };
  let P = {};
  let ME = null;        // текущий пользователь
  let SUBS = {};        // problemId → {count, accepted, last}
  let byId = {}, algoById = {};

  // ---------- data ----------
  class AuthError extends Error {}
  async function api(path, opts = {}) {
    const headers = { 'X-Requested-With': 'AlgoTrain', ...(opts.headers || {}) };
    let body = opts.body;
    if (body !== undefined && typeof body !== 'string') { body = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
    const r = await fetch(path, { method: opts.method || 'GET', headers, body, keepalive: opts.keepalive, credentials: 'same-origin' });
    let j = null;
    try { j = await r.json(); } catch (_) { }
    if (r.status === 401 && !opts.allow401) { if (ME) { ME = null; showAuth(); } throw new AuthError((j && j.error) || 'нужно войти'); }
    if (!r.ok) throw new Error((j && j.error) || `${r.status} ${r.statusText}`);
    return j;
  }
  async function loadAll() {
    const [c, p, s] = await Promise.all([api('/api/content'), api('/api/progress'), api('/api/submissions/summary')]);
    C = c; P = p || {}; SUBS = s || {};
    P.problems = P.problems || {};
    P.settings = P.settings || {};
    index();
  }
  function index() {
    byId = Object.fromEntries(C.problems.map(p => [p.id, p]));
    algoById = Object.fromEntries(C.algorithms.map(a => [a.id, a]));
  }
  let saveTimer, savePending = false;
  async function flushSave(keepalive) {
    clearTimeout(saveTimer);
    if (!savePending || !ME) return;
    savePending = false;
    try { await api('/api/progress', { method: 'PUT', body: P, keepalive }); }
    catch (e) { if (!(e instanceof AuthError)) { savePending = true; toast('Ошибка сохранения: ' + e.message); } }
  }
  function save() {
    savePending = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flushSave(false), 400);
    updateChrome();
  }
  // не потерять последние изменения при закрытии вкладки
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(true); });
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- helpers ----------
  const T = () => SRS.today();
  const rec = id => P.problems[id];
  const st = id => SRS.status(P, rec(id));
  const STATUS_RU = { new: 'Не решена', learning: 'В процессе', due: 'Сегодня', overdue: 'Просрочена', mastered: 'Выучена' };
  const pill = s => `<span class="pill ${s}">${STATUS_RU[s]}</span>`;
  const diff = d => `<span class="diff ${esc(d || '')}">${esc(d || '—')}</span>`;
  const offs = () => SRS.offsets(P);
  const LIST_NAMES = { neetcode150: 'NeetCode 150', blind75: 'Blind 75', custom: 'Мои задачи' };
  const listName = l => LIST_NAMES[l] || l;
  const stageLabel = s => s === 0 ? 'решение' : '+' + offs()[s - 1];
  const stageCls = s => 'st' + (s === 0 ? 0 : ((s - 1) % 4) + 1);
  const GROUP_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#22c55e', '#f59e0b', '#22d3ee', '#fb7185', '#84cc16'];
  function colorFor(str) { let h = 0; for (const c of str || '') h = (h * 31 + c.charCodeAt(0)) >>> 0; return GROUP_COLORS[h % GROUP_COLORS.length]; }
  const algoIcon = a => `<span class="ico" style="background:${colorFor(a.group)}">${esc(a.icon || a.title[0])}</span>`;
  const isDue = id => { const s = st(id); return s === 'due' || s === 'overdue'; };
  const dueList = () => C.problems.filter(p => isDue(p.id)).sort((a, b) => rec(a.id).due.localeCompare(rec(b.id).due) || a.order - b.order);

  function dots(id) {
    const r = rec(id);
    const steps = SRS.ladder(P, r);
    return '<span class="dots" title="Этапы повторения">' + steps.map(s => {
      let c = s.state === 'done' ? 'done' : s.state === 'due' ? 'due' : s.state === 'overdue' ? 'overdue' : s.state === 'next' ? 'next' : '';
      return `<span class="dot ${c}" title="${s.label}${s.date ? ' · ' + SRS.human(s.date) : ''}"></span>`;
    }).join('') + '</span>';
  }
  function ladderHTML(id) {
    const steps = SRS.ladder(P, rec(id));
    return `<div class="ladder" style="--n:${steps.length}">` + steps.map(s => `
      <div class="step ${s.state}">
        <div class="node">${s.state === 'done' ? '✓' : s.stage === 0 ? 'D' : s.label}</div>
        <div class="lbl">${s.stage === 0 ? 'Решено' : 'День ' + s.label}</div>
        <div class="date">${s.date ? SRS.human(s.date) : '—'}</div>
      </div>`).join('') + '</div>';
  }

  const STATUS_SUB = {
    accepted: ['Принято', 'ok'], wrong_answer: ['Неверный ответ', 'bad'], compile_error: ['Ошибка компиляции', 'warn'],
    runtime_error: ['Ошибка выполнения', 'bad'], time_limit: ['Превышено время', 'warn'], internal_error: ['Ошибка проверки', 'warn'],
  };
  const subPill = s => { const [t, c] = STATUS_SUB[s] || [s, 'warn']; return `<span class="sub-pill ${c}">${t}</span>`; };
  const ago = ms => {
    const d = (Date.now() - ms) / 1000;
    if (d < 60) return 'только что';
    if (d < 3600) return Math.floor(d / 60) + ' мин назад';
    if (d < 86400) return Math.floor(d / 3600) + ' ч назад';
    const dt = new Date(ms);
    return SRS.human(SRS.fmt(dt)) + ' ' + dt.toTimeString().slice(0, 5);
  };
  const codeBadge = id => {
    const s = SUBS[id];
    if (!s) return '';
    return s.accepted ? `<span class="code-badge ok" title="Есть принятое решение в тренажёре (${s.count} отправок)">✓ код</span>`
      : `<span class="code-badge" title="Отправок: ${s.count}, принятых нет">${s.count} попыт.</span>`;
  };

  function updateChrome() {
    const n = dueList().length;
    $('#due-badge').textContent = n ? n : '';
    const s = SRS.streak(P);
    $('#streak').innerHTML = s ? `Серия: <b>${s}</b> дн. подряд` : 'Серия: начни сегодня';
    document.documentElement.dataset.theme = P.settings.theme || 'dark';
  }

  // ---------- actions ----------
  function doSolve(id) { SRS.solve(P, id); save(); toast(`Решено! Повторение ${SRS.rel(rec(id).due)} (${SRS.human(rec(id).due)})`); }
  function doReview(id, ok) {
    const r = SRS.review(P, id, ok);
    save();
    if (!ok) toast('Цикл начат заново — повтор завтра');
    else if (r.due == null) toast('Задача выучена — все этапы пройдены 🎉');
    else toast(`Отлично! Следующее повторение ${SRS.rel(r.due)}`);
  }
  function doPractice(id) { rec(id).history.push({ d: T(), t: 'practice' }); save(); toast('Практика записана (расписание не меняется)'); }
  function doReset(id) {
    if (!confirm('Сбросить прогресс по задаче? История будет удалена.')) return;
    SRS.reset(P, id); save(); toast('Прогресс сброшен');
  }

  // делегирование кликов по data-act
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b) {
      e.preventDefault();
      const id = b.dataset.id, act = b.dataset.act;
      if (act === 'solve') doSolve(id);
      else if (act === 'ok') doReview(id, true);
      else if (act === 'fail') doReview(id, false);
      else if (act === 'practice') doPractice(id);
      else if (act === 'reset') doReset(id);
      else if (act === 'toggle') { if (rec(id)) doReset(id); else doSolve(id); }
      if (RESULTS[id]) RESULTS[id].srsDone = true;
      route();
      return;
    }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      navigator.clipboard.writeText(cp.parentElement.querySelector('code').innerText).then(() => toast('Скопировано'));
    }
  });

  // ---------- views ----------
  function heatmap() {
    const act = SRS.activity(P);
    const t = T();
    const end = SRS.parse(t);
    const dow = (end.getDay() + 6) % 7; // 0 = Пн
    const weeks = 53;
    const start = SRS.addDays(t, -(weeks - 1) * 7 - dow);
    let cells = '', months = '', lastM = -1, lastCol = -9;
    let total = 0, days = 0;
    for (let w = 0; w < weeks; w++) {
      const wd0 = SRS.addDays(start, w * 7);
      const m = SRS.parse(wd0).getMonth();
      const show = m !== lastM && w - lastCol >= 3 && w < weeks - 1;
      months += `<span style="overflow:visible;white-space:nowrap">${show ? SRS.MONTHS[m].slice(0, 3) : ''}</span>`;
      if (show) lastCol = w;
      lastM = m;
      for (let d = 0; d < 7; d++) {
        const ds = SRS.addDays(start, w * 7 + d);
        if (ds > t) { cells += `<i class="fut" title="${ds}"></i>`; continue; }
        const c = act[ds] ? act[ds].count : 0;
        if (c) { total += c; days++; }
        const l = c === 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 7 ? 3 : 4;
        cells += `<i class="l${l}${ds === t ? ' today' : ''}" title="${SRS.human(ds)}: ${c} действ."></i>`;
      }
    }
    return `<div class="card">
      <div class="card-title">Активность за год<span class="spacer"></span><span class="muted small">${total} действий за ${days} дн.</span></div>
      <div class="heat-wrap"><div class="heat-months">${months}</div><div class="heat">${cells}</div></div>
      <div class="heat-legend">меньше <i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i> больше</div>
    </div>`;
  }

  function forecast(days = 21) {
    const t = T();
    const sched = SRS.schedule(P);
    const o = offs();
    const buckets = Array.from({ length: days }, () => Array(o.length).fill(0));
    for (const s of sched) {
      let n = SRS.diffDays(t, s.date);
      if (n < 0) n = 0;
      if (n < days) buckets[n][s.stage - 1]++;
    }
    const max = Math.max(1, ...buckets.map(b => b.reduce((x, y) => x + y, 0)));
    const colors = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
    const bars = buckets.map((b, i) => {
      const ds = SRS.addDays(t, i);
      const d = SRS.parse(ds);
      const sum = b.reduce((x, y) => x + y, 0);
      const wk = d.getDay() === 0 || d.getDay() === 6;
      const segs = b.map((v, k) => v ? `<span style="height:${v / max * 130}px;background:${colors[k % 4]}" title="+${o[k]}: ${v}"></span>` : '').join('');
      return `<a class="fbar ${i === 0 ? 'today' : ''} ${wk ? 'weekend' : ''}" href="#/calendar/${ds.slice(0, 7)}/${ds}" title="${SRS.human(ds)}: ${sum}">
        <span class="num">${sum || ''}</span><span class="stack">${segs}</span><span class="day">${i === 0 ? 'сег' : d.getDate()}</span></a>`;
    }).join('');
    return `<div class="card">
      <div class="card-title">График повторений на ${days} дней<span class="spacer"></span>
      <span class="legend">${o.map((x, k) => `<span><i style="background:${colors[k % 4]}"></i>день +${x}</span>`).join('')}</span></div>
      <div class="fchart">${bars}</div>
      <div class="muted small" style="margin-top:8px">Каждая решённая задача повторяется на ${o.map(x => '+' + x).join(', ')} день. Прозрачные этапы календаря — прогноз, если повторять вовремя.</div>
    </div>`;
  }

  function catProgress() {
    const rows = C.categories.map(cat => {
      const ps = C.problems.filter(p => p.category === cat);
      const solved = ps.filter(p => rec(p.id)).length;
      const mastered = ps.filter(p => st(p.id) === 'mastered').length;
      return `<div style="margin-bottom:10px">
        <div class="row small"><span>${esc(cat)}</span><span class="spacer"></span><span class="muted">${solved}/${ps.length}</span></div>
        <div class="progress"><span style="width:${mastered / ps.length * 100}%;background:var(--accent)"></span><span style="width:${(solved - mastered) / ps.length * 100}%;background:var(--blue)"></span></div>
      </div>`;
    }).join('');
    return `<div class="card"><div class="card-title">Прогресс по темам<span class="spacer"></span><span class="legend"><span><i style="background:var(--accent)"></i>выучено</span><span><i style="background:var(--blue)"></i>в процессе</span></span></div>${rows}</div>`;
  }

  function viewToday() {
    const due = dueList();
    const total = C.problems.length;
    const solved = C.problems.filter(p => rec(p.id)).length;
    const mastered = C.problems.filter(p => st(p.id) === 'mastered').length;
    const learning = C.problems.filter(p => ['learning', 'due', 'overdue'].includes(st(p.id)));
    const overdue = due.filter(p => st(p.id) === 'overdue').length;
    const d = SRS.parse(T());
    const nextNew = C.problems.filter(p => !rec(p.id)).slice(0, 4);

    const dueRows = due.length ? due.map(p => {
      const r = rec(p.id), s = st(p.id);
      const late = -SRS.diffDays(T(), r.due);
      return `<tr>
        <td><span class="stage-badge ${stageCls(r.stage + 1)}">${stageLabel(r.stage + 1)}</span></td>
        <td class="ttl"><a href="#/problem/${p.id}">${esc(p.title)}</a><div class="small muted">${esc(p.category)}</div></td>
        <td>${diff(p.difficulty)}</td>
        <td>${s === 'overdue' ? `<span class="pill overdue">просрочено ${late} дн.</span>` : pill(s)}</td>
        <td style="text-align:right;white-space:nowrap">
          ${p.hasTests ? `<a class="btn small" href="#/solve/${p.id}">⌨ Решать</a>` : p.url ? `<a class="btn small" href="${esc(p.url)}" target="_blank" rel="noopener">Открыть ↗</a>` : ''}
          <button class="ok small" data-act="ok" data-id="${p.id}">✓ Вспомнил</button>
          <button class="fail small" data-act="fail" data-id="${p.id}">✗ Забыл</button>
        </td></tr>`;
    }).join('') : '';

    const ladderRows = learning.sort((a, b) => rec(a.id).due.localeCompare(rec(b.id).due)).slice(0, 12).map(p => {
      const steps = SRS.ladder(P, rec(p.id));
      return `<tr><td class="ttl"><a href="#/problem/${p.id}">${esc(p.title)}</a></td>` + steps.map(s => {
        const c = s.state === 'done' ? 'done' : s.state === 'due' ? 'due' : s.state === 'overdue' ? 'overdue' : s.state === 'next' ? 'next' : '';
        return `<td style="text-align:center"><span class="dot ${c}" style="display:inline-block"></span><div class="small ${s.state === 'future' ? 'dim' : 'muted'}">${s.date ? SRS.human(s.date) : ''}</div></td>`;
      }).join('') + '</tr>';
    }).join('');

    app.innerHTML = `
      <div class="row" style="margin-bottom:18px"><h1 style="margin:0">Сегодня, ${d.getDate()} ${SRS.MONTHS_G[d.getMonth()]}</h1><span class="spacer"></span>
        <a class="btn" href="#/calendar">Календарь →</a></div>
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card stat"><span class="v ${due.length ? 'red' : 'green'}">${due.length}</span><span class="l">к повторению${overdue ? ` (просрочено ${overdue})` : ''}</span></div>
        <div class="card stat"><span class="v">${solved}<span class="muted" style="font-size:16px">/${total}</span></span><span class="l">решено задач</span></div>
        <div class="card stat"><span class="v green">${mastered}</span><span class="l">выучено (все этапы)</span></div>
        <div class="card stat"><span class="v" style="color:var(--medium)">${SRS.streak(P)}</span><span class="l">дней подряд</span></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Повторить сегодня<span class="spacer"></span><span class="muted small">Сначала реши задачу заново сам, потом отметь результат</span></div>
        ${due.length ? `<div style="overflow-x:auto"><table class="plist"><tbody>${dueRows}</tbody></table></div>` :
        `<div class="empty">На сегодня повторений нет ✓
           ${nextNew.length ? `<div style="margin-top:14px">Следующие новые задачи:</div><div class="row" style="justify-content:center;margin-top:8px">${nextNew.map(p => `<a class="btn" href="#/problem/${p.id}">${esc(p.title)} ${diff(p.difficulty)}</a>`).join('')}</div>` : ''}</div>`}
      </div>
      <div class="grid g2" style="margin-bottom:16px">
        ${forecast()}
        ${catProgress()}
      </div>
      ${learning.length ? `<div class="card" style="margin-bottom:16px">
        <div class="card-title">Лестница повторений<span class="spacer"></span><span class="muted small">решение → ${offs().map(x => '+' + x).join(' → ')}</span></div>
        <div style="overflow-x:auto"><table class="plist"><thead><tr><th>Задача</th><th style="text-align:center">Решено</th>${offs().map(x => `<th style="text-align:center">+${x}</th>`).join('')}</tr></thead><tbody>${ladderRows}</tbody></table></div>
      </div>` : ''}
      ${heatmap()}
    `;
  }

  // ----- problems list -----
  const F = { q: '', list: 'all', diff: 'all', status: 'all', algo: 'all' };
  function viewProblems() {
    const lists = [...new Set(C.problems.flatMap(p => p.lists))];
    const filt = p => {
      if (F.q && !(p.title.toLowerCase().includes(F.q) || String(p.leetcode).includes(F.q))) return false;
      if (F.list !== 'all' && !p.lists.includes(F.list)) return false;
      if (F.diff !== 'all' && p.difficulty !== F.diff) return false;
      if (F.algo !== 'all' && !p.algorithms.includes(F.algo)) return false;
      if (F.status !== 'all') {
        const s = st(p.id);
        if (F.status === 'due' ? !(s === 'due' || s === 'overdue') : s !== F.status) return false;
      }
      return true;
    };
    const ps = C.problems.filter(filt);
    const solvedAll = C.problems.filter(p => rec(p.id)).length;
    const sel = (k, opts) => `<select data-f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${F[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const groups = C.categories.map(cat => {
      const all = C.problems.filter(p => p.category === cat);
      const items = ps.filter(p => p.category === cat);
      if (!items.length) return '';
      const solved = all.filter(p => rec(p.id)).length;
      return `<details class="cat" open>
        <summary><span class="name">${esc(cat)}</span><span class="progress"><span style="width:${solved / all.length * 100}%;background:var(--accent)"></span></span><span class="muted small">${solved} / ${all.length}</span></summary>
        <div class="inner"><table class="plist"><thead><tr><th style="width:36px"></th><th>Задача</th><th>Сложность</th><th>Алгоритмы</th><th>Статус</th><th>Этапы</th><th>След. повтор</th><th></th></tr></thead><tbody>
        ${items.map(p => {
        const r = rec(p.id), s = st(p.id);
        return `<tr>
            <td><button class="check ${r ? 'on' : ''}" data-act="toggle" data-id="${p.id}" title="${r ? 'Сбросить' : 'Отметить решённой сегодня'}">${r ? '✓' : ''}</button></td>
            <td class="ttl"><a href="#/problem/${p.id}">${esc(p.title)}</a>${p.leetcode ? ` <span class="dim small">#${p.leetcode}</span>` : ''} ${codeBadge(p.id)}</td>
            <td>${diff(p.difficulty)}</td>
            <td>${p.algorithms.map(a => `<a class="tag" href="#/algo/${a}">${esc(algoById[a] ? algoById[a].title : a)}</a>`).join(' ')}</td>
            <td>${pill(s)}</td>
            <td>${r ? dots(p.id) : ''}</td>
            <td class="small ${s === 'overdue' ? '' : 'muted'}" style="${s === 'overdue' ? 'color:var(--hard)' : ''}">${r && r.due ? SRS.rel(r.due) : ''}</td>
            <td style="white-space:nowrap">${p.hasTests ? `<a href="#/solve/${p.id}" title="Решать в редакторе">⌨</a> ` : ''}${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" title="Открыть условие">↗</a>` : ''}</td>
          </tr>`;
      }).join('')}</tbody></table></div></details>`;
    }).join('');
    app.innerHTML = `
      <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Задачи</h1><span class="muted">${solvedAll} из ${C.problems.length} решено</span><span class="spacer"></span>${ME && ME.admin ? '<a class="btn" href="#/add">＋ Добавить задачу</a>' : ''}</div>
      <div class="filters">
        <input type="search" data-f="q" placeholder="Поиск по названию или номеру…" value="${esc(F.q)}">
        ${sel('list', [['all', 'Все списки'], ...lists.map(l => [l, listName(l)])])}
        ${sel('diff', [['all', 'Любая сложность'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']])}
        ${sel('status', [['all', 'Любой статус'], ['new', 'Не решена'], ['due', 'К повторению'], ['learning', 'В процессе'], ['mastered', 'Выучена']])}
        ${sel('algo', [['all', 'Все алгоритмы'], ...C.algorithms.map(a => [a.id, a.title])])}
      </div>
      ${groups || '<div class="empty">Ничего не найдено</div>'}
    `;
    $$('[data-f]', app).forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
      F[el.dataset.f] = el.tagName === 'INPUT' ? el.value.trim().toLowerCase() : el.value;
      const pos = el.selectionStart;
      viewProblems();
      if (el.tagName === 'INPUT') { const n = $('[data-f=q]', app); n.focus(); n.setSelectionRange(pos, pos); }
    }));
  }

  // ----- single problem -----
  const shownSolutions = new Set();
  function viewProblem(id) {
    const p = byId[id];
    if (!p) { app.innerHTML = `<div class="empty">Задача «${esc(id)}» не найдена</div>`; return; }
    const r = rec(id), s = st(id);
    const idx = C.problems.indexOf(p);
    const prev = C.problems[idx - 1], next = C.problems[idx + 1];
    let actions = '';
    if (s === 'new') actions = `<button class="primary" data-act="solve" data-id="${id}">✓ Решил сегодня</button>`;
    else if (s === 'due' || s === 'overdue') actions = `<button class="ok" data-act="ok" data-id="${id}">✓ Вспомнил и решил</button><button class="fail" data-act="fail" data-id="${id}">✗ Не вспомнил</button>`;
    else if (s === 'learning') actions = `<button data-act="practice" data-id="${id}">Отметить практику</button>`;
    else if (s === 'mastered') actions = `<button data-act="solve" data-id="${id}">↻ Начать цикл заново</button>`;
    if (r) actions += `<button class="ghost danger small" data-act="reset" data-id="${id}">Сбросить</button>`;
    if (p.hasTests) actions = `<a class="btn primary" href="#/solve/${id}">⌨ Решать в редакторе</a>` + actions.replace('class="primary"', '');

    const hide = P.settings.hideSolutions !== false && !shownSolutions.has(id);
    const sols = p.solutions.length ? (hide ?
      `<div class="spoiler">Эталонные решения скрыты, чтобы сначала решить самому.<div style="margin-top:12px"><button id="show-sol">Показать ${p.solutions.length} ${p.solutions.length === 1 ? 'решение' : 'решения'}</button></div></div>` :
      `<div class="tabs">${p.solutions.map((x, i) => `<button data-tab="${i}" class="${i === 0 ? 'active' : ''}">${esc(x.title)}</button>`).join('')}</div>
       ${p.solutions.map((x, i) => `<div class="sol prose" data-pane="${i}" ${i ? 'hidden' : ''}>${MD.render(x.explanation)}${MD.codeBlock(x.code, x.lang)}</div>`).join('')}`)
      : '<div class="muted">Решений пока нет.</div>';

    const hist = r ? [...r.history].reverse().map(h => `<div><span>${SRS.human(h.d)}</span><span>${h.t === 'solve' ? 'решено' : h.t === 'practice' ? 'практика' : (h.ok ? '✓ повтор ' : '✗ забыл на ') + stageLabel(h.stage)}</span></div>`).join('') : '';
    const similar = C.problems.filter(q => q.id !== id && q.algorithms.some(a => p.algorithms.includes(a))).slice(0, 6);

    app.innerHTML = `
      <div class="row small muted" style="margin-bottom:10px"><a href="#/problems">← Все задачи</a><span class="spacer"></span>
        ${prev ? `<a href="#/problem/${prev.id}">‹ ${esc(prev.title)}</a>` : ''}${next ? `<a href="#/problem/${next.id}">${esc(next.title)} ›</a>` : ''}</div>
      <div class="ph">
        <div style="flex:1;min-width:260px">
          <h1>${p.leetcode ? `<span class="dim">${p.leetcode}.</span> ` : ''}${esc(p.title)}</h1>
          <div class="meta">${diff(p.difficulty)} ${pill(s)} <span class="tag">${esc(p.category)}</span>
            ${p.lists.map(l => `<span class="tag">${esc(listName(l))}</span>`).join('')}
            ${codeBadge(id)}
            ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${p.url.includes('leetcode.com') ? 'Открыть на LeetCode' : 'Открыть условие'} ↗</a>` : ''}</div>
        </div>
        <div class="row">${actions}</div>
      </div>
      <div class="layout-2">
        <div>
          <div class="card prose" style="margin-bottom:16px">${MD.render(p.description)}</div>
          <div class="card" style="margin-bottom:16px"><div class="card-title">Эталонные решения на Go</div>${sols}</div>
          <div class="card"><div class="card-title">Мои заметки<span class="spacer"></span><span class="muted small" id="note-st"></span></div>
            <textarea id="notes" rows="8" placeholder="Ключевая идея, ошибки, на чём споткнулся, своё решение…" class="mono">${esc(r && r.notes || '')}</textarea>
            ${r ? '' : '<div class="small muted" style="margin-top:6px">Заметки сохранятся, когда задача будет отмечена решённой.</div>'}
          </div>
        </div>
        <div>
          <div class="card" style="margin-bottom:16px"><div class="card-title">График повторения</div>
            ${ladderHTML(id)}
            <div class="small muted" style="margin-top:10px">${r ? (r.due ? `Следующее повторение: <b style="color:var(--text)">${SRS.human(r.due)}</b> (${SRS.rel(r.due)})` : 'Все этапы пройдены — задача выучена.') : 'Отметь задачу решённой, и повторения встанут в календарь.'}</div>
          </div>
          <div class="card" style="margin-bottom:16px"><div class="card-title">Алгоритмы</div>
            ${p.algorithms.map(a => algoById[a] ? `<a class="algo-mini" href="#/algo/${a}">${algoIcon(algoById[a])}<div><div class="t">${esc(algoById[a].title)}</div><div class="s">${esc(algoById[a].short)}</div></div></a>` : `<span class="tag">${esc(a)}</span>`).join('') || '<span class="muted">—</span>'}
          </div>
          ${similar.length ? `<div class="card" style="margin-bottom:16px"><div class="card-title">Похожие задачи</div>${similar.map(q => `<div class="row small" style="padding:4px 0"><a href="#/problem/${q.id}">${esc(q.title)}</a><span class="spacer"></span>${diff(q.difficulty)}</div>`).join('')}</div>` : ''}
          ${hist ? `<div class="card"><div class="card-title">История</div><div class="hist">${hist}</div></div>` : ''}
        </div>
      </div>`;
    const sb = $('#show-sol'); if (sb) sb.onclick = () => { shownSolutions.add(id); viewProblem(id); };
    $$('[data-tab]', app).forEach(b => b.onclick = () => {
      $$('[data-tab]', app).forEach(x => x.classList.toggle('active', x === b));
      $$('[data-pane]', app).forEach(x => x.hidden = x.dataset.pane !== b.dataset.tab);
    });
    const ta = $('#notes');
    let nt;
    ta.addEventListener('input', () => {
      clearTimeout(nt);
      nt = setTimeout(() => {
        if (!rec(id)) return;
        rec(id).notes = ta.value; save(); $('#note-st').textContent = 'сохранено';
      }, 500);
    });
  }

  // ----- calendar -----
  function viewCalendar(month, selDay) {
    const t = T();
    month = month || t.slice(0, 7);
    selDay = selDay || (month === t.slice(0, 7) ? t : month + '-01');
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const off = (first.getDay() + 6) % 7;
    const startDs = SRS.addDays(SRS.fmt(first), -off);
    const act = SRS.activity(P);
    const sched = SRS.schedule(P);
    const byDate = {};
    for (const s of sched) {
      const d = s.overdue ? t : s.date;
      (byDate[d] = byDate[d] || []).push(s);
    }
    const title = id => byId[id] ? byId[id].title : id;
    const dayItems = ds => {
      const items = [];
      if (ds <= t && act[ds]) for (const e of act[ds].events) items.push({ kind: 'done', ...e });
      if (ds >= t && byDate[ds]) for (const s of byDate[ds]) items.push({ kind: 'plan', ...s });
      return items;
    };
    let cells = SRS.WD.map(w => `<div class="wd">${w}</div>`).join('');
    const weeks = Math.ceil((off + new Date(y, m, 0).getDate()) / 7);
    for (let i = 0; i < weeks * 7; i++) {
      const ds = SRS.addDays(startDs, i);
      const items = dayItems(ds);
      const chips = items.slice(0, 4).map(it => it.kind === 'done'
        ? `<div class="chip doneev" title="${esc(title(it.id))}">${it.t === 'solve' ? '✓' : it.ok ? '↻' : '✗'} ${esc(title(it.id))}</div>`
        : `<div class="chip ${stageCls(it.stage)} ${it.projected ? 'proj' : ''} ${it.overdue ? 'over' : ''}" title="${esc(title(it.id))} · ${stageLabel(it.stage)}">${esc(title(it.id))}</div>`).join('');
      cells += `<div class="day ${ds.slice(0, 7) !== month ? 'other' : ''} ${ds === t ? 'today' : ''} ${ds === selDay ? 'sel' : ''}" data-day="${ds}">
        <div class="dn"><span>${SRS.parse(ds).getDate()}</span>${items.length ? `<span class="dim">${items.length}</span>` : ''}</div>
        ${chips}${items.length > 4 ? `<div class="chip more">ещё ${items.length - 4}…</div>` : ''}
        ${items.length ? `<span class="cnt">${items.length}</span>` : ''}
      </div>`;
    }
    const items = dayItems(selDay);
    const done = items.filter(i => i.kind === 'done'), plan = items.filter(i => i.kind === 'plan');
    const prevM = SRS.fmt(new Date(y, m - 2, 1)).slice(0, 7), nextM = SRS.fmt(new Date(y, m, 1)).slice(0, 7);
    const listItem = it => {
      const p = byId[it.id]; if (!p) return '';
      const due = it.kind === 'plan' && !it.projected && selDay === t;
      return `<div class="it">
        <span class="stage-badge ${it.kind === 'done' ? 'st0' : stageCls(it.stage)}">${it.kind === 'done' ? (it.t === 'solve' ? 'решено' : it.t === 'practice' ? 'практика' : (it.ok ? '✓ ' : '✗ ') + stageLabel(it.stage)) : stageLabel(it.stage)}</span>
        <div style="flex:1;min-width:0"><a href="#/problem/${p.id}">${esc(p.title)}</a><div class="small muted">${diff(p.difficulty)} ${it.overdue ? '<span style="color:var(--hard)">просрочено</span>' : it.projected ? 'прогноз' : ''}</div></div>
        ${due ? `<button class="ok small" data-act="ok" data-id="${p.id}">✓</button><button class="fail small" data-act="fail" data-id="${p.id}">✗</button>` : ''}
      </div>`;
    };
    app.innerHTML = `
      <div class="cal-head"><h1 style="margin:0">Календарь</h1><span class="spacer"></span>
        <a class="btn" href="#/calendar/${prevM}">‹</a><h2 style="text-align:center">${SRS.MONTHS[m - 1]} ${y}</h2><a class="btn" href="#/calendar/${nextM}">›</a>
        <a class="btn" href="#/calendar">Сегодня</a></div>
      <div class="legend" style="margin-bottom:12px">
        <span><i style="background:var(--accent)"></i>сделано</span>
        ${offs().map((x, k) => `<span><i style="background:var(--s${k % 4 + 1})"></i>повтор +${x}</span>`).join('')}
        <span><i style="background:var(--hard)"></i>просрочено</span><span class="dim">полупрозрачные — прогноз</span></div>
      <div class="layout-2" style="margin-top:0">
        <div class="cal">${cells}</div>
        <div class="cal-side">
          <div class="card"><div class="card-title">${SRS.human(selDay)}<span class="spacer"></span><span class="muted small">${SRS.rel(selDay)}</span></div>
            ${plan.length ? `<div class="small muted" style="margin-bottom:4px">Запланировано (${plan.length})</div><div class="day-list">${plan.map(listItem).join('')}</div>` : ''}
            ${done.length ? `<div class="small muted" style="margin:12px 0 4px">Сделано (${done.length})</div><div class="day-list">${done.map(listItem).join('')}</div>` : ''}
            ${!items.length ? '<div class="empty">Ничего нет</div>' : ''}
          </div>
        </div>
      </div>
      <div style="margin-top:18px">${heatmap()}</div>`;
    $$('[data-day]', app).forEach(el => el.onclick = () => { location.hash = `#/calendar/${month}/${el.dataset.day}`; });
  }

  // ----- algorithms -----
  function viewAlgorithms() {
    const groups = [...new Set(C.algorithms.map(a => a.group || 'Прочее'))];
    app.innerHTML = `<h1>Алгоритмы и паттерны</h1>
      <p class="muted" style="max-width:760px">Для каждого — история появления, как работает (с пошаговой интерактивной инфографикой), шаблон на Go, сложность и где он реально применяется в бигтехе, финтехе и геймдеве.</p>
      ${groups.map(g => `<div class="group-h">${esc(g)}</div><div class="algo-grid">${C.algorithms.filter(a => (a.group || 'Прочее') === g).map(a => {
      const ps = C.problems.filter(p => p.algorithms.includes(a.id));
      const solved = ps.filter(p => rec(p.id)).length;
      return `<a class="card algo-card" href="#/algo/${a.id}"><div class="top">${algoIcon(a)}<div><div class="t">${esc(a.title)}</div><div class="small muted">${ps.length} задач · решено ${solved}</div></div></div>
          <div class="s">${esc(a.short)}</div>
          <div class="progress"><span style="width:${ps.length ? solved / ps.length * 100 : 0}%;background:${colorFor(a.group)}"></span></div></a>`;
    }).join('')}</div>`).join('')}`;
  }

  function enhanceArticle(root) {
    // Карточки «Бигтех / Финтех / Геймдев»
    const map = { 'бигтех': 'bt', 'финтех': 'ft', 'геймдев': 'gd' };
    let group = null;
    for (const h of $$('h3', root)) {
      const key = Object.keys(map).find(k => h.textContent.toLowerCase().startsWith(k));
      if (!key) { group = null; continue; }
      const card = document.createElement('div');
      card.className = 'app-card ' + map[key];
      const h4 = document.createElement('h4'); h4.textContent = h.textContent; card.appendChild(h4);
      let n = h.nextElementSibling;
      while (n && !/^H[23]$/.test(n.tagName)) { const nx = n.nextElementSibling; card.appendChild(n); n = nx; }
      if (!group || group.nextElementSibling !== h) {
        group = document.createElement('div'); group.className = 'app-cards';
        h.before(group);
      }
      group.appendChild(card);
      h.remove();
    }
    $$('[data-viz]', root).forEach(el => VIZ.mount(el, el.dataset.viz));
  }

  function viewAlgo(id) {
    const a = algoById[id];
    if (!a) { app.innerHTML = `<div class="empty">Алгоритм «${esc(id)}» не найден</div>`; return; }
    const ps = C.problems.filter(p => p.algorithms.includes(id));
    let body = a.Body || a.body;
    app.innerHTML = `
      <div class="row small muted" style="margin-bottom:10px"><a href="#/algorithms">← Все алгоритмы</a></div>
      <div class="row" style="gap:14px;margin-bottom:6px">${algoIcon(a)}<div><h1 style="margin:0">${esc(a.title)}</h1><div class="muted">${esc(a.short)}</div></div></div>
      <div class="layout-2">
        <article class="prose card" id="art">${MD.render(body)}</article>
        <div>
          <div class="card toc" style="margin-bottom:16px"><div class="card-title">Содержание</div><div id="toc"></div></div>
          <div class="card"><div class="card-title">Задачи (${ps.length})</div>
            ${ps.map(p => `<div class="row small" style="padding:5px 0;flex-wrap:nowrap"><button class="check ${rec(p.id) ? 'on' : ''}" style="width:16px;height:16px;font-size:10px" data-act="toggle" data-id="${p.id}">${rec(p.id) ? '✓' : ''}</button><a href="#/problem/${p.id}" style="flex:1">${esc(p.title)}</a>${diff(p.difficulty)}</div>`).join('') || '<div class="muted">Пока нет задач</div>'}
          </div>
        </div>
      </div>`;
    const art = $('#art');
    enhanceArticle(art);
    $('#toc').innerHTML = $$('h2', art).map(h => `<a href="#" data-to="${h.id}">${esc(h.textContent)}</a>`).join('');
    $$('[data-to]').forEach(l => l.onclick = e => { e.preventDefault(); document.getElementById(l.dataset.to).scrollIntoView({ behavior: 'smooth' }); });
  }

  // ----- add problem -----
  function viewAdd() {
    const cats = C.categories;
    app.innerHTML = `<h1>Добавить задачу</h1>
      <p class="muted" style="max-width:760px">Задача сохранится в базе и станет видна всем пользователям. Для постоянных задач удобнее файлы: <code>content/problems/…</code> и тесты в <code>content/judge/…</code> (см. CONTENT_FORMAT.md и JUDGE_FORMAT.md).</p>
      <form id="addf" class="card grid" style="max-width:900px">
        <div class="grid g3">
          <label class="field">Название *<input type="text" name="title" required placeholder="Two Sum"></label>
          <label class="field">id (slug) *<input type="text" name="id" required pattern="[a-z0-9][a-z0-9-]*" placeholder="two-sum"></label>
          <label class="field">Номер LeetCode<input type="number" name="leetcode" placeholder="1"></label>
        </div>
        <div class="grid g3">
          <label class="field">Сложность<select name="difficulty"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></label>
          <label class="field">Тема (категория)<input type="text" name="category" list="cats" placeholder="Arrays &amp; Hashing"><datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
          <label class="field">Списки (через запятую)<input type="text" name="lists" value="custom"></label>
        </div>
        <label class="field">Ссылка<input type="url" name="url" placeholder="https://leetcode.com/problems/…  (если пусто — по id и номеру LeetCode)"></label>
        <div class="field"><span class="muted small">Алгоритмы</span><div class="row" style="gap:6px">${C.algorithms.map(a => `<label class="tag" style="cursor:pointer"><input type="checkbox" name="algo" value="${a.id}" style="vertical-align:-2px"> ${esc(a.title)}</label>`).join('')}</div></div>
        <label class="field">Условие (markdown)<textarea name="description" rows="6" placeholder="Дан массив nums…"></textarea></label>
        <div id="sols"></div>
        <div class="row"><button type="button" id="addsol">＋ Ещё решение</button></div>
        <label class="field">Заготовка для редактора (Go)<textarea name="starter" rows="5" class="mono" spellcheck="false" placeholder="func twoSum(nums []int, target int) []int {&#10;&#10;}"></textarea></label>
        <label class="field">Тесты (Go, формат — JUDGE_FORMAT.md; без тестов задачу нельзя решать в редакторе)<textarea name="tests" rows="10" class="mono" spellcheck="false" placeholder="func judgeTests(t *Judge) {&#10;	t.Case(&quot;nums = [2 7 11 15], target = 9&quot;, []int{0, 1}, func() any { return twoSum([]int{2, 7, 11, 15}, 9) }, JAnyOrder)&#10;}"></textarea></label>
        <div class="row"><span class="spacer"></span><button class="primary" type="submit">Сохранить задачу</button></div>
        <div id="adderr" class="small" style="color:var(--hard)"></div>
      </form>`;
    const f = $('#addf');
    const addSol = () => {
      const n = $$('.solbox', f).length + 1;
      const d = document.createElement('div');
      d.className = 'card solbox'; d.style.background = 'var(--panel2)';
      d.innerHTML = `<div class="grid"><label class="field">Решение ${n}: название<input type="text" name="st" placeholder="Hash map, O(n)"></label>
        <label class="field">Пояснение (markdown)<textarea name="se" rows="3"></textarea></label>
        <label class="field">Код на Go<textarea name="sc" rows="10" class="mono" spellcheck="false" placeholder="func twoSum(nums []int, target int) []int {&#10;}"></textarea></label></div>`;
      $('#sols').appendChild(d);
    };
    addSol();
    $('#addsol').onclick = addSol;
    f.title.addEventListener('input', () => {
      if (!f.id.dataset.touched) f.id.value = f.title.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    });
    f.id.addEventListener('input', () => f.id.dataset.touched = 1);
    f.onsubmit = async e => {
      e.preventDefault();
      const body = {
        id: f.id.value.trim(), title: f.title.value.trim(), difficulty: f.difficulty.value,
        category: f.category.value.trim() || 'Мои задачи', url: f.url.value.trim(), leetcode: +f.leetcode.value || 0,
        lists: f.lists.value.split(',').map(s => s.trim()).filter(Boolean),
        algorithms: $$('[name=algo]:checked', f).map(x => x.value),
        description: f.description.value,
        solutions: $$('.solbox', f).map(b => ({ title: $('[name=st]', b).value, explanation: $('[name=se]', b).value, code: $('[name=sc]', b).value })),
        starter: f.starter.value, tests: f.tests.value,
      };
      try { await api('/api/problems', { method: 'POST', body }); }
      catch (err) { $('#adderr').textContent = err.message; return; }
      toast('Задача сохранена');
      await loadAll();
      location.hash = '#/problem/' + body.id;
    };
  }

  // ----- settings -----
  function viewSettings() {
    app.innerHTML = `<h1>Настройки</h1>
      <div class="grid g2" style="align-items:start">
        <div class="card grid">
          <div class="card-title">Интервальное повторение</div>
          <label class="field">Дни повторения после решения (через запятую)<input type="text" id="offs" value="${offs().join(', ')}"></label>
          <div class="small muted">По умолчанию 1, 3, 6, 11: повтор на следующий день, через 3, 6 и 11 дней после решения. Если повторение сделано с опозданием, следующие этапы сдвигаются, сохраняя промежутки. «Не вспомнил» — цикл начинается заново.</div>
          <label class="row"><input type="checkbox" id="hide" ${P.settings.hideSolutions !== false ? 'checked' : ''}> Скрывать эталонные решения до нажатия кнопки</label>
          <label class="field">Тема<select id="theme"><option value="dark">Тёмная</option><option value="light" ${P.settings.theme === 'light' ? 'selected' : ''}>Светлая</option></select></label>
          <div><button class="primary" id="saveset">Сохранить</button></div>
        </div>
        <div class="card grid">
          <div class="card-title">Аккаунт</div>
          <div class="small muted">${esc(ME.email)} · с нами с ${SRS.human(SRS.fmt(new Date(ME.createdAt)))}${ME.admin ? ' · администратор' : ''}</div>
          <label class="field">Имя<input type="text" id="acc-name" maxlength="60" value="${esc(ME.name)}"></label>
          <div><button id="acc-save-name">Сохранить имя</button></div>
          <div class="card-title" style="margin-top:6px">Смена пароля</div>
          <label class="field">Текущий пароль<input type="password" id="acc-old" autocomplete="current-password"></label>
          <label class="field">Новый пароль (от 8 символов)<input type="password" id="acc-new" autocomplete="new-password" minlength="8"></label>
          <div class="row"><button id="acc-pass">Сменить пароль</button><span class="spacer"></span><button class="ghost small" id="acc-others">Выйти на других устройствах</button></div>
          <div><button class="ghost" id="acc-logout">Выйти из аккаунта</button></div>
        </div>
        <div class="card grid">
          <div class="card-title">Данные</div>
          <div class="small muted">Прогресс, черновики и история отправок хранятся на сервере в вашем аккаунте и доступны с любого устройства. Экспорт — резервная копия прогресса повторений.</div>
          <div class="row"><button id="exp">Экспорт JSON</button><label class="btn">Импорт JSON<input type="file" id="imp" accept=".json" hidden></label><span class="spacer"></span><button class="danger" id="wipe">Сбросить весь прогресс</button></div>
          <div class="card-title" style="margin-top:10px">Контент</div>
          <div class="small muted">${C.problems.length} задач (с тестами для редактора — ${C.problems.filter(p => p.hasTests).length}), ${C.algorithms.length} статей.</div>
          ${ME.admin ? ((C.errors || []).length ? `<div class="card warn small">${C.errors.map(esc).join('<br>')}</div>` : '<div class="small" style="color:var(--accent)">Ошибок в контенте нет</div>') : ''}
        </div>
      </div>`;
    const updMe = async (body, okMsg) => {
      try { ME = await api('/api/me', { method: 'PATCH', body }); renderUser(); toast(okMsg); return true; }
      catch (e) { toast(e.message); return false; }
    };
    $('#acc-save-name').onclick = () => updMe({ name: $('#acc-name').value }, 'Имя сохранено');
    $('#acc-pass').onclick = async () => {
      if (await updMe({ oldPassword: $('#acc-old').value, newPassword: $('#acc-new').value }, 'Пароль изменён, остальные сессии завершены')) {
        $('#acc-old').value = $('#acc-new').value = '';
      }
    };
    $('#acc-logout').onclick = () => $('#logout').click();
    $('#acc-others').onclick = () => updMe({ logoutOther: true }, 'Остальные сессии завершены');
    $('#saveset').onclick = () => {
      const o = $('#offs').value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0);
      const okOrder = o.every((x, i) => i === 0 || x > o[i - 1]);
      if (!o.length || !okOrder) { toast('Нужны возрастающие положительные числа'); return; }
      P.settings.offsets = o;
      P.settings.hideSolutions = $('#hide').checked;
      P.settings.theme = $('#theme').value;
      save(); toast('Сохранено');
    };
    $('#exp').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(P, null, 1)], { type: 'application/json' }));
      a.download = `algotrain-progress-${T()}.json`; a.click();
    };
    $('#imp').onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const j = JSON.parse(await file.text());
        if (!j.problems) throw new Error('нет поля problems');
        if (!confirm('Заменить текущий прогресс импортированным?')) return;
        P = j; P.settings = P.settings || {}; save(); toast('Импортировано'); route();
      } catch (err) { toast('Ошибка импорта: ' + err.message); }
    };
    $('#wipe').onclick = () => {
      if (!confirm('Удалить весь прогресс повторений? Это нельзя отменить (сделайте сначала экспорт). История отправок решений останется.')) return;
      P.problems = {}; save(); toast('Прогресс сброшен');
    };
  }

  // ----- тренажёр кода -----
  const DRAFTS = {};   // id → текущий код (в памяти)
  const RESULTS = {};  // id → последний результат проверки
  const SUBLIST = {};  // id → список отправок (кэш)
  const solveTab = {};
  let editor = null, running = false, draftTimer;
  const lsKey = id => `algotrain:draft:${ME.id}:${id}`;
  function lsGet(id) { try { return JSON.parse(localStorage.getItem(lsKey(id)) || 'null'); } catch (_) { return null; } }
  function lsSet(id, code) { try { localStorage.setItem(lsKey(id), JSON.stringify({ code, t: Date.now() })); } catch (_) { } }

  async function loadDraft(p) {
    if (DRAFTS[p.id] != null) return DRAFTS[p.id];
    let code = null, t = 0;
    try {
      const d = await api('/api/drafts/' + encodeURIComponent(p.id));
      if (d.code != null) { code = d.code; t = d.updatedAt; }
    } catch (e) { if (e instanceof AuthError) throw e; }
    const l = lsGet(p.id); // локальная копия новее серверной — сервер мог не успеть сохранить
    if (l && l.t > t) code = l.code;
    if (code == null) code = p.starter || '';
    return (DRAFTS[p.id] = code);
  }
  function saveDraft(id, code, now) {
    DRAFTS[id] = code;
    lsSet(id, code);
    clearTimeout(draftTimer);
    const go = () => api('/api/drafts/' + encodeURIComponent(id), { method: 'PUT', body: { code } })
      .then(() => { const s = $('#ed-saved'); if (s) s.textContent = 'черновик сохранён'; })
      .catch(() => { const s = $('#ed-saved'); if (s) s.textContent = 'черновик сохранён локально'; });
    if (now) go(); else draftTimer = setTimeout(go, 1500);
  }

  function linkifyLines(text) {
    return esc(text).replace(/solution\.go:(\d+)(?::(\d+))?/g, (m, l, c) => `<a href="#" class="jump" data-line="${l}" data-col="${c || 1}">строка ${l}${c ? ':' + c : ''}</a>`);
  }

  function resultHTML(res, mode, id, history) {
    const isRun = mode === 'run';
    const ok = res.status === 'accepted';
    let h = `<div class="res ${(STATUS_SUB[res.status] || [0, 'warn'])[1]}">
      <div class="res-head">${subPill(res.status)}
        <span>${res.status === 'compile_error' ? '' : `${isRun ? 'Примеры' : 'Тесты'}: <b>${res.passed}</b> из ${res.total}`}</span>
        <span class="spacer"></span>
        <span class="small muted">${res.status === 'compile_error' ? `компиляция ${res.compileMs} мс` : `выполнение ${res.timeMs} мс · компиляция ${res.compileMs} мс`}</span></div>`;
    if (ok && isRun) h += `<div class="small" style="margin-top:6px">Примеры пройдены — отправьте решение, чтобы проверить на всех тестах.</div>`;
    if (res.compile) h += `<pre class="res-pre">${linkifyLines(res.compile)}</pre>`;
    if (res.error && res.status !== 'compile_error') h += `<pre class="res-pre">${linkifyLines(res.error)}</pre>`;
    const cases = res.cases || [];
    if (cases.length && !isRun) {
      h += `<div class="case-strip">${cases.map(c => `<i class="${c.ok ? 'ok' : 'bad'}" title="Тест ${c.i + 1}${c.ok ? '' : ' — не пройден'}"></i>`).join('')}</div>`;
    }
    const shown = isRun ? cases : cases.filter(c => !c.ok).slice(0, 5);
    h += shown.map(c => `<details class="case" ${!c.ok || isRun ? 'open' : ''}>
        <summary>${c.ok ? '<span class="ok-t">✓</span>' : '<span class="bad-t">✗</span>'} Тест ${c.i + 1}<span class="spacer"></span><span class="dim small">${c.ms != null && (c.ok || c.got) ? c.ms + ' мс' : ''}</span></summary>
        ${c.input ? `<div class="kv"><span>Вход</span><code>${esc(c.input)}</code></div>` : ''}
        ${c.want ? `<div class="kv"><span>Ожидалось</span><code>${esc(c.want)}</code></div>` : ''}
        ${c.got || (c.ok === false && !c.err) ? `<div class="kv"><span>Получено</span><code class="${c.ok ? '' : 'bad-t'}">${esc(c.got || '')}</code></div>` : ''}
        ${c.err ? `<div class="kv"><span>Ошибка</span><code class="bad-t">${linkifyLines(c.err)}</code></div>` : ''}
      </details>`).join('');
    if (!isRun && cases.filter(c => !c.ok).length > 5) h += `<div class="small muted">…и ещё ${cases.filter(c => !c.ok).length - 5} непройденных тестов</div>`;
    if (res.stdout) h += `<div class="small muted" style="margin-top:10px">Вывод программы (stdout)</div><pre class="res-pre">${esc(res.stdout)}</pre>`;
    if (ok && !isRun && id && !history) {
      const s = st(id);
      let act = '';
      if (s === 'new') act = `<button class="primary" data-act="solve" data-id="${id}">✓ Отметить решённой</button><span class="small muted">повторения встанут на ${offs().map(x => '+' + x).join(', ')} день</span>`;
      else if (s === 'due' || s === 'overdue') act = `<button class="ok" data-act="ok" data-id="${id}">✓ Засчитать повторение</button>`;
      else act = `<button data-act="practice" data-id="${id}">Записать практику</button><span class="small muted">следующее повторение ${rec(id) && rec(id).due ? SRS.rel(rec(id).due) : 'не запланировано'}</span>`;
      h += `<div class="srs-box row">Решение принято 🎉 ${act}</div>`;
    }
    return h + '</div>';
  }

  function renderResult(id) {
    const box = $('#ed-result');
    if (!box) return;
    const R = RESULTS[id];
    if (editor) editor.setErrors({});
    if (!R) { box.innerHTML = ''; return; }
    if (R.pending) { box.innerHTML = `<div class="res"><div class="res-head"><span class="spin"></span> ${R.mode === 'run' ? 'Запускаю на примерах…' : 'Проверяю на всех тестах…'}</div></div>`; return; }
    if (R.error) { box.innerHTML = `<div class="res bad"><div class="res-head">Не удалось проверить</div><div class="small">${esc(R.error)}</div></div>`; return; }
    box.innerHTML = resultHTML(R.result, R.mode, R.srsDone ? null : id);
    if (R.result.compile && editor) {
      const errs = {};
      for (const m of R.result.compile.matchAll(/solution\.go:(\d+)(?::\d+)?: (.*)/g)) errs[+m[1]] = (errs[+m[1]] ? errs[+m[1]] + '\n' : '') + m[2];
      editor.setErrors(errs);
    }
  }

  async function runCode(id, mode) {
    if (running || !editor) return;
    const code = editor.value;
    if (!code.trim()) { toast('Пустой код'); return; }
    saveDraft(id, code);
    running = true;
    RESULTS[id] = { mode, pending: true };
    $$('#ed-run, #ed-submit').forEach(b => b.disabled = true);
    renderResult(id);
    try {
      const j = await api('/api/run/' + encodeURIComponent(id), { method: 'POST', body: { code, mode } });
      RESULTS[id] = { mode, result: j.result };
      if (j.submission) {
        const s = SUBS[id] || { count: 0, accepted: false };
        s.count++; s.accepted = s.accepted || j.submission.status === 'accepted'; s.last = j.submission.createdAt;
        SUBS[id] = s;
        if (SUBLIST[id]) SUBLIST[id].unshift(j.submission);
      }
    } catch (e) {
      RESULTS[id] = { mode, error: e.message };
    }
    running = false;
    if (route._last === 'solve/' + id) {
      $$('#ed-run, #ed-submit').forEach(b => b.disabled = false);
      renderResult(id);
      const badge = $('#solve-badge'); if (badge) badge.innerHTML = codeBadge(id);
      if ((solveTab[id] || 'desc') === 'subs') renderSolveTab(id);
      const r = $('#ed-result'); if (r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  async function renderSolveTab(id) {
    const p = byId[id], tab = solveTab[id] || 'desc';
    const body = $('#stab-body');
    if (!body) return;
    $$('[data-stab]').forEach(b => b.classList.toggle('active', b.dataset.stab === tab));
    if (tab === 'desc') {
      body.innerHTML = `<div class="prose">${MD.render(p.description)}</div>
        <div class="small muted" style="margin-top:14px"><a href="#/problem/${id}">Страница задачи</a> — график повторений, заметки, алгоритмы.</div>`;
    } else if (tab === 'sols') {
      const hide = P.settings.hideSolutions !== false && !shownSolutions.has(id);
      body.innerHTML = hide
        ? `<div class="spoiler">Эталонные решения скрыты, чтобы сначала решить самому.<div style="margin-top:12px"><button id="show-sol2">Показать ${p.solutions.length}</button></div></div>`
        : `<div class="tabs">${p.solutions.map((x, i) => `<button data-tab="${i}" class="${i === 0 ? 'active' : ''}">${esc(x.title)}</button>`).join('')}</div>
           ${p.solutions.map((x, i) => `<div class="sol prose" data-pane="${i}" ${i ? 'hidden' : ''}>${MD.render(x.explanation)}${MD.codeBlock(x.code, x.lang)}</div>`).join('')}`;
      const sb = $('#show-sol2'); if (sb) sb.onclick = () => { shownSolutions.add(id); renderSolveTab(id); };
      $$('[data-tab]', body).forEach(b => b.onclick = () => {
        $$('[data-tab]', body).forEach(x => x.classList.toggle('active', x === b));
        $$('[data-pane]', body).forEach(x => x.hidden = x.dataset.pane !== b.dataset.tab);
      });
    } else {
      if (!SUBLIST[id]) {
        body.innerHTML = '<div class="muted">Загрузка…</div>';
        try { SUBLIST[id] = await api('/api/submissions?limit=100&problem=' + encodeURIComponent(id)); }
        catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
        if ((solveTab[id] || 'desc') !== 'subs' || !$('#stab-body')) return;
      }
      const list = SUBLIST[id];
      body.innerHTML = list.length ? `<div class="small muted" style="margin-bottom:8px">Отправок: ${list.length}${list.some(s => s.status === 'accepted') ? ' · есть принятое решение' : ''}. Нажмите на отправку, чтобы посмотреть код.</div>
        <div class="sub-list">${list.map(s => `<div class="sub-row" data-sid="${s.id}">${subPill(s.status)}<span>${s.passed}/${s.total}</span><span class="dim small">${s.status === 'compile_error' ? '' : s.timeMs + ' мс'}</span><span class="spacer"></span><span class="muted small">${ago(s.createdAt)}</span></div><div class="sub-detail" id="sd-${s.id}" hidden></div>`).join('')}</div>`
        : '<div class="empty">Отправок пока нет. Напишите решение и нажмите «Отправить» — оно проверится на всех тестах и попадёт сюда.</div>';
      $$('[data-sid]', body).forEach(row => row.onclick = async () => {
        const d = $('#sd-' + row.dataset.sid);
        if (!d.hidden) { d.hidden = true; return; }
        d.hidden = false;
        d.innerHTML = '<div class="muted small">Загрузка…</div>';
        try {
          const j = await api('/api/submissions/' + row.dataset.sid);
          d.innerHTML = `<div class="row" style="margin:6px 0"><button class="small" data-load>⤓ Загрузить в редактор</button><a class="small" href="#/submission/${j.submission.id}">Открыть отдельно</a></div>
            ${MD.codeBlock(j.submission.code, 'go')}${resultHTML(j.result, 'submit', id, true)}`;
          $('[data-load]', d).onclick = () => {
            if (editor && editor.value !== j.submission.code && !confirm('Заменить код в редакторе кодом этой отправки?')) return;
            editor.value = j.submission.code; saveDraft(id, j.submission.code); toast('Код загружен в редактор');
          };
        } catch (e) { d.innerHTML = `<div class="small" style="color:var(--hard)">${esc(e.message)}</div>`; }
      });
    }
  }

  async function viewSolve(id) {
    const p = byId[id];
    if (!p) { app.innerHTML = `<div class="empty">Задача «${esc(id)}» не найдена</div>`; return; }
    if (!p.hasTests) { app.innerHTML = `<div class="empty">Для задачи «${esc(p.title)}» пока нет тестов. <a href="#/problem/${id}">К задаче</a></div>`; return; }
    const withTests = C.problems.filter(q => q.hasTests);
    const idx = withTests.indexOf(p);
    const prev = withTests[idx - 1], next = withTests[idx + 1];
    app.innerHTML = `
      <div class="row solve-head">
        <a href="#/problem/${id}" class="small">← Задача</a>
        <h2 style="margin:0">${p.leetcode ? `<span class="dim">${p.leetcode}.</span> ` : ''}${esc(p.title)}</h2>
        ${diff(p.difficulty)} ${pill(st(id))} <span id="solve-badge">${codeBadge(id)}</span>
        <span class="spacer"></span>
        ${prev ? `<a class="small" href="#/solve/${prev.id}" title="${esc(prev.title)}">‹ пред.</a>` : ''}
        ${next ? `<a class="small" href="#/solve/${next.id}" title="${esc(next.title)}">след. ›</a>` : ''}
      </div>
      <div class="solve">
        <section class="card solve-left">
          <div class="tabs"><button data-stab="desc">Условие</button><button data-stab="subs">Мои отправки</button><button data-stab="sols">Решения</button></div>
          <div id="stab-body"></div>
        </section>
        <section class="solve-right">
          <div class="ed-toolbar row">
            <span class="small muted">Go</span><span id="ed-saved" class="small dim"></span>
            <span class="spacer"></span>
            <button class="ghost small" id="ed-reset" title="Вернуть исходную заготовку">↺ Заготовка</button>
            <button id="ed-run" title="Ctrl+'">▶ Запустить</button>
            <button class="primary" id="ed-submit" title="Ctrl+Enter">Отправить</button>
          </div>
          <div id="ed-host"><div class="ed ed-loading">Загрузка…</div></div>
          <div class="small dim ed-hint">Ctrl+' — запустить на примерах · Ctrl+Enter — отправить на все тесты · Ctrl+/ — комментарий · Tab / Shift+Tab — отступ. <code>package</code> и импорты стандартной библиотеки добавляются сами.</div>
          <div id="ed-result"></div>
        </section>
      </div>`;
    $$('[data-stab]').forEach(b => b.onclick = () => { solveTab[id] = b.dataset.stab; renderSolveTab(id); });
    renderSolveTab(id);
    const here = route._last;
    let code;
    try { code = await loadDraft(p); } catch (e) { return; }
    if (route._last !== here) return;
    editor = Editor.create($('#ed-host'), {
      value: code,
      onChange: v => { saveDraft(id, v); $('#ed-saved').textContent = ''; },
      onRun: () => runCode(id, 'run'),
      onSubmit: () => runCode(id, 'submit'),
      onSave: () => saveDraft(id, editor.value, true),
    });
    $('#ed-run').onclick = () => runCode(id, 'run');
    $('#ed-submit').onclick = () => runCode(id, 'submit');
    $('#ed-reset').onclick = () => {
      if (editor.value !== p.starter && !confirm('Заменить код исходной заготовкой? Текущий код останется в истории, только если вы его отправляли.')) return;
      editor.value = p.starter || ''; saveDraft(id, editor.value);
    };
    if (running) $$('#ed-run, #ed-submit').forEach(b => b.disabled = true);
    renderResult(id);
    $('#ed-result').addEventListener('click', e => {
      const j = e.target.closest('[data-line]');
      if (j) { e.preventDefault(); editor.gotoLine(+j.dataset.line, +j.dataset.col || 1); }
    });
    if (!('ontouchstart' in window)) editor.focus();
  }

  // ----- все отправки -----
  async function viewSubmissions() {
    app.innerHTML = '<h1>Мои отправки</h1><div class="muted">Загрузка…</div>';
    const here = route._last;
    let list;
    try { list = await api('/api/submissions?limit=200'); } catch (e) { app.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    if (route._last !== here) return;
    const acc = new Set(list.filter(s => s.status === 'accepted').map(s => s.problemId));
    app.innerHTML = `<div class="row" style="margin-bottom:16px"><h1 style="margin:0">Мои отправки</h1><span class="muted">последние ${list.length} · принято задач: ${Object.values(SUBS).filter(s => s.accepted).length}</span></div>
      ${list.length ? `<div class="card" style="overflow-x:auto"><table class="plist"><thead><tr><th>Когда</th><th>Задача</th><th>Статус</th><th>Тесты</th><th>Время</th><th></th></tr></thead><tbody>
      ${list.map(s => {
      const p = byId[s.problemId];
      return `<tr><td class="small muted" style="white-space:nowrap">${ago(s.createdAt)}</td>
          <td class="ttl"><a href="#/submission/${s.id}">${esc(p ? p.title : s.problemId)}</a> ${acc.has(s.problemId) && s.status !== 'accepted' ? '' : ''}</td>
          <td>${subPill(s.status)}</td><td>${s.passed}/${s.total}</td><td class="small muted">${s.status === 'compile_error' ? '—' : s.timeMs + ' мс'}</td>
          <td style="white-space:nowrap"><a class="small" href="#/solve/${s.problemId}">⌨ решать</a></td></tr>`;
    }).join('')}</tbody></table></div>`
        : '<div class="empty">Пока нет ни одной отправки. Откройте любую задачу и нажмите «Решать в редакторе».</div>'}`;
  }

  async function viewSubmission(sid) {
    app.innerHTML = '<div class="muted">Загрузка…</div>';
    const here = route._last;
    let j;
    try { j = await api('/api/submissions/' + encodeURIComponent(sid)); } catch (e) { app.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    if (route._last !== here) return;
    const s = j.submission, p = byId[s.problemId];
    app.innerHTML = `<div class="row small muted" style="margin-bottom:10px"><a href="#/submissions">← Все отправки</a></div>
      <div class="row" style="margin-bottom:14px"><h1 style="margin:0">${esc(p ? p.title : s.problemId)}</h1>${subPill(s.status)}<span class="muted">${ago(s.createdAt)}</span><span class="spacer"></span>
        <button id="to-editor">⤓ Открыть в редакторе</button></div>
      <div class="layout-2">
        <div class="card">${MD.codeBlock(s.code, 'go')}</div>
        <div>${resultHTML(j.result, 'submit', s.problemId, true)}</div>
      </div>`;
    $('#to-editor').onclick = () => {
      if (DRAFTS[s.problemId] != null && DRAFTS[s.problemId] !== s.code && !confirm('Заменить текущий черновик в редакторе кодом этой отправки?')) return;
      saveDraft(s.problemId, s.code, true);
      location.hash = '#/solve/' + s.problemId;
    };
  }

  // ----- вход и регистрация -----
  function showAuth(mode) {
    mode = mode || 'login';
    document.body.classList.add('guest');
    const reg = mode === 'register';
    app.innerHTML = `<div class="auth">
      <div class="auth-intro">
        <div class="brand big"><span class="logo"><svg viewBox="0 0 32 32"><path d="M7 22l5-12 4 8 3-5 4 9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>AlgoTrain</span></div>
        <h1>Подготовка к алгоритмическим собеседованиям на Go</h1>
        <ul class="auth-feat">
          <li><b>NeetCode 150</b> — условия, подсказки и несколько эталонных решений на Go</li>
          <li><b>Редактор кода</b> — решайте прямо в браузере, решения проверяются на тестах</li>
          <li><b>История отправок</b> — все попытки по каждой задаче с кодом и результатами</li>
          <li><b>Интервальные повторения</b> — +1, +3, +6, +11 дней, календарь и прогноз нагрузки</li>
          <li><b>Статьи об алгоритмах</b> — история, анимации, применение в бигтехе, финтехе и геймдеве</li>
        </ul>
      </div>
      <form class="card auth-card grid" id="authf" novalidate>
        <div class="tabs"><button type="button" data-am="login" class="${reg ? '' : 'active'}">Вход</button><button type="button" data-am="register" class="${reg ? 'active' : ''}">Регистрация</button></div>
        <label class="field">Email<input type="email" name="email" autocomplete="email" required></label>
        ${reg ? '<label class="field">Имя<input type="text" name="name" autocomplete="nickname" maxlength="60" placeholder="как к вам обращаться"></label>' : ''}
        <label class="field">Пароль<input type="password" name="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="${reg ? 8 : 1}"></label>
        ${reg ? '<div class="small muted">Не короче 8 символов.</div>' : ''}
        <button class="primary" type="submit">${reg ? 'Создать аккаунт' : 'Войти'}</button>
        <div id="autherr" class="small" style="color:var(--hard);min-height:1em"></div>
      </form>
    </div>`;
    $$('[data-am]').forEach(b => b.onclick = () => showAuth(b.dataset.am));
    const f = $('#authf');
    f.email.focus();
    f.onsubmit = async e => {
      e.preventDefault();
      const btn = $('button[type=submit]', f);
      btn.disabled = true;
      try {
        const body = { email: f.email.value, password: f.password.value };
        if (reg) body.name = f.name.value;
        ME = await api('/api/auth/' + (reg ? 'register' : 'login'), { method: 'POST', body, allow401: true });
        await start();
      } catch (err) {
        $('#autherr').textContent = err.message;
        btn.disabled = false;
      }
    };
  }

  function renderUser() {
    const box = $('#user-box');
    if (!ME) { box.innerHTML = ''; return; }
    box.innerHTML = `<a href="#/settings" class="user-name" title="${esc(ME.email)}">${esc(ME.name || ME.email)}</a><button class="ghost small" id="logout" title="Выйти">Выйти</button>`;
    $('#logout').onclick = async () => {
      await flushSave(false);
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) { }
      ME = null; P = {}; SUBS = {};
      for (const o of [DRAFTS, RESULTS, SUBLIST]) for (const k in o) delete o[k];
      renderUser();
      showAuth();
    };
    $('#nav-add').hidden = !ME.admin;
  }

  async function start() {
    document.body.classList.remove('guest');
    renderUser();
    app.innerHTML = '<div class="loading">Загрузка…</div>';
    await loadAll();
    route._last = null;
    route();
  }

  // ---------- router ----------
  function route() {
    if (!ME) { showAuth(); return; }
    const h = location.hash.replace(/^#\/?/, '');
    const [view, a, b] = h.split('/');
    const navMap = { '': 'today', problem: 'problems', solve: 'problems', algo: 'algorithms', submission: 'submissions' };
    $$('#nav a').forEach(l => l.classList.toggle('active', l.dataset.route === (navMap[view] || view)));
    const keepScroll = route._last === h;
    route._last = h;
    const y = window.scrollY;
    document.body.classList.toggle('wide', view === 'solve');
    if (view !== 'solve') editor = null;
    switch (view) {
      case '': viewToday(); break;
      case 'problems': viewProblems(); break;
      case 'problem': viewProblem(decodeURIComponent(a)); break;
      case 'solve': viewSolve(decodeURIComponent(a)); break;
      case 'submissions': viewSubmissions(); break;
      case 'submission': viewSubmission(a); break;
      case 'calendar': viewCalendar(a, b); break;
      case 'algorithms': viewAlgorithms(); break;
      case 'algo': viewAlgo(a); break;
      case 'add': if (ME.admin) viewAdd(); else app.innerHTML = '<div class="empty">Добавлять задачи может только администратор</div>'; break;
      case 'settings': viewSettings(); break;
      default: app.innerHTML = '<div class="empty">Страница не найдена</div>';
    }
    if (keepScroll) window.scrollTo(0, y); else if (view !== 'calendar' || !b) window.scrollTo(0, 0);
    updateChrome();
  }
  window.addEventListener('hashchange', route);
  $('#theme-toggle').onclick = () => {
    const t = (document.documentElement.dataset.theme || 'dark') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('algotrain:theme', t); } catch (_) { }
    document.documentElement.dataset.theme = t;
    if (ME) { P.settings.theme = t; save(); }
  };
  try { const t = localStorage.getItem('algotrain:theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) { }

  // смена дня, если вкладка открыта через полночь
  let day = SRS.today();
  setInterval(() => { if (SRS.today() !== day && ME) { day = SRS.today(); route(); } }, 60000);

  (async () => {
    try { ME = await api('/api/me', { allow401: true }); } catch (e) {
      ME = null;
      if (!/войти/.test(e.message)) { app.innerHTML = `<div class="empty">Не удалось связаться с сервером: ${esc(e.message)}</div>`; return; }
    }
    if (!ME) { showAuth(); return; }
    try { await start(); } catch (e) { if (!(e instanceof AuthError)) app.innerHTML = `<div class="empty">Не удалось загрузить данные: ${esc(e.message)}</div>`; }
  })();
})();
