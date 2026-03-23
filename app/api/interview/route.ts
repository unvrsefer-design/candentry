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

function getModeInstruction(mode: RecruiterMode) {
  switch (mode) {
    case "strict":
      return `
You are a strict recruiter preparing a high-signal interview.
Focus on weaknesses, domain gaps, and execution risk.
`;

    case "growth":
      return `
You are a recruiter who values growth potential.
Create questions that test adaptability, learning speed, and coachability.
`;

    case "candidateFriendly":
      return `
You are a candidate-friendly recruiter.
Create thoughtful, fair, and constructive interview questions.
Avoid hostile wording, but still validate real fit.
`;

    case "balanced":
    default:
      return `
You are a balanced recruiter.
Create practical interview questions that validate both strengths and risks.
`;
  }
}

function sanitizeJson(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      extractedText,
      jobDescription,
      mode = "balanced",
      candidateName = "Candidate",
    } = body as {
      extractedText?: string;
      jobDescription?: string;
      mode?: RecruiterMode;
      candidateName?: string;
    };

    if (!extractedText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing extractedText or jobDescription." },
        { status: 400 }
      );
    }

    const prompt = `
${getModeInstruction(mode)}

You are creating an interview plan for ${candidateName}.

Use the candidate CV text and job description below.

Candidate CV:
${extractedText}

Job Description:
${jobDescription}

Return STRICT JSON only.
Do not use markdown.
Do not add explanations outside JSON.

JSON format:
{
  "technicalQuestions": string[],
  "behavioralQuestions": string[],
  "riskProbingQuestions": string[],
  "interviewFocusAreas": string[],
  "interviewerNote": string
}

Rules:
- technicalQuestions: 5 items
- behavioralQuestions: 5 items
- riskProbingQuestions: 3 items
- interviewFocusAreas: 4 items
- interviewerNote: concise but useful
- Questions must be specific to the candidate and the job
- Avoid generic filler questions
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text || "{}";
    const cleaned = sanitizeJson(raw);

    let parsed: {
      technicalQuestions?: string[];
      behavioralQuestions?: string[];
      riskProbingQuestions?: string[];
      interviewFocusAreas?: string[];
      interviewerNote?: string;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON from AI",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      technicalQuestions: Array.isArray(parsed.technicalQuestions)
        ? parsed.technicalQuestions
        : [],
      behavioralQuestions: Array.isArray(parsed.behavioralQuestions)
        ? parsed.behavioralQuestions
        : [],
      riskProbingQuestions: Array.isArray(parsed.riskProbingQuestions)
        ? parsed.riskProbingQuestions
        : [],
      interviewFocusAreas: Array.isArray(parsed.interviewFocusAreas)
        ? parsed.interviewFocusAreas
        : [],
      interviewerNote: parsed.interviewerNote || "No interviewer note returned.",
    });
  } catch (error: any) {
    console.error("Interview generator error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Interview generation failed",
      },
      { status: 500 }
    );
  }
}