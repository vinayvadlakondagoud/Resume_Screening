import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getResults, exportResultsCSV, exportResultsXLSX, deleteJob } from "../../utils/api";
import { showToast } from "../../components/Toast";
import CandidateTable from "../../components/CandidateTable";
import ScoreSummaryCards from "../../components/ScoreSummaryCards";

interface Candidate {
  rank: number;
  candidate_name: string;
  score: number;
  matching_skills: string[];
  missing_skills: string[];
  resume_url: string;
  resume_preview?: string;
  skills_score: number;
  experience_score: number;
  education_score: number;
  keyword_score: number;
}

interface ResultsData {
  job_id: string;
  job_title: string;
  candidates: Candidate[];
  total: number;
  average_score: number;
  top_score: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [filterVersion, setFilterVersion] = useState(0);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [polling, setPolling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchResults = useCallback(async (signal?: AbortSignal) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await getResults(jobId as string, minScore, debouncedSearch, signal);
      if (!signal?.aborted) setData(res);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (!signal?.aborted) showToast("Failed to fetch results", "error");
    }
    if (!signal?.aborted) setLoading(false);
  }, [jobId, minScore, debouncedSearch]);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetchResults(ac.signal);
    return () => ac.abort();
  }, [fetchResults, filterVersion]);

  useEffect(() => {
    if (!jobId || search || minScore) return;
    const interval = setInterval(async () => {
      setPolling(true);
      try {
        const res = await getResults(jobId as string, 0, "");
        setData((prev) => {
          if (!prev) return res;
          if (JSON.stringify(prev.candidates) !== JSON.stringify(res.candidates)) {
            showToast("Results updated", "info");
          }
          return res;
        });
      } catch {
        // ignore poll errors
      }
      setPolling(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [jobId, search, minScore]);

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!jobId) return;
    if (format === "csv") setExportingCsv(true);
    else setExportingXlsx(true);
    try {
      if (format === "csv") await exportResultsCSV(jobId as string);
      else await exportResultsXLSX(jobId as string);
      showToast(`Exported as ${format.toUpperCase()}`, "success");
    } catch {
      showToast("Export failed", "error");
    }
    setExportingCsv(false);
    setExportingXlsx(false);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterVersion((v) => v + 1);
  };

  const handleDelete = async () => {
    if (!jobId) return;
    setDeleting(true);
    try {
      await deleteJob(jobId as string);
      showToast("Job deleted", "success");
      router.push("/");
    } catch {
      showToast("Failed to delete job", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const scoreDistribution = data ? [0, 0, 0, 0, 0] : [];
  if (data) {
    data.candidates.forEach((c) => {
      if (c.score >= 80) scoreDistribution[4]++;
      else if (c.score >= 60) scoreDistribution[3]++;
      else if (c.score >= 40) scoreDistribution[2]++;
      else if (c.score >= 20) scoreDistribution[1]++;
      else scoreDistribution[0]++;
    });
  }

  const barColors = ["bg-slate-300", "bg-orange-400", "bg-amber-400", "bg-indigo-400", "bg-emerald-400"];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold hover:bg-indigo-700 transition">R</Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-tight">{data?.job_title || "Results"}</h1>
                {polling && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
              <p className="text-xs text-slate-400">{data ? `${data.total} candidate${data.total !== 1 ? "s" : ""}` : "Loading..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearch(""); setMinScore(0); setFilterVersion((v) => v + 1); }}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Refresh results"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {data && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                title="Delete this screening"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <Link href="/screen" className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
              New Screening
            </Link>
            {data && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport("csv")}
                  disabled={exportingCsv}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium transition"
                >
                  {exportingCsv ? (
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  disabled={exportingXlsx}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-xl text-sm font-medium transition"
                >
                  {exportingXlsx ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading results...</p>
            </div>
          )}

          {data && (
            <>
              <ScoreSummaryCards total={data.total} averageScore={data.average_score} topScore={data.top_score} topCandidateName={data.candidates[0]?.candidate_name} />

              {data.candidates.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Score Distribution</p>
                  <div className="flex items-end gap-2 h-20">
                    {["0-19", "20-39", "40-59", "60-79", "80-100"].map((label, i) => {
                      const max = Math.max(...scoreDistribution, 1);
                      const h = (scoreDistribution[i] / max) * 100;
                      return (
                        <div key={label} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-medium text-slate-500">{scoreDistribution[i]}</span>
                          <div className="w-full rounded-full relative" style={{ height: "48px", backgroundColor: "#f1f5f9" }}>
                            <div
                              className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${barColors[i]}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.total === 0 && data.average_score === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Screening not yet complete</p>
                    <p className="text-xs text-amber-600">Upload resumes and run screening to see results here. Results auto-refresh every 15s.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-5">
                <div className="flex-1 min-w-[200px] relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="relative w-36">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
                  </svg>
                  <input
                    type="number"
                    placeholder="Min score"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
                  </svg>
                  Filter
                </button>
              </form>

              <CandidateTable candidates={data.candidates} />
            </>
          )}

          {!loading && !data && (
            <div className="text-center py-32 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Could not load results. Make sure the job ID is correct.</p>
            </div>
          )}
        </div>
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setConfirmDelete(false)}>
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete screening?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              This will permanently delete the job, all uploaded resumes, and screening results. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {deleting ? (
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
