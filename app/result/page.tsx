"use client";

import { useEffect, useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveCandidate } from "@/lib/candidate-store";
import { encodeShareData } from "@/lib/share-report";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type ResultData = {
  fileName: string;
  mode?: RecruiterMode;
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
  aiAgreement?: "High" | "Medium" | "Low";
  consensusSummary?: string;
  sources?: {
    openai?: boolean;
    claude?: boolean;
  };
  interviewPlan?: {
    interviewerNote?: string;
    technicalQuestions?: string[];
    behavioralQuestions?: string[];
  } | null;
};

function getModeLabel(mode?: RecruiterMode) {
  if (mode === "strict") return "Strict";
  if (mode === "growth") return "Growth Potential";
  if (mode === "candidateFriendly") return "Candidate-Friendly";
  return "Balanced";
}

function getDecisionColor(decision: ResultData["finalDecision"]) {
  if (decision === "Hire") return "text-green-400";
  if (decision === "Consider") return "text-yellow-400";
  return "text-red-400";
}

function getAgreementColor(level?: ResultData["aiAgreement"]) {
  if (level === "High") return "text-green-300 border-green-500/30 bg-green-500/10";
  if (level === "Medium") return "text-yellow-300 border-yellow-500/30 bg-yellow-500/10";
  return "text-red-300 border-red-500/30 bg-red-500/10";
}

