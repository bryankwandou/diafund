export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dia-g" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35e5c4" />
          <stop offset="1" stopColor="#4c8dff" />
        </linearGradient>
      </defs>
      {/* the lens: light is meant to pass through it */}
      <circle cx="16" cy="16" r="11" stroke="url(#dia-g)" strokeWidth="2" opacity="0.55" />
      <circle cx="16" cy="16" r="5.5" stroke="url(#dia-g)" strokeWidth="2" />
      {/* the beam passing through, ending at a verified node */}
      <path d="M2 16 H27" stroke="url(#dia-g)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28.5" cy="16" r="2.5" fill="url(#dia-g)" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[17px] font-semibold tracking-tight">
        <span className="brand-text">Dia</span>fund
      </span>
    </span>
  );
}
