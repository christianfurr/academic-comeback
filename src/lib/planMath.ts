import { assignmentImpact, classMissing } from "@/lib/classMath";
import type { AssignmentStatus, ClassData, PlanTask } from "@/lib/types";

export type PlanItem =
  | {
      kind: "assignment";
      id: string;
      title: string;
      dueDate: string | null;
      completed: false;
      impact: number;
      catId: string;
      status: AssignmentStatus;
      effort: PlanTask["effort"];
    }
  | {
      kind: "task";
      id: string;
      title: string;
      dueDate: string | null;
      completed: boolean;
      impact: null;
      catId: null;
      status: null;
      effort: PlanTask["effort"];
    };

function dateValue(date: string | null): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const normalized = /^\d{2}\/\d{2}\/\d{2,4}$/.test(date)
    ? date.replace(/^(\d{2})\/(\d{2})\/(\d{2,4})$/, "$3-$1-$2")
    : date;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function buildClassPlan(cls: ClassData, tasks: PlanTask[], todayOnly = false): PlanItem[] {
  const assignmentItems: PlanItem[] = classMissing(cls).map((assignment) => ({
    kind: "assignment",
    id: assignment.id,
    title: assignment.name,
    dueDate: assignment.date,
    completed: false,
    impact: assignmentImpact(cls, assignment.catId, assignment.total),
    catId: assignment.catId,
    status: assignment.status ?? "not-started",
    effort: 30,
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
      status: null,
      effort: task.effort ?? 30,
    }));

  const items = [...assignmentItems, ...customItems];
  const filtered = todayOnly
    ? items.filter((item) => !item.completed && (!item.dueDate || dateValue(item.dueDate) <= Date.now() + 86400000))
    : items;
  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.status !== b.status) return a.status === "in-progress" ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === "assignment" ? -1 : 1;
    if (a.kind === "assignment" && b.kind === "assignment" && a.impact !== b.impact) {
      return b.impact - a.impact;
    }
    return dateValue(a.dueDate) - dateValue(b.dueDate) || a.effort - b.effort || a.title.localeCompare(b.title);
  });
}

export function planSummary(items: PlanItem[]): { open: number; done: number } {
  const done = items.filter((item) => item.completed).length;
  return { open: items.length - done, done };
}
