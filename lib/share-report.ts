export type SharedReportData = {
  fileName?: string;
  mode?: "strict" | "balanced" | "growth" | "candidateFriendly";
  hireScore?: number;
  finalDecision?: "Hire" | "Consider" | "Reject";
  technicalMatch?: number;
  experienceMatch?: number;
  riskScore?: number;
  strengths?: string[];
  risks?: string[];
  missingSkills?: string[];
  growthPotential?: string;
  reasoning?: string;
  aiAgreement?: "High" | "Medium" | "Low";
  consensusSummary?: string;
  sources?: {
    openai?: boolean;
    claude?: boolean;
  };
  interviewPlan?: {
    technicalQuestions?: string[];
    behavioralQuestions?: string[];
    riskProbingQuestions?: string[];
    interviewFocusAreas?: string[];
    interviewerNote?: string;
  } | null;
};

export function buildSharePayload(data: SharedReportData) {
  return {
    fileName: data.fileName || "Candidate",
    mode: data.mode || "balanced",
    hireScore: data.hireScore ?? 0,
    finalDecision: data.finalDecision || "Reject",
    technicalMatch: data.technicalMatch ?? 0,
    experienceMatch: data.experienceMatch ?? 0,
    riskScore: data.riskScore ?? 0,
    strengths: data.strengths || [],
    risks: data.risks || [],
    missingSkills: data.missingSkills || [],
    growthPotential: data.growthPotential || "N/A",
    reasoning: data.reasoning || "N/A",
    aiAgreement: data.aiAgreement || "Low",
    consensusSummary: data.consensusSummary || "",
    sources: {
      openai: !!data.sources?.openai,
      claude: !!data.sources?.claude,
    },
    interviewPlan: data.interviewPlan
      ? {
          technicalQuestions: data.interviewPlan.technicalQuestions || [],
          behavioralQuestions: data.interviewPlan.behavioralQuestions || [],
          riskProbingQuestions: data.interviewPlan.riskProbingQuestions || [],
          interviewFocusAreas: data.interviewPlan.interviewFocusAreas || [],
          interviewerNote: data.interviewPlan.interviewerNote || "",
        }
      : null,
  };
}

export function encodeShareData(data: SharedReportData) {
  const json = JSON.stringify(buildSharePayload(data));
  return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
}

export function decodeShareData(encoded: string): SharedReportData | null {
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    return JSON.parse(json);
  } catch {
    return null;
  }
}