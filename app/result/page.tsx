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
  if (decision === "Hire") return "text-green-600";
  if (decision === "Consider") return "text-amber-600";
  return "text-red-600";
}

function getAgreementColor(level?: ResultData["aiAgreement"]) {
  if (level === "High") {
    return "text-green-700 border-green-200 bg-green-50";
  }
  if (level === "Medium") {
    return "text-amber-700 border-amber-200 bg-amber-50";
  }
  return "text-red-700 border-red-200 bg-red-50";
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
    color = rgb(0, 0, 0)
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
    drawLine(title, left, 14, true, rgb(0.15, 0.39, 0.92));
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

  drawLine("CandEntry Analysis Report", left, 20, true, rgb(0.15, 0.39, 0.92));
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
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
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
      <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 p-10 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
            CandEntry Analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Analysis Failed
          </h1>
          <p className="mt-6 text-red-600">No analysis result found.</p>
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
    if (!data) return;

    const currentData = data;

    const id = `${currentData.fileName}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    saveCandidate({
      id,
      savedAt: new Date().toISOString(),
      fileName: currentData.fileName,
      mode: currentData.mode || "balanced",
      hireScore: currentData.hireScore,
      finalDecision: currentData.finalDecision,
      technicalMatch: currentData.technicalMatch,
      experienceMatch: currentData.experienceMatch,
      riskScore: currentData.riskScore,
      strengths: currentData.strengths || [],
      risks: currentData.risks || [],
      missingSkills: currentData.missingSkills || [],
      growthPotential: currentData.growthPotential || "",
      reasoning: currentData.reasoning || "",
      shortlist: false,
      status: "New",
      notes: "",
      source: "upload",
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
              CandEntry Analysis
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl md:text-6xl">
              Candidate Evaluation
            </h1>
            <p className="mt-4 text-xl text-slate-700 sm:text-2xl">
              {data.fileName}
            </p>
            <p className="mt-2 text-slate-500">
              Recruiter mode:{" "}
              <span className="font-medium text-blue-700">
                {getModeLabel(data.mode)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyShareLink}
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 transition hover:bg-green-100"
            >
              {copied ? "Share Link Copied" : "Copy Share Link"}
            </button>

            <button
              onClick={handleSaveCandidate}
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700 transition hover:bg-violet-100"
            >
              {saved ? "Saved" : "Save Candidate"}
            </button>

            <button
              onClick={() => downloadPDF(data)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
            >
              Download PDF report
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <span
            className={`rounded-full border px-4 py-2 text-sm ${
              data.sources?.openai
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-300 bg-slate-100 text-slate-500"
            }`}
          >
            OpenAI: {data.sources?.openai ? "Active" : "Unavailable"}
          </span>

          <span
            className={`rounded-full border px-4 py-2 text-sm ${
              data.sources?.claude
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-300 bg-slate-100 text-slate-500"
            }`}
          >
            Claude: {data.sources?.claude ? "Active" : "Unavailable"}
          </span>
        </div>

        {(!data.sources?.openai || !data.sources?.claude) && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-2xl font-semibold text-amber-700">
              Single-model fallback used
            </h2>
            <p className="mt-3 text-slate-700">
              Only one model was available during analysis. The result was
              generated from a single-model fallback instead of a full
              multi-model consensus.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm text-slate-500">Consensus Hire Score</p>
            <p className="mt-4 text-5xl font-semibold text-blue-700 sm:text-6xl">
              {data.hireScore}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm text-slate-500">Consensus Decision</p>
            <p
              className={`mt-4 text-5xl font-semibold sm:text-6xl ${getDecisionColor(
                data.finalDecision
              )}`}
            >
              {data.finalDecision}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm text-slate-500">Technical Match</p>
            <p className="mt-4 text-4xl font-semibold text-blue-700">
              {data.technicalMatch}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm text-slate-500">Experience Match</p>
            <p className="mt-4 text-4xl font-semibold text-violet-700">
              {data.experienceMatch}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm text-slate-500">Risk Score</p>
            <p className="mt-4 text-4xl font-semibold text-red-600">
              {data.riskScore}/100
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-semibold text-slate-900">
              AI Consensus
            </h2>
            <span
              className={`rounded-full border px-4 py-2 text-sm ${getAgreementColor(
                data.aiAgreement
              )}`}
            >
              AI Agreement: {data.aiAgreement || "Low"}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">OpenAI Decision</p>
              <p className="mt-3 text-2xl font-semibold text-amber-700">
                {data.finalDecision}
              </p>
              <p className="mt-2 text-slate-500">
                Score: {data.hireScore}/100
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">Claude Decision</p>
              <p className="mt-3 text-2xl font-semibold text-slate-700">
                {data.sources?.claude ? data.finalDecision : "Unavailable"}
              </p>
              <p className="mt-2 text-slate-500">
                Score: {data.sources?.claude ? `${data.hireScore}/100` : "0/100"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">Consensus Status</p>
              <p className="mt-3 text-2xl font-semibold text-red-600">
                {data.sources?.openai && data.sources?.claude
                  ? "Consensus"
                  : "Fallback"}
              </p>
              <p className="mt-2 text-slate-500">
                {data.sources?.openai && data.sources?.claude
                  ? "Multi-model result"
                  : "Single-model result"}
              </p>
            </div>
          </div>

          <p className="mt-6 text-lg leading-8 text-slate-700">
            {data.consensusSummary ||
              "Only one model was available, so the result is based on a single-model fallback."}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-green-700">Strengths</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
              {(data.strengths || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-red-700">Risks</h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
              {(data.risks || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h3 className="text-2xl font-semibold text-amber-700">
              Missing Skills
            </h3>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
              {(data.missingSkills || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">
            Growth Potential
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            {data.growthPotential || "-"}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">Reasoning</h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            {data.reasoning || "-"}
          </p>
        </div>

        {data.interviewPlan && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-900">
              Interview Intelligence
            </h2>

            {data.interviewPlan.interviewerNote && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Interviewer Note
                </h3>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  {data.interviewPlan.interviewerNote}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Technical Questions
                </h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
                  {(data.interviewPlan.technicalQuestions || []).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Behavioral Questions
                </h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
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