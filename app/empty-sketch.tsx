type EmptySketchProps = {
  tone?: "default" | "folder" | "trash" | "favorite" | "music" | "pdf" | "document" | "image" | "video";
};

export function EmptySketch({ tone = "default" }: EmptySketchProps) {
  const accent =
    tone === "trash"
      ? "#ef4444"
      : tone === "favorite"
        ? "#eab308"
        : tone === "music"
          ? "#f59e0b"
          : tone === "pdf"
            ? "#dc2626"
            : tone === "document"
              ? "#2563eb"
              : tone === "image"
                ? "#ec4899"
                : tone === "video"
                  ? "#8b5cf6"
                  : tone === "folder"
                    ? "#6366f1"
                    : "#2563eb";

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
        {tone === "trash" ? (
          <>
            <path
              d="M96 63h30"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              className="sketch-line sketch-line-delay"
            />
            <path
              d="M100 63l2 28a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4l2-28"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sketch-line sketch-line-delay"
            />
            <path
              d="M104 63v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sketch-line sketch-line-delay"
            />
            <path
              d="M108 72v14m6-14v14"
              stroke={accent}
              strokeWidth="3.5"
              strokeLinecap="round"
              className="sketch-line sketch-line-delay"
            />
          </>
        ) : tone === "favorite" ? (
          <path
            d="M111 60l5.8 11.7 12.9 1.9-9.3 9.1 2.2 12.8L111 89.4l-11.6 6.1 2.2-12.8-9.3-9.1 12.9-1.9L111 60z"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="sketch-line sketch-line-delay"
          />
        ) : tone === "folder" ? (
          <>
            <path d="M93 69h13l3-5h18a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H93a4 4 0 0 1-4-4V73a4 4 0 0 1 4-4z" stroke={accent} strokeWidth="3.5" strokeLinejoin="round" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M89 77h42" stroke={accent} strokeWidth="3" strokeLinecap="round" className="sketch-line sketch-line-delay" />
          </>
        ) : tone === "music" ? (
          <>
            <path d="M103 60v26" stroke={accent} strokeWidth="3.5" strokeLinecap="round" className="sketch-line sketch-line-delay" />
            <path d="M103 60l18-5v20" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="sketch-line sketch-line-delay" />
            <circle cx="98" cy="89" r="5" stroke={accent} strokeWidth="3" fill="none" className="sketch-line sketch-line-delay" />
            <circle cx="116" cy="84" r="5" stroke={accent} strokeWidth="3" fill="none" className="sketch-line sketch-line-delay" />
          </>
        ) : tone === "pdf" ? (
          <>
            <rect x="95" y="58" width="30" height="36" rx="4" stroke={accent} strokeWidth="3.5" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M118 58v10h7" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sketch-line sketch-line-delay" />
            <path d="M100 76h14m-14 7h16" stroke={accent} strokeWidth="3" strokeLinecap="round" className="sketch-line sketch-line-delay" />
          </>
        ) : tone === "document" ? (
          <>
            <path d="M94 69h34" stroke={accent} strokeWidth="3.5" strokeLinecap="round" className="sketch-line sketch-line-delay" />
            <rect x="94" y="69" width="34" height="24" rx="4" stroke={accent} strokeWidth="3.5" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M100 77h10m-10 7h18" stroke={accent} strokeWidth="3" strokeLinecap="round" className="sketch-line sketch-line-delay" />
          </>
        ) : tone === "image" ? (
          <>
            <rect x="94" y="62" width="34" height="28" rx="4" stroke={accent} strokeWidth="3.5" fill="none" className="sketch-line sketch-line-delay" />
            <circle cx="104" cy="71" r="2.8" stroke={accent} strokeWidth="2.5" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M97 85l8-7 7 5 5-4 8 6" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sketch-line sketch-line-delay" />
          </>
        ) : tone === "video" ? (
          <>
            <rect x="94" y="62" width="34" height="28" rx="4" stroke={accent} strokeWidth="3.5" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M108 70l10 6-10 6z" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" className="sketch-line sketch-line-delay" />
          </>
        ) : (
          <>
            <path d="M94 69h34" stroke={accent} strokeWidth="3.5" strokeLinecap="round" className="sketch-line sketch-line-delay" />
            <rect x="94" y="69" width="34" height="24" rx="4" stroke={accent} strokeWidth="3.5" fill="none" className="sketch-line sketch-line-delay" />
            <path d="M100 77h10m-10 7h18" stroke={accent} strokeWidth="3" strokeLinecap="round" className="sketch-line sketch-line-delay" />
          </>
        )}
        <rect x="35" y="26" width="42" height="26" rx="5" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M43 36h18M43 43h10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <rect x="151" y="20" width="34" height="34" rx="7" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M161 32h14M161 40h9" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
