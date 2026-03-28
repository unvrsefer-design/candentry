"use client";

import Link from "next/link";
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
  if (decision === "Hire") return "text-green-600";
  if (decision === "Consider") return "text-amber-600";
  return "text-red-600";
}

function getAgreementColor(level?: ReportData["aiAgreement"]) {
  if (level === "High") return "border-green-200 bg-green-50 text-green-700";
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

function ReportUnavailableState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">📄</div>

        <p className="text-xs uppercase tracking-[0.2em] text-blue-600">
          CandEntry Report
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Report unavailable
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          This shared report link is invalid, expired, or incomplete.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/upload"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Upload new CV
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
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
    return <ReportUnavailableState />;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
            CandEntry Shared Report
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
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
              <p className="mt-2 text-slate-500">Score: {data.hireScore}/100</p>
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

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
              CandEntry Shared Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Candidate Evaluation
            </h1>
            <p className="mt-4 text-slate-600">Loading shared report...</p>
          </div>
        </main>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}