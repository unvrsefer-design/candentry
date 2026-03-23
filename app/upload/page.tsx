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
  const [dragActive, setDragActive] = useState(false);
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

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  }

  async function handleAnalyze() {
    if (!file) {
      alert("Please upload a CV PDF.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please paste a job description.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("cv", file);
      formData.append("jobDescription", jobDescription);
      formData.append("mode", mode);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Analysis failed.");
        return;
      }

      sessionStorage.setItem("candentry-result", JSON.stringify(result));
      window.location.href = "/result";
    } catch (error) {
      console.error("Analyze error:", error);
      alert("Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Candentry Analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Single CV Analysis
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Upload one CV, match it against a job description, and generate an
            AI-backed candidate evaluation with scoring, risks, and interview
            guidance.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
              dragActive
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-slate-700 bg-slate-950"
            }`}
          >
            <input
              id="single-cv-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <label
              htmlFor="single-cv-upload"
              className="cursor-pointer text-lg text-white"
            >
              Click or drag & drop CV
            </label>

            <p className="mt-2 text-sm text-slate-400">PDF only</p>

            {file && (
              <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
                Selected: {file.name}
              </div>
            )}
          </div>

          <div className="mt-6">
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

          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Job Description
            </label>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[220px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Analyzing candidate..." : "Analyze Candidate"}
          </button>
        </div>
      </div>
    </main>
  );
}