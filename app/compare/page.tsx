"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCandidateById,
  type SavedCandidate,
} from "../../lib/candidate-store";
import { saveCompareResult } from "../../lib/compare-store";
import { downloadElementAsPdf } from "@/lib/pdf";

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

  const getCandidateName = (index: number) =>
    result?.candidateNames?.[index] ||
    fallbackNames[index] ||
    `Candidate ${index + 1}`;

  const winnerName =
    typeof result?.bestCandidateIndex === "number"
      ? getCandidateName(result.bestCandidateIndex)
      : "N/A";

  // ✅ PDF DOWNLOAD FIXED
  async function handleDownloadPdf() {
    try {
      await downloadElementAsPdf(
        "compare-print-area",
        `candentry-compare-${Date.now()}.pdf`
      );
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("PDF download failed.");
    }
  }

  // ✅ COMPARE FUNCTION (DOĞRU)
  async function handleCompare() {
    setLocalError("");
    setResult(null);
    setSaveState("idle");

    if (selectedCandidates.length < 2) {
      setLocalError("Select at least 2 candidates.");
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
          candidates: selectedCandidates.map((c) => ({
            id: c.id,
            name: c.fileName,
            score: c.hireScore,
            finalDecision: c.finalDecision,
            technicalMatch: c.technicalMatch,
            experienceMatch: c.experienceMatch,
            riskScore: c.riskScore,
            strengths: c.strengths,
            risks: c.risks,
            missingSkills: c.missingSkills,
            growthPotential: c.growthPotential,
            reasoning: c.reasoning,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || "Compare failed." });
        return;
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  function handleSaveCompareResult() {
    if (!result || result.error) return;

    saveCompareResult({
      id: `compare-${Date.now()}`,
      savedAt: new Date().toISOString(),
      mode,
      candidateNames: result.candidateNames || fallbackNames,
      bestCandidateIndex: result.bestCandidateIndex || 0,
      ranking: result.ranking || [],
      summary: result.summary || "",
      candidates: result.candidates || [],
      comparison: result.comparison || null,
    });

    setSaveState("saved");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">

        {/* BUTTONS */}
        <button onClick={handleCompare} className="mb-4 bg-cyan-500 px-4 py-2 rounded">
          Compare
        </button>

        {result && !result.error && (
          <button
            onClick={handleDownloadPdf}
            className="mb-4 ml-4 bg-green-500 px-4 py-2 rounded"
          >
            Download PDF
          </button>
        )}

        {/* RESULT */}
        {result && (
          <div
            id="compare-print-area"
            className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"
          >
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">
                  Winner: {winnerName}
                </h2>

                <p className="mt-4 text-slate-300">{result.summary}</p>
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
    <Suspense fallback={<div>Loading...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}