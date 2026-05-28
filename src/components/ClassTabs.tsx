"use client";

import { SourceBadge } from "@/components/SourceBadge";
import { classProjected } from "@/lib/classMath";
import { fmt, gradeTone, letterFor } from "@/lib/helpers";
import type { ClassData } from "@/lib/types";

type Props = {
  classes: ClassData[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function ClassTabs({ classes, activeId, onSelect, onAdd }: Props) {
  return (
    <div>
      <div className="h-px bg-[var(--rule)] mb-3" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {classes.map((c) => {
          const pct = classProjected(c);
          const tone = gradeTone(pct);
          const onTrack = pct >= c.target;
          const isActive = c.id === activeId;

          return (
            <button
              key={c.id}
              className={[
                "min-w-[240px] flex shrink-0 items-center gap-3 px-4 py-3 border transition-colors text-left",
                isActive
                  ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]"
                  : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--ink)]",
              ].join(" ")}
              onClick={() => onSelect(c.id)}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background:
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
                              : "var(--muted)",
                }}
              />
              <span className="min-w-0 flex flex-col gap-1.5">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-display italic text-[18px] leading-none truncate">{c.name}</span>
                  <SourceBadge
                    source={c.source}
                    lastSyncedAt={c.lastSyncedAt}
                    variant="tab"
                    inverted={isActive}
                  />
                </span>
                <span className="flex items-center gap-2 text-[12px]">
                  <span className="font-mono text-[11px] font-semibold">{letterFor(pct)}</span>
                  <span className={["font-mono text-[11px]", isActive ? "text-[var(--muted-soft)]" : "text-[var(--muted)]"].join(" ")}>
                    {fmt(pct, 1)}%
                  </span>
                  <span
                    className={[
                      "text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded",
                      onTrack
                        ? isActive
                          ? "bg-[rgba(29,107,57,0.25)] text-[#b5e6c4]"
                          : "bg-[color:rgba(29,107,57,0.10)] text-[var(--ace)]"
                        : isActive
                          ? "bg-[rgba(184,113,8,0.25)] text-[#f5d188]"
                          : "bg-[color:rgba(184,113,8,0.10)] text-[var(--risk)]",
                    ].join(" ")}
                  >
                    {onTrack ? "on track" : `→ ${fmt(c.target, 0)}%`}
                  </span>
                </span>
              </span>
            </button>
          );
        })}

        <button
          className="min-w-[240px] flex shrink-0 items-center gap-3 px-4 py-3 border border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
          onClick={onAdd}
        >
          <span className="text-[18px] leading-none text-[var(--accent)]">+</span>
          <span className="flex flex-col gap-1.5 text-left">
            <span className="font-display italic text-[18px] leading-none">Add class</span>
            <span className="text-[12px] text-[var(--muted)]">paste or blank</span>
          </span>
        </button>
      </div>
    </div>
  );
}

