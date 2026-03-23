import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getDocument } from "pdfjs-serverless";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

function getModeInstruction(mode: RecruiterMode) {
  switch (mode) {
    case "strict":
      return `
Be strict and selective.
Penalize missing domain fit heavily.
Recommend only strong candidates.
`;

    case "growth":
      return `
Value growth potential and transferable skills.
Be more optimistic about coachable candidates.
`;

    case "candidateFriendly":
      return `
Be candidate-friendly and constructive.
Avoid unnecessary harshness.
Highlight upside where credible.
`;

    case "balanced":
    default:
      return `
Be balanced and fair.
Evaluate strengths and risks equally.
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

async function analyzeSingleCandidate(params: {
  fileName: string;
  extractedText: string;
  jobDescription: string;
  mode: RecruiterMode;
}) {
  const prompt = `
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
  "summary": string
}

Rules:
- Keep strengths to max 3 items
- Keep risks to max 3 items
- Keep missingSkills to max 3 items
- summary should be concise and recruiter-friendly

Job Description:
${params.jobDescription}

Candidate File Name:
${params.fileName}

Candidate CV:
${params.extractedText}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const raw = sanitizeJson(response.output_text || "{}");

  try {
    const parsed = JSON.parse(raw);

    return {
      fileName: params.fileName,
      hireScore: Number(parsed.hireScore ?? 0),
      finalDecision: parsed.finalDecision ?? "Reject",
      technicalMatch: Number(parsed.technicalMatch ?? 0),
      experienceMatch: Number(parsed.experienceMatch ?? 0),
      riskScore: Number(parsed.riskScore ?? 0),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],
      summary: parsed.summary || "No summary returned.",
    };
  } catch {
    return {
      fileName: params.fileName,
      hireScore: 0,
      finalDecision: "Reject",
      technicalMatch: 0,
      experienceMatch: 0,
      riskScore: 0,
      strengths: [],
      risks: [],
      missingSkills: [],
      summary: "AI returned invalid JSON for this candidate.",
    };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const files = formData.getAll("cvs") as File[];
    const jobDescription = (formData.get("jobDescription") as string) || "";
    const mode = ((formData.get("mode") as string) ||
      "balanced") as RecruiterMode;

    if (!files.length) {
      return NextResponse.json(
        { error: "No CV files uploaded." },
        { status: 400 }
      );
    }

    if (!jobDescription.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const extracted = await Promise.all(
      files.map(async (file) => {
        const extractedText = await extractPdfText(file);
        return {
          fileName: file.name,
          extractedText,
        };
      })
    );

    const analyzed = await Promise.all(
      extracted.map((item) =>
        analyzeSingleCandidate({
          fileName: item.fileName,
          extractedText: item.extractedText,
          jobDescription,
          mode,
        })
      )
    );

    const ranked = [...analyzed].sort((a, b) => b.hireScore - a.hireScore);

    return NextResponse.json({
      totalCandidates: ranked.length,
      mode,
      jobDescription,
      results: ranked,
      topCandidates: ranked.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Bulk analyze error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Bulk analysis failed",
      },
      { status: 500 }
    );
  }
}