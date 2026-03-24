"use client";

import { useEffect, useState } from "react";
import { encodeShareData } from "../../lib/share-report";
import { saveCandidate } from "../../lib/candidate-store";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type FinalDecision = "Hire" | "Consider" | "Reject";
type AgreementLevel = "High" | "Medium" | "Low";

type SingleAnalysis = {
  hireScore?: number;
  finalDecision?: FinalDecision;
  technicalMatch?: number;
  experienceMatch?: number;
  riskScore?: number;
  strengths?: string[];
  risks?: string[];
  missingSkills?: string[];
  growthPotential?: string;
  reasoning?: string;
};

type InterviewPlan = {
  technicalQuestions?: string[];
  behavioralQuestions?: string[];
  riskProbingQuestions?: string[];
  interviewFocusAreas?: string[];
  interviewerNote?: string;
  error?: string;
};

type ResultData = {
  fileName?: string;
  extractedText?: string;
  jobDescription?: string;
  mode?: RecruiterMode;

  hireScore?: number;
  finalDecision?: FinalDecision;
  technicalMatch?: number;
  experienceMatch?: number;
  riskScore?: number;

  strengths?: string[];
  risks?: string[];
  missingSkills?: string[];

  growthPotential?: string;
  reasoning?: string;

  openaiAnalysis?: SingleAnalysis | null;
  claudeAnalysis?: SingleAnalysis | null;
  aiAgreement?: AgreementLevel;
  consensusSummary?: string;

  sources?: {
    openai?: boolean;
    claude?: boolean;
  };

  error?: string;
  rawResponse?: string;
};

const modeLabels: Record<RecruiterMode, string> = {
  strict: "Strict",
  balanced: "Balanced",
  growth: "Growth Potential",
  candidateFriendly: "Candidate-Friendly",
};

function getDecisionColor(decision?: FinalDecision) {
  if (decision === "Hire") return "text-green-400";
  if (decision === "Consider") return "text-yellow-400";
  return "text-red-400";
}

function getAgreementColor(level?: AgreementLevel) {
  if (level === "High") return "text-green-400";
  if (level === "Medium") return "text-yellow-400";
  return "text-red-400";
}

function getAgreementBg(level?: AgreementLevel) {
  if (level === "High") return "border-green-500/30 bg-green-500/10";
  if (level === "Medium") return "border-yellow-500/30 bg-yellow-500/10";
  return "border-red-500/30 bg-red-500/10";
}