async function downloadPDF(result: ResultData) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;
  const left = 40;
  const lineHeight = 18;
  const maxWidth = width - 80;

  function ensureSpace(linesNeeded = 1) {
    if (y - linesNeeded * lineHeight < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 40;
    }
  }

  function drawLine(
    text: string,
    x = left,
    size = 12,
    bold = false,
    color = rgb(1, 1, 1)
  ) {
    ensureSpace(1);
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color,
    });
    y -= lineHeight;
  }

  function drawWrapped(text: string, x = left, size = 12, bold = false) {
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const activeFont = bold ? boldFont : font;
      const textWidth = activeFont.widthOfTextAtSize(candidate, size);

      if (textWidth > maxWidth - (x - left) && line) {
        drawLine(line, x, size, bold);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) drawLine(line, x, size, bold);
  }

  function drawSection(title: string) {
    y -= 8;
    drawLine(title, left, 14, true, rgb(0.2, 0.8, 1));
    y -= 4;
  }

  function drawBulletList(items: string[]) {
    if (!items.length) {
      drawLine("• -", left + 10, 11);
      return;
    }

    items.forEach((item) => {
      drawWrapped(`• ${item}`, left + 10, 11);
    });
  }

  drawLine("Candentry Analysis Report", left, 20, true, rgb(0.2, 0.8, 1));
  y -= 8;
  drawLine(`File: ${result.fileName}`);
  drawLine(`Mode: ${getModeLabel(result.mode)}`);
  y -= 8;

  drawSection("Summary Scores");
  drawLine(`Hire Score: ${result.hireScore}/100`, left, 12, true);
  drawLine(`Decision: ${result.finalDecision}`, left, 12, true);
  drawLine(`Technical Match: ${result.technicalMatch}/100`);
  drawLine(`Experience Match: ${result.experienceMatch}/100`);
  drawLine(`Risk Score: ${result.riskScore}/100`);

  drawSection("Strengths");
  drawBulletList(result.strengths || []);

  drawSection("Risks");
  drawBulletList(result.risks || []);

  drawSection("Missing Skills");
  drawBulletList(result.missingSkills || []);

  drawSection("Growth Potential");
  drawWrapped(result.growthPotential || "-", left + 10, 11);

  drawSection("Reasoning");
  drawWrapped(result.reasoning || "-", left + 10, 11);

  if (result.consensusSummary) {
    drawSection("Consensus Summary");
    drawWrapped(result.consensusSummary, left + 10, 11);
  }

  if (result.interviewPlan) {
    drawSection("Interview Intelligence");

    if (result.interviewPlan.interviewerNote) {
      drawWrapped(
        `Interviewer Note: ${result.interviewPlan.interviewerNote}`,
        left + 10,
        11
      );
    }

    y -= 6;
    drawLine("Technical Questions", left + 10, 12, true);
    drawBulletList(result.interviewPlan.technicalQuestions || []);

    y -= 6;
    drawLine("Behavioral Questions", left + 10, 12, true);
    drawBulletList(result.interviewPlan.behavioralQuestions || []);
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.fileName || "candentry-report"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("candentry-result");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch (error) {
      console.error("Failed to parse result data:", error);
    }
  }, []);

  const shareUrl = useMemo(() => {
    if (!data || typeof window === "undefined") return "";
    const encoded = encodeShareData({
      ...data,
      mode: data.mode || "balanced",
      aiAgreement: data.aiAgreement || "Medium",
      consensusSummary: data.consensusSummary || data.reasoning,
      sources: {
        openai: data.sources?.openai ?? true,
        claude: data.sources?.claude ?? false,
      },
      interviewPlan: data.interviewPlan || null,
    });
    return `${window.location.origin}/report?data=${encoded}`;
  }, [data]);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Analysis Failed
          </h1>
          <p className="mt-6 text-red-400">No analysis result found.</p>
        </div>
      </main>
    );
  }

  function handleCopyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveCandidate() {
    const id = `${data.fileName}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    saveCandidate({
      id,
      savedAt: new Date().toISOString(),
      fileName: data.fileName,
      mode: data.mode || "balanced",
      hireScore: data.hireScore,
      finalDecision: data.finalDecision,
      technicalMatch: data.technicalMatch,
      experienceMatch: data.experienceMatch,
      riskScore: data.riskScore,
      strengths: data.strengths || [],
      risks: data.risks || [],
      missingSkills: data.missingSkills || [],
      growthPotential: data.growthPotential || "",
      reasoning: data.reasoning || "",
      shortlist: false,
      status: "New",
      notes: "",
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry Analysis
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-6xl">
              Candidate Evaluation
            </h1>
            <p className="mt-6 text-2xl text-slate-300">{data.fileName}</p>
            <p className="mt-2 text-slate-400">
              Recruiter mode:{" "}
              <span className="text-cyan-300">{getModeLabel(data.mode)}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyShareLink}
              className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm transition hover:border-green-400 hover:text-green-300"
            >
              {copied ? "Share Link Copied" : "Copy Share Link"}
            </button>

            <button
              onClick={handleSaveCandidate}
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm transition hover:border-violet-400 hover:text-violet-300"
            >
              {saved ? "Saved" : "Save Candidate"}
            </button>

            <button
              onClick={() => downloadPDF(data)}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Download PDF report
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <span
            className={`rounded-full border px-4 py-2 text-sm ${data.sources?.openai ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-slate-700 bg-slate-900 text-slate-400"}`}
          >
            OpenAI: {data.sources?.openai ? "Active" : "Unavailable"}
          </span>

          <span
            className={`rounded-full border px-4 py-2 text-sm ${data.sources?.claude ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-slate-700 bg-slate-900 text-slate-400"}`}
          >
            Claude: {data.sources?.claude ? "Active" : "Unavailable"}
          </span>
        </div>

        {(!data.sources?.openai || !data.sources?.claude) && (
          <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-2xl font-semibold text-yellow-300">
              Single-model fallback used
            </h2>
            <p className="mt-3 text-slate-200">
              Only one model was available during analysis. The result was
              generated from a single-model fallback instead of a full
              multi-model consensus.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Consensus Hire Score</p>
            <p className="mt-4 text-6xl font-semibold text-cyan-300">
              {data.hireScore}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Consensus Decision</p>
            <p className={`mt-4 text-6xl font-semibold ${getDecisionColor(data.finalDecision)}`}>
              {data.finalDecision}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Technical Match</p>
            <p className="mt-4 text-4xl font-semibold text-blue-300">
              {data.technicalMatch}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Experience Match</p>
            <p className="mt-4 text-4xl font-semibold text-purple-300">
              {data.experienceMatch}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Risk Score</p>
            <p className="mt-4 text-4xl font-semibold text-red-300">
              {data.riskScore}/100
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-semibold">AI Consensus</h2>
            <span className={`rounded-full border px-4 py-2 text-sm ${getAgreementColor(data.aiAgreement)}`}>
              AI Agreement: {data.aiAgreement || "Low"}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">OpenAI Decision</p>
              <p className="mt-3 text-2xl font-semibold text-yellow-300">
                {data.finalDecision}
              </p>
              <p className="mt-2 text-slate-400">Score: {data.hireScore}/100</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Claude Decision</p>
              <p className="mt-3 text-2xl font-semibold text-slate-400">
                {data.sources?.claude ? data.finalDecision : "Unavailable"}
              </p>
              <p className="mt-2 text-slate-400">
                Score: {data.sources?.claude ? `${data.hireScore}/100` : "0/100"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Consensus Status</p>
              <p className="mt-3 text-2xl font-semibold text-red-300">
                {data.sources?.openai && data.sources?.claude ? "Consensus" : "Fallback"}
              </p>
              <p className="mt-2 text-slate-400">
                {data.sources?.openai && data.sources?.claude
                  ? "Multi-model result"
                  : "Single-model result"}
              </p>
            </div>
          </div>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            {data.consensusSummary ||
              "Only one model was available, so the result is based on a single-model fallback."}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h3 className="text-2xl font-semibold text-green-300">Strengths</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {(data.strengths || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h3 className="text-2xl font-semibold text-red-300">Risks</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {(data.risks || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h3 className="text-2xl font-semibold text-yellow-300">
              Missing Skills
            </h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {(data.missingSkills || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-3xl font-semibold">Growth Potential</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            {data.growthPotential || "-"}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-3xl font-semibold">Reasoning</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            {data.reasoning || "-"}
          </p>
        </div>

        {data.interviewPlan && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-3xl font-semibold">Interview Intelligence</h2>

            {data.interviewPlan.interviewerNote && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-2xl font-semibold">Interviewer Note</h3>
                <p className="mt-4 text-lg leading-8 text-slate-300">
                  {data.interviewPlan.interviewerNote}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-2xl font-semibold">Technical Questions</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.technicalQuestions || []).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-2xl font-semibold">Behavioral Questions</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.behavioralQuestions || []).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}