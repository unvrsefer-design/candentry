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
  roleId?: string;
};

const STORAGE_KEY = "candentry_candidates";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

export function getCandidateSourceCounts() {
  const all = getSavedCandidates();

  return {
    total: all.length,
    upload: all.filter((item) => item.source === "upload").length,
    linkedin: all.filter((item) => item.source === "linkedin").length,
    referral: all.filter((item) => item.source === "referral").length,
  };
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

export function addLinkedInCandidate() {
  if (typeof window === "undefined") return;

  const candidate: SavedCandidate = {
    id: makeId("ln"),
    savedAt: new Date().toISOString(),
    fileName: "LinkedIn Candidate - Growth Marketer",
    mode: "balanced",
    hireScore: 81,
    finalDecision: "Consider",
    technicalMatch: 76,
    experienceMatch: 84,
    riskScore: 28,
    strengths: [
      "Strong campaign execution background",
      "Experience with paid acquisition and funnels",
      "Good cross-functional communication",
    ],
    risks: ["Limited B2B SaaS experience"],
    missingSkills: ["Advanced product analytics"],
    growthPotential:
      "Strong potential to grow into a performance marketing lead role.",
    reasoning:
      "This LinkedIn-sourced candidate shows solid commercial experience and strong execution ability, with moderate ramp-up needed on product-led growth metrics.",
    shortlist: false,
    status: "New",
    notes: "",
    source: "linkedin",
  };

  saveCandidate(candidate);
}

export function addReferralCandidate() {
  if (typeof window === "undefined") return;

  const candidate: SavedCandidate = {
    id: makeId("ref"),
    savedAt: new Date().toISOString(),
    fileName: "Referral Candidate - Full Stack Engineer",
    mode: "balanced",
    hireScore: 84,
    finalDecision: "Hire",
    technicalMatch: 86,
    experienceMatch: 82,
    riskScore: 24,
    strengths: [
      "Full stack engineering breadth",
      "Strong product ownership mindset",
      "Good startup execution experience",
    ],
    risks: ["Needs deeper frontend specialization"],
    missingSkills: ["Advanced design systems"],
    growthPotential:
      "High potential to take on broader product engineering ownership.",
    reasoning:
      "This referral candidate has a strong balance of execution, startup adaptability, and product thinking, making them a strong all-around hire.",
    shortlist: false,
    status: "New",
    notes: "",
    source: "referral",
  };

  saveCandidate(candidate);
}

export function loadDemoCandidatePool() {
  if (typeof window === "undefined") return;

  const existing = getSavedCandidates();

  const hasLinkedInDemo = existing.some(
    (candidate) => candidate.id === "ln-1" || candidate.id === "ln-2"
  );

  const demoPool = [
    ...(hasLinkedInDemo
      ? []
      : [
          {
            id: "ln-1",
            savedAt: new Date().toISOString(),
            fileName: "Senior Frontend Developer",
            mode: "balanced" as const,
            hireScore: 87,
            finalDecision: "Hire" as const,
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
            status: "New" as const,
            notes: "",
            source: "linkedin" as const,
          },
          {
            id: "ln-2",
            savedAt: new Date().toISOString(),
            fileName: "Product Manager",
            mode: "balanced" as const,
            hireScore: 78,
            finalDecision: "Consider" as const,
            technicalMatch: 70,
            experienceMatch: 82,
            riskScore: 30,
            strengths: ["Stakeholder management", "Roadmapping"],
            risks: ["Limited technical depth"],
            missingSkills: ["Data analysis"],
            growthPotential: "Medium",
            reasoning: "Good product sense but lacks strong data background.",
            shortlist: false,
            status: "Review" as const,
            notes: "",
            source: "linkedin" as const,
          },
        ]),
    {
      id: makeId("ref"),
      savedAt: new Date().toISOString(),
      fileName: "Referral Candidate - Backend Engineer",
      mode: "balanced" as const,
      hireScore: 83,
      finalDecision: "Hire" as const,
      technicalMatch: 88,
      experienceMatch: 80,
      riskScore: 25,
      strengths: [
        "Strong backend systems knowledge",
        "Experience with APIs and distributed systems",
        "Good collaboration habits",
      ],
      risks: ["Less product-facing experience"],
      missingSkills: ["Advanced frontend exposure"],
      growthPotential:
        "Strong potential for platform and infrastructure ownership.",
      reasoning:
        "This referral candidate is technically strong and reliable, especially for backend-heavy engineering work.",
      shortlist: false,
      status: "Interview" as const,
      notes: "",
      source: "referral" as const,
    },
    {
      id: makeId("upload"),
      savedAt: new Date().toISOString(),
      fileName: "Uploaded CV - UX Designer",
      mode: "balanced" as const,
      hireScore: 75,
      finalDecision: "Consider" as const,
      technicalMatch: 72,
      experienceMatch: 79,
      riskScore: 31,
      strengths: [
        "Strong user research foundation",
        "Clean portfolio storytelling",
        "Good collaboration with product teams",
      ],
      risks: ["Limited design systems leadership"],
      missingSkills: ["Advanced analytics-driven experimentation"],
      growthPotential:
        "Good potential for product design ownership in small teams.",
      reasoning:
        "This uploaded candidate shows strong UX thinking and communication skills, with some room to grow in systems-level design leadership.",
      shortlist: false,
      status: "Review" as const,
      notes: "",
      source: "upload" as const,
    },
  ] satisfies SavedCandidate[];

  const all = getSavedCandidates();
  const updated = [...demoPool, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}