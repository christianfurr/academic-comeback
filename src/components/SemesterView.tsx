"use client";

import { classCurrent, classMissing, classNeeded, classProjected, assignmentImpact } from "@/lib/classMath";
import { clamp, fmt, gradeTone, letterFor } from "@/lib/helpers";
import type { ClassData } from "@/lib/types";
import { Sparkline } from "@/components/primitives/Sparkline";
import { useMemo } from "react";

type Props = {
  classes: ClassData[];
  onOpenClass: (id: string) => void;
};

export function SemesterView({ classes, onOpenClass }: Props) {
  const allMissing = useMemo(() => {
    const out: Array<{
      id: string;
      name: string;
      catName: string;
      catId: string;
      total: number;
      className: string;
      classId: string;
      impact: number;
    }> = [];
    for (const c of classes) {
      for (const a of classMissing(c)) {
        out.push({
          id: a.id,
          name: a.name,
          catName: a.catName,
          catId: a.catId,
          total: a.total,
          className: c.name,
          classId: c.id,
          impact: assignmentImpact(c, a.catId, a.total),
        });
      }
    }
    return out.sort((a, b) => b.impact - a.impact);
  }, [classes]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
          All classes
        </div>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {classes.map((c) => (
            <SemesterCard key={c.id} cls={c} onOpen={() => onOpenClass(c.id)} />
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
          Top priorities across the semester
        </div>
        <h3 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.25] tracking-[-0.015em]">
          {allMissing.length} assignments. Highest-impact first.
        </h3>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)] max-w-[640px]">
          These are the biggest needle-movers across every class you're tracking.
        </p>

        <div className="mt-4 border border-[var(--border)] bg-[var(--card)]">
          {allMissing.slice(0, 12).map((a, i) => (
            <div
              key={`${a.classId}:${a.id}`}
              className="grid items-center gap-4 px-6 py-3 border-b border-[var(--rule)] last:border-b-0"
              style={{ gridTemplateColumns: "40px 160px 120px 1fr 180px" }}
            >
              <span className="font-mono text-[12px] text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
              <button
                className="font-display italic text-[17px] text-left underline decoration-transparent underline-offset-4 hover:decoration-[var(--accent)] transition-colors"
                onClick={() => onOpenClass(a.classId)}
              >
                {a.className}
              </button>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                {a.catName}
              </span>
              <span className="text-[13px] text-[var(--ink)]">{a.name}</span>
              <span className="flex items-center justify-end gap-2">
                <span className="h-1 w-[80px] rounded bg-[var(--rule)] overflow-hidden">
                  <span className="block h-full rounded bg-[var(--accent)]" style={{ width: `${clamp(a.impact * 2, 4, 100)}%` }} />
                </span>
                <span className="font-mono text-[11px] text-[var(--ink)]">{fmt(a.impact, 1)}pt</span>
              </span>
            </div>
          ))}
          {allMissing.length === 0 ? (
            <div className="px-6 py-6 text-center font-display italic text-[16px] text-[var(--muted)]">
              No missing assignments anywhere. Take a breath.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SemesterCard({ cls, onOpen }: { cls: ClassData; onOpen: () => void }) {
  const current = classCurrent(cls);
  const projected = classProjected(cls);
  const needed = classNeeded(cls);
  const missingCount = classMissing(cls).length;
  const tone = gradeTone(projected);
  const onTrack = projected >= cls.target;

  const stripe =
    tone === "ace"
      ? "var(--ace)"
      : tone === "solid"
        ? "var(--solid)"
        : tone === "risk"
          ? "var(--risk)"
          : tone === "low"
            ? "var(--low)"
            : tone === "danger"
              ? "var(--danger)"
              : "var(--muted)";

  const letterColor = stripe;

  return (
    <button
      className="relative overflow-hidden border border-[var(--border)] bg-[var(--card)] px-6 py-5 text-left transition-all hover:border-[var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_var(--ink)]"
      onClick={onOpen}
    >
      <span className="absolute left-0 top-0 h-[3px] w-full" style={{ background: stripe }} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display italic text-[24px] leading-none">{cls.name}</span>
        <span className="font-display text-[36px] leading-none" style={{ color: letterColor }}>
          {letterFor(current)}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-[18px] font-medium">
          {fmt(current, 1)}
          <span className="text-[13px] text-[var(--muted)]">%</span>
        </span>
        <span className="font-mono text-[14px] text-[var(--muted-soft)]">→</span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          target {fmt(cls.target, 0)}%
        </span>
      </div>

      <div className="mt-3">
        <Sparkline value={projected} target={cls.target} showTicks={false} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="font-mono text-[11px] text-[var(--muted)]">{missingCount} missing</span>
        {needed !== null && Number.isFinite(needed) && needed > 0 && needed <= 100 ? (
          <span className="font-mono text-[11px] text-[var(--ink)]">
            need <strong>{fmt(needed, 0)}%</strong> avg
          </span>
        ) : needed !== null && needed > 100 ? (
          <span className="font-mono text-[11px] text-[var(--danger)]">impossible w/o EC</span>
        ) : needed !== null && needed <= 0 ? (
          <span className="font-mono text-[11px] text-[var(--ace)]">cruise</span>
        ) : missingCount === 0 ? (
          <span className="font-mono text-[11px]" style={{ color: onTrack ? "var(--ace)" : "var(--danger)" }}>
            {onTrack ? "goal hit" : `${fmt(cls.target - current, 1)} short`}
          </span>
        ) : null}
      </div>
    </button>
  );
}

