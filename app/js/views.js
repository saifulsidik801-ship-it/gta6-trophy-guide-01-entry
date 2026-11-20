// Rendering for the Leonida Ledger: checklist, detail pane, roadmap, missables
// and sources views, all drawn from app/data/trophies.json. No network calls.
export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function trophyIsMasked(t, state) {
  return t.hidden && state.spoilers && !state.earned.has(t.name) && !state.revealed.has(t.name);
}

export function linkSources(text) {
  return escapeHtml(text).replace(/\[(\d+)\]/g, '<a class="src-ref" href="#src-$1" title="Source $1">[$1]</a>');
}

export function renderAudit(data) {
  const unconfirmed = data.trophies.filter((t) => t.note && t.note.startsWith('UNCONFIRMED')).length;
  return `<b>55 official</b> · 1P 2G 6S 46B · <b>28 hidden</b> · <b>55/55 cite a source</b> · 8 sources read 19–20 Nov 2026 · <span class="audit-warn">1 possibly missable</span> · ${unconfirmed} unconfirmed · ${data.disagreements.length} disagreements shown · 0 online · 1 playthrough · ~200–300 h`;
}

export function renderGradeCounters(data, state) {
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  return grades.map((g) => {
    const total = data.trophies.filter((t) => t.grade === g).length;
    const got = data.trophies.filter((t) => t.grade === g && state.earned.has(t.name)).length;
    const letter = g === 'platinum' ? 'P' : g.charAt(0).toUpperCase();
    return `<span><span class="grade-dot dot-${g}"></span><b>${got}/${total}</b> ${letter}</span>`;
  }).join(' · ');
}

const KIND_LABELS = {
  all: 'All', story: 'Story', side: 'Side quests', activities: 'Activities',
  crime: 'Crime', collectibles: 'Collectibles', money: 'Money', oddities: 'Oddities',
  completion: 'Platinum path', missable: 'Missable', hidden: 'Hidden',
};

export function renderKindChips(data, state) {
  const counts = { all: data.trophies.length };
  for (const t of data.trophies) counts[t.kind] = (counts[t.kind] || 0) + 1;
  counts.missable = data.trophies.filter((t) => t.missable).length;
  counts.hidden = data.trophies.filter((t) => t.hidden).length;
  const order = ['all', 'story', 'side', 'activities', 'crime', 'collectibles', 'money', 'oddities', 'completion', 'missable', 'hidden'];
  return order.map((k) => `<button type="button" class="chip${state.kind === k ? ' active' : ''}" data-kind="${k}">${KIND_LABELS[k]} <span class="n">${counts[k]}</span></button>`).join('');
}

