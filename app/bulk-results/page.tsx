"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCandidate } from "@/lib/candidate-store";

type RecruiterMode = "strict" | "balanced" | "lenient";

type CandidateResult = {
  fileName: string;
  hireScore: number;
  finalDecision: string;
  technicalMatch: number;
  experienceMatch: number;
  riskScore: number;
  strengths?: string[];
  risks?: string[];
  missingSkills?: string[];
  growthPotential?: string;
  summary?: string;
};

export default function BulkResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [mode, setMode] = useState<RecruiterMode>("balanced");

  useEffect(() => {
    const stored = localStorage.getItem("bulkResults");
    const storedMode = localStorage.getItem("recruiterMode");

    if (!stored) {
      router.push("/upload");
      return;
    }

    setResults(JSON.parse(stored));
    if (storedMode) {
      setMode(storedMode as RecruiterMode);
    }
  }, [router]);

  const handleSaveAll = () => {
    results.forEach((candidate) => {
      const id = `${candidate.fileName}-${Date.now()}-${Math.random()}`
        .toString(36)
        .slice(2, 8);

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
        reasoning: candidate.summary || "",

        shortlist: false,
        status: "New",
        notes: "",
        source: "upload",
      });
    });

    alert("All candidates saved!");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        Bulk Results
      </h1>

      <div className="mb-6">
        <button
          onClick={handleSaveAll}
          className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-cyan-400"
        >
          Save All Candidates
        </button>
      </div>

      <div className="grid gap-4">
        {results.map((candidate, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="mb-2 flex justify-between">
              <h2 className="font-medium text-white">{candidate.fileName}</h2>
              <span className="text-sm text-cyan-400">
                {candidate.hireScore}
              </span>
            </div>

            <p className="text-sm text-slate-400">
              {candidate.summary || "No summary available"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}