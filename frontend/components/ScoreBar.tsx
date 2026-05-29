interface Props {
  score: number;
  label?: string;
  size?: "sm" | "md";
}

export default function ScoreBar({ score, label, size = "md" }: Props) {
  const pct = Math.min(score, 100);
  const color =
    pct >= 80 ? "from-emerald-500 to-emerald-400" :
    pct >= 60 ? "from-amber-500 to-amber-400" :
    pct >= 40 ? "from-orange-500 to-orange-400" :
    "from-red-500 to-red-400";

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">{label}</span>
          <span className="text-xs font-semibold">{score}%</span>
        </div>
      )}
      <div className={`${size === "sm" ? "h-1.5" : "h-2.5"} bg-slate-200 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
