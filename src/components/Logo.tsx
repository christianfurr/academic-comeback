type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * The Comeback mark: a grade that dips, then climbs back up to a bright peak.
 * Colors come from theme CSS vars so it adapts to whatever accent/bg is active.
 */
export function Logo({ size = 26, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Comeback / Protocol"
      className={className}
    >
      <rect
        width="32"
        height="32"
        rx="7"
        fill="var(--card)"
        stroke="var(--border)"
      />
      <path
        d="M6 21 C 10 25, 12 13, 25 8"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="6" cy="21" r="2.2" fill="var(--ace)" />
      <circle cx="25" cy="8" r="3.4" fill="var(--accent)" />
    </svg>
  );
}
