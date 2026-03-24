import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getDocument } from "pdfjs-serverless";

export const runtime = "nodejs";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type AnalysisResult = {
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
};

type InterviewPlan = {
  interviewerNote: string;
  technicalQuestions: string[];
  behavioralQuestions: string[];
};

type ModelAnalysisOutput = {
  raw: string;
  analysis: AnalysisResult;
  interviewPlan: InterviewPlan | null;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function getModeInstruction(mode: RecruiterMode) {
  switch (mode) {
    case "strict":
      return `
Be strict and selective.
Penalize weak relevance, low evidence, and missing core requirements.
Recommend only clearly strong candidates.
`;
    case "growth":
      return `
Value growth potential and transferable skills.
Be more optimistic about coachable candidates with strong upside.
`;
    case "candidateFriendly":
      return `
Be constructive and candidate-friendly.
Still be honest, but avoid unnecessarily harsh framing.
`;
    case "balanced":
    default:
      return `
Be balanced and fair.
Evaluate strengths and risks evenly.
`;
  }
}

async function extractPdfText(file: File) {
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

  return extractedText;
}

function sanitizeJson(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeAnalysis(parsed: any): AnalysisResult {
  return {
    hireScore: Number(parsed?.hireScore ?? 0),
    finalDecision:
      parsed?.finalDecision === "Hire" ||
      parsed?.finalDecision === "Consider" ||
      parsed?.finalDecision === "Reject"
        ? parsed.finalDecision
        : "Reject",
    technicalMatch: Number(parsed?.technicalMatch ?? 0),
    experienceMatch: Number(parsed?.experienceMatch ?? 0),
    riskScore: Number(parsed?.riskScore ?? 0),
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
    risks: Array.isArray(parsed?.risks) ? parsed.risks : [],
    missingSkills: Array.isArray(parsed?.missingSkills)
      ? parsed.missingSkills
      : [],
    growthPotential: parsed?.growthPotential || "",
    reasoning: parsed?.reasoning || "",
  };
}

function normalizeInterviewPlan(parsed: any): InterviewPlan | null {
  if (!parsed) return null;

  return {
    interviewerNote: parsed?.interviewerNote || "",
    technicalQuestions: Array.isArray(parsed?.technicalQuestions)
      ? parsed.technicalQuestions
      : [],
    behavioralQuestions: Array.isArray(parsed?.behavioralQuestions)
      ? parsed.behavioralQuestions
      : [],
  };
}

function buildAnalysisPrompt(params: {
  extractedText: string;
  jobDescription: string;
  mode: RecruiterMode;
}) {
  return `
You are a senior recruiter.

${getModeInstruction(params.mode)}

Evaluate this candidate CV against the job description.

Return STRICT JSON only.

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
  "reasoning": string,
  "interviewPlan": {
    "interviewerNote": string,
    "technicalQuestions": string[],
    "behavioralQuestions": string[]
  }
}

Rules:
- Scores must be between 0 and 100
- strengths max 5
- risks max 5
- missingSkills max 5
- technicalQuestions max 5
- behavioralQuestions max 5
- reasoning should be concise but specific

Job Description:
${params.jobDescription}

Candidate CV:
${params.extractedText}
`;
}

async function analyzeWithOpenAI(params: {
  extractedText: string;
  jobDescription: string;
  mode: RecruiterMode;
}): Promise<ModelAnalysisOutput> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const prompt = buildAnalysisPrompt(params);

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const raw = sanitizeJson(response.output_text || "{}");
  const parsed = JSON.parse(raw);

  return {
    raw,
    analysis: normalizeAnalysis(parsed),
    interviewPlan: normalizeInterviewPlan(parsed?.interviewPlan),
  };
}

async function analyzeWithClaude(params: {
  extractedText: string;
  jobDescription: string;
  mode: RecruiterMode;
}): Promise<ModelAnalysisOutput> {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  const prompt = buildAnalysisPrompt(params);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1800,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawText = response.content
    .map((block: any) => ("text" in block ? block.text : ""))
    .join("\n");

  const raw = sanitizeJson(rawText || "{}");
  const parsed = JSON.parse(raw);

  return {
    raw,
    analysis: normalizeAnalysis(parsed),
    interviewPlan: normalizeInterviewPlan(parsed?.interviewPlan),
  };
}

function averageNumber(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function mergeUniqueStrings(arrays: string[][], limit = 5) {
  return [...new Set(arrays.flat().filter(Boolean))].slice(0, limit);
}

function chooseDecision(averageHireScore: number): "Hire" | "Consider" | "Reject" {
  if (averageHireScore >= 75) return "Hire";
  if (averageHireScore >= 50) return "Consider";
  return "Reject";
}

function buildConsensusSummary(params: {
  openaiAvailable: boolean;
  claudeAvailable: boolean;
  openaiAnalysis?: AnalysisResult;
  claudeAnalysis?: AnalysisResult;
  finalAnalysis: AnalysisResult;
}) {
  if (params.openaiAvailable && params.claudeAvailable) {
    return `Both models contributed to the evaluation. Final result reflects a multi-model consensus balancing strengths, risks, and overall fit.`;
  }

  if (params.openaiAvailable) {
    return `Only OpenAI was available during analysis. Final result is based on a single-model fallback.`;
  }

  if (params.claudeAvailable) {
    return `Only Claude was available during analysis. Final result is based on a single-model fallback.`;
  }

  return `No model consensus was available.`;
}

function buildAgreementLabel(params: {
  openaiAvailable: boolean;
  claudeAvailable: boolean;
  openaiAnalysis?: AnalysisResult;
  claudeAnalysis?: AnalysisResult;
}) {
  if (!params.openaiAvailable || !params.claudeAvailable) return "Low";

  const decisionMatch =
    params.openaiAnalysis?.finalDecision === params.claudeAnalysis?.finalDecision;

  const scoreGap = Math.abs(
    (params.openaiAnalysis?.hireScore ?? 0) - (params.claudeAnalysis?.hireScore ?? 0)
  );

  if (decisionMatch && scoreGap <= 8) return "High";
  if (scoreGap <= 18) return "Medium";
  return "Low";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("cv") as File | null;
    const jobDescription = (formData.get("jobDescription") as string) || "";
    const mode = ((formData.get("mode") as string) || "balanced") as RecruiterMode;

    if (!file) {
      return NextResponse.json({ error: "CV file is required." }, { status: 400 });
    }

    if (!jobDescription.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const extractedText = await extractPdfText(file);

    const [openaiSettled, claudeSettled] = await Promise.allSettled([
      analyzeWithOpenAI({
        extractedText,
        jobDescription,
        mode,
      }),
      analyzeWithClaude({
        extractedText,
        jobDescription,
        mode,
      }),
    ]);

    const openaiSuccess = openaiSettled.status === "fulfilled";
    const claudeSuccess = claudeSettled.status === "fulfilled";

    if (!openaiSuccess && !claudeSuccess) {
      return NextResponse.json(
        { error: "Both OpenAI and Claude analysis failed." },
        { status: 500 }
      );
    }

    const openaiResult = openaiSuccess ? openaiSettled.value : null;
    const claudeResult = claudeSuccess ? claudeSettled.value : null;

    const analyses = [openaiResult?.analysis, claudeResult?.analysis].filter(
      Boolean
    ) as AnalysisResult[];

    const interviewPlan =
      openaiResult?.interviewPlan || claudeResult?.interviewPlan || null;

    const finalAnalysis: AnalysisResult = analyses.length === 1
      ? analyses[0]
      : {
          hireScore: averageNumber(analyses.map((a) => a.hireScore)),
          finalDecision: chooseDecision(
            averageNumber(analyses.map((a) => a.hireScore))
          ),
          technicalMatch: averageNumber(analyses.map((a) => a.technicalMatch)),
          experienceMatch: averageNumber(analyses.map((a) => a.experienceMatch)),
          riskScore: averageNumber(analyses.map((a) => a.riskScore)),
          strengths: mergeUniqueStrings(analyses.map((a) => a.strengths), 5),
          risks: mergeUniqueStrings(analyses.map((a) => a.risks), 5),
          missingSkills: mergeUniqueStrings(analyses.map((a) => a.missingSkills), 5),
          growthPotential:
            analyses.map((a) => a.growthPotential).filter(Boolean).join(" ") ||
            "",
          reasoning:
            analyses.map((a) => a.reasoning).filter(Boolean).join(" ") || "",
        };

    return NextResponse.json({
      fileName: file.name,
      mode,
      hireScore: finalAnalysis.hireScore,
      finalDecision: finalAnalysis.finalDecision,
      technicalMatch: finalAnalysis.technicalMatch,
      experienceMatch: finalAnalysis.experienceMatch,
      riskScore: finalAnalysis.riskScore,
      strengths: finalAnalysis.strengths,
      risks: finalAnalysis.risks,
      missingSkills: finalAnalysis.missingSkills,
      growthPotential: finalAnalysis.growthPotential,
      reasoning: finalAnalysis.reasoning,
      aiAgreement: buildAgreementLabel({
        openaiAvailable: openaiSuccess,
        claudeAvailable: claudeSuccess,
        openaiAnalysis: openaiResult?.analysis,
        claudeAnalysis: claudeResult?.analysis,
      }),
      consensusSummary: buildConsensusSummary({
        openaiAvailable: openaiSuccess,
        claudeAvailable: claudeSuccess,
        openaiAnalysis: openaiResult?.analysis,
        claudeAnalysis: claudeResult?.analysis,
        finalAnalysis,
      }),
      sources: {
        openai: openaiSuccess,
        claude: claudeSuccess,
      },
      interviewPlan,
    });
  } catch (error: any) {
    console.error("Analyze route error:", error);

    return NextResponse.json(
      { error: error?.message || "Analysis failed." },
      { status: 500 }
    );
  }
}