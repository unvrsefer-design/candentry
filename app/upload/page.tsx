"use client";

import { useState } from "react";

type RecruiterMode =
  | "strict"
  | "balanced"
  | "growth"
  | "candidateFriendly";

const modeLabels: Record<RecruiterMode, string> = {
  strict: "Strict",
  balanced: "Balanced",
  growth: "Growth Potential",
  candidateFriendly: "Candidate-Friendly",
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState<RecruiterMode>("balanced");
  const [loading, setLoading] = useState(false);

  function handleFileSelect(fileList: FileList | null) {
    if (!fileList?.length) return;
    const selected = fileList[0];
    if (selected.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    setFile(selected);
  }

  async function handleAnalyze() {
    if (!file || !jobDescription.trim()) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("cv", file);
    formData.append("jobDescription", jobDescription);
    formData.append("mode", mode);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    sessionStorage.setItem("candentry-result", JSON.stringify(result));
    window.location.href = "/result";

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-4xl">

        <h1 className="text-3xl font-semibold">
          Single CV Analysis
        </h1>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8">

          {/* FILE */}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="mb-6"
          />

          {/* MODE */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            {Object.keys(modeLabels).map((key) => (
              <button
                key={key}
                onClick={() => setMode(key as RecruiterMode)}
                className={`rounded-xl border px-4 py-3 ${
                  mode === key
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-slate-300"
                }`}
              >
                {modeLabels[key as RecruiterMode]}
              </button>
            ))}
          </div>

          {/* JD */}
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description..."
            className="w-full rounded-xl border border-slate-300 p-4"
          />

          {/* BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white hover:bg-blue-500"
          >
            {loading ? "Analyzing..." : "Analyze Candidate"}
          </button>
        </div>
      </div>
    </main>
  );
}