"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSavedCandidates,
  removeCandidate,
  updateCandidate,
  seedLinkedInCandidates,
  addLinkedInCandidate,
  addReferralCandidate,
  loadDemoCandidatePool,
  getCandidateSourceCounts,
  type CandidateStatus,
  type SavedCandidate,
} from "@/lib/candidate-store";
import {
  getRoles,
  getRoleById,
  saveRole,
  seedDemoRoles,
  type Role,
} from "@/lib/role-store";
import { encodeShareData } from "@/lib/share-report";

const columns: CandidateStatus[] = ["New", "Review", "Interview", "Rejected"];
const decisionOptions = ["All", "Hire", "Consider", "Reject"] as const;
const sourceOptions = ["All", "upload", "linkedin", "referral"] as const;

function getDecisionColor(decision: SavedCandidate["finalDecision"]) {
  if (decision === "Hire") return "text-green-400";
  if (decision === "Consider") return "text-yellow-400";
  return "text-red-400";
}

function getColumnStyle(status: CandidateStatus) {
  if (status === "New") return "border-slate-700 bg-slate-900";
  if (status === "Review") return "border-cyan-500/30 bg-cyan-500/5";
  if (status === "Interview") return "border-purple-500/30 bg-purple-500/5";
  return "border-red-500/30 bg-red-500/5";
}

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(
    null
  );
  const [dragOverColumn, setDragOverColumn] =
    useState<CandidateStatus | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [decisionFilter, setDecisionFilter] =
    useState<(typeof decisionOptions)[number]>("All");
  const [sourceFilter, setSourceFilter] =
    useState<(typeof sourceOptions)[number]>("All");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  function refresh() {
    const data = getSavedCandidates();
    setCandidates(data);
    setRoles(getRoles());

    const notes: Record<string, string> = {};
    data.forEach((candidate) => {
      notes[candidate.id] = candidate.notes || "";
    });
    setDraftNotes(notes);
  }

  useEffect(() => {
    seedLinkedInCandidates();
    seedDemoRoles();
    refresh();
  }, []);

  const shortlistCount = useMemo(
    () => candidates.filter((candidate) => candidate.shortlist).length,
    [candidates]
  );

  const sourceCounts = useMemo(() => getCandidateSourceCounts(), [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        !searchQuery.trim() ||
        candidate.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.reasoning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.notes || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesShortlist = !shortlistOnly || candidate.shortlist;

      const matchesDecision =
        decisionFilter === "All" ||
        candidate.finalDecision === decisionFilter;

      const matchesSource =
        sourceFilter === "All" || candidate.source === sourceFilter;

      const matchesRole =
        roleFilter === "all" || candidate.roleId === roleFilter;

      return (
        matchesSearch &&
        matchesShortlist &&
        matchesDecision &&
        matchesSource &&
        matchesRole
      );
    });
  }, [
    candidates,
    searchQuery,
    shortlistOnly,
    decisionFilter,
    sourceFilter,
    roleFilter,
  ]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleShortlist(id: string, current: boolean) {
    updateCandidate(id, { shortlist: !current });
    refresh();
  }

  function handleDelete(id: string) {
    removeCandidate(id);
    refresh();
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }

  function openSavedReport(candidate: SavedCandidate) {
    const payload = encodeShareData({
      fileName: candidate.fileName,
      mode: candidate.mode,
      hireScore: candidate.hireScore,
      finalDecision: candidate.finalDecision,
      technicalMatch: candidate.technicalMatch,
      experienceMatch: candidate.experienceMatch,
      riskScore: candidate.riskScore,
      strengths: candidate.strengths,
      risks: candidate.risks,
      missingSkills: candidate.missingSkills,
      growthPotential: candidate.growthPotential,
      reasoning: candidate.reasoning,
      aiAgreement: "Medium",
      consensusSummary: candidate.reasoning,
      sources: {
        openai: true,
        claude: false,
      },
      interviewPlan: null,
    });

    window.location.href = `/report?data=${payload}`;
  }

  function handleNoteChange(id: string, value: string) {
    setDraftNotes((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function saveNotes(id: string) {
    updateCandidate(id, {
      notes: draftNotes[id] || "",
    });
    refresh();
  }

  function handleDragStart(id: string) {
    setDraggedCandidateId(id);
  }

  function handleDragEnd() {
    setDraggedCandidateId(null);
    setDragOverColumn(null);
  }

  function handleDrop(status: CandidateStatus) {
    if (!draggedCandidateId) return;

    updateCandidate(draggedCandidateId, { status });
    refresh();
    setDraggedCandidateId(null);
    setDragOverColumn(null);
  }

  function handleAddLinkedInCandidate() {
    addLinkedInCandidate();
    refresh();
  }

  function handleAddReferralCandidate() {
    addReferralCandidate();
    refresh();
  }

  function handleLoadDemoPool() {
    loadDemoCandidatePool();
    refresh();
  }

  function handleCreateRole() {
    if (!newRoleTitle.trim()) {
      alert("Please enter a role title.");
      return;
    }

    saveRole(newRoleTitle, newRoleDescription);
    setNewRoleTitle("");
    setNewRoleDescription("");
    refresh();
  }

  function getCandidateRoleName(candidate: SavedCandidate) {
    if (!candidate.roleId) return "Unassigned";
    return getRoleById(candidate.roleId)?.title || "Unknown Role";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Candentry ATS
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              All Candidates
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Review candidates from different sources, move them through your
              hiring pipeline, compare selected profiles, and open saved reports.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Total Candidates</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">
                {sourceCounts.total}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Shortlisted</p>
              <p className="mt-2 text-2xl font-semibold text-green-300">
                {shortlistCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Roles</p>
              <p className="mt-2 text-2xl font-semibold text-violet-300">
                {roles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-sm text-slate-400">Selected for Compare</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {selectedIds.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-300">
                Candidate Sources
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-slate-700 px-3 py-1">
                  Upload: {sourceCounts.upload}
                </span>
                <span className="rounded-full border border-slate-700 px-3 py-1">
                  LinkedIn: {sourceCounts.linkedin}
                </span>
                <span className="rounded-full border border-slate-700 px-3 py-1">
                  Referral: {sourceCounts.referral}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAddLinkedInCandidate}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Add LinkedIn Candidate
              </button>

              <button
                onClick={handleAddReferralCandidate}
                className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm transition hover:border-violet-400 hover:text-violet-300"
              >
                Add Referral Candidate
              </button>

              <button
                onClick={handleLoadDemoPool}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm transition hover:border-white hover:text-white"
              >
                Load Demo Pool
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-lg font-semibold">Create Role</h2>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="Role title (e.g. Senior Frontend Developer)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Short role description..."
                  className="min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <button
                  onClick={handleCreateRole}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
                >
                  Create Role
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h2 className="text-lg font-semibold">Active Roles</h2>
              {roles.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  No roles created yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                    >
                      <p className="font-medium text-white">{role.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {role.description || "No description added."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file name, notes, or reasoning..."
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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Source Filter
              </label>
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(
                    e.target.value as (typeof sourceOptions)[number]
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="All">All Sources</option>
                <option value="upload">Upload</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role Filter
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={shortlistOnly}
                  onChange={(e) => setShortlistOnly(e.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                Show shortlisted only
              </label>
            </div>
          </div>
        </div>

        {selectedIds.length >= 2 && (
          <button
            onClick={() => {
              window.location.href = `/compare?ids=${selectedIds.join(",")}`;
            }}
            className="mb-8 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:bg-cyan-400"
          >
            Compare Selected ({selectedIds.length})
          </button>
        )}

        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
            <h2 className="text-2xl font-semibold">No candidates yet</h2>
            <p className="mt-3 text-slate-300">
              Save candidates from the analysis and bulk screening pages to start
              building your pipeline.
            </p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10">
            <h2 className="text-2xl font-semibold">No matching candidates</h2>
            <p className="mt-3 text-slate-300">
              Try adjusting your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-4">
            {columns.map((column) => {
              const columnCandidates = filteredCandidates.filter(
                (candidate) => candidate.status === column
              );

              return (
                <div
                  key={column}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn(column);
                  }}
                  onDragLeave={() => {
                    if (dragOverColumn === column) {
                      setDragOverColumn(null);
                    }
                  }}
                  onDrop={() => handleDrop(column)}
                  className={`rounded-2xl border p-4 transition ${getColumnStyle(
                    column
                  )} ${
                    dragOverColumn === column ? "ring-2 ring-cyan-400/50" : ""
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{column}</h2>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      {columnCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {columnCandidates.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
                        Drag candidates here
                      </div>
                    ) : (
                      columnCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          draggable
                          onDragStart={() => handleDragStart(candidate.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-xl border border-slate-800 bg-slate-950 p-4 ${
                            draggedCandidateId === candidate.id ? "opacity-60" : ""
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="min-w-0 truncate text-sm font-semibold text-white">
                              {candidate.fileName}
                            </h3>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(candidate.id)}
                              onChange={() => toggleSelect(candidate.id)}
                              className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                            />
                          </div>

                          <div className="space-y-1 text-xs text-slate-400">
                            <p>Score: {candidate.hireScore}/100</p>
                            <p className={getDecisionColor(candidate.finalDecision)}>
                              Decision: {candidate.finalDecision}
                            </p>
                            <p>Mode: {candidate.mode}</p>
                            <p>
                              Source:{" "}
                              <span className="capitalize text-cyan-300">
                                {candidate.source}
                              </span>
                            </p>
                            <p>
                              Role:{" "}
                              <span className="text-violet-300">
                                {getCandidateRoleName(candidate)}
                              </span>
                            </p>
                            {candidate.shortlist && (
                              <p className="text-green-300">Shortlisted</p>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                toggleShortlist(candidate.id, candidate.shortlist)
                              }
                              className={`rounded-lg px-3 py-1 text-xs ${
                                candidate.shortlist
                                  ? "bg-green-600 text-white"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {candidate.shortlist
                                ? "Shortlisted"
                                : "Add to Shortlist"}
                            </button>

                            <button
                              onClick={() => openSavedReport(candidate)}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
                            >
                              Open Report
                            </button>

                            <button
                              onClick={() => handleDelete(candidate.id)}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
                            >
                              Delete
                            </button>
                          </div>

                          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-3">
                            <label className="mb-2 block text-xs font-medium text-slate-300">
                              Notes
                            </label>

                            <textarea
                              value={draftNotes[candidate.id] || ""}
                              onChange={(e) =>
                                handleNoteChange(candidate.id, e.target.value)
                              }
                              placeholder="Recruiter notes..."
                              className="min-h-[90px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500"
                            />

                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => saveNotes(candidate.id)}
                                className="rounded-lg bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500"
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}