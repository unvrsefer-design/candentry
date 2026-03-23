import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type CompareCandidateInput = {
  id?: string;
  name?: string;
  score?: number;
  finalDecision?: "Hire" | "Consider" | "Reject";
  technicalMatch?: number;
  experienceMatch?: number;
  riskScore?: number;
  strengths?: string[];
  risks?: string[];
  missingSkills?: string[];
  growthPotential?: string;
  reasoning?: string;
};

function getModeInstruction(mode: RecruiterMode) {
  switch (mode) {
    case "strict":
      return `Be strict. Only top-tier candidates should win. Penalize missing domain heavily.`;

    case "growth":
      return `Value potential and transferable skills. Be optimistic about candidates who can ramp up and grow.`;

    case "candidateFriendly":
      return `Be supportive and constructive. Highlight strengths generously, but still rank honestly.`;

    case "balanced":
    default:
      return `Be balanced and fair.`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const candidates = Array.isArray(body?.candidates)
      ? (body.candidates as CompareCandidateInput[])
      : [];
    const mode = (body?.mode || "balanced") as RecruiterMode;

    if (candidates.length < 2) {
      return NextResponse.json(
        { error: "At least 2 saved candidates are required." },
        { status: 400 }
      );
    }

    const candidateBlock = candidates
      .map((candidate, index) => {
        return `
Candidate ${index} (${candidate.name || `Candidate ${index + 1}`}):
- Overall Score: ${candidate.score ?? 0}/100
- Final Decision: ${candidate.finalDecision ?? "Reject"}
- Technical Match: ${candidate.technicalMatch ?? 0}/100
- Experience Match: ${candidate.experienceMatch ?? 0}/100
- Risk Score: ${candidate.riskScore ?? 0}/100
- Strengths: ${(candidate.strengths || []).join("; ") || "None"}
- Risks: ${(candidate.risks || []).join("; ") || "None"}
- Missing Skills: ${(candidate.missingSkills || []).join("; ") || "None"}
- Growth Potential: ${candidate.growthPotential || "N/A"}
- Reasoning: ${candidate.reasoning || "N/A"}
`;
      })
      .join("\n");

    const prompt = `
You are a senior recruiter.

${getModeInstruction(mode)}

Compare these saved candidates using their existing evaluation data.

Return STRICT JSON ONLY.

{
  "bestCandidateIndex": number,
  "ranking": number[],
  "summary": string,
  "candidateNames": string[],
  "candidates": [
    {
      "score": number,
      "strengths": string[],
      "risks": string[]
    }
  ],
  "comparison": {
    "dimensionWins": string[],
    "whyWinner": string[],
    "whyLoser": string[]
  }
}

Rules:
- bestCandidateIndex must match ranking[0]
- ranking must include all candidate indices exactly once
- candidateNames must be in the same order as input candidates
- candidates array must be in the same order as input candidates
- dimensionWins examples:
  "Domain Expertise → Alice"
  "Leadership → Bob"
  "Execution Risk → Alice"

Candidates:
${candidateBlock}
`;

    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw =
      res.output_text?.replace(/```json/g, "").replace(/```/g, "").trim() ||
      "{}";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...parsed,
      candidateNames:
        Array.isArray(parsed.candidateNames) && parsed.candidateNames.length
          ? parsed.candidateNames
          : candidates.map((candidate, index) => candidate.name || `Candidate ${index + 1}`),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Compare failed" },
      { status: 500 }
    );
  }
}