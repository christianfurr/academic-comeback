"use client";

import { useEffect, useRef, useState } from "react";
import type { SyncStatus } from "@/hooks/usePlannerState";

type Props = {
  status: SyncStatus;
  cloudActive: boolean;
  cloudAvailable: boolean;
  onRetry: () => void;
  onDisable: () => void;
  onEnable: () => void;
  skywardConnected: boolean;
  skywardBaseUrl: string | null;
  onSkywardConnect: () => void;
  onSkywardDisconnect: () => void;
};

function statusText(status: SyncStatus, cloudActive: boolean): string {
  if (!cloudActive) return "Local only";
  switch (status) {
    case "loading":
      return "Loading your data…";
    case "syncing":
      return "Syncing…";
    case "saved":
      return "Synced";
    case "error":
      return "Sync failed";
    default:
      return "Synced";
  }
}

function statusColor(status: SyncStatus, cloudActive: boolean): string {
  if (!cloudActive) return "var(--muted)";
  switch (status) {
    case "saved":
      return "var(--ace)";
    case "syncing":
    case "loading":
      return "var(--accent)";
    case "error":
      return "var(--danger)";
    default:
      return "var(--muted)";
  }
}

export function SyncControl({
  status,
  cloudActive,
  cloudAvailable,
  onRetry,
  onDisable,
  onEnable,
  skywardConnected,
  skywardBaseUrl,
  onSkywardConnect,
  onSkywardDisconnect,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!cloudAvailable) return null;

  const color = statusColor(status, cloudActive);
  const text = statusText(status, cloudActive);
  const showRetry = cloudActive && status === "error";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
          "text-[11px] font-mono uppercase tracking-[0.08em]",
          cloudActive
            ? "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-2)]"
            : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-2)]",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={cloudActive ? "Cloud sync settings" : "Sync is off — click to enable"}
      >
        <span
          className={[
            "h-2 w-2 rounded-full shrink-0",
            status === "syncing" || status === "loading" ? "animate-pulse" : "",
          ].join(" ")}
          style={{ background: color }}
        />
        <span className="text-[var(--ink-soft)]">{text}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[260px] border border-[var(--ink)] bg-[var(--bg)] shadow-[6px_6px_0_var(--ink)] p-3 flex flex-col gap-1"
        >
          <div className="px-2 py-2 border-b border-[var(--rule)] mb-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              Cloud sync
            </div>
            <div className="mt-1 text-[12.5px] text-[var(--ink-soft)]">
              {cloudActive
                ? "Your grades save to your account automatically."
                : "Sync is off. Grades stay on this device only."}
            </div>
          </div>

          {showRetry ? (
            <button
              type="button"
              className="text-left px-2 py-2 text-[13px] hover:bg-[var(--card-2)] text-[var(--danger)]"
              onClick={() => {
                onRetry();
                setOpen(false);
              }}
            >
              Retry sync
            </button>
          ) : null}

          {cloudActive ? (
            <button
              type="button"
              className="text-left px-2 py-2 text-[13px] hover:bg-[var(--card-2)] text-[var(--ink-soft)]"
              onClick={() => {
                onDisable();
                setOpen(false);
              }}
            >
              Turn off cloud sync
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Removes your data from the cloud. Local copy stays.
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="text-left px-2 py-2 text-[13px] hover:bg-[var(--card-2)] text-[var(--ink-soft)]"
              onClick={() => {
                onEnable();
                setOpen(false);
              }}
            >
              Turn on cloud sync
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Save grades to your account and access them on other devices.
              </div>
            </button>
          )}

          <div className="px-2 pt-3 pb-2 border-t border-[var(--rule)] mt-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              Skyward
            </div>
            <div className="mt-1 text-[12.5px] text-[var(--ink-soft)] break-all">
              {skywardConnected
                ? `Connected · ${skywardBaseUrl?.replace(/^https?:\/\//, "").split("/")[0] ?? "Skyward"}`
                : "Not connected"}
            </div>
          </div>

          {skywardConnected ? (
            <button
              type="button"
              className="text-left px-2 py-2 text-[13px] hover:bg-[var(--card-2)] text-[var(--ink-soft)]"
              onClick={() => {
                onSkywardDisconnect();
                setOpen(false);
              }}
            >
              Disconnect Skyward
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Removes your stored Skyward login. Grades you&apos;ve already imported stay.
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="text-left px-2 py-2 text-[13px] hover:bg-[var(--card-2)] text-[var(--ink-soft)]"
              onClick={() => {
                onSkywardConnect();
                setOpen(false);
              }}
            >
              Connect Skyward
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Pull classes + assignments straight from Family Access.
              </div>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