function StatusBadge({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-green-500/30 bg-green-500/10 text-green-300"
          : "border-slate-700 bg-slate-800 text-slate-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-green-400" : "bg-slate-500"
        }`}
      />
      <span>
        {label}: {active ? "Active" : "Unavailable"}
      </span>
    </div>
  );
}

export default function ResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">(
    "idle"
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("candentry-result");

    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData({
          error: "Could not load analysis result.",
        });
      }
    } else {
      setData({
        error: "No analysis result found.",
      });
    }
  }, []);

  async function copyShareLink() {
    if (!data) return;

    try {
      const payload = encodeShareData({
        fileName: data.fileName,
        mode: data.mode,
        hireScore: data.hireScore,
        finalDecision: data.finalDecision,
        technicalMatch: data.technicalMatch,
        experienceMatch: data.experienceMatch,
        riskScore: data.riskScore,
        strengths: data.strengths,
        risks: data.risks,
        missingSkills: data.missingSkills,
        growthPotential: data.growthPotential,
        reasoning: data.reasoning,
        aiAgreement: data.aiAgreement,
        consensusSummary: data.consensusSummary,
        sources: data.sources,
        interviewPlan: interviewPlan
          ? {
              technicalQuestions: interviewPlan.technicalQuestions || [],
              behavioralQuestions: interviewPlan.behavioralQuestions || [],
              riskProbingQuestions: interviewPlan.riskProbingQuestions || [],
              interviewFocusAreas: interviewPlan.interviewFocusAreas || [],
              interviewerNote: interviewPlan.interviewerNote || "",
            }
          : null,
      });

      const shareUrl = `${window.location.origin}/report?data=${payload}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopyState("copied");

      setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);

      setCopyState("failed");

      setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    }
  }

  function handleSaveCandidate() {
    if (!data) return;

    try {
      const candidate = {
        id: `${data.fileName || "candidate"}-${Date.now()}`,
        savedAt: new Date().toISOString(),
        fileName: data.fileName || "Candidate",
        mode: data.mode || "balanced",
        hireScore: data.hireScore ?? 0,
        finalDecision: data.finalDecision ?? "Reject",
        technicalMatch: data.technicalMatch ?? 0,
        experienceMatch: data.experienceMatch ?? 0,
        riskScore: data.riskScore ?? 0,
        strengths: data.strengths || [],
        risks: data.risks || [],
        missingSkills: data.missingSkills || [],
        growthPotential: data.growthPotential || "N/A",
        reasoning: data.reasoning || "N/A",
        shortlist: false,
        status: "New" as const,
      };

      saveCandidate(candidate);

      setSaveState("saved");

      setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    } catch (error) {
      console.error("Save failed:", error);

      setSaveState("failed");

      setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    }
  }

  async function generateInterviewPlan() {
    if (!data?.extractedText || !data?.jobDescription) return;

    try {
      setInterviewLoading(true);
      setInterviewPlan(null);

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedText: data.extractedText,
          jobDescription: data.jobDescription,
          mode: data.mode || "balanced",
          candidateName: data.fileName || "Candidate",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setInterviewPlan({
          error: result.error || "Interview plan generation failed.",
        });
        return;
      }

      setInterviewPlan(result);
    } catch (error) {
      console.error("Interview plan error:", error);
      setInterviewPlan({
        error: "Something went wrong while generating interview questions.",
      });
    } finally {
      setInterviewLoading(false);
    }
  }

  async function downloadPDF(result: ResultData) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 14;
    const width = 180;
    let y = 16;

    const ensureSpace = (needed = 10) => {
      if (y + needed > pageHeight - 14) {
        doc.addPage();
        y = 16;
      }
    };

    const addTitle = (title: string) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, left, y);
      y += 8;
    };

    const addText = (text: string) => {
      const lines = doc.splitTextToSize(text || "-", width);
      ensureSpace(lines.length * 6 + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(lines, left, y);
      y += lines.length * 6 + 2;
    };

    const addList = (items?: string[]) => {
      if (!items?.length) {
        addText("- None");
        return;
      }

      items.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, width);
        ensureSpace(lines.length * 6 + 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(lines, left, y);
        y += lines.length * 6 + 2;
      });
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Candidate Evaluation Report", left, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`File: ${result.fileName || "N/A"}`, left, y);
    y += 7;
    doc.text(
      `Recruiter Mode: ${
        result.mode ? modeLabels[result.mode] : "Balanced"
      }`,
      left,
      y
    );
    y += 7;
    doc.text(`Consensus Hire Score: ${result.hireScore ?? 0}/100`, left, y);
    y += 7;
    doc.text(`Consensus Decision: ${result.finalDecision ?? "Reject"}`, left, y);
    y += 7;
    doc.text(`AI Agreement: ${result.aiAgreement ?? "N/A"}`, left, y);
    y += 7;
    doc.text(
      `Sources: OpenAI ${result.sources?.openai ? "Active" : "Unavailable"}, Claude ${
        result.sources?.claude ? "Active" : "Unavailable"
      }`,
      left,
      y
    );
    y += 10;

    addTitle("Consensus Summary");
    addText(result.consensusSummary || "N/A");
    y += 4;

    addTitle("Strengths");
    addList(result.strengths);
    y += 4;

    addTitle("Risks");
    addList(result.risks);
    y += 4;

    addTitle("Missing Skills");
    addList(result.missingSkills);
    y += 4;

    addTitle("Growth Potential");
    addText(result.growthPotential || "N/A");
    y += 4;

    addTitle("Reasoning");
    addText(result.reasoning || "N/A");

    doc.save("candidate-report.pdf");
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-slate-300">Loading result...</p>
        </div>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Analysis Failed
          </h1>
          <p className="mt-6 text-lg text-red-400">{data.error}</p>
          {data.fileName && (
            <p className="mt-6 text-slate-400">File analyzed: {data.fileName}</p>
          )}
        </div>
      </main>
    );
  }

  const openaiActive = !!data.sources?.openai;
  const claudeActive = !!data.sources?.claude;
  const singleModelFallback = openaiActive !== claudeActive;
  const bothModelsActive = openaiActive && claudeActive;
  const lowAgreementWithBoth = bothModelsActive && data.aiAgreement === "Low";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry Analysis
            </p>

            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Candidate Evaluation
            </h1>

            {data.fileName && (
              <p className="mt-4 text-slate-400">
                File analyzed: {data.fileName}
              </p>
            )}

            {data.mode && (
              <p className="mt-2 text-sm text-slate-400">
                Recruiter mode:{" "}
                <span className="text-cyan-300">{modeLabels[data.mode]}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={copyShareLink}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm transition hover:border-emerald-400 hover:text-emerald-300"
            >
              {copyState === "copied"
                ? "Link Copied"
                : copyState === "failed"
                ? "Copy Failed"
                : "Copy Share Link"}
            </button>

            <button
              onClick={handleSaveCandidate}
              className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm transition hover:border-violet-400 hover:text-violet-300"
            >
              {saveState === "saved"
                ? "Candidate Saved"
                : saveState === "failed"
                ? "Save Failed"
                : "Save Candidate"}
            </button>

            <button
              onClick={generateInterviewPlan}
              disabled={interviewLoading}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-60"
            >
              {interviewLoading
                ? "Generating interview plan..."
                : "Generate Interview Plan"}
            </button>

            <button
              onClick={() => downloadPDF(data)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Download PDF report
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <StatusBadge label="OpenAI" active={openaiActive} />
          <StatusBadge label="Claude" active={claudeActive} />
        </div>

        {singleModelFallback && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <h2 className="text-lg font-semibold text-yellow-300">
              Single-model fallback used
            </h2>
            <p className="mt-2 text-sm leading-7 text-yellow-100/90">
              Only one model was available during analysis. The result was
              generated from a single-model fallback instead of a full
              multi-model consensus.
            </p>
          </div>
        )}

        {lowAgreementWithBoth && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <h2 className="text-lg font-semibold text-red-300">
              Model disagreement detected
            </h2>
            <p className="mt-2 text-sm leading-7 text-red-100/90">
              OpenAI and Claude disagreed materially on this candidate. Review
              the strengths, risks, and job alignment carefully before making a
              final hiring decision.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Consensus Hire Score</p>
            <p className="mt-3 text-4xl font-semibold text-cyan-300">
              {data.hireScore ?? 0}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm text-slate-400">Consensus Decision</p>
            <p
              className={`mt-3 text-4xl font-semibold ${getDecisionColor(
                data.finalDecision
              )}`}
            >
              {data.finalDecision ?? "Reject"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Technical Match</p>
            <p className="mt-2 text-2xl font-semibold text-blue-400">
              {data.technicalMatch ?? 0}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Experience Match</p>
            <p className="mt-2 text-2xl font-semibold text-purple-400">
              {data.experienceMatch ?? 0}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Risk Score</p>
            <p className="mt-2 text-2xl font-semibold text-red-400">
              {data.riskScore ?? 0}/100
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold">AI Consensus</h2>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${getAgreementBg(
                data.aiAgreement
              )}`}
            >
              <span className={`font-medium ${getAgreementColor(data.aiAgreement)}`}>
                AI Agreement: {data.aiAgreement ?? "N/A"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">OpenAI Decision</p>
              <p
                className={`mt-2 text-2xl font-semibold ${getDecisionColor(
                  data.openaiAnalysis?.finalDecision
                )}`}
              >
                {openaiActive
                  ? data.openaiAnalysis?.finalDecision ?? "N/A"
                  : "Unavailable"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Score: {openaiActive ? data.openaiAnalysis?.hireScore ?? 0 : 0}/100
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Claude Decision</p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  claudeActive
                    ? getDecisionColor(data.claudeAnalysis?.finalDecision)
                    : "text-slate-500"
                }`}
              >
                {claudeActive
                  ? data.claudeAnalysis?.finalDecision ?? "N/A"
                  : "Unavailable"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Score: {claudeActive ? data.claudeAnalysis?.hireScore ?? 0 : 0}/100
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Consensus Status</p>
              <p
                className={`mt-2 text-2xl font-semibold ${getAgreementColor(
                  data.aiAgreement
                )}`}
              >
                {singleModelFallback
                  ? "Fallback"
                  : data.aiAgreement ?? "N/A"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {singleModelFallback
                  ? "Single-model result"
                  : "Dual-model consensus"}
              </p>
            </div>
          </div>

          {data.consensusSummary && (
            <p className="mt-6 leading-8 text-slate-300">
              {data.consensusSummary}
            </p>
          )}
        </div>

        {interviewPlan && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            {interviewPlan.error ? (
              <>
                <h2 className="text-2xl font-semibold">Interview Plan Failed</h2>
                <p className="mt-4 text-red-400">{interviewPlan.error}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">Interview Intelligence</h2>

                {interviewPlan.interviewerNote && (
                  <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <h3 className="text-xl font-semibold">Interviewer Note</h3>
                    <p className="mt-4 leading-8 text-slate-300">
                      {interviewPlan.interviewerNote}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <h3 className="text-xl font-semibold">Technical Questions</h3>
                    <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                      {interviewPlan.technicalQuestions?.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <h3 className="text-xl font-semibold">Behavioral Questions</h3>
                    <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                      {interviewPlan.behavioralQuestions?.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <h3 className="text-xl font-semibold">Risk-Probing Questions</h3>
                    <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                      {interviewPlan.riskProbingQuestions?.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                    <h3 className="text-xl font-semibold">Interview Focus Areas</h3>
                    <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                      {interviewPlan.interviewFocusAreas?.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Strengths</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {data.strengths?.length ? (
                data.strengths.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No strengths returned.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Risks</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {data.risks?.length ? (
                data.risks.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No risks returned.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-semibold">Missing Skills</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
            {data.missingSkills?.length ? (
              data.missingSkills.map((item, i) => <li key={i}>{item}</li>)
            ) : (
              <li>No major missing skills identified.</li>
            )}
          </ul>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Growth Potential</h2>
            <p className="mt-4 leading-8 text-slate-300">
              {data.growthPotential ?? "N/A"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Reasoning</h2>
            <p className="mt-4 leading-8 text-slate-300">
              {data.reasoning ?? "N/A"}
            </p>
          </div>
        </div>

        {data.jobDescription && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Job Description</h2>
            <pre className="mt-4 whitespace-pre-wrap break-words text-slate-300">
              {data.jobDescription}
            </pre>
          </div>
        )}

        {data.extractedText && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Extracted CV Text</h2>
            <pre className="mt-4 whitespace-pre-wrap break-words text-slate-300">
              {data.extractedText}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}