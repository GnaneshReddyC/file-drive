type EmptyVariant = "trash" | "favorites" | "images" | "videos";

type SectionEmptyStateProps = {
  variant: EmptyVariant;
  title: string;
  subtitle: string;
  hint: string;
};

const accentByVariant: Record<EmptyVariant, string> = {
  trash: "#ef4444",
  favorites: "#6366f1",
  images: "#3b82f6",
  videos: "#a855f7",
};

function MotifIcon({ variant, accent }: { variant: EmptyVariant; accent: string }) {
  if (variant === "favorites") {
    return (
      <path
        d="M69 96l5.8 11.7 12.9 1.9-9.3 9.1 2.2 12.8L69 125.4l-11.6 6.1 2.2-12.8-9.3-9.1 12.9-1.9L69 96z"
        fill={accent}
      />
    );
  }

  if (variant === "images") {
    return (
      <>
        <rect x="50" y="99" width="38" height="30" rx="5" fill={accent} />
        <circle cx="61" cy="109" r="3.2" fill="#dbeafe" />
        <path d="M52 123l10-8 8 6 6-4 10 6" stroke="#dbeafe" strokeWidth="2" strokeLinecap="round" />
      </>
    );
  }

  if (variant === "videos") {
    return (
      <>
        <rect x="50" y="99" width="38" height="30" rx="5" fill={accent} />
        <path d="M64 108l11 6-11 6z" fill="#ede9fe" />
      </>
    );
  }

  return (
    <>
      <rect x="52" y="102" width="34" height="24" rx="3" fill={accent} opacity="0.2" />
      <path d="M58 102h22m-19-4h16" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M60 108v12m8-12v12m8-12v12" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function EmptyIllustration({ variant }: { variant: EmptyVariant }) {
  const accent = accentByVariant[variant];

  return (
    <svg viewBox="0 0 160 120" className="h-[120px] w-[170px]" aria-hidden="true">
      <g transform="translate(16 18) rotate(-8)">
        <rect width="54" height="38" rx="6" fill="#16161f" stroke="rgba(255,255,255,0.06)" />
        <rect x="0" y="0" width="54" height="5" rx="6" fill={accent} />
        <rect x="8" y="12" width="24" height="2" rx="1" fill="#3f3f54" />
        <rect x="8" y="18" width="32" height="2" rx="1" fill="#3f3f54" />
      </g>
      <g transform="translate(56 10) rotate(4)">
        <rect width="58" height="41" rx="6" fill="#16161f" stroke="rgba(255,255,255,0.06)" />
        <rect x="0" y="0" width="58" height="5" rx="6" fill={accent} />
        <rect x="9" y="13" width="28" height="2" rx="1" fill="#3f3f54" />
        <rect x="9" y="19" width="36" height="2" rx="1" fill="#3f3f54" />
      </g>
      <g transform="translate(33 34)">
        <rect width="60" height="42" rx="6" fill="#16161f" stroke="rgba(255,255,255,0.06)" />
        <rect x="0" y="0" width="60" height="5" rx="6" fill={accent} />
        <rect x="9" y="14" width="30" height="2" rx="1" fill="#3f3f54" />
        <rect x="9" y="20" width="38" height="2" rx="1" fill="#3f3f54" />
      </g>
      <MotifIcon variant={variant} accent={accent} />
    </svg>
  );
}

export function SectionEmptyState({ variant, title, subtitle, hint }: SectionEmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <EmptyIllustration variant={variant} />
        <h2 className="mt-7 text-[18px] font-medium text-[#e2e2f0]">{title}</h2>
        <p className="mt-[10px] text-[13px] text-[#44445a]">{subtitle}</p>
        <div className="mt-5 inline-flex rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[12px] text-[#6b6b80]">
          {hint}
        </div>
      </div>
    </div>
  );
}
