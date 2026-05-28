import { uid } from "@/lib/helpers";
import type { ClassData, ClassSource, ParsedCourse } from "@/lib/types";

function withId<T extends { id?: string }>(obj: T): T & { id: string } {
  return { ...obj, id: obj.id ?? uid() };
}

export function normalizeParsedCourses(
  courses: ParsedCourse[],
  fallbackNames: string[] = [],
  source: ClassSource = "paste",
): ClassData[] {
  return courses.map((course, i) => ({
    id: uid(),
    name:
      course.name && course.name !== "Untitled Class"
        ? course.name
        : fallbackNames[i] ?? `Class ${i + 1}`,
    target: 90,
    source,
    categories: course.categories.map((c) => ({
      id: uid(),
      name: c.name,
      weight: Math.round(((c.weight ?? 0) as number) * 10) / 10,
      assignments: c.assignments.map((a) =>
        withId({
          id: uid(),
          name: a.name,
          letter: a.letter ?? null,
          date: a.date ?? null,
          score: a.missing ? null : (a.score ?? null),
          total: a.total,
          missing: !!a.missing,
          noCount: !!a.noCount,
          whatIf: a.missing ? 80 : null,
        }),
      ),
    })),
  }));
}

export function newBlankClass(name?: string): ClassData {
  return {
    id: uid(),
    name: name || "New class",
    target: 90,
    source: "manual",
    categories: [
      { id: uid(), name: "Tests", weight: 40, assignments: [] },
      { id: uid(), name: "Quizzes", weight: 20, assignments: [] },
      { id: uid(), name: "Homework", weight: 20, assignments: [] },
      { id: uid(), name: "Participation", weight: 20, assignments: [] },
    ],
  };
}

