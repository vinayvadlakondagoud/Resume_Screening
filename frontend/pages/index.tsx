import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getJobSummaries, deleteJob, type JobSummary } from "../utils/api";
import { showToast } from "../components/Toast";

function relativeDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xs">🥇</span>;
  if (rank === 2) return <span className="text-xs">🥈</span>;
  if (rank === 3) return <span className="text-xs">🥉</span>;
  return <span className="text-xs font-bold text-slate-400 w-4 text-center">{rank}</span>;
}

function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#059669" : score >= 60 ? "#6366f1" : score >= 40 ? "#d97706" : "#94a3b8";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.28} fontWeight="700" fill={color}>{Math.round(score)}%</text>
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="w-9 h-9 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-7 bg-slate-100 rounded-lg w-full" />
        <div className="h-7 bg-slate-100 rounded-lg w-3/4" />
        <div className="h-7 bg-slate-100 rounded-lg w-2/3" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-slate-100 rounded-md w-14" />
        <div className="h-5 bg-slate-100 rounded-md w-16" />
        <div className="h-5 bg-slate-100 rounded-md w-12" />
      </div>
    </div>
  );
}

function JobCard({ job, onDelete }: { job: JobSummary; onDelete: (id: string) => void }) {
  const screened = job.candidate_count > 0;
  const top = job.top_candidates || [];

  return (
    <Link
      href={`/results/${job.job_id}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all p-5 flex flex-col relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/60 to-transparent rounded-bl-[40px] pointer-events-none" />

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(job.job_id); }}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/80 hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Delete job"
      >
        <svg className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${screened ? "bg-emerald-500" : "bg-amber-400"}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${screened ? "text-emerald-600" : "text-amber-600"}`}>
              {screened ? "Screened" : "Pending"}
            </span>
            <span className="text-[10px] text-slate-300 mx-0.5">·</span>
            <span className="text-[10px] text-slate-400">{relativeDate(job.created_at)}</span>
          </div>
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors pr-4 text-[15px]">
            {job.title || "Untitled Position"}
          </h3>
        </div>
        <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {screened ? (
        <div className="flex items-start gap-3 mb-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <ScoreRing score={job.average_score} />
          <div className="flex-1 min-w-0 space-y-1">
            {top.slice(0, 3).map((c) => (
              <div key={c.rank} className="flex items-center gap-2 text-xs">
                <RankBadge rank={c.rank} />
                <span className="text-slate-700 font-medium truncate">{c.candidate_name}</span>
                <span className={`ml-auto font-semibold shrink-0 ${
                  c.score >= 80 ? "text-emerald-600" : c.score >= 60 ? "text-indigo-600" : c.score >= 40 ? "text-amber-600" : "text-slate-400"
                }`}>{c.score}%</span>
              </div>
            ))}
            {job.candidate_count > 3 && (
              <p className="text-[11px] text-slate-400 pl-6">+{job.candidate_count - 3} more</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3 bg-amber-50/80 rounded-xl p-3 border border-amber-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700">Awaiting resumes</p>
            <p className="text-[11px] text-slate-500">Upload candidate resumes and run screening</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        {screened && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.candidate_count} candidate{job.candidate_count !== 1 ? "s" : ""}
          </div>
        )}
        {!screened && <div />}
        <div className="flex flex-wrap gap-1 justify-end">
          {job.extracted_skills.slice(0, 2).map((s) => (
            <span key={s} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${screened ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
              {s}
            </span>
          ))}
          {job.extracted_skills.length > 2 && (
            <span className="text-[10px] text-slate-400 font-medium">+{job.extracted_skills.length - 2}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getJobSummaries()
      .then(setJobs)
      .catch(() => showToast("Failed to load dashboard", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteJob = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await deleteJob(confirmDeleteId);
      setJobs((prev) => prev.filter((j) => j.job_id !== confirmDeleteId));
      showToast("Job deleted", "success");
    } catch {
      showToast("Failed to delete job", "error");
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter((j) => (j.title || "").toLowerCase().includes(q));
  }, [jobs, search]);

  const totalCandidates = jobs.reduce((s, j) => s + j.candidate_count, 0);
  const screenedJobs = jobs.filter((j) => j.candidate_count > 0).length;
  const pendingJobs = jobs.length - screenedJobs;
  const allScores = jobs.flatMap((j) => (j.candidate_count > 0 ? [j.average_score] : []));
  const overallAvg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-indigo-200">
                R
              </div>
              <div className="leading-tight">
                <h1 className="text-[15px] font-bold text-slate-800">Resume Screener</h1>
                <p className="text-[11px] text-slate-400 font-medium">HR Screening Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-56 lg:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
                />
              </div>
              <Link
                href="/screen"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden xs:inline">New Screening</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-200 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-16" />
                        <div className="h-6 bg-slate-200 rounded w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-6 border border-indigo-100/50">
                <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">No screenings yet</h2>
              <p className="text-sm text-slate-400 mb-8 max-w-md leading-relaxed">
                Get started by creating a new job screening. Upload a job description and candidate resumes to automatically rank and score applicants.
              </p>
              <Link
                href="/screen"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start First Screening
              </Link>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Jobs</p>
                    <p className="text-2xl font-bold text-slate-800">{jobs.length}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{screenedJobs} screened</span>
                      {pendingJobs > 0 && <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{pendingJobs} pending</span>}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Candidates</p>
                    <p className="text-2xl font-bold text-slate-800">{totalCandidates}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">across {screenedJobs} job{screenedJobs !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Match</p>
                    <p className="text-2xl font-bold text-slate-800">{overallAvg ?? "—"}{overallAvg ? "%" : ""}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{allScores.length} job{allScores.length !== 1 ? "s" : ""} scored</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">All Screenings</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{filtered.length} of {jobs.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {search && (
                    <button onClick={() => setSearch("")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Clear filter</button>
                  )}
                </div>
              </div>

              {filtered.length === 0 && search && (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-400">No jobs match &ldquo;{search}&rdquo;</p>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map((job) => <JobCard key={job.job_id} job={job} onDelete={setConfirmDeleteId} />)}
              </div>
            </>
          )}
        </div>
      </main>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deletingId && setConfirmDeleteId(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete this screening?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              This will permanently delete the job, all uploaded resumes, and screening results. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={!!deletingId}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={!!deletingId}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
