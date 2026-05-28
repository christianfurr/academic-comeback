import { computeGrade, computeNeeded, computeProjected } from "@/lib/grademath";
import type { Assignment, ClassData } from "@/lib/types";

export function classCurrent(cls: ClassData): number {
  return computeGrade(cls.categories).overall;
}

export function classProjected(cls: ClassData): number {
  return computeProjected(cls.categories).overall;
}

export function classNeeded(cls: ClassData): number | null {
  return computeNeeded(cls.categories, cls.target);
}

export type MissingAssignment = Assignment & {
  catId: string;
  catName: string;
  catWeight: number;
};

export function classMissing(cls: ClassData): MissingAssignment[] {
  const out: MissingAssignment[] = [];
  for (const cat of cls.categories) {
    for (const a of cat.assignments) {
      if (a.missing) out.push({ ...a, catId: cat.id, catName: cat.name, catWeight: cat.weight });
    }
  }
  return out;
}

export function assignmentImpact(
  cls: ClassData,
  catId: string,
  total: number,
): number {
  const cat = cls.categories.find((c) => c.id === catId);
  if (!cat) return 0;
  const totalPossible = cat.assignments.reduce((s, x) => (x.noCount ? s : s + x.total), 0);
  if (totalPossible === 0) return 0;
  return (cat.weight * total) / totalPossible;
}

