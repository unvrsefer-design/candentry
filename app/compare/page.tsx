"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCandidateById,
  type SavedCandidate,
} from "../../lib/candidate-store";
import { saveCompareResult } from "../../lib/compare-store";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

type CompareApiResult = {
  bestCandidateIndex?: number;
  ranking?: number[];
  summary?: string;
  candidates?: Array<{
    score: number;
    strengths: string[];
    risks: string[];
  }>;
  comparison?: {
    dimensionWins: string[];
    whyWinner: string[];
    whyLoser: string[];
  };
  candidateNames?: string[];
  error?: string;
};

const modeLabels: Record<RecruiterMode, string> = {
  strict: "Strict",
  balanced: "Balanced",
  growth: "Growth Potential",
  candidateFriendly: "Candidate-Friendly",
};

function ComparePageContent() {
  const searchParams = useSearchParams();

  const [selectedCandidates, setSelectedCandidates] = useState<SavedCandidate[]>(
    []
  );
  const [mode, setMode] = useState<RecruiterMode>("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareApiResult | null>(null);
  const [localError, setLocalError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">(
    "idle"
  );

  const idsParam = searchParams.get("ids");

  useEffect(() => {
    if (!idsParam) {
      setSelectedCandidates([]);
      return;
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const resolved = ids
      .map((id) => getCandidateById(id))
      .filter(Boolean) as SavedCandidate[];

    setSelectedCandidates(resolved);
  }, [idsParam]);

  const fallbackNames = useMemo(
    () => selectedCandidates.map((candidate) => candidate.fileName),
    [selectedCandidates]
  );

  async function handleCompare() {
    setLocalError("");
    setResult(null);
    setSaveState("idle");

    if (selectedCandidates.length < 2) {
      setLocalError(
        "Please select at least 2 saved candidates from the dashboard."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          candidates: selectedCandidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.fileName,
            score: candidate.hireScore,
            finalDecision: candidate.finalDecision,
            technicalMatch: candidate.technicalMatch,
            experienceMatch: candidate.experienceMatch,
            riskScore: candidate.riskScore,
            strengths: candidate.strengths,
            risks: candidate.risks,
            missingSkills: candidate.missingSkills,
            growthPotential: candidate.growthPotential,
            reasoning: candidate.reasoning,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          error: data.error || "Compare failed.",
        });
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Compare error:", error);
      setResult({
        error: "Something went wrong while comparing candidates.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSaveCompareResult() {
    if (
      !result ||
      result.error ||
      typeof result.bestCandidateIndex !== "number" ||
      !result.ranking ||
      !result.summary ||
      !result.candidates
    ) {
      setSaveState("failed");
      setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    try {
      const compareId = `compare-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      saveCompareResult({
        id: compareId,
        savedAt: new Date().toISOString(),
        mode,
        candidateNames:
          result.candidateNames?.length ? result.candidateNames : fallbackNames,
        bestCandidateIndex: result.bestCandidateIndex,
        ranking: result.ranking,
        summary: result.summary,
        candidates: result.candidates,
        comparison: result.comparison || null,
      });

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      console.error("Save compare failed:", error);
      setSaveState("failed");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Compare
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Compare Candidates
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Compare saved candidates from your dashboard and generate a ranked
            recommendation with clear reasoning.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Recruiter Mode
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  "strict",
                  "balanced",
                  "growth",
                  "candidateFriendly",
                ] as RecruiterMode[]
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    mode === item
                      ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-700 text-slate-300 hover:border-cyan-400"
                  }`}
                >
                  {modeLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="text-xl font-semibold">Selected Candidates</h2>

            {selectedCandidates.length === 0 ? (
              <p className="mt-4 text-slate-400">
                No candidates selected. Go to the dashboard and select at least
                2 candidates.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selectedCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <h3 className="truncate text-lg font-semibold">
                      {candidate.fileName}
                    </h3>

                    <div className="mt-3 space-y-1 text-sm text-slate-400">
                      <p>Score: {candidate.hireScore}/100</p>
                      <p>Decision: {candidate.finalDecision}</p>
                      <p>Tech Match: {candidate.technicalMatch}/100</p>
                      <p>Experience Match: {candidate.experienceMatch}/100</p>
                      <p>Risk Score: {candidate.riskScore}/100</p>
                      <p className="pt-1">
                        Status:{" "}
                        <span className="text-slate-300">
                          {candidate.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {localError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {localError}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={loading || selectedCandidates.length < 2}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Comparing candidates...
              </span>
            ) : (
              `Compare Candidates${
                selectedCandidates.length ? ` (${selectedCandidates.length})` : ""
              }`
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            {result.error ? (
              <>
                <h2 className="text-2xl font-semibold">Compare Failed</h2>
                <p className="mt-4 text-red-400">{result.error}</p>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="text-2xl font-semibold">Comparison Result</h2>

                  <button
                    onClick={handleSaveCompareResult}
                    className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm transition hover:border-violet-400 hover:text-violet-300"
                  >
                    {saveState === "saved"
                      ? "Compare Saved"
                      : saveState === "failed"
                      ? "Save Failed"
                      : "Save Compare Result"}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6">
                  <p className="text-sm text-slate-400">Winner</p>
                  <p className="mt-2 text-4xl font-semibold text-cyan-300">
                    {typeof result.bestCandidateIndex === "number"
                      ? result.candidateNames?.[result.bestCandidateIndex] ||
                        fallbackNames[result.bestCandidateIndex] ||
                        `Candidate ${result.bestCandidateIndex + 1}`
                      : "N/A"}
                  </p>
                </div>

                {result.candidates?.length ? (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {result.candidates.map((candidate, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-6"
                      >
                        <h3 className="text-2xl font-semibold">
                          {result.candidateNames?.[index] ||
                            fallbackNames[index] ||
                            `Candidate ${index + 1}`}
                        </h3>

                        <p className="mt-4 text-4xl font-semibold text-cyan-300">
                          {candidate.score}/100
                        </p>

                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-green-300">
                            Strengths
                          </h4>
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                            {candidate.strengths?.length ? (
                              candidate.strengths.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))
                            ) : (
                              <li>No strengths returned.</li>
                            )}
                          </ul>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-red-300">
                            Risks
                          </h4>
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                            {candidate.risks?.length ? (
                              candidate.risks.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))
                            ) : (
                              <li>No risks returned.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {result.comparison && (
                  <>
                    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
                      <h3 className="text-2xl font-semibold">Head-to-Head</h3>
                      <ul className="mt-4 space-y-3 text-slate-300">
                        {result.comparison.dimensionWins?.map((item, i) => (
                          <li key={i}>✔ {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
                      <h3 className="text-2xl font-semibold">Why Winner</h3>
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
                        {result.comparison.whyWinner?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>

                      <h3 className="mt-8 text-2xl font-semibold">
                        Why Others Lose
                      </h3>
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
                        {result.comparison.whyLoser?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
                  <h3 className="text-2xl font-semibold">Summary</h3>
                  <p className="mt-4 leading-8 text-slate-300">
                    {result.summary}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry Compare
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Compare Candidates
            </h1>
            <p className="mt-4 text-slate-300">Loading compare page...</p>
          </div>
        </main>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}