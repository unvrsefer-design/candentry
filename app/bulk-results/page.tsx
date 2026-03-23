"use client";

import { useEffect, useMemo, useState } from "react";
import { saveCandidate } from "@/lib/candidate-store";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type Candidate = {
  fileName: string;
  hireScore: number;
  finalDecision: "Hire" | "Consider" | "Reject";
  technicalMatch: number;
  experienceMatch: number;
  riskScore: number;
  strengths: string[];
  risks: string[];
  missingSkills: string[];
  summary: string;
};

type BulkResult = {
  totalCandidates: number;
  mode: RecruiterMode;
  results: Candidate[];
  topCandidates: Candidate[];
};

const decisionOptions = ["All", "Hire", "Consider", "Reject"] as const;

function getDecisionColor(decision: Candidate["finalDecision"]) {
  if (decision === "Hire") return "text-green-400";
  if (decision === "Consider") return "text-yellow-400";
  return "text-red-400";
}

function getModeLabel(mode: RecruiterMode) {
  if (mode === "strict") return "Strict";
  if (mode === "growth") return "Growth Potential";
  if (mode === "candidateFriendly") return "Candidate-Friendly";
  return "Balanced";
}

export default function BulkResultsPage() {
  const [data, setData] = useState<BulkResult | null>(null);
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [top10Saved, setTop10Saved] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [decisionFilter, setDecisionFilter] =
    useState<(typeof decisionOptions)[number]>("All");
  const [topOnly, setTopOnly] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("candentry-bulk-result");

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch {
      console.error("Failed to parse bulk result");
    }
  }, []);

  const top10Count = useMemo(() => {
    if (!data?.topCandidates) return 0;
    return data.topCandidates.length;
  }, [data]);

  const visibleResults = useMemo(() => {
    if (!data) return [];

    const source = topOnly ? data.topCandidates : data.results;

    return source.filter((candidate) => {
      const matchesSearch =
        !searchQuery.trim() ||
        candidate.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.strengths.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.risks.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.missingSkills
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesDecision =
        decisionFilter === "All" ||
        candidate.finalDecision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [data, searchQuery, decisionFilter, topOnly]);

  const visibleTopCandidates = useMemo(() => {
    if (!data) return [];

    return data.topCandidates.filter((candidate) => {
      const matchesSearch =
        !searchQuery.trim() ||
        candidate.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDecision =
        decisionFilter === "All" ||
        candidate.finalDecision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [data, searchQuery, decisionFilter]);

  function saveToDashboard(candidate: Candidate, shortlist = false) {
    const id = `${candidate.fileName}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    saveCandidate({
      id,
      savedAt: new Date().toISOString(),
      fileName: candidate.fileName,
      mode: data?.mode || "balanced",
      hireScore: candidate.hireScore,
      finalDecision: candidate.finalDecision,
      technicalMatch: candidate.technicalMatch,
      experienceMatch: candidate.experienceMatch,
      riskScore: candidate.riskScore,
      strengths: candidate.strengths,
      risks: candidate.risks,
      missingSkills: candidate.missingSkills,
      growthPotential: "",
      reasoning: candidate.summary,
      shortlist,
      status: "New",
      notes: "",
    });

    setSavedNames((prev) =>
      prev.includes(candidate.fileName) ? prev : [...prev, candidate.fileName]
    );
  }

  function saveTop10ToDashboard() {
    if (!data?.topCandidates?.length) return;

    data.topCandidates.forEach((candidate) => {
      const id = `${candidate.fileName}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      saveCandidate({
        id,
        savedAt: new Date().toISOString(),
        fileName: candidate.fileName,
        mode: data.mode || "balanced",
        hireScore: candidate.hireScore,
        finalDecision: candidate.finalDecision,
        technicalMatch: candidate.technicalMatch,
        experienceMatch: candidate.experienceMatch,
        riskScore: candidate.riskScore,
        strengths: candidate.strengths,
        risks: candidate.risks,
        missingSkills: candidate.missingSkills,
        growthPotential: "",
        reasoning: candidate.summary,
        shortlist: true,
        status: "New",
        notes: "",
      });
    });

    setSavedNames((prev) => [
      ...new Set([
        ...prev,
        ...data.topCandidates.map((candidate) => candidate.fileName),
      ]),
    ]);
    setTop10Saved(true);
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>No bulk result found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry Bulk Screening
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Bulk Results
            </h1>
            <p className="mt-3 text-slate-400">
              {data.totalCandidates} candidates analyzed • Mode:{" "}
              <span className="text-cyan-300">{getModeLabel(data.mode)}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">
                {data.totalCandidates}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Top Candidates</p>
              <p className="mt-2 text-2xl font-semibold text-green-300">
                {top10Count}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Saved</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {savedNames.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Visible</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {visibleResults.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search Candidates
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file name, summary, strengths..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Decision Filter
              </label>
              <select
                value={decisionFilter}
                onChange={(e) =>
                  setDecisionFilter(
                    e.target.value as (typeof decisionOptions)[number]
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                {decisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={topOnly}
                  onChange={(e) => setTopOnly(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                Show top candidates only
              </label>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={saveTop10ToDashboard}
            disabled={top10Saved || !data.topCandidates.length}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {top10Saved
              ? `Top ${top10Count} Saved to Dashboard`
              : `Save Top ${top10Count} to Dashboard`}
          </button>

          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Open Dashboard
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold text-cyan-300">
            Top Candidates
          </h2>

          {visibleTopCandidates.length === 0 ? (
            <p className="mt-4 text-slate-400">
              No top candidates match the current search/filter state.
            </p>
          ) : (
            <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleTopCandidates.map((candidate, index) => {
                const isSaved = savedNames.includes(candidate.fileName);

                return (
                  <div
                    key={`${candidate.fileName}-${index}`}
                    className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6"
                  >
                    <p className="text-xs uppercase tracking-wide text-cyan-300">
                      Top Candidate
                    </p>

                    <h3 className="mt-2 truncate text-lg font-semibold">
                      {candidate.fileName}
                    </h3>

                    <p className="mt-4 text-4xl font-semibold text-cyan-300">
                      {candidate.hireScore}/100
                    </p>

                    <p
                      className={`mt-2 text-sm font-medium ${getDecisionColor(
                        candidate.finalDecision
                      )}`}
                    >
                      {candidate.finalDecision}
                    </p>

                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {candidate.summary}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => saveToDashboard(candidate, true)}
                        disabled={isSaved}
                        className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaved ? "Saved" : "Save to Dashboard"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold">All Candidates</h2>

          {visibleResults.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-slate-300">
                No candidates match your current search/filter state.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-6">
              {visibleResults.map((candidate, index) => {
                const isSaved = savedNames.includes(candidate.fileName);

                return (
                  <div
                    key={`${candidate.fileName}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">
                          {candidate.fileName}
                        </h3>
                        <p
                          className={`mt-1 text-sm ${getDecisionColor(
                            candidate.finalDecision
                          )}`}
                        >
                          {candidate.finalDecision}
                        </p>
                      </div>

                      <p className="text-3xl font-semibold text-cyan-300">
                        {candidate.hireScore}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-300">
                      <div>Technical Match: {candidate.technicalMatch}</div>
                      <div>Experience Match: {candidate.experienceMatch}</div>
                      <div>Risk Score: {candidate.riskScore}</div>
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-green-300">
                          Strengths
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                          {candidate.strengths.length ? (
                            candidate.strengths.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))
                          ) : (
                            <li>No strengths returned.</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-red-300">Risks</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                          {candidate.risks.length ? (
                            candidate.risks.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))
                          ) : (
                            <li>No risks returned.</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-yellow-300">
                          Missing Skills
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                          {candidate.missingSkills.length ? (
                            candidate.missingSkills.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))
                          ) : (
                            <li>No missing skills returned.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm text-slate-400">Summary</p>
                      <p className="mt-1 leading-7 text-slate-300">
                        {candidate.summary}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => saveToDashboard(candidate)}
                        disabled={isSaved}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}