// Leonida Ledger boot: load the trophy data, read the view from the URL
// (?view=roadmap|missables|sources, ?trophy=<id>, ?demo=1, ?spoilers=off),
// wire the tracker controls, and render.
import { loadProgress, saveProgress, loadCounts, saveCounts, exportProgress, parseProgressFile, seedDemoProgress } from './store.js';
import {
  renderAudit, renderGradeCounters, renderKindChips, renderChecklist, renderDetail,
  renderRoadmap, renderMissables, renderSourcesPanel, renderSourcesFull, renderNextUp,
} from './views.js';

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const validNames = new Set(doc.trophies.map((t) => t.name));

const state = {
  earned: params.get('demo') === '1' ? seedDemoProgress() : loadProgress(),
  counts: loadCounts(),
  kind: 'all',
  grade: 'all',
  earnedFilter: 'all',
  search: '',
  spoilers: params.get('spoilers') !== 'off',
  view: ['checklist', 'roadmap', 'missables', 'sources'].includes(params.get('view')) ? params.get('view') : 'checklist',
  selectedId: Number(params.get('trophy')) || 28,
  revealed: new Set(),
};
if (!doc.trophies.some((t) => t.id === state.selectedId)) state.selectedId = 28;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPane');

function renderAll() {
  $('earnedCount').textContent = state.earned.size;
  $('gradeCounters').innerHTML = renderGradeCounters(doc, state);
  $('progressFill').style.width = `${Math.round((state.earned.size / doc.trophies.length) * 100)}%`;
  $('auditStrip').innerHTML = renderAudit(doc);
  $('nextUp').innerHTML = renderNextUp(doc, state);
  $('kindChips').innerHTML = renderKindChips(doc, state);
  $('listHeading').textContent = `Checklist — ${doc.trophies.length} trophies`;
  listEl.innerHTML = renderChecklist(doc, state);
  detailEl.innerHTML = renderDetail(doc, state);
  $('roadmapStages').innerHTML = renderRoadmap(doc, state);
  $('missablesBody').innerHTML = renderMissables(doc, state);
  $('sourcesPanel').innerHTML = renderSourcesPanel(doc);
  $('sourcesFull').innerHTML = renderSourcesFull(doc);
  document.querySelectorAll('#viewTabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
  for (const v of ['checklist', 'roadmap', 'missables', 'sources']) $('view' + v.charAt(0).toUpperCase() + v.slice(1)).hidden = state.view !== v;
}

function setView(view) {
  state.view = view;
  renderAll();
  window.scrollTo({ top: 0 });
}

function selectTrophy(id) {
  state.selectedId = id;
  state.view = 'checklist';
  renderAll();
  const row = listEl.querySelector(`[data-trophy-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(id) {
  const t = doc.trophies.find((x) => x.id === id);
  if (!t) return;
  if (state.earned.has(t.name)) state.earned.delete(t.name);
  else state.earned.add(t.name);
  saveProgress(state.earned);
  renderAll();
}

$('spoilerToggle').checked = state.spoilers;
$('spoilerToggle').addEventListener('change', (e) => { state.spoilers = e.target.checked; renderAll(); });
$('searchBox').addEventListener('input', (e) => { state.search = e.target.value; listEl.innerHTML = renderChecklist(doc, state); });
$('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; listEl.innerHTML = renderChecklist(doc, state); });
$('earnedFilter').addEventListener('change', (e) => { state.earnedFilter = e.target.value; listEl.innerHTML = renderChecklist(doc, state); });
$('kindChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-kind]');
  if (!chip) return;
  state.kind = chip.dataset.kind;
  $('kindChips').innerHTML = renderKindChips(doc, state);
  listEl.innerHTML = renderChecklist(doc, state);
});
$('viewTabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-view]');
  if (tab) setView(tab.dataset.view);
});
listEl.addEventListener('click', (e) => {
  if (e.target.matches('[data-earn]')) return;
  const row = e.target.closest('[data-trophy-id]');
  if (row) selectTrophy(Number(row.dataset.trophyId));
});
listEl.addEventListener('change', (e) => {
  if (e.target.matches('[data-earn]')) toggleEarned(Number(e.target.dataset.earn));
});
detailEl.addEventListener('click', (e) => {
  const earn = e.target.closest('[data-earn-btn]');
  if (earn) { toggleEarned(Number(earn.dataset.earnBtn)); return; }
  const reveal = e.target.closest('[data-reveal]');
  if (reveal) { state.revealed.add(Number(reveal.dataset.reveal)); renderAll(); }
});
detailEl.addEventListener('change', (e) => {
  if (e.target.matches('[data-count]')) {
    const t = doc.trophies.find((x) => x.id === Number(e.target.dataset.count));
    if (t) { state.counts[t.name] = Number(e.target.value) || 0; saveCounts(state.counts); }
  }
});
$('roadmapStages').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-goto]');
  if (chip) selectTrophy(Number(chip.dataset.goto));
});
$('exportBtn').addEventListener('click', () => exportProgress(state.earned, state.counts));
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = parseProgressFile(await file.text(), validNames);
    state.earned = parsed.earned;
    state.counts = parsed.counts;
    saveProgress(state.earned);
    saveCounts(state.counts);
    renderAll();
  } catch {
    alert('That file is not a Leonida Ledger progress export.');
  }
  e.target.value = '';
});

renderAll();
