// Saved progress for the Leonida Ledger: which trophies are earned and the
// per-trophy counters (PSN counts), kept in localStorage and exportable as JSON.
export const STORE_KEY = 'leonida-ledger-progress-v1';
export const COUNT_KEY = 'leonida-ledger-counts-v1';

// The demo set the screenshots are taken with: 11 earned across the kinds,
// so the cover shows real progress, real counters and the spoiler rule at work.
export const DEMO_EARNED = [
  'Just Like Paradise',
  'Paradise Lost',
  'T**s Ass Drug Money',
  'Vice City, Baby!',
  'Top Of The World, Ma',
  'Trust',
  'Break the Bank',
  'Family Matters',
  'Baited My Tackle',
  'Whip It Good',
  "Don't Touch My Deck",
];

export function loadProgress() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}

export function loadCounts() {
  try {
    return JSON.parse(localStorage.getItem(COUNT_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveCounts(counts) {
  localStorage.setItem(COUNT_KEY, JSON.stringify(counts));
}

export function exportProgress(earned, counts) {
  const payload = {
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    counts,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-ledger-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function parseProgressFile(text, validNames) {
  const data = JSON.parse(text);
  const names = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(names)) throw new Error('no earned list in file');
  const earned = new Set(names.filter((n) => validNames.has(n)));
  const counts = data.counts && typeof data.counts === 'object' ? data.counts : {};
  return { earned, counts };
}

export function seedDemoProgress() {
  return new Set(DEMO_EARNED);
}
