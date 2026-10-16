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
        <rect width="32" height="32" rx="8" fill="#0f4c9c" />
        <path
          d="M4 18h5l2.5-6 4 12 3-8 2 2h7"
          fill="none"
          stroke="#7db7f0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-semibold text-text-1">SiagaGempa</span>
    </span>
  )
}
