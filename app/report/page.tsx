"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { decodeShareData } from "@/lib/share-report";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type ReportData = {
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

function getDecisionColor(decision: ReportData["finalDecision"]) {
  if (decision === "Hire") return "text-green-400";
  if (decision === "Consider") return "text-yellow-400";
  return "text-red-400";
}

function getAgreementColor(level?: ReportData["aiAgreement"]) {
  if (level === "High") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }
  if (level === "Medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function ReportPageContent() {
  const searchParams = useSearchParams();

  const data = useMemo(() => {
    const encoded = searchParams.get("data");
    if (!encoded) return null;

    try {
      return decodeShareData(encoded) as ReportData;
    } catch (error) {
      console.error("Failed to decode shared report:", error);
      return null;
    }
  }, [searchParams]);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Shared Report
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Report Unavailable
          </h1>
          <p className="mt-6 text-red-400">
            This shared report link is invalid or incomplete.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Shared Report
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

        <div className="mb-8 flex flex-wrap gap-3">
          <span
            className={`rounded-full border px-4 py-2 text-sm ${
              data.sources?.openai
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
          >
            OpenAI: {data.sources?.openai ? "Active" : "Unavailable"}
          </span>

          <span
            className={`rounded-full border px-4 py-2 text-sm ${
              data.sources?.claude
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
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
            <p
              className={`mt-4 text-6xl font-semibold ${getDecisionColor(
                data.finalDecision
              )}`}
            >
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
            <span
              className={`rounded-full border px-4 py-2 text-sm ${getAgreementColor(
                data.aiAgreement
              )}`}
            >
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
                {data.sources?.openai && data.sources?.claude
                  ? "Consensus"
                  : "Fallback"}
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

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry Shared Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Candidate Evaluation
            </h1>
            <p className="mt-4 text-slate-300">Loading shared report...</p>
          </div>
        </main>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}