import { assignmentImpact, classMissing } from "@/lib/classMath";
import type { ClassData, PlanTask } from "@/lib/types";

export type PlanItem =
  | {
      kind: "assignment";
      id: string;
      title: string;
      dueDate: string | null;
      completed: false;
      impact: number;
      catId: string;
    }
  | {
      kind: "task";
      id: string;
      title: string;
      dueDate: string | null;
      completed: boolean;
      impact: null;
      catId: null;
    };

function dateValue(date: string | null): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function buildClassPlan(cls: ClassData, tasks: PlanTask[]): PlanItem[] {
  const assignmentItems: PlanItem[] = classMissing(cls).map((assignment) => ({
    kind: "assignment",
    id: assignment.id,
    title: assignment.name,
    dueDate: assignment.date,
    completed: false,
    impact: assignmentImpact(cls, assignment.catId, assignment.total),
    catId: assignment.catId,
  }));

  const customItems: PlanItem[] = tasks
    .filter((task) => task.classId === cls.id && task.title.trim())
    .map((task) => ({
      kind: "task",
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      completed: task.completed,
      impact: null,
      catId: null,
    }));

  return [...assignmentItems, ...customItems].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.kind !== b.kind) return a.kind === "assignment" ? -1 : 1;
    if (a.kind === "assignment" && b.kind === "assignment" && a.impact !== b.impact) {
      return b.impact - a.impact;
    }
    return dateValue(a.dueDate) - dateValue(b.dueDate) || a.title.localeCompare(b.title);
  });
}

export function planSummary(items: PlanItem[]): { open: number; done: number } {
  const done = items.filter((item) => item.completed).length;
  return { open: items.length - done, done };
}
