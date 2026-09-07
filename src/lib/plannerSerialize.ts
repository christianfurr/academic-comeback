import { DEFAULT_TWEAKS } from "@/lib/helpers";
import { STATE_VERSION } from "@/lib/storage";
import type { AppState } from "@/lib/types";

export function appStateToJson(state: AppState): string {
  return JSON.stringify(state);
}

export function parseAppStateJson(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.classes)) return null;

    const version = typeof parsed.version === "number" ? parsed.version : 0;
    return {
      version,
      classes: parsed.classes,
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
      view: parsed.view === "today" || parsed.view === "semester" ? parsed.view : "class",
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map((task) => ({ ...task, effort: task.effort ?? 30 })) : [],
      progress: Array.isArray(parsed.progress) ? parsed.progress : [],
      tweaks:
        parsed.tweaks && version === STATE_VERSION
          ? { ...DEFAULT_TWEAKS, ...parsed.tweaks }
          : DEFAULT_TWEAKS,
    };
  } catch {
    return null;
  }
}

export function buildAppState(
  classes: AppState["classes"],
  activeId: AppState["activeId"],
  view: AppState["view"],
  tweaks: AppState["tweaks"],
  tasks: AppState["tasks"],
  progress: AppState["progress"],
): AppState {
  return { version: STATE_VERSION, classes, activeId, view, tweaks, tasks, progress };
}
