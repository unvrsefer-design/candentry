"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSavedCompareResults,
  removeCompareResult,
  type SavedCompareResult,
} from "@/lib/compare-store";

function getModeLabel(
  mode: SavedCompareResult["mode"]
): "Strict" | "Balanced" | "Growth Potential" | "Candidate-Friendly" {
  if (mode === "strict") return "Strict";
  if (mode === "growth") return "Growth Potential";
  if (mode === "candidateFriendly") return "Candidate-Friendly";
  return "Balanced";
}

function getWinnerName(item: SavedCompareResult) {
  return item.candidateNames[item.bestCandidateIndex] || "N/A";
}

export default function CompareHistoryPage() {
  const [items, setItems] = useState<SavedCompareResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [printingId, setPrintingId] = useState<string | null>(null);

  function refresh() {
    setItems(getSavedCompareResults());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const haystack = [
        ...item.candidateNames,
        item.summary,
        ...(item.comparison?.dimensionWins || []),
        ...(item.comparison?.whyWinner || []),
        ...(item.comparison?.whyLoser || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleDownloadPdf(id: string) {
    setPrintingId(id);

    setTimeout(() => {
      window.print();

      setTimeout(() => {
        setPrintingId(null);
      }, 300);
    }, 150);
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .compare-history-print-target,
          .compare-history-print-target * {
            visibility: visible;
          }

          .compare-history-print-target {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
          }

          .print-hidden {
            display: none !important;
          }

          .print-card {
            border: 1px solid #d1d5db !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }

          .print-text-dark {
            color: black !important;
          }

          .print-text-muted {
            color: #374151 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between print-hidden">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Candentry Compare History
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
                Saved Compare Results
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Review previously saved candidate comparisons, decisions, and
                winner rationale.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                <p className="text-sm text-slate-400">Saved Comparisons</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">
                  {items.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                <p className="text-sm text-slate-400">Visible Results</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {filteredItems.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 print-hidden">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Search Compare History
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate names, summary, or rationale..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
              <h2 className="text-2xl font-semibold">No saved compare results</h2>
              <p className="mt-3 text-slate-300">
                Save a comparison from the Compare page and it will appear here.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
              <h2 className="text-2xl font-semibold">No matching results</h2>
              <p className="mt-3 text-slate-300">
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredItems.map((item) => {
                const expanded = expandedIds.includes(item.id);
                const isPrinting = printingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border border-slate-800 bg-slate-900 p-8 ${
                      isPrinting ? "compare-history-print-target" : ""
                    }`}
                  >
                    <div className={`${isPrinting ? "mb-8" : "hidden"} print:block`}>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Candentry AI Hiring Report
                      </p>
                      <h1 className="mt-2 text-3xl font-bold print-text-dark">
                        Saved Comparison Report
                      </h1>
                      <div className="mt-3 space-y-1 text-sm print-text-muted">
                        <p>Generated: {new Date().toLocaleString()}</p>
                        <p>
                          Original Save Time:{" "}
                          {new Date(item.savedAt).toLocaleString()}
                        </p>
                        <p>Recruiter Mode: {getModeLabel(item.mode)}</p>
                        <p>
                          Compared Candidates: {item.candidateNames.join(" vs ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold print-text-dark">
                            {item.candidateNames.join(" vs ")}
                          </h2>

                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300 print-hidden">
                            {getModeLabel(item.mode)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400 print-text-muted">
                          Saved: {new Date(item.savedAt).toLocaleString()}
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 print-card">
                            <p className="text-sm text-slate-400 print-text-muted">
                              Winner
                            </p>
                            <p className="mt-2 text-xl font-semibold text-cyan-300 print-text-dark">
                              {getWinnerName(item)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 print-card">
                            <p className="text-sm text-slate-400 print-text-muted">
                              Ranking
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300 print-text-muted">
                              {item.ranking
                                .map(
                                  (index) =>
                                    item.candidateNames[index] ||
                                    `Candidate ${index + 1}`
                                )
                                .join(" → ")}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 print-card">
                            <p className="text-sm text-slate-400 print-text-muted">
                              Compared
                            </p>
                            <p className="mt-2 text-xl font-semibold text-white print-text-dark">
                              {item.candidateNames.length} candidates
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 print-hidden">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="rounded-xl border border-slate-700 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
                        >
                          {expanded ? "Hide Details" : "View Details"}
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(item.id)}
                          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
                        >
                          Download PDF
                        </button>

                        <button
                          onClick={() => {
                            removeCompareResult(item.id);
                            refresh();
                          }}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm transition hover:border-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 print-card">
                      <h3 className="text-xl font-semibold print-text-dark">
                        Summary
                      </h3>
                      <p className="mt-4 leading-8 text-slate-300 print-text-muted">
                        {item.summary
                          .replaceAll(
                            "Candidate 0",
                            item.candidateNames[0] || "Candidate 1"
                          )
                          .replaceAll(
                            "Candidate 1",
                            item.candidateNames[1] || "Candidate 2"
                          )
                          .replaceAll(
                            "Candidate 2",
                            item.candidateNames[2] || "Candidate 3"
                          )
                          .replaceAll(
                            "Candidate 3",
                            item.candidateNames[3] || "Candidate 4"
                          )}
                      </p>
                    </div>

                    {(expanded || isPrinting) && (
                      <>
                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                          {item.candidates.map((candidate, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-800 bg-slate-950 p-6 print-card"
                            >
                              <h3 className="text-xl font-semibold print-text-dark">
                                {item.candidateNames[index] ||
                                  `Candidate ${index + 1}`}
                              </h3>

                              <p className="mt-3 text-3xl font-semibold text-cyan-300 print-text-dark">
                                Score: {candidate.score}/100
                              </p>

                              <div className="mt-5">
                                <h4 className="text-sm font-medium uppercase tracking-wide text-green-300 print-text-dark">
                                  Strengths
                                </h4>
                                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300 print-text-muted">
                                  {candidate.strengths.length ? (
                                    candidate.strengths.map((entry, i) => (
                                      <li key={i}>{entry}</li>
                                    ))
                                  ) : (
                                    <li>No strengths saved.</li>
                                  )}
                                </ul>
                              </div>

                              <div className="mt-5">
                                <h4 className="text-sm font-medium uppercase tracking-wide text-red-300 print-text-dark">
                                  Risks
                                </h4>
                                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300 print-text-muted">
                                  {candidate.risks.length ? (
                                    candidate.risks.map((entry, i) => (
                                      <li key={i}>{entry}</li>
                                    ))
                                  ) : (
                                    <li>No risks saved.</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>

                        {item.comparison && (
                          <div className="mt-6 grid gap-6 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 print-card">
                              <h3 className="text-xl font-semibold print-text-dark">
                                Head-to-Head
                              </h3>
                              <ul className="mt-4 space-y-2 text-slate-300 print-text-muted">
                                {item.comparison.dimensionWins.length ? (
                                  item.comparison.dimensionWins.map((entry, i) => (
                                    <li key={i}>✔ {entry}</li>
                                  ))
                                ) : (
                                  <li>No comparison dimensions saved.</li>
                                )}
                              </ul>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 print-card">
                              <h3 className="text-xl font-semibold print-text-dark">
                                Why Winner
                              </h3>
                              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300 print-text-muted">
                                {item.comparison.whyWinner.length ? (
                                  item.comparison.whyWinner.map((entry, i) => (
                                    <li key={i}>{entry}</li>
                                  ))
                                ) : (
                                  <li>No winner rationale saved.</li>
                                )}
                              </ul>

                              <h3 className="mt-8 text-xl font-semibold print-text-dark">
                                Why Others Lose
                              </h3>
                              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300 print-text-muted">
                                {item.comparison.whyLoser.length ? (
                                  item.comparison.whyLoser.map((entry, i) => (
                                    <li key={i}>{entry}</li>
                                  ))
                                ) : (
                                  <li>No loser rationale saved.</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className={`${isPrinting ? "mt-10 text-center" : "hidden"} print:block`}>
                      <p className="text-sm print-text-muted">
                        Generated by Candentry AI
                      </p>
                      <p className="text-xs text-slate-500">candentry.com</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}