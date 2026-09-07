"use client";

import { buildClassPlan, type PlanItem } from "@/lib/planMath";
import type { ClassData, PlanTask } from "@/lib/types";
import { useMemo } from "react";

type Props = { classes: ClassData[]; tasks: PlanTask[]; onOpenClass: (id: string) => void };

export function TodayView({ classes, tasks, onOpenClass }: Props) {
  const items = useMemo(
    () => classes.flatMap((cls) => buildClassPlan(cls, tasks, true).map((item) => ({ item, cls }))),
    [classes, tasks],
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">Today / next actions</div>
        <h2 className="font-display text-[clamp(32px,5vw,54px)] leading-[1.05] tracking-[-0.02em]">Make the next hour count.</h2>
        <p className="mt-2 max-w-[620px] text-[14.5px] leading-[1.5] text-[var(--muted)]">Start with work that is due soon or moves a grade the most.</p>
      </div>
      {items.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] px-6 py-8 font-display italic text-[20px] text-[var(--muted)]">Nothing urgent is on your list today.</div>
      ) : (
        <div className="border border-[var(--border)] bg-[var(--card)]">
          {items.map(({ item, cls }, index) => <TodayRow key={`${cls.id}:${item.id}`} item={item} cls={cls} index={index} onOpen={() => onOpenClass(cls.id)} />)}
        </div>
      )}
    </div>
  );
}

function TodayRow({ item, cls, index, onOpen }: { item: PlanItem; cls: ClassData; index: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="grid w-full items-center gap-3 border-b border-[var(--rule)] px-5 py-4 text-left last:border-b-0 hover:bg-[var(--card-2)] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[var(--accent)] sm:grid-cols-[36px_minmax(0,1fr)_140px_100px]">
      <span className="font-mono text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0">
        <span className="block truncate font-display italic text-[20px]">{item.title}</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{cls.name} · {item.kind === "assignment" ? `${item.impact?.toFixed(1)} grade points` : `${item.effort} min`}</span>
      </span>
      <span className="font-mono text-[11px] text-[var(--muted)]">{item.dueDate ?? "No date"}</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">open class</span>
    </button>
  );
}
