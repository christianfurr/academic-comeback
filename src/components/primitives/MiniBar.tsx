"use client";

import { clamp, gradeTone } from "@/lib/helpers";

type Props = {
  value: number;
  max?: number;
  tone?: ReturnType<typeof gradeTone>;
};

export function MiniBar({ value, max = 100, tone }: Props) {
  const w = clamp((value / max) * 100, 0, 100);
  const t = tone ?? gradeTone(value);
  const color =
    t === "ace"
      ? "var(--ace)"
      : t === "solid"
        ? "var(--solid)"
        : t === "risk"
          ? "var(--risk)"
          : t === "low"
            ? "var(--low)"
            : t === "danger"
              ? "var(--danger)"
              : "var(--muted)";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-[var(--rule)]">
      <div className="h-full rounded transition-[width] duration-300" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

