export type CandidateSource = "upload" | "linkedin" | "referral";

export type CandidateStatus =
  | "New"
  | "Review"
  | "Reviewed"
  | "Interview"
  | "Shortlisted"
  | "Rejected";

export type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

export type FinalDecision = "Hire" | "Consider" | "Reject";

export type SavedCandidate = {
  id: string;
  savedAt: string;
  fileName: string;
  mode: RecruiterMode;

  hireScore: number;
  finalDecision: FinalDecision;

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
  notes: string;

  source: CandidateSource;
};

const STORAGE_KEY = "candentry_candidates";

export function getSavedCandidates(): SavedCandidate[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SavedCandidate[];
  } catch {
    return [];
  }
}

export function getCandidates(): SavedCandidate[] {
  return getSavedCandidates();
}

export function saveCandidate(candidate: SavedCandidate) {
  if (typeof window === "undefined") return;

  const all = getSavedCandidates();
  const updated = [candidate, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearCandidates() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
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

export function seedLinkedInCandidates() {
  if (typeof window === "undefined") return;

  const existing = getSavedCandidates();
  if (existing.length > 0) return;

  const dummy: SavedCandidate[] = [
    {
      id: "ln-1",
      savedAt: new Date().toISOString(),
      fileName: "Senior Frontend Developer",
      mode: "balanced",
      hireScore: 87,
      finalDecision: "Hire",
      technicalMatch: 90,
      experienceMatch: 85,
      riskScore: 20,
      strengths: ["React", "Next.js", "System Design"],
      risks: ["Limited startup experience"],
      missingSkills: [],
      growthPotential: "High",
      reasoning:
        "Strong frontend background with solid architecture knowledge.",
      shortlist: false,
      status: "New",
      notes: "",
      source: "linkedin",
    },
    {
      id: "ln-2",
      savedAt: new Date().toISOString(),
      fileName: "Product Manager",
      mode: "balanced",
      hireScore: 78,
      finalDecision: "Consider",
      technicalMatch: 70,
      experienceMatch: 82,
      riskScore: 30,
      strengths: ["Stakeholder management", "Roadmapping"],
      risks: ["Limited technical depth"],
      missingSkills: ["Data analysis"],
      growthPotential: "Medium",
      reasoning: "Good product sense but lacks strong data background.",
      shortlist: false,
      status: "Review",
      notes: "",
      source: "linkedin",
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dummy));
}