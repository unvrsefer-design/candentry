"use client";

import { useEffect, useMemo, useState } from "react";
import { saveCandidate, type RecruiterMode } from "@/lib/candidate-store";

type BulkCandidateResult = {
  fileName: string;
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

type BulkResultPayload = {
  results?: BulkCandidateResult[];
  candidates?: BulkCandidateResult[];
  mode?: RecruiterMode;
};

function getDecisionColor(decision: BulkCandidateResult["finalDecision"]) {
  if (decision === "Hire") return "text-green-600";
  if (decision === "Consider") return "text-amber-600";
  return "text-red-600";
}

function getModeLabel(mode?: RecruiterMode) {
  if (mode === "strict") return "Strict";
  if (mode === "growth") return "Growth Potential";
  if (mode === "candidateFriendly") return "Candidate-Friendly";
  return "Balanced";
}

export default function BulkResultsPage() {
  const [items, setItems] = useState<BulkCandidateResult[]>([]);
  const [mode, setMode] = useState<RecruiterMode>("balanced");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("candentry-bulk-result");
      if (!raw) {
        setItems([]);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(raw) as BulkResultPayload | BulkCandidateResult[];

      if (Array.isArray(parsed)) {
        setItems(parsed);
      } else {
        setItems(parsed.results || parsed.candidates || []);
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch (error) {
      console.error("Failed to parse bulk results:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const ranking = useMemo(() => {
    return [...items].sort((a, b) => b.hireScore - a.hireScore);
  }, [items]);

  function handleSaveCandidate(candidate: BulkCandidateResult) {
    const id = `${candidate.fileName}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    saveCandidate({
      id,
      savedAt: new Date().toISOString(),
      fileName: candidate.fileName,
      mode,
      hireScore: candidate.hireScore,
      finalDecision: candidate.finalDecision,
      technicalMatch: candidate.technicalMatch,
      experienceMatch: candidate.experienceMatch,
      riskScore: candidate.riskScore,
      strengths: candidate.strengths || [],
      risks: candidate.risks || [],
      missingSkills: candidate.missingSkills || [],
      growthPotential: candidate.growthPotential || "",
      reasoning: candidate.reasoning || "",
      shortlist: false,
      status: "New",
      notes: "",
      source: "upload",
    });

    setSavedIds((prev) => [...prev, candidate.fileName]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
            CandEntry Bulk Screening
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Bulk Results
          </h1>
          <p className="mt-4 text-slate-600">Loading results...</p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
            CandEntry Bulk Screening
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            No bulk results found
          </h1>
          <p className="mt-4 text-slate-600">
            Analyze candidates from the Bulk Upload page first.
          </p>

          <div className="mt-8">
            <button
              onClick={() => {
                window.location.href = "/bulk-upload";
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Go to Bulk Upload
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">
            CandEntry Bulk Screening
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Bulk Results
          </h1>
          <p className="mt-3 text-slate-600">
            Ranked candidates from your bulk upload analysis.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Recruiter mode:{" "}
            <span className="font-medium text-blue-700">{getModeLabel(mode)}</span>
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Candidates Analyzed</p>
            <p className="mt-2 text-2xl font-semibold text-blue-700">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Top Score</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {ranking[0]?.hireScore ?? 0}/100
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Hire Decisions</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {items.filter((item) => item.finalDecision === "Hire").length}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {ranking.map((candidate, index) => (
            <div
              key={`${candidate.fileName}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                      Rank #{index + 1}
                    </span>

                    <h2 className="text-2xl font-semibold text-slate-900">
                      {candidate.fileName}
                    </h2>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Hire Score</p>
                      <p className="mt-2 text-2xl font-semibold text-blue-700">
                        {candidate.hireScore}/100
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Decision</p>
                      <p
                        className={`mt-2 text-2xl font-semibold ${getDecisionColor(
                          candidate.finalDecision
                        )}`}
                      >
                        {candidate.finalDecision}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Technical</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {candidate.technicalMatch}/100
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Experience</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {candidate.experienceMatch}/100
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => handleSaveCandidate(candidate)}
                    disabled={savedIds.includes(candidate.fileName)}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savedIds.includes(candidate.fileName)
                      ? "Saved"
                      : "Save Candidate"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-green-700">
                    Strengths
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
                    {(candidate.strengths || []).length ? (
                      candidate.strengths.map((item, i) => <li key={i}>{item}</li>)
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-red-700">Risks</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
                    {(candidate.risks || []).length ? (
                      candidate.risks.map((item, i) => <li key={i}>{item}</li>)
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-amber-700">
                    Missing Skills
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
                    {(candidate.missingSkills || []).length ? (
                      candidate.missingSkills.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  Reasoning
                </h3>
                <p className="mt-3 leading-7 text-slate-700">
                  {candidate.reasoning || "-"}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  Growth Potential
                </h3>
                <p className="mt-3 leading-7 text-slate-700">
                  {candidate.growthPotential || "-"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}