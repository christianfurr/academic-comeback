"use client";

import { clamp, fmt, gradeTone } from "@/lib/helpers";

type Props = {
  value: number;
  target: number;
  showTicks?: boolean;
};

export function Sparkline({ value, target, showTicks = true }: Props) {
  const v = clamp(value, 0, 100);
  const t = clamp(target, 0, 100);
  const tone = gradeTone(value);

  return (
    <div className="relative h-2 w-full">
      <div className="absolute inset-x-0 top-1 h-1 rounded bg-[var(--rule)]" />
      {showTicks ? (
        <>
          {["60%", "70%", "80%", "90%"].map((left) => (
            <div
              key={left}
              className="absolute top-1 h-1 w-px bg-[var(--border)]"
              style={{ left }}
            />
          ))}
        </>
      ) : null}
      <div
        className={[
          "absolute top-1 h-1 rounded",
          tone === "ace"
            ? "bg-[var(--ace)]"
            : tone === "solid"
              ? "bg-[var(--solid)]"
              : tone === "risk"
                ? "bg-[var(--risk)]"
                : tone === "low"
                  ? "bg-[var(--low)]"
                  : tone === "danger"
                    ? "bg-[var(--danger)]"
                    : "bg-[var(--muted)]",
        ].join(" ")}
        style={{ width: `${v}%` }}
      />
      <div
        className="absolute -top-2 bottom-0 w-0.5 bg-[var(--accent)]"
        style={{ left: `${t}%`, transform: "translateX(-50%)" }}
        title={`Target ${fmt(t, 1)}%`}
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] font-semibold text-[var(--accent)]">
          {fmt(t, 0)}
        </div>
      </div>
    </div>
  );
}

