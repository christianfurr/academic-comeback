"use client";

import { parseGradeData } from "@/lib/parser";
import { SAMPLE_GRADES } from "@/lib/samples";
import type { ParsedCourse } from "@/lib/types";
import { useState } from "react";

type Props = {
  onClose: () => void;
  onAddParsed: (courses: ParsedCourse[], optionalSingleName?: string) => void;
  onAddBlank: (name?: string) => void;
};

export function AddClassModal({ onClose, onAddParsed, onAddBlank }: Props) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"paste" | "blank">("paste");

  const submit = () => {
    if (mode === "blank") {
      onAddBlank(name || undefined);
      return;
    }
    const parsed = parseGradeData(text);
    if (!parsed || parsed.length === 0) {
      setError("Couldn't read that. Try pasting tab-separated rows, or start blank.");
      return;
    }
    onAddParsed(parsed, name || undefined);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(24,21,19,0.45)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[640px] max-h-[90vh] overflow-hidden border border-[var(--ink)] bg-[var(--bg)] shadow-[8px_8px_0_var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] px-7 py-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold mb-1">
              + Adding another class
            </div>
            <h3 className="font-display italic text-[32px] leading-[1.05] tracking-[-0.01em]">
              What are we climbing back from?
            </h3>
          </div>
          <button className="text-[26px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)] rounded w-8 h-8" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="flex border-b border-[var(--rule)]">
          <button
            className={[
              "flex-1 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors",
              mode === "paste" ? "text-[var(--ink)] border-b-[var(--accent)]" : "text-[var(--muted)] border-b-transparent hover:text-[var(--ink)]",
            ].join(" ")}
            onClick={() => setMode("paste")}
          >
            Paste from portal
          </button>
          <button
            className={[
              "flex-1 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors",
              mode === "blank" ? "text-[var(--ink)] border-b-[var(--accent)]" : "text-[var(--muted)] border-b-transparent hover:text-[var(--ink)]",
            ].join(" ")}
            onClick={() => setMode("blank")}
          >
            Start blank
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
              Class name <span className="text-[var(--muted)] font-normal">(optional)</span>
            </span>
            <input
              className="px-3 py-2 border border-[var(--border)] bg-[var(--card)] text-[14px] rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AP Physics"
            />
          </label>

          {mode === "paste" ? (
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
                Paste grade data
              </span>
              <textarea
                className="min-h-[160px] resize-y px-3 py-3 border border-[var(--border)] bg-[var(--card)] rounded font-mono text-[12px] leading-[1.6]"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                }}
                placeholder={`Tests\nweighted at 40%\n09/15/25\tUnit 1 Test\tC+\t\t78 out of 100\n…`}
                spellCheck={false}
              />
              {error ? <div className="font-mono text-[12px] text-[var(--danger)]">{error}</div> : null}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-[var(--muted)]">samples:</span>
                {Object.keys(SAMPLE_GRADES).map((k) => (
                  <button
                    key={k}
                    className="chip"
                    onClick={() => setText(SAMPLE_GRADES[k] ?? "")}
                    type="button"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </label>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--rule)] px-7 py-4">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={mode === "paste" && !text.trim()}>
            <span>Add class</span>
            <span className="font-mono">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

