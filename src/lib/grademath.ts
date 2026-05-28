import type { Category } from "@/lib/types";

export type CategoryStats = {
  earned: number;
  possible: number;
  pct: number | null;
};

export function categoryStats(cat: Category): CategoryStats {
  let earned = 0;
  let possible = 0;
  for (const a of cat.assignments) {
    if (a.noCount) continue;
    if (a.missing) {
      possible += a.total;
      continue;
    }
    if (a.score === null || a.total === 0) continue;
    earned += a.score;
    possible += a.total;
  }
  const pct = possible > 0 ? (earned / possible) * 100 : null;
  return { earned, possible, pct };
}

export function categoryStatsProjected(cat: Category): CategoryStats {
  let earned = 0;
  let possible = 0;
  for (const a of cat.assignments) {
    if (a.noCount) continue;
    if (a.missing) {
      const wi = a.whatIf ?? 0;
      earned += (wi / 100) * a.total;
      possible += a.total;
      continue;
    }
    if (a.score === null || a.total === 0) continue;
    earned += a.score;
    possible += a.total;
  }
  const pct = possible > 0 ? (earned / possible) * 100 : null;
  return { earned, possible, pct };
}

export function computeGrade(categories: Category[]): { overall: number; totalWeight: number } {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const cat of categories) {
    const { pct } = categoryStats(cat);
    if (pct === null) continue;
    weightedSum += (pct / 100) * cat.weight;
    totalWeight += cat.weight;
  }
  const overall = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  return { overall, totalWeight };
}

export function computeProjected(categories: Category[]): { overall: number; totalWeight: number } {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const cat of categories) {
    const { pct } = categoryStatsProjected(cat);
    if (pct === null) continue;
    weightedSum += (pct / 100) * cat.weight;
    totalWeight += cat.weight;
  }
  const overall = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  return { overall, totalWeight };
}

/**
 * What you need: assume all missing assignments get the same percentage p,
 * solve for p that lands you at `target`.
 */
export function computeNeeded(categories: Category[], target: number): number | null {
  const totalWeight = categories.reduce((s, c) => s + (c.weight || 0), 0);
  if (totalWeight === 0) return null;

  const cats = categories.map((c) => {
    let earned = 0;
    let possible = 0;
    let missingTotal = 0;
    for (const a of c.assignments) {
      if (a.noCount) continue;
      if (a.missing) missingTotal += a.total;
      else if (a.score !== null && a.total > 0) {
        earned += a.score;
        possible += a.total;
      }
    }
    return { weight: c.weight || 0, earned, possible, missingTotal };
  });

  let A = 0;
  let B = 0;
  for (const c of cats) {
    const denom = c.possible + c.missingTotal;
    if (denom === 0) continue;
    A += (c.weight * c.missingTotal) / denom;
    B += (c.weight * c.earned) / denom;
  }

  const targetSum = (target / 100) * totalWeight;
  if (A === 0) return null;
  return ((targetSum - B) / A) * 100;
}

