"use client";

import { classCurrent, classMissing, classProjected } from "@/lib/classMath";
import { fmt, gradeTone, letterFor } from "@/lib/helpers";
import type { ClassData } from "@/lib/types";
import { useMemo } from "react";

type Props = {
  classes: ClassData[];
};

function gpaFromPct(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 63) return 1.0;
  if (pct >= 60) return 0.7;
  return 0.0;
}

export function ClassesSummary({ classes }: Props) {
  const totals = useMemo(() => {
    const total = classes.length;
    const projected = classes.map(classProjected);
    const targets = classes.map((c) => c.target);
    const onTrack = projected.filter((p, i) => p >= targets[i]!).length;
    const avgCurrent = classes.reduce((s, c) => s + classCurrent(c), 0) / total;
    const avgProjected = projected.reduce((s, p) => s + p, 0) / total;
    const totalMissing = classes.reduce((s, c) => s + classMissing(c).length, 0);
    const gpaCurrent = classes.reduce((s, c) => s + gpaFromPct(classCurrent(c)), 0) / total;
    const gpaProjected = classes.reduce((s, c) => s + gpaFromPct(classProjected(c)), 0) / total;
    return { total, projected, targets, onTrack, avgCurrent, avgProjected, totalMissing, gpaCurrent, gpaProjected };
  }, [classes]);

  if (classes.length === 0) return null;

  return (
    <section className="border-t-2 border-[var(--ink)] pt-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink)]">
          YOUR SEMESTER
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
        <span className="font-display italic text-[14px] text-[var(--muted)]">
          {totals.total} class{totals.total === 1 ? "" : "es"} · {totals.totalMissing} assignment
          {totals.totalMissing === 1 ? "" : "s"} to climb
        </span>
      </div>

      <div className="grid grid-cols-1 overflow-hidden border border-[var(--border)] bg-[var(--card)] sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat
          label="GPA right now"
          value={totals.gpaCurrent.toFixed(2)}
          sub={`projected: ${totals.gpaProjected.toFixed(2)}`}
          tone={totals.gpaCurrent >= 3.0 ? "solid" : "risk"}
        />
        <SummaryStat
          label="Avg across classes"
          value={`${fmt(totals.avgCurrent, 1)}%`}
          sub={`${letterFor(totals.avgCurrent)} · projected ${letterFor(totals.avgProjected)}`}
          tone={gradeTone(totals.avgCurrent)}
        />
        <SummaryStat
          label="Classes on track"
          value={`${totals.onTrack}/${totals.total}`}
          sub={totals.onTrack === totals.total ? "every target reachable" : `${totals.total - totals.onTrack} need recovery work`}
          tone={totals.onTrack === totals.total ? "ace" : totals.onTrack >= totals.total / 2 ? "solid" : "risk"}
        />
        <SummaryStat
          label="Assignments left"
          value={`${totals.totalMissing}`}
          sub="missing across all classes"
          tone={totals.totalMissing === 0 ? "ace" : totals.totalMissing <= 5 ? "solid" : "risk"}
        />
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "ace" | "solid" | "risk" | "danger" | "low" | "neutral";
}) {
  const color =
    tone === "ace"
      ? "var(--ace)"
      : tone === "risk"
        ? "var(--risk)"
        : tone === "danger"
          ? "var(--danger)"
          : tone === "low"
            ? "var(--low)"
            : "var(--ink)";

  return (
    <div className="border-b border-[var(--border)] p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)] mb-2">{label}</div>
      <div className="font-display text-[44px] leading-none tracking-[-0.02em]" style={{ color }}>
        {value}
      </div>
      <div className="font-display italic text-[14px] text-[var(--muted)] mt-1">{sub}</div>
    </div>
  );
}

