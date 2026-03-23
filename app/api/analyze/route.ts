import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getDocument } from "pdfjs-serverless";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";
type FinalDecision = "Hire" | "Consider" | "Reject";

type AnalysisResult = {
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
};

function getModeInstruction(mode: RecruiterMode) {
  switch (mode) {
    case "strict":
      return `
You are acting as a strict senior recruiter.
Be highly selective.
Penalize missing domain fit heavily.
Reject candidates who are not clearly aligned.
`;

    case "growth":
      return `
You are acting as a recruiter who prioritizes growth potential.
Value transferable skills, adaptability, and learning ability.
Do not reject purely for domain gaps if upside is strong.
`;

    case "candidateFriendly":
      return `
You are acting as a candidate-friendly recruiter.
Be constructive, fair, and encouraging.
Present risks with nuance and professionalism.
Prefer Consider over Reject when upside is credible.
Avoid unnecessarily harsh language.
`;

    case "balanced":
    default:
      return `
You are acting as a balanced senior recruiter.
Be fair, evidence-based, and commercially sensible.
Weigh strengths and risks evenly.
`;
  }
}

function buildPrompt(
  mode: RecruiterMode,
  jobDescription: string,
  extractedText: string
) {
  return `
${getModeInstruction(mode)}

Analyze this candidate CV against the job description.

Return STRICT JSON only.
Do not use markdown.
Do not explain anything outside JSON.
All numeric values must be numbers, not words.

JSON format:
{
  "hireScore": number,
  "finalDecision": "Hire" | "Consider" | "Reject",
  "technicalMatch": number,
  "experienceMatch": number,
  "riskScore": number,
  "strengths": string[],
  "risks": string[],
  "missingSkills": string[],
  "growthPotential": string,
  "reasoning": string
}

Job Description:
${jobDescription}

Candidate CV:
${extractedText}
`;
}

function sanitizeJsonText(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeDecision(value: unknown): FinalDecision {
  if (value === "Hire" || value === "Consider" || value === "Reject") {
    return value;
  }
  return "Reject";
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function normalizeResult(value: any): AnalysisResult {
  return {
    hireScore: Number(value?.hireScore ?? 0),
    finalDecision: normalizeDecision(value?.finalDecision),
    technicalMatch: Number(value?.technicalMatch ?? 0),
    experienceMatch: Number(value?.experienceMatch ?? 0),
    riskScore: Number(value?.riskScore ?? 0),
    strengths: ensureStringArray(value?.strengths),
    risks: ensureStringArray(value?.risks),
    missingSkills: ensureStringArray(value?.missingSkills),
    growthPotential: String(value?.growthPotential ?? "N/A"),
    reasoning: String(value?.reasoning ?? "N/A"),
  };
}

async function repairJsonWithOpenAI(rawText: string) {
  const repairPrompt = `
Convert the following malformed JSON into STRICT valid JSON only.

Rules:
- Return valid JSON only
- No markdown
- No explanations
- Convert written numbers like "sixty five" into numeric values like 65
- Preserve meaning as closely as possible

Target schema:
{
  "hireScore": number,
  "finalDecision": "Hire" | "Consider" | "Reject",
  "technicalMatch": number,
  "experienceMatch": number,
  "riskScore": number,
  "strengths": string[],
  "risks": string[],
  "missingSkills": string[],
  "growthPotential": string,
  "reasoning": string
}

Malformed JSON:
${rawText}
`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: repairPrompt,
  });

  return sanitizeJsonText(response.output_text || "{}");
}

async function parsePossiblyBrokenJson(rawText: string) {
  const cleaned = sanitizeJsonText(rawText);

  try {
    return JSON.parse(cleaned);
  } catch {
    const repaired = await repairJsonWithOpenAI(cleaned);
    return JSON.parse(repaired);
  }
}

async function analyzeWithOpenAI(prompt: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const raw = response.output_text || "{}";
  const parsed = await parsePossiblyBrokenJson(raw);

  return {
    raw,
    analysis: normalizeResult(parsed),
  };
}

async function analyzeWithClaude(prompt: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const parsed = await parsePossiblyBrokenJson(raw);

  return {
    raw,
    analysis: normalizeResult(parsed),
  };
}

function mergeUnique(a: string[], b: string[]) {
  return Array.from(new Set([...a, ...b]));
}

function decisionRank(decision: FinalDecision) {
  if (decision === "Hire") return 3;
  if (decision === "Consider") return 2;
  return 1;
}

function rankToDecision(rank: number): FinalDecision {
  if (rank >= 3) return "Hire";
  if (rank === 2) return "Consider";
  return "Reject";
}

