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