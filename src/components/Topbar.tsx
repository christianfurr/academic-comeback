"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import type { ViewMode } from "@/lib/types";

type Props = {
  hasClasses: boolean;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  onAddClass: () => void;
  onReset: () => void;
  skywardButton?: ReactNode;
  syncControl?: ReactNode;
  userMenu?: ReactNode;
};

export function Topbar({
  hasClasses,
  view,
  setView,
  onAddClass,
  onReset,
  skywardButton,
  syncControl,
  userMenu,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] py-6">
      <div className="flex items-center gap-2.5">
        <Logo size={28} className="mr-0.5" />
        <span className="font-display italic text-[22px] tracking-[-0.01em] relative top-[1px]">Comeback</span>
        <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          / academic recovery planner
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 whitespace-nowrap">
        {hasClasses ? (
          <>
            <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] p-[3px]">
              <button
                className={[
                  "px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors",
                  view === "class"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                ].join(" ")}
                onClick={() => setView("class")}
              >
                Class focus
              </button>
              <button
                className={[
                  "px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-colors",
                  view === "semester"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                ].join(" ")}
                onClick={() => setView("semester")}
              >
                Semester view
              </button>
            </div>

            <button className="btn-ghost" onClick={onAddClass}>
              + class
            </button>
            <button className="btn-ghost" onClick={onReset}>
              start over
            </button>
          </>
        ) : null}
        {skywardButton}
        {syncControl}
        {userMenu}
      </div>
    </header>
  );
}
