export function AnimatedCheck({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <div className={`check-ring mx-auto grid place-items-center rounded-full ${className}`}>
      <svg viewBox="0 0 52 52" className="h-full w-full" role="img" aria-label="Success">
        <circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke="#15803d"
          strokeWidth="3"
          className="check-circle"
        />
        <path
          fill="none"
          stroke="#15803d"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-16"
          className="check-mark"
        />
      </svg>
    </div>
  );
}
