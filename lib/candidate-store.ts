export type SavedCandidate = {
  id: string;
  savedAt: string;
  fileName: string;
  mode: string;

  hireScore: number;
  finalDecision: string;

  technicalMatch: number;
  experienceMatch: number;
  riskScore: number;

  strengths: string[];
  risks: string[];
  missingSkills: string[];

  growthPotential: string;
  reasoning: string;

  shortlist: boolean;
  status: string;
  notes: string;

  // 🔥 YENİ EKLEDİĞİMİZ ALAN
  source: "upload" | "linkedin" | "referral";
};

const STORAGE_KEY = "candentry_candidates";

export function getCandidates(): SavedCandidate[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCandidate(candidate: SavedCandidate) {
  if (typeof window === "undefined") return;

  const existing = getCandidates();

  const updated = [candidate, ...existing];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearCandidates() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function seedLinkedInCandidates() {
  if (typeof window === "undefined") return;

  const existing = getCandidates();
  if (existing.length > 0) return;

  const dummy: SavedCandidate[] = [
    {
      id: "ln-1",
      savedAt: new Date().toISOString(),
      fileName: "Senior Frontend Developer",
      mode: "standard",

      hireScore: 87,
      finalDecision: "Hire",

      technicalMatch: 90,
      experienceMatch: 85,
      riskScore: 20,

      strengths: ["React", "Next.js", "System Design"],
      risks: ["Limited startup experience"],
      missingSkills: [],

      growthPotential: "High",
      reasoning: "Strong frontend background with solid architecture knowledge",

      shortlist: false,
      status: "New",
      notes: "",

      source: "linkedin",
    },

    {
      id: "ln-2",
      savedAt: new Date().toISOString(),
      fileName: "Product Manager",
      mode: "standard",

      hireScore: 78,
      finalDecision: "Consider",

      technicalMatch: 70,
      experienceMatch: 82,
      riskScore: 30,

      strengths: ["Stakeholder management", "Roadmapping"],
      risks: ["Limited technical depth"],
      missingSkills: ["Data analysis"],

      growthPotential: "Medium",
      reasoning: "Good product sense but lacks strong data background",

      shortlist: false,
      status: "New",
      notes: "",

      source: "linkedin",
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dummy));
}