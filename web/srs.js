// Интервальное повторение.
// После первого решения задачи (день D) повторения назначаются на
// D+1, D+3, D+6, D+11 (смещения настраиваются). Если повторение сделано
// с опозданием, следующие сдвигаются, сохраняя промежутки между этапами.
// «Не вспомнил» — цикл начинается заново от сегодняшнего дня.
(function () {
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => fmt(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000); // b - a
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const human = s => { const d = parse(s); return `${d.getDate()} ${MONTHS_G[d.getMonth()]}`; };
  const rel = s => {
    const n = diffDays(today(), s);
    if (n === 0) return 'сегодня';
    if (n === 1) return 'завтра';
    if (n === -1) return 'вчера';
    if (n > 0) return `через ${n} дн.`;
    return `${-n} дн. назад`;
  };

  const DEFAULT_OFFSETS = [1, 3, 6, 11];

  function offsets(progress) {
    const o = progress && progress.settings && progress.settings.offsets;
    return Array.isArray(o) && o.length ? o : DEFAULT_OFFSETS;
  }
  function gap(progress, stage) {
    const o = offsets(progress);
    return stage === 0 ? o[0] : o[stage] - o[stage - 1];
  }

  // rec: { stage, start, last, due, history:[{d,t,ok?}], notes }
  function solve(progress, id, date = today()) {
    const recs = progress.problems || (progress.problems = {});
    const r = recs[id] || (recs[id] = { history: [] });
    r.stage = 0; r.start = date; r.last = date; r.due = addDays(date, gap(progress, 0));
    r.history.push({ d: date, t: 'solve' });
    return r;
  }

  function review(progress, id, ok, date = today()) {
    const r = progress.problems[id];
    if (!r || r.due == null) return r;
    const n = offsets(progress).length;
    if (ok) {
      r.history.push({ d: date, t: 'review', stage: r.stage + 1, ok: true });
      r.stage += 1; r.last = date;
      r.due = r.stage >= n ? null : addDays(date, gap(progress, r.stage));
    } else {
      r.history.push({ d: date, t: 'review', stage: r.stage + 1, ok: false });
      r.stage = 0; r.start = date; r.last = date; r.due = addDays(date, gap(progress, 0));
    }
    return r;
  }

  function reset(progress, id) { delete progress.problems[id]; }

  function status(progress, rec, t = today()) {
    if (!rec || !rec.start) return 'new';
    if (rec.due == null) return 'mastered';
    const d = diffDays(t, rec.due);
    if (d < 0) return 'overdue';
    if (d === 0) return 'due';
    return 'learning';
  }

  // Полная «лестница»: этап 0 (решение) + N повторений с датами.
  // Для пройденных этапов — фактические даты, для будущих — прогноз.
  function ladder(progress, rec, t = today()) {
    const o = offsets(progress);
    const steps = [{ stage: 0, label: 'Решено', date: rec ? rec.start : null, state: rec && rec.start ? 'done' : 'future' }];
    if (!rec || !rec.start) {
      o.forEach((off, i) => steps.push({ stage: i + 1, label: '+' + off, date: null, state: 'future' }));
      return steps;
    }
    // фактические успешные повторения после последнего старта
    const done = rec.history.filter(h => h.t === 'review' && h.ok && h.d >= rec.start);
    const doneByStage = {};
    for (const h of done) doneByStage[h.stage] = h.d;
    let cursor = rec.due;
    o.forEach((off, i) => {
      const st = i + 1;
      if (st <= rec.stage) {
        steps.push({ stage: st, label: '+' + off, date: doneByStage[st] || null, state: 'done' });
      } else if (st === rec.stage + 1) {
        const s = status(progress, rec, t);
        steps.push({ stage: st, label: '+' + off, date: rec.due, state: s === 'overdue' ? 'overdue' : s === 'due' ? 'due' : 'next' });
        cursor = rec.due;
      } else {
        // прогноз: если предыдущий будет сделан вовремя (или сегодня, если просрочен)
        const base = cursor < t ? t : cursor;
        cursor = addDays(base, gap(progress, st - 1));
        steps.push({ stage: st, label: '+' + off, date: cursor, state: 'future' });
      }
    });
    return steps;
  }

  // Все запланированные повторения (фактический due + прогноз последующих этапов).
  function schedule(progress, t = today()) {
    const out = [];
    for (const [id, rec] of Object.entries(progress.problems || {})) {
      if (!rec.start || rec.due == null) continue;
      for (const s of ladder(progress, rec, t)) {
        if (s.stage === 0 || s.state === 'done') continue;
        out.push({ id, stage: s.stage, date: s.date, projected: s.state === 'future', overdue: s.state === 'overdue' });
      }
    }
    return out;
  }

  // Активность по дням: {date: {count, events:[{id,t,ok,stage}]}}
  function activity(progress) {
    const map = {};
    for (const [id, rec] of Object.entries(progress.problems || {})) {
      for (const h of rec.history || []) {
        const a = map[h.d] || (map[h.d] = { count: 0, events: [] });
        a.count++;
        a.events.push({ id, ...h });
      }
    }
    return map;
  }

  function streak(progress) {
    const act = activity(progress);
    let d = today(), n = 0;
    if (!act[d]) d = addDays(d, -1);
    while (act[d]) { n++; d = addDays(d, -1); }
    return n;
  }

  window.SRS = {
    fmt, parse, today, addDays, diffDays, human, rel, MONTHS, MONTHS_G, WD, DEFAULT_OFFSETS,
    offsets, gap, solve, review, reset, status, ladder, schedule, activity, streak,
  };
})();
