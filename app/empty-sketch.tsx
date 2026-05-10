type EmptySketchProps = {
  tone?: "default" | "trash" | "favorite";
};

export function EmptySketch({ tone = "default" }: EmptySketchProps) {
  const accent = tone === "trash" ? "#ef4444" : tone === "favorite" ? "#eab308" : "#2563eb";

  return (
    <div className="sketch-asset mb-4" aria-hidden="true">
      <svg viewBox="0 0 220 150" className="h-36 w-52" fill="none">
        <path
          d="M36 118c22 8 119 10 150-1"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 7"
        />
        <path
          d="M65 93c-9-1-17-8-17-18 0-9 7-17 16-18 4-18 20-30 39-30 17 0 31 9 38 23 17 1 30 14 30 31 0 18-14 31-32 31H70"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sketch-line"
        />
        <path
          d="M111 96V61m0 0L94 78m17-17 17 17"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sketch-line sketch-line-delay"
        />
        <rect x="35" y="26" width="42" height="26" rx="5" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M43 36h18M43 43h10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <rect x="151" y="20" width="34" height="34" rx="7" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M161 32h14M161 40h9" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
