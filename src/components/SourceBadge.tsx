"use client";

import type { ClassSource } from "@/lib/types";

type Props = {
  source?: ClassSource;
  lastSyncedAt?: number;
  /** "tab" = compact (for ClassTabs), "header" = roomier with timestamp (for ClassDetail). */
  variant?: "tab" | "header";
  className?: string;
  /** Override colors when the surrounding element is inverted (active tab). */
  inverted?: boolean;
};

function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  if (diff < 60_000) return "just now";
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(epochMs);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SourceBadge({
  source,
  lastSyncedAt,
  variant = "tab",
  className = "",
  inverted = false,
}: Props) {
  const effective = source ?? "manual";
  if (effective === "manual") return null;

  const isSkyward = effective === "skyward";
  const label = isSkyward ? "Skyward" : "Paste";

  if (variant === "tab") {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold uppercase tracking-[0.08em]",
          isSkyward
            ? inverted
              ? "bg-[rgba(255,255,255,0.18)] text-[var(--bg)]"
              : "bg-[color:rgba(102,68,255,0.10)] text-[var(--accent)]"
            : inverted
              ? "bg-[rgba(255,255,255,0.12)] text-[var(--bg)]"
              : "bg-[var(--rule)] text-[var(--muted)]",
          className,
        ].join(" ")}
        title={
          isSkyward && lastSyncedAt
            ? `Synced from Skyward · ${relativeTime(lastSyncedAt)}`
            : isSkyward
              ? "Synced from Skyward"
              : "Added from paste"
        }
      >
        {isSkyward ? "⟳" : "❐"} {label}
      </span>
    );
  }

  // header variant
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-semibold uppercase tracking-[0.10em]",
        isSkyward
          ? "bg-[color:rgba(102,68,255,0.10)] text-[var(--accent)]"
          : "bg-[var(--rule)] text-[var(--muted)]",
        className,
      ].join(" ")}
    >
      <span>{isSkyward ? "⟳" : "❐"}</span>
      <span>{label}</span>
      {isSkyward && lastSyncedAt ? (
        <span className="text-[var(--muted)] font-normal normal-case tracking-normal">
          · {relativeTime(lastSyncedAt)}
        </span>
      ) : null}
    </span>
  );
}
