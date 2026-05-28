"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import { newBlankClass } from "@/lib/normalize";
import { diffClassFromParsed, hasRemovals, type SyncDiff } from "@/lib/syncClass";
import type { ClassData, ParsedCourse } from "@/lib/types";

const norm = (s: string) => s.trim().toLowerCase();

type ClassMeta = {
  name: string;
  currentTerm: string | null;
  letter: string | null;
  percent: number | null;
};

export type RemovalGroup = {
  classId: string;
  className: string;
  /** Pre-computed result of dropping stale items. */
  mergedFull: ClassData;
  /** Pre-computed result of keeping stale items (also already in draft). */
  merged: ClassData;
  diff: SyncDiff;
};

export type SkywardSyncReview = {
  /** Snapshot with auto-applied add/update merges (stale items kept) per class. */
  draft: ClassData[];
  /** Subset of draft entries that have removals the user must confirm. */
  removals: RemovalGroup[];
  /** Skyward classes not currently in the tracker. */
  unmatched: ParsedCourse[];
  summary: {
    classesUpdated: number;
    added: number;
    updated: number;
  };
  errors: { className: string; message: string }[];
  classMeta: ClassMeta[];
};

export type SkywardSyncState =
  | { kind: "idle" }
  | { kind: "syncing" }
  | {
      kind: "error";
      reason: "no-credentials" | "auth" | "network" | "scrape" | "config" | "unknown";
      message?: string;
    }
  | { kind: "review"; review: SkywardSyncReview };

function matchCourseToClass(course: ParsedCourse, classes: ClassData[]): ClassData | null {
  const cn = norm(course.name);
  if (!cn) return null;
  // exact name first
  for (const c of classes) {
    if (norm(c.name) === cn) return c;
  }
  // bidirectional substring (Skyward names tend to be all caps / abbreviated)
  for (const c of classes) {
    const local = norm(c.name);
    if (local.includes(cn) || cn.includes(local)) return c;
  }
  return null;
}

type Options = {
  classes: ClassData[];
  applyClasses: (next: ClassData[]) => void;
};

export function useSkywardSync({ classes, applyClasses }: Options) {
  const runSync = useAction(api.skyward.syncFromSkyward);
  const [state, setState] = useState<SkywardSyncState>({ kind: "idle" });

  const sync = useCallback(async (term?: string, targetClassName?: string) => {
    setState({ kind: "syncing" });
    let result;
    try {
      const args: { term?: string; targetClassName?: string } = {};
      if (term) args.term = term;
      if (targetClassName) args.targetClassName = targetClassName;
      result = await runSync(args);
    } catch (e: unknown) {
      setState({
        kind: "error",
        reason: "unknown",
        message: e instanceof Error ? e.message : String(e),
      });
      return;
    }

    if (!result.ok) {
      setState({ kind: "error", reason: result.reason, message: result.message });
      return;
    }

    const review = buildReview(classes, result.courses, result.classMeta, result.errors);

    if (
      review.removals.length === 0 &&
      review.unmatched.length === 0 &&
      review.errors.length === 0
    ) {
      applyClasses(review.draft);
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "review", review });
  }, [runSync, classes, applyClasses]);

  const cancelReview = useCallback(() => {
    setState({ kind: "idle" });
  }, []);

  /**
   * Apply the user's choices from the review modal.
   * - removeStaleClassIds: set of classIds where user chose "Remove them"
   * - addCourseIndexes: indexes into review.unmatched for unmatched courses the user wants to add
   */
  const applyReview = useCallback(
    (params: {
      removeStaleClassIds: Set<string>;
      addCourseIndexes: Set<number>;
    }) => {
      setState((prev) => {
        if (prev.kind !== "review") return prev;
        const { review } = prev;
        const now = Date.now();
        let next = review.draft.map((c) => {
          if (!params.removeStaleClassIds.has(c.id)) return c;
          const r = review.removals.find((g) => g.classId === c.id);
          return r
            ? { ...r.mergedFull, source: "skyward" as const, lastSyncedAt: now }
            : c;
        });
        for (const i of params.addCourseIndexes) {
          const course = review.unmatched[i];
          if (!course) continue;
          const cls = newBlankClass(course.name);
          cls.categories = course.categories.map((cat) => ({
            id: cls.id + ":cat:" + cat.name,
            name: cat.name,
            weight: cat.weight ?? 0,
            assignments: cat.assignments.map((a, ai) => ({
              id: cls.id + ":a:" + cat.name + ":" + ai,
              name: a.name,
              letter: a.letter ?? null,
              date: a.date ?? null,
              score: a.missing ? null : (a.score ?? null),
              total: a.total,
              missing: !!a.missing,
              noCount: !!a.noCount,
              whatIf: a.missing ? 80 : null,
            })),
          }));
          cls.source = "skyward";
          cls.lastSyncedAt = now;
          next = [...next, cls];
        }
        applyClasses(next);
        return { kind: "idle" };
      });
    },
    [applyClasses],
  );

  return { state, sync, cancelReview, applyReview };
}

function buildReview(
  classes: ClassData[],
  courses: ParsedCourse[],
  classMeta: ClassMeta[],
  errors: { className: string; message: string }[],
): SkywardSyncReview {
  const draft: ClassData[] = [...classes];
  const removals: RemovalGroup[] = [];
  const unmatched: ParsedCourse[] = [];
  const now = Date.now();
  let added = 0;
  let updated = 0;
  let classesUpdated = 0;

  for (const course of courses) {
    const existing = matchCourseToClass(course, draft);
    if (!existing) {
      unmatched.push(course);
      continue;
    }
    const diff = diffClassFromParsed(existing, course);
    const tagged: ClassData = {
      ...diff.merged,
      source: "skyward",
      lastSyncedAt: now,
    };
    const idx = draft.findIndex((c) => c.id === existing.id);
    if (idx >= 0) draft[idx] = tagged;
    added += diff.addedCount;
    updated += diff.updatedCount;
    if (diff.addedCount + diff.updatedCount > 0) classesUpdated++;
    if (hasRemovals(diff)) {
      removals.push({
        classId: existing.id,
        className: existing.name,
        merged: tagged,
        mergedFull: diff.mergedFull,
        diff,
      });
    }
  }

  return {
    draft,
    removals,
    unmatched,
    summary: { added, updated, classesUpdated },
    errors,
    classMeta,
  };
}
