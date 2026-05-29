import { useState, useMemo } from "react";
import ScoreBar from "./ScoreBar";

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

interface Props {
  candidates: Candidate[];
}

type SortKey = "rank" | "score" | "candidate_name";

export default function CandidateTable({ candidates }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Candidate | null>(null);

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortKey === "candidate_name") return a.candidate_name.localeCompare(b.candidate_name) * mul;
      return (Number(a[sortKey]) - Number(b[sortKey])) * mul;
    });
  }, [candidates, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-slate-300 ml-1">&#8597;</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === "desc" ? "&#8595;" : "&#8593;"}</span>;
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : s >= 40 ? "text-orange-600" : "text-red-600";

  if (!candidates.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No candidates match your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-700" onClick={() => toggleSort("rank")}>
                  Rank <SortIcon k="rank" />
                </th>
                <th className="py-3.5 px-3 cursor-pointer select-none hover:text-slate-700" onClick={() => toggleSort("candidate_name")}>
                  Candidate <SortIcon k="candidate_name" />
                </th>
                <th className="py-3.5 px-3 cursor-pointer select-none hover:text-slate-700" onClick={() => toggleSort("score")}>
                  Score <SortIcon k="score" />
                </th>
                <th className="py-3.5 px-3">Match</th>
                <th className="py-3.5 px-3 hidden md:table-cell">Matching Skills</th>
                <th className="py-3.5 px-3 hidden lg:table-cell">Missing Skills</th>
                <th className="py-3.5 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c, i) => (
                <tr
                  key={`${c.candidate_name}-${c.rank}-${i}`}
                  className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  onClick={() => setSelected(c)}
                >
                  <td className="py-3.5 px-4">
                    {c.rank === 1 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🥇</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">1</span>
                      </div>
                    ) : c.rank === 2 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🥈</span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-md">2</span>
                      </div>
                    ) : c.rank === 3 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🥉</span>
                        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-md">3</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {c.rank}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-slate-800">{c.candidate_name || "Unknown"}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`text-base font-bold ${scoreColor(c.score)}`}>{c.score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </td>
                  <td className="py-3.5 px-3 w-32">
                    <ScoreBar score={c.score} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.matching_skills.slice(0, 3).map((s) => (
                        <span key={s} className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-medium">{s}</span>
                      ))}
                      {c.matching_skills.length > 3 && <span className="text-xs text-slate-400">+{c.matching_skills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.missing_skills.slice(0, 2).map((s) => (
                        <span key={s} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium">{s}</span>
                      ))}
                      {c.missing_skills.length > 2 && <span className="text-xs text-slate-400">+{c.missing_skills.length - 2}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selected.candidate_name || "Unknown"}</h3>
                <p className="text-xs text-slate-400">Rank #{selected.rank} &middot; Overall Score {selected.score}/100</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Breakdown</p>
                <ScoreBar score={selected.score} label="Overall Score" />
                <ScoreBar score={selected.skills_score} label="Skills Match (40%)" />
                <ScoreBar score={selected.experience_score} label="Experience (25%)" />
                <ScoreBar score={selected.education_score} label="Education (15%)" />
                <ScoreBar score={selected.keyword_score} label="Keyword Similarity (20%)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Matching Skills ({selected.matching_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.matching_skills.length ? selected.matching_skills.map((s) => (
                      <span key={s} className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium">{s}</span>
                    )) : <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missing Skills ({selected.missing_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.missing_skills.length ? selected.missing_skills.map((s) => (
                      <span key={s} className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-medium">{s}</span>
                    )) : <span className="text-xs text-slate-400">None</span>}
                  </div>
                </div>
              </div>

              {selected.resume_preview && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resume Preview</p>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {selected.resume_preview}
                  </div>
                </div>
              )}

              <a
                href={selected.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Resume
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
