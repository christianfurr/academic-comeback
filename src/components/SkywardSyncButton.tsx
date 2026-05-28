"use client";

type Props = {
  connected: boolean;
  syncing: boolean;
  errored: boolean;
  onConnect: () => void;
  onSync: () => void;
};

export function SkywardSyncButton({ connected, syncing, errored, onConnect, onSync }: Props) {
  if (!connected) {
    return (
      <button
        type="button"
        className="btn-ghost"
        onClick={onConnect}
        title="Connect your Skyward Family Access account"
      >
        + Skyward
      </button>
    );
  }

  return (
    <button
      type="button"
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
        "text-[11px] font-mono uppercase tracking-[0.08em]",
        errored
          ? "border-[var(--danger)] text-[var(--danger)] bg-[var(--card)]"
          : "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] hover:opacity-90",
      ].join(" ")}
      onClick={onSync}
      disabled={syncing}
      title={errored ? "Sync failed — try again" : "Pull latest from Skyward"}
    >
      <span
        className={[
          "h-2 w-2 rounded-full shrink-0",
          syncing ? "animate-pulse bg-[var(--accent)]" : errored ? "bg-[var(--danger)]" : "bg-[var(--bg)]",
        ].join(" ")}
      />
      <span>
        {syncing ? "Syncing…" : errored ? "Sync failed · retry" : "Sync from Skyward"}
      </span>
    </button>
  );
}
