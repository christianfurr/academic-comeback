"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const DEFAULT_BASE_URL =
  "https://skystu.jordan.k12.ut.us/scripts/wsisa.dll/WService=wsEAplus";

type Props = {
  initialUsername?: string;
  initialBaseUrl?: string;
  onClose: () => void;
  /** Fired after credentials are saved. Receives whether the user wants to sync right away. */
  onSaved: (opts: { syncNow: boolean }) => void;
};

export function SkywardConnectModal({
  initialUsername = "",
  initialBaseUrl,
  onClose,
  onSaved,
}: Props) {
  const setCredentials = useAction(api.skyward.setCredentials);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl ?? "");
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialBaseUrl && initialBaseUrl !== DEFAULT_BASE_URL));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setBusy(true);
    try {
      await setCredentials({
        username: username.trim(),
        password,
        baseUrl: baseUrl.trim() || undefined,
      });
      onSaved({ syncNow: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[rgba(24,21,19,0.45)] backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[560px] max-h-[90vh] overflow-hidden border border-[var(--ink)] bg-[var(--bg)] shadow-[8px_8px_0_var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] px-7 py-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)] font-semibold mb-1">
              ⟳ Connect Skyward
            </div>
            <h3 className="font-display italic text-[28px] leading-[1.1] tracking-[-0.01em]">
              Link your Skyward account
            </h3>
          </div>
          <button
            type="button"
            className="text-[26px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)] rounded w-8 h-8"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex flex-col gap-4">
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            Comeback will log into Skyward Family Access on your behalf to pull classes and
            assignments. Your credentials are encrypted at rest and only decrypted during sync.
          </p>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
              Skyward username
            </span>
            <input
              className="px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded font-mono text-[13px]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
              Password
            </span>
            <input
              type="password"
              className="px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded font-mono text-[13px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
            />
          </label>

          <button
            type="button"
            className="self-start font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "▾" : "▸"} Different district?
          </button>

          {showAdvanced ? (
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] font-semibold">
                Skyward base URL
              </span>
              <input
                className="px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded font-mono text-[12px]"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={DEFAULT_BASE_URL}
                spellCheck={false}
                disabled={busy}
              />
              <span className="text-[11px] text-[var(--muted)]">
                Leave blank for Jordan SD (Riverton). Pattern:{" "}
                <code className="font-mono">.../wsisa.dll/WService=wsEAplus</code>
              </span>
            </label>
          ) : null}

          {error ? (
            <div className="font-mono text-[12px] text-[var(--danger)]">{error}</div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--rule)] px-7 py-4">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy || !username.trim() || !password}
          >
            <span>{busy ? "Connecting…" : "Connect & sync"}</span>
            <span className="font-mono">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
