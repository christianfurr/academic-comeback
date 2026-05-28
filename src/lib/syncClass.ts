import { uid } from "@/lib/helpers";
import type {
  Assignment,
  Category,
  ClassData,
  ParsedAssignment,
  ParsedCategory,
  ParsedCourse,
} from "@/lib/types";

const norm = (s: string) => s.trim().toLowerCase();

export type RemovedAssignment = { categoryName: string; assignmentName: string };

export type SyncDiff = {
  /** Result if the user chooses to keep stale items (no removals applied). */
  merged: ClassData;
  /** Result if the user chooses to apply removals (full sync). */
  mergedFull: ClassData;
  addedCount: number;
  updatedCount: number;
  unchangedCount: number;
  addedCategories: string[];
  removedCategories: string[];
  removedAssignments: RemovedAssignment[];
};

function parsedToAssignment(pa: ParsedAssignment): Assignment {
  return {
    id: uid(),
    name: pa.name,
    letter: pa.letter ?? null,
    date: pa.date ?? null,
    score: pa.missing ? null : (pa.score ?? null),
    total: pa.total,
    missing: !!pa.missing,
    noCount: !!pa.noCount,
    whatIf: pa.missing ? 80 : null,
  };
}

function applyUpdate(existing: Assignment, pa: ParsedAssignment): Assignment {
  const nowMissing = !!pa.missing;
  return {
    ...existing,
    name: pa.name,
    letter: pa.letter ?? existing.letter,
    date: pa.date ?? existing.date,
    score: nowMissing ? null : (pa.score ?? null),
    total: pa.total,
    missing: nowMissing,
    noCount: !!pa.noCount,
    // Keep whatIf only while still missing; clear once a real score arrives.
    whatIf: nowMissing ? (existing.whatIf ?? 80) : null,
  };
}

function assignmentsDiffer(a: Assignment, b: Assignment): boolean {
  return (
    a.score !== b.score ||
    a.total !== b.total ||
    a.missing !== b.missing ||
    a.letter !== b.letter ||
    a.date !== b.date ||
    a.noCount !== b.noCount
  );
}

type MergeResult = {
  matched: Assignment[];
  stale: Assignment[];
  added: number;
  updated: number;
  unchanged: number;
};

function mergeAssignments(existing: Assignment[], parsed: ParsedAssignment[]): MergeResult {
  const remaining = [...existing];
  const matched: Assignment[] = [];
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  const take = (pa: ParsedAssignment): Assignment | null => {
    const nameKey = norm(pa.name);
    const dateKey = pa.date ?? "";
    // Pass 1: exact name + date
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[i];
      if (norm(a.name) === nameKey && (a.date ?? "") === dateKey) {
        remaining.splice(i, 1);
        return a;
      }
    }
    // Pass 2: by name only (covers cases where date was added/changed/missing)
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[i];
      if (norm(a.name) === nameKey) {
        remaining.splice(i, 1);
        return a;
      }
    }
    return null;
  };

  for (const pa of parsed) {
    const m = take(pa);
    if (m) {
      const next = applyUpdate(m, pa);
      matched.push(next);
      if (assignmentsDiffer(m, next)) updated++;
      else unchanged++;
    } else {
      matched.push(parsedToAssignment(pa));
      added++;
    }
  }

  return { matched, stale: remaining, added, updated, unchanged };
}

export function diffClassFromParsed(current: ClassData, parsed: ParsedCourse): SyncDiff {
  const parsedByKey = new Map<string, ParsedCategory>(
    parsed.categories.map((pc) => [norm(pc.name), pc]),
  );
  const usedKeys = new Set<string>();

  const removedCategories: string[] = [];
  const removedAssignments: RemovedAssignment[] = [];

  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  type Slot = { keep: Category; drop: Category | null };
  const fromExisting: Slot[] = [];

  for (const cat of current.categories) {
    const key = norm(cat.name);
    const pc = parsedByKey.get(key);
    if (!pc) {
      removedCategories.push(cat.name);
      // In "keep" mode, the whole category survives unchanged. In "full" mode it is dropped.
      fromExisting.push({ keep: cat, drop: null });
      continue;
    }
    usedKeys.add(key);
    const { matched, stale, added, updated, unchanged } = mergeAssignments(
      cat.assignments,
      pc.assignments,
    );
    addedCount += added;
    updatedCount += updated;
    unchangedCount += unchanged;
    for (const a of stale) {
      removedAssignments.push({ categoryName: cat.name, assignmentName: a.name });
    }
    const weight = pc.weight ?? cat.weight;
    fromExisting.push({
      keep: { ...cat, weight, assignments: [...matched, ...stale] },
      drop: { ...cat, weight, assignments: matched },
    });
  }

  const addedCategories: string[] = [];
  const newCats: Category[] = [];
  for (const pc of parsed.categories) {
    if (usedKeys.has(norm(pc.name))) continue;
    addedCategories.push(pc.name);
    addedCount += pc.assignments.length;
    newCats.push({
      id: uid(),
      name: pc.name,
      weight: pc.weight ?? 0,
      assignments: pc.assignments.map(parsedToAssignment),
    });
  }

  const merged: ClassData = {
    ...current,
    categories: [...fromExisting.map((s) => s.keep), ...newCats],
  };
  const mergedFull: ClassData = {
    ...current,
    categories: [
      ...fromExisting.filter((s) => s.drop !== null).map((s) => s.drop as Category),
      ...newCats,
    ],
  };

  return {
    merged,
    mergedFull,
    addedCount,
    updatedCount,
    unchangedCount,
    addedCategories,
    removedCategories,
    removedAssignments,
  };
}

export function hasRemovals(diff: SyncDiff): boolean {
  return diff.removedCategories.length > 0 || diff.removedAssignments.length > 0;
}
