export type CandidateStatus = "New" | "Review" | "Interview" | "Rejected";

export type SavedCandidate = {
  id: string;
  savedAt: string;
  fileName: string;
  mode: "strict" | "balanced" | "growth" | "candidateFriendly";
  hireScore: number;
  finalDecision: "Hire" | "Consider" | "Reject";
  technicalMatch: number;
  experienceMatch: number;
  riskScore: number;
  strengths: string[];
  risks: string[];
  missingSkills: string[];
  growthPotential: string;
  reasoning: string;
  shortlist: boolean;
  status: CandidateStatus;
  notes?: string;
};

const STORAGE_KEY = "candentry-saved-candidates";

export function getSavedCandidates(): SavedCandidate[] {
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

export function saveCandidate(candidate: SavedCandidate) {
  if (typeof window === "undefined") return;

  const all = getSavedCandidates();
  const exists = all.some((item) => item.id === candidate.id);

  const updated = exists
    ? all.map((item) => (item.id === candidate.id ? candidate : item))
    : [candidate, ...all];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeCandidate(id: string) {
  if (typeof window === "undefined") return;

  const all = getSavedCandidates();
  const updated = all.filter((item) => item.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateCandidate(
  id: string,
  updates: Partial<SavedCandidate>
) {
  if (typeof window === "undefined") return;

  const all = getSavedCandidates();
  const updated = all.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getCandidateById(id: string): SavedCandidate | null {
  if (typeof window === "undefined") return null;

  const all = getSavedCandidates();
  return all.find((item) => item.id === id) || null;
}