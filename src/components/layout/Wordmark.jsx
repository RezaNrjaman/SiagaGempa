export default function Wordmark({ className = '' }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 32 32"
        role="img"
        aria-label="Logo SiagaGempa"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="url(#sgLogo)" />
        <defs>
          <linearGradient id="sgLogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path
          d="M4 18h5l2.5-6 4 12 3-8 2 2h7"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-semibold text-text-1">SiagaGempa</span>
    </span>
  )
}
