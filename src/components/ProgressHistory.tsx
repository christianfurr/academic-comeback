"use client";

import { fmt } from "@/lib/helpers";
import type { ProgressSnapshot } from "@/lib/types";

export function ProgressHistory({ points }: { points: ProgressSnapshot[] }) {
  const recent = points.slice(-14);
  if (recent.length < 2) return null;
  const min = Math.min(...recent.map((point) => point.current), ...recent.map((point) => point.projected), 50);
  const max = Math.max(...recent.map((point) => point.current), ...recent.map((point) => point.projected), 100);
  const range = Math.max(max - min, 1);
  return (
    <section className="border-t border-[var(--rule)] pt-7" aria-labelledby="progress-history-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">Progress log</div>
          <h3 id="progress-history-title" className="font-display text-[clamp(28px,4vw,40px)] leading-[1.1]">The line is moving.</h3>
        </div>
        <span className="font-mono text-[11px] text-[var(--muted)]">last {recent.length} check-ins</span>
      </div>
      <div className="border border-[var(--border)] bg-[var(--card)] px-4 py-5">
        <div className="flex h-28 items-end gap-1 sm:h-36">
          {recent.map((point) => (
            <div key={point.date} className="flex min-w-0 flex-1 items-end gap-0.5" title={`${point.date}: ${fmt(point.current, 1)}% current, ${fmt(point.projected, 1)}% projected`}>
              <span className="w-1/2 bg-[var(--muted)]" style={{ height: `${((point.current - min) / range) * 100}%`, minHeight: "3px" }} />
              <span className="w-1/2 bg-[var(--accent)]" style={{ height: `${((point.projected - min) / range) * 100}%`, minHeight: "3px" }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] text-[var(--muted)]"><span>current</span><span>projected</span></div>
      </div>
    </section>
  );
}
