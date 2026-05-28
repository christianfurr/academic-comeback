import { DEFAULT_TWEAKS } from "@/lib/helpers";
import type { AppState } from "@/lib/types";

export const STORAGE_KEY = "comeback-state-v2";
export const STATE_VERSION = 3;

export type StoredState = AppState;

export function loadLocalState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredState> | null;
    if (!parsed || !Array.isArray(parsed.classes)) return null;

    const version = typeof parsed.version === "number" ? parsed.version : 0;
    return {
      version,
      classes: parsed.classes,
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
      view: parsed.view === "semester" ? "semester" : "class",
      tweaks:
        parsed.tweaks && version === STATE_VERSION
          ? { ...DEFAULT_TWEAKS, ...parsed.tweaks }
          : DEFAULT_TWEAKS,
    };
  } catch {
    return null;
  }
}

export function saveLocalState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
}

export function clearLocalState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

