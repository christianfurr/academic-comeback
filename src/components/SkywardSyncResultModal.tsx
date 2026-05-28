"use client";

import { useMemo, useState } from "react";
import type { SkywardSyncReview } from "@/hooks/useSkywardSync";

type Props = {
  review: SkywardSyncReview;
  onCancel: () => void;
  onApply: (params: {
    removeStaleClassIds: Set<string>;
    addCourseIndexes: Set<number>;
  }) => void;
};

export function SkywardSyncResultModal({ review, onCancel, onApply }: Props) {
  const [removeIds, setRemoveIds] = useState<Set<string>>(() => new Set());
  const [addIdx, setAddIdx] = useState<Set<number>>(() => {
    // default: pre-select all new classes (user expects fresh setup to come in)
    const s = new Set<number>();
    for (let i = 0; i < review.unmatched.length; i++) s.add(i);
    return s;
  });

  const headline = useMemo(() => {
    const parts: string[] = [];
    if (review.summary.classesUpdated)
      parts.push(`${review.summary.classesUpdated} class${review.summary.classesUpdated === 1 ? "" : "es"} updated`);
    if (review.summary.added) parts.push(`${review.summary.added} added`);
    if (review.summary.updated) parts.push(`${review.summary.updated} score update${review.summary.updated === 1 ? "" : "s"}`);
    return parts.join(" · ");
  }, [review.summary]);

  const toggleRemove = (id: string) =>
    setRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAdd = (i: number) =>
    setAddIdx((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(24,21,19,0.45)] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[680px] max-h-[90vh] overflow-hidden border border-[var(--ink)] bg-[var(--bg)] shadow-[8px_8px_0_var(--ink)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] px-7 py-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold mb-1">
              ⟳ Synced from Skyward
            </div>
            <h3 className="font-display italic text-[28px] leading-[1.1] tracking-[-0.01em]">
              Review changes
            </h3>
            {headline ? (
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--muted)]">
                {headline}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="text-[26px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)] rounded w-8 h-8"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {review.unmatched.length > 0 ? (
            <section className="border border-[var(--border)] bg-[var(--card)] px-4 py-3 rounded">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--accent)] font-semibold mb-2">
                New in Skyward — add to tracker
              </div>
              <ul className="text-[13px] leading-[1.7]">
                {review.unmatched.map((c, i) => (
                  <li key={c.name + i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`add-${i}`}
                      checked={addIdx.has(i)}
                      onChange={() => toggleAdd(i)}
                      className="accent-[var(--accent)]"
                    />
                    <label htmlFor={`add-${i}`} className="cursor-pointer flex-1">
                      <span className="font-medium">{c.name}</span>{" "}
                      <span className="text-[var(--muted)] font-mono text-[11px]">
                        {c.categories.length} categor{c.categories.length === 1 ? "y" : "ies"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {review.removals.length > 0 ? (
            <section className="border border-[var(--border)] bg-[var(--card)] px-4 py-3 rounded">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--danger)] font-semibold mb-2">
                Missing from Skyward
              </div>
              <p className="text-[12.5px] text-[var(--ink-soft)] leading-relaxed mb-3">
                These exist in Comeback but weren&apos;t in this Skyward pull. Check the box to drop them.
              </p>
              <ul className="text-[13px] leading-[1.6] flex flex-col gap-3">
                {review.removals.map((g) => (
                  <li key={g.classId} className="border-t border-[var(--rule)] pt-3 first:border-t-0 first:pt-0">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeIds.has(g.classId)}
                        onChange={() => toggleRemove(g.classId)}
                        className="mt-1 accent-[var(--accent)]"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{g.className}</div>
                        {g.diff.removedCategories.length > 0 ? (
                          <div className="mt-1">
                            <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--muted)]">
                              Categories
                            </div>
                            <ul>
                              {g.diff.removedCategories.map((n) => (
                                <li key={n} className="text-[12.5px]">
                                  <span className="text-[var(--danger)] font-mono">–</span> {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {g.diff.removedAssignments.length > 0 ? (
                          <div className="mt-1">
                            <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--muted)]">
                              Assignments
                            </div>
                            <ul>
                              {g.diff.removedAssignments.map((a, i) => (
                                <li key={`${a.categoryName}-${a.assignmentName}-${i}`} className="text-[12.5px]">
                                  <span className="text-[var(--danger)] font-mono">–</span>{" "}
                                  <span className="text-[var(--muted)]">{a.categoryName}:</span>{" "}
                                  {a.assignmentName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {review.errors.length > 0 ? (
            <section className="border border-[var(--border)] bg-[var(--card)] px-4 py-3 rounded">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--danger)] font-semibold mb-2">
                Couldn&apos;t load
              </div>
              <ul className="text-[12.5px] leading-[1.6]">
                {review.errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium">{e.className}</span>{" "}
                    <span className="text-[var(--muted)]">— {e.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--rule)] px-7 py-4">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onApply({ removeStaleClassIds: removeIds, addCourseIndexes: addIdx })}
          >
            <span>Apply</span>
            <span className="font-mono">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
