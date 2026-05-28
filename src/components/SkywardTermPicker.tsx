"use client";

import { useEffect, useRef, useState } from "react";
import type { SkywardTerm } from "@/lib/syncPrefs";

const TERMS: SkywardTerm[] = ["Q1", "Q2", "Q3", "Q4"];

type Props = {
  value: SkywardTerm;
  onChange: (term: SkywardTerm) => void;
  disabled?: boolean;
};

export function SkywardTermPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] hover:bg-[var(--card-2)] disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Skyward term to sync"
      >
        <span className="text-[var(--muted)]">term</span>
        <span className="text-[var(--ink-soft)] font-semibold">{value}</span>
        <span className="text-[var(--muted)] text-[9px]">▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[140px] border border-[var(--ink)] bg-[var(--bg)] shadow-[6px_6px_0_var(--ink)] py-1"
        >
          {TERMS.map((t) => (
            <button
              key={t}
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={[
                "w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--card-2)] flex items-center justify-between",
                t === value ? "text-[var(--ink)] font-semibold" : "text-[var(--ink-soft)]",
              ].join(" ")}
            >
              <span>{t}</span>
              {t === value ? <span className="font-mono text-[10px] text-[var(--accent)]">●</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