function filteredTrophies(data, state) {
  const q = state.search.trim().toLowerCase();
  return data.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind === 'hidden' && !t.hidden) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && state.kind !== 'hidden' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedFilter === 'earned' && !state.earned.has(t.name)) return false;
    if (state.earnedFilter === 'remaining' && state.earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function renderChecklist(data, state) {
  const list = filteredTrophies(data, state);
  if (!list.length) return '<li class="masked">No trophies match these filters.</li>';
  return list.map((t) => {
    const earned = state.earned.has(t.name);
    const masked = trophyIsMasked(t, state);
    const name = masked ? 'Hidden trophy' : escapeHtml(t.name);
    const desc = masked ? 'Earn it to reveal its name and description.' : escapeHtml(t.description);
    const tags = [
      t.missable ? '<span class="tag missable">Missable</span>' : '',
      t.hidden ? '<span class="tag hidden-t">Hidden</span>' : '',
      t.note && t.note.startsWith('UNCONFIRMED') ? '<span class="tag unconfirmed">Unconfirmed</span>' : '',
    ].join('');
    return `<li data-trophy-id="${t.id}" class="${state.selectedId === t.id ? 'selected' : ''}${earned ? ' earned' : ''}">
      <input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${escapeHtml(t.name)} earned">
      <span><span class="t-name">${name}${tags}</span><span class="t-desc">${desc}</span></span>
      <span class="t-meta grade-${t.grade}"><span class="grade-dot"></span>${gradeLabel(t.grade)}${t.count ? `<br>${escapeHtml(t.count)}` : ''}</span>
    </li>`;
  }).join('');
}

export function renderDetail(data, state) {
  const t = data.trophies.find((x) => x.id === state.selectedId) || data.trophies[0];
  const masked = trophyIsMasked(t, state);
  const earned = state.earned.has(t.name);
  const head = `<div class="detail-head"><span class="grade-pill ${t.grade}">${gradeLabel(t.grade)}</span>
    <h2>${masked ? 'Hidden trophy' : escapeHtml(t.name)}</h2></div>
    <p class="official-desc">Official description: “${masked ? 'Hidden until earned.' : escapeHtml(t.description)}”</p>
    <p class="detail-meta"><b>${escapeHtml(KIND_LABELS[t.kind] || t.kind)}</b> · Roadmap ${escapeHtml(t.stage)} · Xbox ${escapeHtml(t.xbox)}${t.count ? ` · PSN count: <b>${escapeHtml(t.count)}</b>` : ''}${t.hidden ? ' · Hidden on PS5 until earned' : ''}</p>`;
  if (masked) {
    return head + `<div class="warn-box"><h3>Hidden trophy — spoilers on</h3>
      <p>This trophy is hidden on PlayStation until you earn it, and your spoiler setting is on, so its name, description and guide stay hidden here.</p>
      <p><button type="button" class="reveal-btn" data-reveal="${t.id}">Reveal this trophy</button> · or turn “Hide story trophies” off at the top of the page.</p></div>
      <div class="earn-row"><button type="button" class="primary" data-earn-btn="${t.id}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button></div>`;
  }
  const steps = t.steps.map((s) => `<li>${linkSources(s)}</li>`).join('');
  const counter = t.count
    ? `<div class="counter-box"><label>Your progress <input type="number" min="0" data-count="${t.id}" value="${state.counts[t.name] ?? 0}"></label><span>target: <b>${escapeHtml(t.count)}</b> (PSN count [5])</span></div>` : '';
  const warn = t.note
    ? `<div class="warn-box${t.note.startsWith('UNCONFIRMED') ? ' amber' : ''}"><h3>${t.note.startsWith('UNCONFIRMED') ? 'Not yet confirmed' : t.note.startsWith('POSSIBLY') ? 'Possibly missable' : t.note.startsWith('Warning') ? 'Warning' : 'Note'}</h3><p>${linkSources(t.note)}</p></div>` : '';
  const sources = t.sources.map((n) => {
    const s = data.sources.find((x) => x.n === n);
    return s ? `[${n}] ${escapeHtml(s.name)}` : `[${n}]`;
  }).join(' · ');
  return head + `<p class="guide-text">${linkSources(t.guide)}</p>
    <ol class="guide-steps">${steps}</ol>${counter}${warn}
    <p class="sources-line"><b>Sources:</b> ${sources} — see the Sources panel for the full list and links.</p>
    <div class="earn-row"><button type="button" class="primary" data-earn-btn="${t.id}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button></div>`;
}

export function renderRoadmap(data, state) {
  return data.roadmap.map((stage) => {
    const ts = stage.trophies.map((id) => data.trophies.find((t) => t.id === id)).filter(Boolean);
    const got = ts.filter((t) => state.earned.has(t.name)).length;
    const chips = ts.map((t) => `<button type="button" class="stage-trophy${state.earned.has(t.name) ? ' earned' : ''}" data-goto="${t.id}"><span class="grade-dot dot-${t.grade}"></span>${escapeHtml(t.name)}</button>`).join('');
    return `<article class="stage"><h3>${escapeHtml(stage.stage)} — ${escapeHtml(stage.title)}</h3>
      <p class="stage-meta">${escapeHtml(stage.time)} · ${got}/${ts.length} earned</p>
      <p>${escapeHtml(stage.advice)}</p><div class="stage-trophies">${chips}</div></article>`;
  }).join('');
}

export function renderMissables(data, state) {
  const pma = data.trophies.find((t) => t.name === 'Positive Mental Attitude');
  const unconfirmed = data.trophies.filter((t) => t.note && t.note.startsWith('UNCONFIRMED'));
  const steps = pma.steps.map((s) => `<li>${linkSources(s)}</li>`).join('');
  const watch = unconfirmed.map((t) => `<li><b>${escapeHtml(t.name)}</b> — ${linkSources(t.note)}</li>`).join('');
  return `<div class="miss-card"><h3>⚠ Positive Mental Attitude — the only possibly missable trophy</h3>
    <p>${linkSources(pma.guide)}</p><ol class="guide-steps">${steps}</ol>
    <p><b>Save advice:</b> keep a manual save at the start of every chapter and one before the final mission (15 manual slots plus one autosave) [2]. Do the Chapter 1 meditation, then keep that Chapter 1 save until this trophy pops [2].</p>
    <p><b>The count disagreement:</b> PowerPyx [1] says 18 spots; other guides say 15. The 100% checklist asks for only 15, so a missed Chapter 1 spot cannot cost you A Long Road [4][6] — but it might cost you this trophy, so do all 18.</p></div>
  <div class="miss-card"><h3>Watch list — not confirmed yet</h3>
    <p>Five trophies have no confirmed steps in any guide yet, plus one hunt whose animal is unknown. This guide shows the best-reported lead for each and marks it unconfirmed, rather than inventing steps.</p>
    <ul>${watch}</ul>
    <h3>Other warnings</h3>
    <ul><li><b>Cheats disable trophies and saving</b> — keep your trophy run cheat-free [6].</li>
    <li><b>Irredeemable profile is permanent</b> — when farming Actions Speak Louder, stop before the Irredeemable profile [1].</li>
    <li><b>No mission replay, no New Game+</b> — once a mission is done you cannot replay it [2].</li></ul></div>`;
}

export function renderSourcesPanel(data) {
  const list = data.sources.map((s) => `<li id="src-${s.n}"><b>${escapeHtml(s.name)}</b> — ${escapeHtml(s.title)}<br><span class="src-url">${escapeHtml(s.url)}</span><br>Used for: ${escapeHtml(s.usedFor)} Read ${escapeHtml(s.read)}.</li>`).join('');
  const disagree = data.disagreements.map((d) => `<li><b>${escapeHtml(d.title)}</b> ${escapeHtml(d.verdict)}</li>`).join('');
  return `<h2>Sources — read 19–20 Nov 2026</h2>
    <ol class="source-list">${list}</ol>
    <h3>Disagreements (${data.disagreements.length}) — both versions shown</h3>
    <ul class="disagree-mini">${disagree}</ul>
    <h3>Audit</h3>
    <p style="font-size:12.5px;color:var(--muted)">Rockstar has not published an official trophy list; these names and descriptions come from Exophase and PSNProfiles, which agree on all 55 [5]. Every guide here is written in our own words — a source is cited, never copied.</p>`;
}

export function renderSourcesFull(data) {
  const rows = data.sources.map((s) => `<tr><td><b>[${s.n}] ${escapeHtml(s.name)}</b></td><td><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a><br>${escapeHtml(s.title)}</td><td>${escapeHtml(s.usedFor)}</td><td>${escapeHtml(s.read)}</td></tr>`).join('');
  const disagree = data.disagreements.map((d) => `<li><b>${escapeHtml(d.title)}</b><br>${escapeHtml(d.a)} ${escapeHtml(d.b)}<br><b>How this guide handles it:</b> ${escapeHtml(d.verdict)}</li>`).join('');
  return `<div class="card"><h3>Every source this guide read</h3>
    <table><thead><tr><th>Source</th><th>Link &amp; title</th><th>Used for</th><th>Read</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="margin-top:8px">The official list itself [5] is Exophase and PSNProfiles, frozen 18 Nov 2026 and shipped in this app's data file — the two agree on every name, description and grade.</p></div>
  <div class="card"><h3>Where the sources disagree (${data.disagreements.length})</h3>
    <ul class="disagree-full">${disagree}</ul></div>
  <div class="card"><h3>How this guide was built</h3>
    <p>Each trophy's guide is written in our own words from the sources above, with the source number beside every specific location or step. A guide that repeats only the trophy's description adds nothing, so each one says what to do, where and how, and when it can be missed. Where no guide has confirmed the steps, this guide says so plainly and shows only the best-reported lead.</p></div>`;
}

export function renderNextUp(data, state) {
  const order = [];
  for (const stage of data.roadmap) for (const id of stage.trophies) order.push(id);
  const next = order.map((id) => data.trophies.find((t) => t.id === id)).find((t) => t && !state.earned.has(t.name));
  if (!next) return 'All 55 earned — Leonida Legend.';
  const stage = data.trophies.find((t) => t.id === next.id).stage;
  return `Next up in roadmap order: <b>${escapeHtml(next.name)}</b> · ${escapeHtml(stage)}`;
}
