"use client";

import { parseGradeData } from "@/lib/parser";
import { diffClassFromParsed, hasRemovals, type SyncDiff } from "@/lib/syncClass";
import type { ClassData } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  cls: ClassData;
  onClose: () => void;
  onApply: (next: ClassData) => void;
};

type Stage = "paste" | "confirm";

export function SyncClassModal({ cls, onClose, onApply }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [multiWarning, setMultiWarning] = useState<string | null>(null);
  const [diff, setDiff] = useState<SyncDiff | null>(null);
  const [stage, setStage] = useState<Stage>("paste");

  const computeDiff = (): SyncDiff | null => {
    const parsed = parseGradeData(text);
    if (!parsed || parsed.length === 0) {
      setError("Couldn't read that. Try pasting tab-separated rows from your portal.");
      return null;
    }
    if (parsed.length > 1) {
      setMultiWarning(
        `Found ${parsed.length} classes in this paste — only the first was used. To import the others, use “Add class”.`,
      );
    } else {
      setMultiWarning(null);
    }
    setError(null);
    return diffClassFromParsed(cls, parsed[0]);
  };

  const handleSync = () => {
    const d = computeDiff();
    if (!d) return;
    if (hasRemovals(d)) {
      setDiff(d);
      setStage("confirm");
      return;
    }
    onApply(d.merged);
  };

  const handleKeepStale = () => {
    if (diff) onApply(diff.merged);
  };

  const handleRemoveStale = () => {
    if (diff) onApply(diff.mergedFull);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(24,21,19,0.45)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] max-h-[90vh] overflow-hidden border border-[var(--ink)] bg-[var(--bg)] shadow-[8px_8px_0_var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] px-7 py-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold mb-1">
              ⟳ Sync from paste
            </div>
            <h3 className="font-display italic text-[28px] leading-[1.1] tracking-[-0.01em]">
              Update <span className="not-italic font-semibold">{cls.name}</span> from your portal
            </h3>
          </div>
          <button
            className="text-[26px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)] rounded w-8 h-8"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {stage === "paste" ? (
          <PasteStage
            text={text}
            setText={(v) => {
              setText(v);
              setError(null);
            }}
            error={error}
            multiWarning={multiWarning}
            onCancel={onClose}
            onSubmit={handleSync}
          />
        ) : (
          <ConfirmStage
            diff={diff!}
            onCancel={() => setStage("paste")}
            onKeep={handleKeepStale}
            onRemove={handleRemoveStale}
          />
        )}
      </div>
    </div>
  );
}

function PasteStage({
  text,
  setText,
  error,
  multiWarning,
  onCancel,
  onSubmit,
}: {
  text: string;
  setText: (v: string) => void;
  error: string | null;
  multiWarning: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="px-7 py-6 overflow-y-auto flex flex-col gap-4">
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          Paste fresh grade data from Skyward (or any portal). Existing assignments match by name and
          update in place; new ones get added. Your target % and what-ifs on still-missing work stay
          put.
        </p>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
            Paste grade data
          </span>
          <textarea
            className="min-h-[180px] resize-y px-3 py-3 border border-[var(--border)] bg-[var(--card)] rounded font-mono text-[12px] leading-[1.6]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Tests\nweighted at 40%\n09/15/25\tUnit 1 Test\tC+\t\t78 out of 100\n…`}
            spellCheck={false}
            autoFocus
          />
          {error ? <div className="font-mono text-[12px] text-[var(--danger)]">{error}</div> : null}
          {multiWarning ? (
            <div className="font-mono text-[12px] text-[var(--muted)]">{multiWarning}</div>
          ) : null}
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-[var(--rule)] px-7 py-4">
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={onSubmit} disabled={!text.trim()}>
          <span>Sync</span>
          <span className="font-mono">→</span>
        </button>
      </div>
    </>
  );
}

function ConfirmStage({
  diff,
  onCancel,
  onKeep,
  onRemove,
}: {
  diff: SyncDiff;
  onCancel: () => void;
  onKeep: () => void;
  onRemove: () => void;
}) {
  const removedCount = diff.removedAssignments.length;
  const removedCatCount = diff.removedCategories.length;
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (diff.addedCount) parts.push(`${diff.addedCount} added`);
    if (diff.updatedCount) parts.push(`${diff.updatedCount} updated`);
    if (diff.unchangedCount) parts.push(`${diff.unchangedCount} unchanged`);
    return parts.join(" · ");
  }, [diff]);

  return (
    <>
      <div className="px-7 py-6 overflow-y-auto flex flex-col gap-5 max-h-[60vh]">
        {summary ? (
          <div className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--muted)]">
            {summary}
          </div>
        ) : null}

        <div className="border border-[var(--border)] bg-[var(--card)] px-4 py-3 rounded">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--danger)] font-semibold mb-2">
            Missing from this paste
          </div>
          <p className="text-[13px] text-[var(--ink)] leading-relaxed mb-3">
            {removedCatCount > 0 && removedCount > 0
              ? `${removedCatCount} ${removedCatCount === 1 ? "category" : "categories"} and ${removedCount} ${removedCount === 1 ? "assignment" : "assignments"} in this class aren't in the paste.`
              : removedCatCount > 0
                ? `${removedCatCount} ${removedCatCount === 1 ? "category" : "categories"} in this class ${removedCatCount === 1 ? "isn't" : "aren't"} in the paste.`
                : `${removedCount} ${removedCount === 1 ? "assignment" : "assignments"} in this class ${removedCount === 1 ? "isn't" : "aren't"} in the paste.`}{" "}
            Remove them, or keep them?
          </p>

          {diff.removedCategories.length > 0 ? (
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--muted)] mb-1">
                Categories
              </div>
              <ul className="text-[13px] leading-[1.6]">
                {diff.removedCategories.map((n) => (
                  <li key={n} className="flex items-baseline gap-2">
                    <span className="text-[var(--danger)] font-mono">–</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {diff.removedAssignments.length > 0 ? (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--muted)] mb-1">
                Assignments
              </div>
              <ul className="text-[13px] leading-[1.6]">
                {diff.removedAssignments.map((a, i) => (
                  <li key={`${a.categoryName}-${a.assignmentName}-${i}`} className="flex items-baseline gap-2">
                    <span className="text-[var(--danger)] font-mono">–</span>
                    <span>
                      <span className="text-[var(--muted)]">{a.categoryName}:</span> {a.assignmentName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--rule)] px-7 py-4">
        <button className="btn-ghost" onClick={onCancel}>
          Back
        </button>
        <button className="btn-ghost" onClick={onKeep}>
          Keep them
        </button>
        <button className="btn-primary" onClick={onRemove}>
          <span>Remove them</span>
          <span className="font-mono">→</span>
        </button>
      </div>
    </>
  );
}
