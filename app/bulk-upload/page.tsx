"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startTrialIfNeeded,
  isTrialExpired,
  getTrialDaysLeft,
} from "@/lib/trial";

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

export default function BulkUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState<RecruiterMode>("balanced");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(7);

  useEffect(() => {
    startTrialIfNeeded();
    setTrialExpired(isTrialExpired());
    setDaysLeft(getTrialDaysLeft());
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const incoming = Array.from(fileList).filter(
      (file) => file.type === "application/pdf"
    );

    setFiles((prev) => {
      const merged = [...prev, ...incoming];
      return merged.filter(
        (file, index, arr) =>
          arr.findIndex(
            (f) => f.name === file.name && f.size === file.size
          ) === index
      );
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearFiles() {
    setFiles([]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  const totalSizeMb = useMemo(() => {
    return (
      files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024
    ).toFixed(2);
  }, [files]);

  async function handleAnalyzeBulk() {
    if (trialExpired) {
      alert("Trial expired. Please create an account.");
      return;
    }

    if (!files.length) {
      alert("Please add at least one PDF.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please paste a job description.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("cvs", file);
      });

      formData.append("jobDescription", jobDescription);
      formData.append("mode", mode);

      const response = await fetch("/api/bulk-analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Bulk analysis failed.");
        return;
      }

      sessionStorage.setItem("candentry-bulk-result", JSON.stringify(result));
      window.location.href = "/bulk-results";
    } catch (error) {
      console.error("Bulk analyze error:", error);
      alert("Something went wrong during bulk analysis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-700">
            CandEntry Bulk Screening
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Bulk CV Upload
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Upload multiple CVs, apply one job description, and generate a ranked
            screening list that feeds directly into your hiring pipeline.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">7-day public trial</p>
          <p className="mt-1 text-sm text-slate-600">
            Uploaded CVs and generated candidate data are session-only. They
            disappear when the browser session ends.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {trialExpired
              ? "Trial ended. Please create an account to continue."
              : `Trial active • ${daysLeft} day(s) left`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-slate-300 bg-white"
            }`}
          >
            <input
              id="bulk-cv-upload"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              disabled={trialExpired}
            />

            <label
              htmlFor="bulk-cv-upload"
              className={`text-lg ${
                trialExpired
                  ? "cursor-not-allowed text-slate-400"
                  : "cursor-pointer text-slate-900"
              }`}
            >
              Click or drag & drop multiple CVs
            </label>

            <p className="mt-2 text-sm text-slate-500">PDF only</p>
            <p className="mt-1 text-sm text-slate-400">
              Current file count: {files.length}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm text-slate-500">Files</p>
              <p className="mt-2 text-2xl font-semibold text-blue-700">
                {files.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm text-slate-500">Total Size</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {totalSizeMb} MB
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm text-slate-500">Mode</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {modeLabels[mode]}
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Uploaded Files
                </h2>

                <button
                  onClick={clearFiles}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                >
                  Clear All
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium text-slate-700">
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
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-600 hover:border-blue-200"
                  }`}
                >
                  {modeLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Job Description
            </label>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[220px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none placeholder:text-slate-400"
              disabled={trialExpired}
            />
          </div>

          <button
            onClick={handleAnalyzeBulk}
            disabled={loading || trialExpired}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {trialExpired
              ? "Trial expired — account required"
              : loading
              ? "Analyzing candidates..."
              : "Analyze Bulk Candidates"}
          </button>
        </div>
      </div>
    </main>
  );
}