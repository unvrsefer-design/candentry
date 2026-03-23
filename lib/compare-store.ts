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

export function getSavedCompareResults(): SavedCompareResult[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompareResult(compare: SavedCompareResult) {
  if (typeof window === "undefined") return;

  const all = getSavedCompareResults();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([compare, ...all]));
}

export function removeCompareResult(id: string) {
  if (typeof window === "undefined") return;

  const all = getSavedCompareResults();
  const updated = all.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getCompareResultById(id: string): SavedCompareResult | null {
  if (typeof window === "undefined") return null;

  const all = getSavedCompareResults();
  return all.find((item) => item.id === id) || null;
}