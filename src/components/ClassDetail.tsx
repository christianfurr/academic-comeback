"use client";

import { EditableText } from "@/components/primitives/EditableText";
import { GamePlan } from "@/components/GamePlan";
import { MiniBar } from "@/components/primitives/MiniBar";
import { NumberInput } from "@/components/primitives/NumberInput";
import { Sparkline } from "@/components/primitives/Sparkline";
import { SourceBadge } from "@/components/SourceBadge";
import { SyncClassModal } from "@/components/SyncClassModal";
import { assignmentImpact, classCurrent, classMissing, classNeeded, classProjected } from "@/lib/classMath";
import { clamp, fmt, fmtPts, gradeTone, letterFor } from "@/lib/helpers";
import { categoryStats, categoryStatsProjected } from "@/lib/grademath";
import type { Category, ClassData, PlanTask } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type Props = {
  cls: ClassData;
  onUpdate: (next: ClassData) => void;
  onDelete: () => void;
  /** Provided when Skyward is connected; called with the class name to sync just this class. */
  onSkywardSync?: (className: string) => void;
  skywardSyncing?: boolean;
  tasks: PlanTask[];
  onTasksChange: (tasks: PlanTask[]) => void;
};

export function ClassDetail({ cls, onUpdate, onDelete, onSkywardSync, skywardSyncing, tasks, onTasksChange }: Props) {
  const [showSync, setShowSync] = useState(false);
  const isSkyward = cls.source === "skyward";
  const skywardSyncAvailable = isSkyward && !!onSkywardSync;

  return (
    <div className="flex flex-col gap-10">
      <StickyProjectedBar cls={cls} />
      <ComebackHeader
        cls={cls}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSync={
          skywardSyncAvailable
            ? () => onSkywardSync!(cls.name)
            : () => setShowSync(true)
        }
        syncLabel={skywardSyncAvailable ? "sync with skyward ⟳" : "sync from paste ⟳"}
        syncTitle={
          skywardSyncAvailable
            ? "Pull the latest grades for this class from Skyward"
            : "Update this class by pasting fresh data from your portal"
        }
        syncDisabled={skywardSyncAvailable && !!skywardSyncing}
      />
      <GamePlan cls={cls} tasks={tasks} onTasksChange={onTasksChange} />
      <ComebackPath cls={cls} onUpdate={onUpdate} />
      <CategoriesSection cls={cls} onUpdate={onUpdate} />
      {showSync ? (
        <SyncClassModal
          cls={cls}
          onClose={() => setShowSync(false)}
          onApply={(next) => {
            onUpdate({ ...next, source: "paste" });
            setShowSync(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ComebackHeader({
  cls,
  onUpdate,
  onDelete,
  onSync,
  syncLabel,
  syncTitle,
  syncDisabled,
}: {
  cls: ClassData;
  onUpdate: (next: ClassData) => void;
  onDelete: () => void;
  onSync: () => void;
  syncLabel: string;
  syncTitle: string;
  syncDisabled?: boolean;
}) {
  const current = classCurrent(cls);
  const projected = classProjected(cls);
  const needed = classNeeded(cls);
  const missingCount = classMissing(cls).length;

  const verdict = useMemo(() => {
    if (missingCount === 0) {
      if (current >= cls.target) {
        return { tone: "ace" as const, tag: "Goal locked", line: `You're already past ${fmt(cls.target, 0)}%. Hold the line.` };
      }
      return { tone: "danger" as const, tag: "No path left", line: `Nothing left to grade — ${fmt(cls.target - current, 1)} points short. Talk to your teacher about extra credit.` };
    }
    if (needed === null || !Number.isFinite(needed)) return { tone: "neutral" as const, tag: "Calculating", line: "" };
    if (needed <= 0) return { tone: "ace" as const, tag: "Cruise control", line: `Even a zero on everything left still lands above ${fmt(cls.target, 0)}%.` };
    if (needed <= 65) return { tone: "ace" as const, tag: "Soft landing", line: `Just ${fmt(needed, 1)}% on remaining work hits your goal. Coast.` };
    if (needed <= 85) return { tone: "solid" as const, tag: "Within reach", line: `Average ${fmt(needed, 1)}% on the rest. Very doable.` };
    if (needed <= 95) return { tone: "solid" as const, tag: "Lock in", line: `${fmt(needed, 1)}% average needed. Real work, real possible.` };
    if (needed <= 100) return { tone: "risk" as const, tag: "Tight window", line: `${fmt(needed, 1)}% on every assignment left. Won't be easy. Possible.` };
    return { tone: "danger" as const, tag: "Math says no", line: `Would need ${fmt(needed, 1)}% — over a perfect score. Drop the target, or chase extra credit.` };
  }, [cls.target, current, missingCount, needed]);

  const colorForTone = (t: ReturnType<typeof gradeTone>): string =>
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
    <section data-comeback-header="1" className="border border-[var(--border)] bg-[var(--card)] px-8 py-7">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--rule)] pb-6 mb-7">
        <div>
          <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--muted)] mb-1.5 flex items-center gap-2">
            <span>Current focus · class</span>
            <SourceBadge
              source={cls.source}
              lastSyncedAt={cls.lastSyncedAt}
              variant="header"
            />
          </div>
          <h2 className="font-display italic font-normal tracking-[-0.02em] leading-[1.1] text-[clamp(40px,6vw,64px)]">
            <EditableText
              value={cls.name}
              onChange={(v) => onUpdate({ ...cls, name: v })}
              placeholder="Click to name this class"
              maxLength={50}
              ariaLabel="Class name"
            />
          </h2>
        </div>
        <div className="flex items-center gap-5">
          <button
            className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] hover:text-[var(--ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSync}
            title={syncTitle}
            disabled={syncDisabled}
          >
            {syncDisabled ? "syncing… ⟳" : syncLabel}
          </button>
          <button
            className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
            onClick={onDelete}
            title="Remove class"
          >
            remove class ×
          </button>
        </div>
      </div>

      <div className="grid gap-6 border-b border-[var(--rule)] pb-7 mb-6 lg:grid-cols-[minmax(120px,1fr)_auto_minmax(280px,2.4fr)_auto_minmax(180px,1.3fr)] lg:items-center">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--muted)]">Right now</div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span
              className="font-display text-[64px] leading-[0.9] tracking-[-0.025em]"
              style={{ color: colorForTone(gradeTone(current)) }}
            >
              {letterFor(current)}
            </span>
            <span className="font-mono text-[16px] font-medium">
              {fmt(current, 1)}
              <span className="text-[var(--muted)] font-normal">%</span>
            </span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">{missingCount} unfinished</div>
        </div>

        <div className="hidden lg:flex items-center justify-center px-2">
          <div className="flex flex-col items-center gap-1">
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">if you score</div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <span className="inline-block h-px w-3 bg-[var(--muted)]" />
              <span className="font-display italic text-[12px] text-[var(--accent)] whitespace-nowrap">
                {missingCount > 0 ? "your what-ifs →" : "final →"}
              </span>
              <span className="font-mono text-[14px] font-bold text-[var(--accent)]">→</span>
            </div>
          </div>
        </div>

        <div className="relative px-2 lg:px-4">
          <div className="absolute left-0 top-5 bottom-0 w-0.5 bg-[var(--accent)]" />
          <div className="absolute right-0 top-5 bottom-0 w-0.5 bg-[var(--accent)] opacity-40" />

          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--accent)] font-bold mb-3">
            Where you'll land
          </div>
          <div className="flex items-start gap-4">
            <span
              className="font-display tracking-[-0.04em] leading-[0.82] text-[clamp(96px,13vw,152px)]"
              style={{ color: colorForTone(gradeTone(projected)) }}
            >
              {letterFor(projected)}
            </span>
            <div className="pt-2 min-w-0">
              <div className="font-mono font-semibold tracking-[-0.03em] leading-none text-[clamp(28px,3.6vw,42px)] text-[var(--ink)]">
                {fmt(projected, 1)}
                <span className="text-[var(--muted)] font-normal text-[0.6em]">%</span>
              </div>
              <div
                className={[
                  "font-mono text-[13px] font-medium mt-1",
                  projected >= current ? "text-[var(--ace)]" : "text-[var(--danger)]",
                ].join(" ")}
              >
                {projected >= current ? "▲" : "▼"} {fmt(Math.abs(projected - current), 1)} from now
              </div>
            </div>
          </div>

          {missingCount > 0 ? (
            <div className="mt-4 border-t border-[var(--rule)] pt-3">
              <Sparkline value={projected} target={cls.target} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                <span className="font-mono text-[12px] text-[var(--muted)]">
                  vs target{" "}
                  <strong className={projected >= cls.target ? "text-[var(--ace)]" : "text-[var(--danger)]"}>
                    {projected >= cls.target ? "+" : ""}
                    {fmt(projected - cls.target, 1)} pts
                  </strong>
                </span>
                <span className="font-display italic text-[14px] text-[var(--muted)]">drag sliders below to change</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.12em] rounded px-2.5 py-1 bg-[rgba(29,107,57,0.10)] text-[var(--ace)]">
              FINAL · no work left
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center justify-center px-2">
          <div className="flex flex-col items-center gap-1">
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">to clear</div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <span className="font-mono text-[14px] font-bold text-[var(--ink)]">→</span>
              <span className="font-display italic text-[12px] text-[var(--ink)] whitespace-nowrap">target</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--muted)]">Target</div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-display italic text-[56px] leading-none text-[var(--accent)]">
              {letterFor(cls.target)}
            </span>
            <span className="font-mono text-[22px] tracking-[-0.02em]">
              {fmt(cls.target, 1)}
              <span className="text-[var(--muted)] font-normal">%</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {[100, 95, 90, 85, 80, 75].map((t) => (
              <button
                key={t}
                className={[
                  "px-2 py-1 font-mono text-[11px] border rounded text-[var(--muted)] transition-colors",
                  Math.abs(cls.target - t) < 0.1
                    ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]"
                    : "border-[var(--border)] hover:text-[var(--ink)] hover:border-[var(--ink)]",
                ].join(" ")}
                onClick={() => onUpdate({ ...cls, target: t })}
              >
                {t === 100 ? "A+" : letterFor(t)} <span className="text-[9px] opacity-70">{t}</span>
              </button>
            ))}
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={0.5}
            value={cls.target}
            onChange={(e) => onUpdate({ ...cls, target: Number.parseFloat(e.target.value) })}
            className="target-slider"
          />
        </div>
      </div>

      <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--card-2)] px-6 py-5">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--muted)] mb-2">
              The comeback math
            </div>
            <div className="font-display italic text-[22px]" style={{ color: colorForTone(verdict.tone) }}>
              {verdict.tag}
            </div>
            <div className="text-[13px] leading-[1.5] text-[var(--ink-soft)] mt-1">{verdict.line}</div>
          </div>

          {missingCount > 0 && needed !== null && Number.isFinite(needed) ? (
            needed > 100 ? (
              <div className="flex items-baseline gap-3 md:pl-6 md:border-l md:border-[var(--rule)]">
                <span className="font-display italic text-[52px] leading-none tracking-[-0.02em] text-[var(--danger)]">
                  {fmt(needed, 1)}%
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  over a perfect score<br />needed — impossible
                </span>
              </div>
            ) : needed <= 0 ? (
              <div className="flex items-baseline gap-3 md:pl-6 md:border-l md:border-[var(--rule)]">
                <span className="font-display italic text-[36px] leading-none text-[var(--ace)]">0%</span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  target already locked<br />
                  even with all zeros
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 md:pl-6 md:border-l md:border-[var(--rule)]">
                <span className="font-display italic text-[52px] leading-none tracking-[-0.02em] text-[var(--ink)]">
                  {fmt(needed, 1)}%
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  average needed<br />
                  on remaining work
                </span>
              </div>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ComebackPath({ cls, onUpdate }: { cls: ClassData; onUpdate: (next: ClassData) => void }) {
  const missing = classMissing(cls).map((a) => ({
    ...a,
    impact: assignmentImpact(cls, a.catId, a.total),
  }));
  const needed = classNeeded(cls);
  const [sortBy, setSortBy] = useState<"impact" | "category" | "date">("impact");

  const sortedMissing = useMemo(() => {
    const out = [...missing];
    if (sortBy === "category") return out.sort((a, b) => a.catName.localeCompare(b.catName));
    if (sortBy === "date") return out.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return out.sort((a, b) => b.impact - a.impact);
  }, [missing, sortBy]);

  if (missing.length === 0) {
    return (
      <section className="border-t border-[var(--rule)] pt-7">
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
          The path forward
        </div>
        <h3 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.25] tracking-[-0.015em]">
          Nothing left to climb.
        </h3>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)] max-w-[640px]">
          All assignments are graded. Adjust scores in the breakdown below, or paste fresh grades.
        </p>
      </section>
    );
  }

  const targetTickPos =
    needed !== null && Number.isFinite(needed) && needed > 0 && needed <= 100 ? needed : null;

  const updateAssignment = (catId: string, aid: string, patch: Partial<{ whatIf: number | null; missing: boolean; score: number | null }>) => {
    const newCats = cls.categories.map((c) => {
      if (c.id !== catId) return c;
      return { ...c, assignments: c.assignments.map((a) => (a.id === aid ? { ...a, ...patch } : a)) };
    });
    onUpdate({ ...cls, categories: newCats });
  };

  const applyEvenly = (val: number) => {
    const newCats = cls.categories.map((c) => ({
      ...c,
      assignments: c.assignments.map((a) => (a.missing ? { ...a, whatIf: val } : a)),
    }));
    onUpdate({ ...cls, categories: newCats });
  };

  return (
    <section className="border-t border-[var(--rule)] pt-7">
      <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
            02 — The path forward
          </div>
          <h3 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.25] tracking-[-0.015em] mb-4">
            {missing.length} assignment{missing.length === 1 ? "" : "s"} between you and {fmt(cls.target, 0)}%.
          </h3>
          <p className="text-[14.5px] leading-[1.5] text-[var(--muted)] max-w-[640px]">
            Each slider is a missing assignment. Drag it to what-if different scores.
            {targetTickPos !== null ? (
              <>
                {" "}
                The <span className="inline-block h-2 w-2 bg-[var(--accent)] rotate-45 mx-1 align-middle" /> shows the average you need.
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] mr-1">
            sort:
          </span>
          {(["impact", "category", "date"] as const).map((k) => (
            <button
              key={k}
              className={[
                "px-2 py-1 rounded text-[11px] font-mono transition-colors",
                sortBy === k ? "bg-[var(--ink)] text-[var(--bg)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
              ].join(" ")}
              onClick={() => setSortBy(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-3 mb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
          Set all missing to:
        </span>
        {[60, 70, 80, 90, 100].map((v) => (
          <button key={v} className="px-3 py-1 rounded border border-[var(--border)] bg-[var(--card-2)] font-mono text-[12px] hover:bg-[var(--ink)] hover:text-[var(--bg)] hover:border-[var(--ink)] transition-colors" onClick={() => applyEvenly(v)}>
            {v}%
          </button>
        ))}
        {targetTickPos !== null ? (
          <button className="px-3 py-1 rounded border border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] font-mono text-[12px] font-semibold hover:bg-[var(--accent-hot)] transition-colors" onClick={() => applyEvenly(Math.round(targetTickPos))}>
            ↑ {Math.round(targetTickPos)}% (hits target)
          </button>
        ) : null}
        <button className="px-3 py-1 rounded border border-[var(--border)] bg-[var(--card-2)] font-mono text-[12px] text-[var(--danger)] hover:bg-[var(--ink)] hover:text-[var(--bg)] hover:border-[var(--ink)] transition-colors" onClick={() => applyEvenly(0)}>
          ⊘ 0%
        </button>
      </div>

      <div className="border border-[var(--border)] bg-[var(--card)]">
        {sortedMissing.map((a, idx) => {
          const wi = a.whatIf ?? 80;
          const projectedScore = (wi / 100) * a.total;
          const tone = gradeTone(wi);
          const impactPct = clamp(a.impact * 2, 4, 100);

          const toneColor =
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

          return (
            <div
              key={a.id}
              data-assignment-id={a.id}
              className="grid items-center gap-6 border-b border-[var(--rule)] px-6 py-5 last:border-b-0 lg:grid-cols-[36px_minmax(220px,2.8fr)_minmax(180px,2fr)_130px]"
            >
              <div className="font-mono text-[13px] text-[var(--muted)]">{String(idx + 1).padStart(2, "0")}</div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-3 min-w-0">
                  <span className="font-display italic text-[22px] leading-[1.15] overflow-wrap-anywhere">
                    {a.name}
                  </span>
                  {a.date ? <span className="font-mono text-[11px] text-[var(--muted)]">{a.date}</span> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ink)]">
                    {a.catName}
                  </span>
                  <span className="text-[var(--muted-soft)]">·</span>
                  <span>{a.total} pts possible</span>
                  <span className="text-[var(--muted-soft)]">·</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em]">impact</span>
                    <span className="h-1 w-[50px] rounded bg-[var(--rule)] overflow-hidden">
                      <span className="block h-full rounded" style={{ width: `${impactPct}%`, background: "var(--accent)" }} />
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ink)]">{fmt(a.impact, 1)}pt</span>
                  </span>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={wi}
                    onChange={(e) => updateAssignment(a.catId, a.id, { whatIf: Number.parseFloat(e.target.value) })}
                    aria-label={`What-if score for ${a.name}`}
                  />
                  {targetTickPos !== null ? (
                    <div
                      className="pointer-events-none absolute top-1/2 h-6 w-0.5 bg-[var(--accent)]"
                      style={{ left: `${targetTickPos}%`, transform: "translate(-50%, -50%)" }}
                      title={`Target: ${fmt(targetTickPos, 1)}%`}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 text-[8px] leading-none text-[var(--accent)] mb-0.5">
                        ▼
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--muted)]">
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 text-right whitespace-nowrap">
                <span className="font-display italic text-[32px] leading-none" style={{ color: toneColor }}>
                  {fmt(wi, 0)}%
                </span>
                <span className="font-mono text-[11px] text-[var(--ink)]">
                  {fmtPts(projectedScore)}
                  <span className="text-[var(--muted)]">/{a.total}</span>
                </span>
                <button
                  className="mt-1 border border-[var(--ace)] text-[var(--ace)] font-mono text-[10px] px-2 py-1 rounded opacity-70 hover:opacity-100 hover:bg-[var(--ace)] hover:text-[var(--bg)] transition-colors"
                  onClick={() =>
                    updateAssignment(a.catId, a.id, { missing: false, score: ((a.whatIf ?? 0) / 100) * a.total })
                  }
                  title="Mark as actually scored this"
                >
                  ✓ got this
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesSection({ cls, onUpdate }: { cls: ClassData; onUpdate: (next: ClassData) => void }) {
  const totalWeight = cls.categories.reduce((s, c) => s + (c.weight || 0), 0);
  const weightWarn = Math.abs(totalWeight - 100) > 0.5;
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set(cls.categories.map((c) => c.id)));

  const updateCategory = (catId: string, patch: Partial<Category>) => {
    onUpdate({ ...cls, categories: cls.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) });
  };

  const deleteCategory = (catId: string) => onUpdate({ ...cls, categories: cls.categories.filter((c) => c.id !== catId) });

  const addCategory = () =>
    onUpdate({
      ...cls,
      categories: [...cls.categories, { id: crypto.randomUUID(), name: "New category", weight: 10, assignments: [] }],
    });

  const addAssignment = (catId: string) => {
    const cat = cls.categories.find((c) => c.id === catId);
    if (!cat) return;
    updateCategory(catId, {
      assignments: [
        ...cat.assignments,
        {
          id: crypto.randomUUID(),
          name: "New assignment",
          letter: null,
          date: null,
          score: null,
          total: 100,
          missing: true,
          noCount: false,
          whatIf: 85,
        },
      ],
    });
  };

  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="border-t border-[var(--rule)] pt-7">
      <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
            03 — The breakdown
          </div>
          <h3 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.25] tracking-[-0.015em] mb-4">
            Every category. Every assignment. Editable.
          </h3>
          <p className="text-[14.5px] leading-[1.5] text-[var(--muted)] max-w-[640px]">
            Click text to edit. Toggle the dot to mark missing/graded. Use ∅ to no-count an item.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={[
              "inline-flex items-center gap-2 rounded border px-3 py-2 font-mono text-[12px] bg-[var(--card)]",
              weightWarn ? "border-[var(--risk)] text-[var(--risk)]" : "border-[var(--border)]",
            ].join(" ")}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: weightWarn ? "var(--risk)" : "var(--ace)" }} />
            weights total <strong>{fmt(totalWeight, 1)}%</strong>
            {weightWarn ? <span className="ml-1">should be 100</span> : null}
          </span>
          <button className="btn-ghost" onClick={addCategory}>
            + category
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {cls.categories.map((cat) => (
          <CategoryBlock
            key={cat.id}
            cat={cat}
            isOpen={openCats.has(cat.id)}
            onToggle={() => toggleCat(cat.id)}
            onUpdate={(patch) => updateCategory(cat.id, patch)}
            onDelete={() => deleteCategory(cat.id)}
            onAddAssignment={() => addAssignment(cat.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryBlock({
  cat,
  isOpen,
  onToggle,
  onUpdate,
  onDelete,
  onAddAssignment,
}: {
  cat: Category;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Category>) => void;
  onDelete: () => void;
  onAddAssignment: () => void;
}) {
  const stats = categoryStats(cat);
  const projStats = categoryStatsProjected(cat);
  const contribution = stats.pct === null ? 0 : (stats.pct / 100) * cat.weight;
  const projContribution = projStats.pct === null ? 0 : (projStats.pct / 100) * cat.weight;
  const tone = gradeTone(stats.pct);
  const missingCount = cat.assignments.filter((a) => a.missing).length;

  const toneColor =
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

  return (
    <div className="border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--border-strong)] transition-colors">
      <div
        className="grid gap-4 items-center px-6 py-4 cursor-pointer hover:bg-[var(--card-2)] transition-colors lg:grid-cols-[24px_minmax(180px,1.5fr)_auto_1.5fr_auto_24px]"
        onClick={onToggle}
      >
        <div className="font-mono text-[12px] text-[var(--muted)]">{isOpen ? "▾" : "▸"}</div>

        <div className="min-w-0">
          <div className="font-display italic text-[26px] leading-none" onClick={(e) => e.stopPropagation()}>
            <EditableText value={cat.name} onChange={(v) => onUpdate({ name: v })} ariaLabel="Category name" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            <span>
              {cat.assignments.length} item{cat.assignments.length === 1 ? "" : "s"}
            </span>
            {missingCount > 0 ? (
              <>
                <span className="text-[var(--muted-soft)]">·</span>
                <span className="text-[var(--danger)]">{missingCount} missing</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">weight</span>
          <NumberInput
            value={cat.weight}
            onChange={(v) => onUpdate({ weight: v ?? 0 })}
            min={0}
            max={100}
            step={0.5}
            suffix="%"
            ariaLabel="Category weight"
          />
        </div>

        <div className="min-w-0">
          <MiniBar value={stats.pct ?? 0} tone={tone} />
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-display italic text-[20px]" style={{ color: toneColor }}>
              {stats.pct === null ? "—" : `${fmt(stats.pct, 1)}%`}
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">{stats.pct === null ? "" : letterFor(stats.pct)}</span>
          </div>
        </div>

        <div className="text-right whitespace-nowrap">
          <div className="font-mono text-[14px] font-medium">
            {fmt(contribution, 1)}<span className="text-[var(--muted)]">/{fmt(cat.weight, 0)}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">pts toward final</div>
          {Math.abs(projContribution - contribution) > 0.01 ? (
            <div className="font-mono text-[10px] text-[var(--accent)] mt-1">→ {fmt(projContribution, 1)} projected</div>
          ) : null}
        </div>

        <button
          className="text-[18px] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[color:rgba(168,38,26,0.10)] rounded w-6 h-6 flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove "${cat.name}" category?`)) onDelete();
          }}
          title="Remove category"
        >
          ×
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-[var(--rule)] bg-[var(--card-2)]">
          <div className="hidden md:grid grid-cols-[28px_2.5fr_50px_90px_90px_80px_110px_28px] gap-3 px-6 py-2.5 border-b border-[var(--rule)] font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            <span />
            <span>Assignment</span>
            <span className="text-center">Letter</span>
            <span className="text-right">Earned</span>
            <span className="text-right">Possible</span>
            <span className="text-right">Score</span>
            <span />
            <span />
          </div>

          <div>
            {cat.assignments.length === 0 ? (
              <div className="px-6 py-6 text-center font-display italic text-[16px] text-[var(--muted)]">
                No assignments yet — add one below.
              </div>
            ) : null}

            {cat.assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                a={a}
                onUpdate={(patch) => {
                  onUpdate({
                    assignments: cat.assignments.map((x) => (x.id === a.id ? { ...x, ...patch } : x)),
                  });
                }}
                onDelete={() => {
                  onUpdate({ assignments: cat.assignments.filter((x) => x.id !== a.id) });
                }}
              />
            ))}
          </div>

          <button
            className="w-full border-t border-dashed border-[var(--border)] py-3 font-mono text-[12px] text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
            onClick={onAddAssignment}
          >
            + add assignment
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AssignmentRow({
  a,
  onUpdate,
  onDelete,
}: {
  a: Category["assignments"][number];
  onUpdate: (patch: Partial<Category["assignments"][number]>) => void;
  onDelete: () => void;
}) {
  const pct = !a.missing && a.total > 0 && a.score !== null ? (a.score / a.total) * 100 : null;
  const tone = a.missing ? "danger" : a.noCount ? "neutral" : gradeTone(pct);

  const dotStyle = a.missing
    ? { background: "transparent", borderColor: "var(--danger)", borderStyle: "dashed" as const }
    : a.noCount
      ? { background: "var(--muted-soft)", borderColor: "var(--muted-soft)" }
      : {
          background:
            tone === "ace"
              ? "var(--ace)"
              : tone === "solid"
                ? "var(--solid)"
                : tone === "risk"
                  ? "var(--risk)"
                  : tone === "low"
                    ? "var(--low)"
                    : "var(--danger)",
          borderColor:
            tone === "ace"
              ? "var(--ace)"
              : tone === "solid"
                ? "var(--solid)"
                : tone === "risk"
                  ? "var(--risk)"
                  : tone === "low"
                    ? "var(--low)"
                    : "var(--danger)",
        };

  return (
    <div
      className={[
        "grid gap-3 items-center px-6 py-2.5 border-b border-[var(--rule)] text-[13px] transition-colors",
        a.missing ? "bg-[color:rgba(237,98,83,0.08)]" : "",
        a.noCount ? "opacity-50" : "",
        "hover:bg-[rgba(255,255,255,0.02)]",
        "md:grid-cols-[28px_2.5fr_50px_90px_90px_80px_110px_28px]",
        "grid-cols-[28px_1fr_80px_28px] md:[&>.hide-sm]:block [&>.hide-sm]:hidden",
      ].join(" ")}
    >
      <button
        className="h-3.5 w-3.5 rounded-full border-2"
        style={dotStyle}
        onClick={() => {
          if (a.missing) onUpdate({ missing: false, score: 0 });
          else onUpdate({ missing: true });
        }}
        title={a.missing ? "Click: mark as graded" : "Click: mark as missing"}
      />

      <div className="min-w-0 flex flex-wrap items-baseline gap-2">
        <EditableText value={a.name} onChange={(v) => onUpdate({ name: v })} ariaLabel="Assignment name" />
        {a.date ? <span className="font-mono text-[10px] text-[var(--muted)]">{a.date}</span> : null}
      </div>

      <div className="hide-sm font-mono text-[11px] text-center text-[var(--muted)]">{a.letter ?? "—"}</div>

      <div className="hide-sm flex justify-end">
        <NumberInput
          value={a.score}
          onChange={(v) => onUpdate(v === null ? { score: null, missing: true } : { score: v, missing: false })}
          min={0}
          step={0.5}
          placeholder="missing"
          ariaLabel="Earned points"
        />
      </div>

      <div className="hide-sm flex justify-end">
        <NumberInput
          value={a.total}
          onChange={(v) => onUpdate({ total: v ?? 1 })}
          min={1}
          step={1}
          ariaLabel="Possible points"
        />
      </div>

      <div className="hide-sm text-right font-mono text-[13px] font-semibold">
        {pct === null ? (
          a.missing ? (
            <span className="text-[var(--danger)]">0%</span>
          ) : (
            <span className="text-[var(--muted)]">—</span>
          )
        ) : (
          <span style={{ color: tone === "ace" ? "var(--ace)" : tone === "solid" ? "var(--solid)" : tone === "risk" ? "var(--risk)" : tone === "low" ? "var(--low)" : "var(--danger)" }}>
            {fmt(pct, 0)}%
          </span>
        )}
      </div>

      <div className="hide-sm flex items-center justify-end gap-1">
        {a.missing ? <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[rgba(237,98,83,0.14)] text-[var(--danger)] font-semibold">missing</span> : null}
        {a.noCount ? <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-[var(--rule)] text-[var(--muted)] font-semibold">no count</span> : null}
        <button
          className={[
            "w-5 h-5 rounded text-[12px] transition-colors",
            a.noCount ? "bg-[var(--rule)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--rule)] hover:text-[var(--ink)]",
          ].join(" ")}
          onClick={() => onUpdate({ noCount: !a.noCount })}
          title="Toggle no-count"
        >
          ∅
        </button>
      </div>

      <button
        className="text-[16px] text-[var(--muted-soft)] hover:text-[var(--danger)] hover:bg-[rgba(237,98,83,0.14)] rounded w-[22px] h-[22px] flex items-center justify-center transition-colors"
        onClick={onDelete}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

function StickyProjectedBar({ cls }: { cls: ClassData }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector('[data-comeback-header="1"]');
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "-60px 0px 0px 0px" },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [cls.id]);

  const current = classCurrent(cls);
  const projected = classProjected(cls);
  const needed = classNeeded(cls);
  const missingCount = classMissing(cls).length;
  const projTone = gradeTone(projected);
  const onTarget = projected >= cls.target;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const toneColor =
    projTone === "ace"
      ? "var(--ace)"
      : projTone === "solid"
        ? "var(--solid)"
        : projTone === "risk"
          ? "var(--risk)"
          : projTone === "low"
            ? "var(--low)"
            : projTone === "danger"
              ? "var(--danger)"
              : "var(--muted)";

  return (
    <div
      className={[
        "fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-strong)]",
        "backdrop-blur-md",
        "transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
        "bg-[rgba(22,23,30,0.92)]",
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1280px] px-12 py-3 grid gap-6 items-center lg:grid-cols-[minmax(140px,auto)_1fr_auto]">
        <button className="hidden lg:flex items-center gap-2 text-left hover:opacity-70 transition-opacity" onClick={scrollTop} title="Back to top">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneColor }} />
          <span className="flex flex-col min-w-0">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)] font-semibold leading-none">
              CLASS
            </span>
            <span className="font-display italic text-[18px] leading-none truncate">{cls.name}</span>
          </span>
        </button>

        <div className="flex items-center justify-center gap-4">
          <div className="hidden sm:flex flex-col gap-1 opacity-85">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)] font-semibold">now</span>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-display text-[22px]" style={{ color: toneColor }}>
                {letterFor(current)}
              </span>
              <span className="font-mono text-[13px]">
                {fmt(current, 1)}
                <span className="text-[var(--muted)] font-normal text-[0.7em]">%</span>
              </span>
            </span>
          </div>

          <span className="hidden sm:block font-mono text-[14px] text-[var(--muted)]">→</span>

          <div className="relative px-3.5">
            <span className="absolute inset-y-0 left-0 w-px bg-[var(--accent)]" />
            <span className="absolute inset-y-0 right-0 w-px bg-[var(--accent)] opacity-35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] font-bold">PROJECTED</span>
            <div className="inline-flex items-baseline gap-2">
              <span className="font-display text-[38px]" style={{ color: toneColor }}>
                {letterFor(projected)}
              </span>
              <span className="font-mono text-[22px] font-semibold">
                {fmt(projected, 1)}
                <span className="text-[var(--muted)] font-normal text-[0.7em]">%</span>
              </span>
              <span className={["font-mono text-[10.5px] font-semibold", projected >= current ? "text-[var(--ace)]" : "text-[var(--danger)]"].join(" ")}>
                {projected >= current ? "▲" : "▼"}
                {fmt(Math.abs(projected - current), 1)}
              </span>
            </div>
          </div>

          <span className="hidden sm:block font-mono text-[14px] text-[var(--muted)] opacity-50">→</span>

          <div className="hidden sm:flex flex-col gap-1 opacity-85">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)] font-semibold">target</span>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-display italic text-[22px] text-[var(--accent)]">{letterFor(cls.target)}</span>
              <span className="font-mono text-[13px]">
                {fmt(cls.target, 0)}
                <span className="text-[var(--muted)] font-normal text-[0.7em]">%</span>
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 whitespace-nowrap lg:border-l lg:border-[var(--rule)] lg:pl-5">
          {missingCount > 0 && needed !== null && Number.isFinite(needed) && needed > 0 && needed <= 100 ? (
            <>
              <span className="font-display italic text-[26px] text-[var(--ink)]">{fmt(needed, 1)}%</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] font-semibold leading-[1.3] text-right">
                avg needed
                <br />
                on remaining
              </span>
            </>
          ) : missingCount > 0 && needed !== null && needed > 100 ? (
            <>
              <span className="font-display italic text-[26px] text-[var(--danger)]">{fmt(needed, 1)}%</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--danger)] font-semibold leading-[1.3] text-right">
                impossible
                <br />
                without EC
              </span>
            </>
          ) : missingCount > 0 && needed !== null && needed <= 0 ? (
            <>
              <span className="font-display italic text-[26px] text-[var(--ace)]">cruise</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] font-semibold leading-[1.3] text-right">
                target locked
              </span>
            </>
          ) : (
            <>
              <span className="font-display italic text-[26px]" style={{ color: onTarget ? "var(--ace)" : "var(--danger)" }}>
                {onTarget ? "✓" : "✗"}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] font-semibold leading-[1.3] text-right">
                {onTarget ? "goal hit" : `${fmt(cls.target - current, 1)} short`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
