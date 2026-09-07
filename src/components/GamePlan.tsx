"use client";

import { EditableText } from "@/components/primitives/EditableText";
import { buildClassPlan, planSummary, type PlanItem } from "@/lib/planMath";
import { uid } from "@/lib/helpers";
import { computeProjected } from "@/lib/grademath";
import type { AssignmentStatus, ClassData, PlanTask } from "@/lib/types";
import { useMemo, useState } from "react";

type Props = {
  cls: ClassData;
  tasks: PlanTask[];
  onTasksChange: (tasks: PlanTask[]) => void;
  onClassChange: (cls: ClassData) => void;
};

function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  const normalized = /^\d{2}\/\d{2}\/\d{2,4}$/.test(date)
    ? date.replace(/^(\d{2})\/(\d{2})\/(\d{2,4})$/, "$3-$1-$2")
    : date;
  const parsed = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function GamePlan({ cls, tasks, onTasksChange, onClassChange }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [effort, setEffort] = useState<PlanTask["effort"]>(30);
  const items = useMemo(() => buildClassPlan(cls, tasks), [cls, tasks]);
  const summary = planSummary(items);
  const customTasks = tasks.filter((task) => task.classId === cls.id);

  const addTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onTasksChange([
      ...tasks,
      { id: uid(), classId: cls.id, title: trimmed, dueDate: dueDate || null, completed: false, effort },
    ]);
    setTitle("");
    setDueDate("");
    setEffort(30);
  };

  const updateTask = (id: string, patch: Partial<PlanTask>) =>
    onTasksChange(tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)));

  const removeTask = (id: string) => onTasksChange(tasks.filter((task) => task.id !== id));

  const focusAssignment = (id: string) => {
    document.querySelector(`[data-assignment-id="${CSS.escape(id)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const updateAssignmentStatus = (id: string, status: AssignmentStatus) => {
    onClassChange({
      ...cls,
      categories: cls.categories.map((category) => ({
        ...category,
        assignments: category.assignments.map((assignment) =>
          assignment.id === id ? { ...assignment, status } : assignment,
        ),
      })),
    });
  };

  const scenarioGrade = (score: number) =>
    computeProjected(
      cls.categories.map((category) => ({
        ...category,
        assignments: category.assignments.map((assignment) =>
          assignment.missing ? { ...assignment, whatIf: score } : assignment,
        ),
      })),
    ).overall;

  const copyTeacherChecklist = async () => {
    const missing = items.filter((item) => item.kind === "assignment").slice(0, 8);
    const lines = [
      `Questions about ${cls.name}`,
      `Target: ${cls.target}%`,
      "",
      "Could we talk through these items?",
      ...missing.map((item) => `- ${item.title}`),
      "",
      "Are retakes, corrections, extra credit, or extensions available?",
    ];
    await navigator.clipboard?.writeText(lines.join("\n"));
  };

  return (
    <section className="border-t border-[var(--rule)] pt-7" aria-labelledby="game-plan-title">
      <div className="flex flex-wrap items-start justify-between gap-5 mb-5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] font-semibold mb-2">
            02 / The game plan
          </div>
          <h3 id="game-plan-title" className="font-display text-[clamp(28px,4vw,40px)] leading-[1.25] tracking-[-0.015em]">
            Know what to do next.
          </h3>
          <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)] max-w-[640px]">
            Finish the highest-impact work first, then keep your own promises visible.
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
          {summary.open} open · {summary.done} done
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] px-5 py-6 text-[14px] text-[var(--muted)]">
          Your plan is clear. Add a task below if you want to protect time for studying.
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[var(--card)]">
          {items.map((item, index) => (
            <PlanRow
              key={`${item.kind}-${item.id}`}
              item={item}
              index={index}
              onToggle={() => item.kind === "task" && updateTask(item.id, { completed: !item.completed })}
              onEdit={(value) => item.kind === "task" && updateTask(item.id, { title: value })}
              onDelete={() => item.kind === "task" && removeTask(item.id)}
              onOpen={() => item.kind === "assignment" && focusAssignment(item.id)}
              onStatusChange={(status) => item.kind === "assignment" && updateAssignmentStatus(item.id, status)}
            />
          ))}
        </div>
      )}

      <form
        className="mt-3 flex flex-col gap-2 border border-[var(--border)] bg-[var(--card-2)] p-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          addTask();
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 border-b border-[var(--border-strong)] bg-transparent px-2 py-2 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="Add a study task"
          aria-label="New study task"
          maxLength={120}
        />
        <label className="flex items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
          due
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="bg-transparent text-[12px] normal-case tracking-normal text-[var(--ink)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
            aria-label="Task due date"
          />
        </label>
        <button type="submit" className="btn-ghost whitespace-nowrap" disabled={!title.trim()}>
          + add task
        </button>
        <select
          value={effort}
          onChange={(event) => setEffort(Number(event.target.value) as PlanTask["effort"])}
          className="bg-transparent px-1 text-[12px] text-[var(--muted)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label="Task effort"
        >
          {[15, 30, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
        </select>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">If you average:</span>
        {[70, 80, 90, 100].map((score) => (
          <span key={score} className="border border-[var(--border)] px-2 py-1 font-mono text-[11px] text-[var(--muted)]">
            {score}% → {scenarioGrade(score).toFixed(1)}%
          </span>
        ))}
        <button type="button" onClick={() => void copyTeacherChecklist()} className="btn-ghost ml-auto">
          copy teacher questions
        </button>
      </div>

      {customTasks.length > 0 && summary.open === 0 ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ace)]">
          Everything on this plan is done.
        </p>
      ) : null}
    </section>
  );
}

function PlanRow({
  item,
  index,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
  onStatusChange,
}: {
  item: PlanItem;
  index: number;
  onToggle: () => void;
  onEdit: (value: string) => void;
  onDelete: () => void;
  onOpen: () => void;
  onStatusChange: (status: AssignmentStatus) => void;
}) {
  const due = formatDueDate(item.dueDate);
  return (
    <div className={["flex items-start gap-3 border-b border-[var(--rule)] px-4 py-4 last:border-b-0", item.completed ? "opacity-55" : ""].join(" ")}>
      {item.kind === "task" ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border-strong)] text-[11px] text-[var(--ace)] hover:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          aria-label={item.completed ? `Reopen ${item.title}` : `Complete ${item.title}`}
        >
          {item.completed ? "✓" : ""}
        </button>
      ) : (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" aria-label="Missing assignment" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {item.kind === "task" ? (
            <EditableText value={item.title} onChange={onEdit} ariaLabel="Study task title" maxLength={120} />
          ) : (
            <button type="button" onClick={onOpen} className="text-left font-display italic text-[19px] leading-[1.15] hover:text-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              {item.title}
            </button>
          )}
          {due ? <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{due}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
          {item.kind === "assignment" ? (
            <select
              value={item.status}
              onChange={(event) => onStatusChange(event.target.value as AssignmentStatus)}
              className="bg-transparent text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
              aria-label={`Status for ${item.title}`}
            >
              <option value="not-started">not started</option>
              <option value="in-progress">in progress</option>
              <option value="submitted">submitted</option>
            </select>
          ) : <span>your task · {item.effort} min</span>}
          {item.kind === "assignment" && item.impact !== null ? <span>{item.impact.toFixed(1)} grade points at stake</span> : null}
        </div>
      </div>
      <span className="font-mono text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span>
      {item.kind === "task" ? (
        <button type="button" onClick={onDelete} className="text-[var(--muted)] hover:text-[var(--danger)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" aria-label={`Delete ${item.title}`}>
          ×
        </button>
      ) : null}
    </div>
  );
}
