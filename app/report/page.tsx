"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { decodeShareData } from "@/lib/share-report";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type FinalDecision = "Hire" | "Consider" | "Reject";
type AgreementLevel = "High" | "Medium" | "Low";

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

export default function SharedReportPage() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("data");

  const data = useMemo(() => {
    if (!raw) return null;
    return decodeShareData(raw);
  }, [raw]);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Shared Report
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Report unavailable
          </h1>
          <p className="mt-6 text-slate-300">
            This share link is invalid, incomplete, or corrupted.
          </p>
        </div>
      </main>
    );
  }

  const openaiActive = !!data.sources?.openai;
  const claudeActive = !!data.sources?.claude;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Shared Report
          </p>

          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Candidate Evaluation
          </h1>

          <p className="mt-4 text-slate-400">
            File analyzed: {data.fileName || "Candidate"}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Recruiter mode:{" "}
            <span className="text-cyan-300">
              {modeLabels[data.mode as RecruiterMode] || "Balanced"}
            </span>
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <StatusBadge label="OpenAI" active={openaiActive} />
          <StatusBadge label="Claude" active={claudeActive} />
        </div>

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
                data.finalDecision as FinalDecision
              )}`}
            >
              {data.finalDecision || "Reject"}
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">AI Consensus</h2>
            <div className="rounded-full border border-slate-700 px-4 py-2 text-sm">
              <span className={getAgreementColor(data.aiAgreement as AgreementLevel)}>
                AI Agreement: {data.aiAgreement || "Low"}
              </span>
            </div>
          </div>

          <p className="mt-6 leading-8 text-slate-300">
            {data.consensusSummary || "No consensus summary available."}
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Strengths</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {(data.strengths || []).length ? (
                data.strengths!.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No strengths returned.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Risks</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              {(data.risks || []).length ? (
                data.risks!.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No risks returned.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-semibold">Missing Skills</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
            {(data.missingSkills || []).length ? (
              data.missingSkills!.map((item, i) => <li key={i}>{item}</li>)
            ) : (
              <li>No major missing skills identified.</li>
            )}
          </ul>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Growth Potential</h2>
            <p className="mt-4 leading-8 text-slate-300">
              {data.growthPotential || "N/A"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Reasoning</h2>
            <p className="mt-4 leading-8 text-slate-300">
              {data.reasoning || "N/A"}
            </p>
          </div>
        </div>

        {data.interviewPlan && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-semibold">Interview Intelligence</h2>

            {data.interviewPlan.interviewerNote && (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-xl font-semibold">Interviewer Note</h3>
                <p className="mt-4 leading-8 text-slate-300">
                  {data.interviewPlan.interviewerNote}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-xl font-semibold">Technical Questions</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.technicalQuestions || []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-xl font-semibold">Behavioral Questions</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.behavioralQuestions || []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-xl font-semibold">Risk-Probing Questions</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.riskProbingQuestions || []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-xl font-semibold">Interview Focus Areas</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-300">
                  {(data.interviewPlan.interviewFocusAreas || []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}