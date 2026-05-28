"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(24,21,19,0.45)] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[440px] border border-[var(--ink)] bg-[var(--bg)] shadow-[8px_8px_0_var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 py-6 border-b border-[var(--rule)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
            Confirm
          </div>
          <div className="font-display italic text-[26px] leading-[1.1]">{title}</div>
        </div>
        <div className="px-7 py-5 text-[14px] leading-[1.55] text-[var(--ink-soft)]">{body}</div>
        <div className="px-7 py-5 border-t border-[var(--rule)] flex flex-wrap items-center justify-end gap-3">
          <button className="btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            style={destructive ? { background: "var(--danger)", color: "var(--bg)" } : undefined}
          >
            <span>{confirmLabel}</span>
            <span className="font-mono">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
