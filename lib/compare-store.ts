export type SavedCompareResult = {
  id: string;
  savedAt: string;
  mode: "strict" | "balanced" | "growth" | "candidateFriendly";
  candidateNames: string[];
  bestCandidateIndex: number;
  ranking: number[];
  summary: string;
  candidates: Array<{
    score: number;
    strengths: string[];
    risks: string[];
  }>;
  comparison: {
    dimensionWins: string[];
    whyWinner: string[];
    whyLoser: string[];
  } | null;
};

const STORAGE_KEY = "candentry-saved-compares";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage; // 🔥 kritik değişiklik
}

export function getSavedCompareResults(): SavedCompareResult[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompareResult(compare: SavedCompareResult) {
  const storage = getStorage();
  if (!storage) return;

  const all = getSavedCompareResults();
  storage.setItem(STORAGE_KEY, JSON.stringify([compare, ...all]));
}

export function removeCompareResult(id: string) {
  const storage = getStorage();
  if (!storage) return;

  const all = getSavedCompareResults();
  const updated = all.filter((item) => item.id !== id);
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getCompareResultById(id: string): SavedCompareResult | null {
  const all = getSavedCompareResults();
  return all.find((item) => item.id === id) || null;
}

export function clearCompareResults() {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(STORAGE_KEY);
}