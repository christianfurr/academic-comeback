import type { Tweaks } from "@/lib/types";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtPts(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function letterFor(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  if (pct >= 93) return "A";
  if (pct >= 90) return "A−";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B−";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C−";
  if (pct >= 67) return "D+";
  if (pct >= 63) return "D";
  if (pct >= 60) return "D−";
  return "F";
}

export function gradeTone(
  pct: number | null | undefined,
): "ace" | "solid" | "risk" | "low" | "danger" | "neutral" {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "neutral";
  if (pct >= 90) return "ace";
  if (pct >= 80) return "solid";
  if (pct >= 70) return "risk";
  if (pct >= 60) return "low";
  return "danger";
}

export const DEFAULT_TWEAKS: Tweaks = {
  accent: "electric",
  type: "editorial",
  density: "comfortable",
  bg: "midnight",
};

