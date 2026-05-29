interface Props {
  total: number;
  averageScore: number;
  topScore: number;
  topCandidateName?: string;
}

export default function ScoreSummaryCards({ total, averageScore, topScore, topCandidateName }: Props) {
  const cards = [
    {
      label: "Total Candidates",
      value: total,
      suffix: "",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accent: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Average Score",
      value: averageScore,
      suffix: "%",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      accent: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Top Match",
      value: topScore,
      suffix: "%",
      subtitle: topCandidateName,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      accent: "from-violet-500 to-violet-600",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-5 flex items-center gap-4`}>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.accent} flex items-center justify-center text-white shadow-sm`}>
            {c.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className={`text-2xl font-bold ${c.text} truncate`}>{c.value}{c.suffix}</p>
            {(c as any).subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{(c as any).subtitle}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