function buildConsensus(openaiResult: AnalysisResult, claudeResult: AnalysisResult) {
  const hireScore = Math.round(
    (openaiResult.hireScore + claudeResult.hireScore) / 2
  );

  const technicalMatch = Math.round(
    (openaiResult.technicalMatch + claudeResult.technicalMatch) / 2
  );

  const experienceMatch = Math.round(
    (openaiResult.experienceMatch + claudeResult.experienceMatch) / 2
  );

  const riskScore = Math.round(
    (openaiResult.riskScore + claudeResult.riskScore) / 2
  );

  const openaiRank = decisionRank(openaiResult.finalDecision);
  const claudeRank = decisionRank(claudeResult.finalDecision);

  let aiAgreement: "High" | "Medium" | "Low";
  let finalDecision: FinalDecision;

  if (openaiResult.finalDecision === claudeResult.finalDecision) {
    aiAgreement = "High";
    finalDecision = openaiResult.finalDecision;
  } else if (Math.abs(openaiRank - claudeRank) === 1) {
    aiAgreement = "Medium";
    finalDecision = rankToDecision(Math.round((openaiRank + claudeRank) / 2));
  } else {
    aiAgreement = "Low";
    finalDecision = hireScore >= 70 ? "Consider" : "Reject";
  }

  return {
    hireScore,
    technicalMatch,
    experienceMatch,
    riskScore,
    finalDecision,
    strengths: mergeUnique(openaiResult.strengths, claudeResult.strengths),
    risks: mergeUnique(openaiResult.risks, claudeResult.risks),
    missingSkills: mergeUnique(
      openaiResult.missingSkills,
      claudeResult.missingSkills
    ),
    growthPotential:
      openaiResult.growthPotential.length >= claudeResult.growthPotential.length
        ? openaiResult.growthPotential
        : claudeResult.growthPotential,
    reasoning:
      openaiResult.reasoning.length >= claudeResult.reasoning.length
        ? openaiResult.reasoning
        : claudeResult.reasoning,
    aiAgreement,
    consensusSummary:
      aiAgreement === "High"
        ? "OpenAI and Claude reached the same hiring direction."
        : aiAgreement === "Medium"
        ? "OpenAI and Claude were close, so the final result was balanced between both models."
        : "OpenAI and Claude disagreed materially, so the final decision was made conservatively.",
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("cv") as File | null;
    const jobDescription = (formData.get("jobDescription") as string) || "";
    const mode = ((formData.get("mode") as string) ||
      "balanced") as RecruiterMode;

    if (!file) {
      return NextResponse.json(
        { error: "No CV file uploaded." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    }).promise;

    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items.map((item: any) =>
        "str" in item ? item.str : ""
      );

      extractedText += strings.join(" ") + "\n";
    }

    const prompt = buildPrompt(mode, jobDescription, extractedText);

    const [openaiSettled, claudeSettled] = await Promise.allSettled([
      analyzeWithOpenAI(prompt),
      analyzeWithClaude(prompt),
    ]);

    const openaiSuccess = openaiSettled.status === "fulfilled";
    const claudeSuccess = claudeSettled.status === "fulfilled";

    if (!openaiSuccess && !claudeSuccess) {
      return NextResponse.json(
        {
          error: "Both OpenAI and Claude failed.",
          openaiError:
            openaiSettled.status === "rejected"
              ? String(openaiSettled.reason)
              : null,
          claudeError:
            claudeSettled.status === "rejected"
              ? String(claudeSettled.reason)
              : null,
        },
        { status: 500 }
      );
    }

    if (openaiSuccess && claudeSuccess) {
      const openaiAnalysis = openaiSettled.value.analysis;
      const claudeAnalysis = claudeSettled.value.analysis;
      const consensus = buildConsensus(openaiAnalysis, claudeAnalysis);

      return NextResponse.json({
        fileName: file.name,
        extractedText,
        jobDescription,
        mode,

        hireScore: consensus.hireScore,
        finalDecision: consensus.finalDecision,
        technicalMatch: consensus.technicalMatch,
        experienceMatch: consensus.experienceMatch,
        riskScore: consensus.riskScore,

        strengths: consensus.strengths,
        risks: consensus.risks,
        missingSkills: consensus.missingSkills,
        growthPotential: consensus.growthPotential,
        reasoning: consensus.reasoning,

        openaiAnalysis,
        claudeAnalysis,
        aiAgreement: consensus.aiAgreement,
        consensusSummary: consensus.consensusSummary,

        sources: {
          openai: true,
          claude: true,
        },
      });
    }

    const fallbackAnalysis = openaiSuccess
      ? openaiSettled.value.analysis
      : claudeSettled.value.analysis;

    return NextResponse.json({
      fileName: file.name,
      extractedText,
      jobDescription,
      mode,

      hireScore: fallbackAnalysis.hireScore,
      finalDecision: fallbackAnalysis.finalDecision,
      technicalMatch: fallbackAnalysis.technicalMatch,
      experienceMatch: fallbackAnalysis.experienceMatch,
      riskScore: fallbackAnalysis.riskScore,

      strengths: fallbackAnalysis.strengths,
      risks: fallbackAnalysis.risks,
      missingSkills: fallbackAnalysis.missingSkills,
      growthPotential: fallbackAnalysis.growthPotential,
      reasoning: fallbackAnalysis.reasoning,

      openaiAnalysis: openaiSuccess ? openaiSettled.value.analysis : null,
      claudeAnalysis: claudeSuccess ? claudeSettled.value.analysis : null,
      aiAgreement: "Low",
      consensusSummary:
        "Only one model was available, so the result is based on a single-model fallback.",

      sources: {
        openai: openaiSuccess,
        claude: claudeSuccess,
      },
    });
  } catch (error: any) {
    console.error("Analyze error:", error);

    return NextResponse.json(
      {
        error: error?.message || "AI analysis failed",
      },
      { status: 500 }
    );
  }
}