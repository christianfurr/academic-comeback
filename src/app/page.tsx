"use client";

import { AddClassModal } from "@/components/AddClassModal";
import { ClassDetail } from "@/components/ClassDetail";
import { ClassTabs } from "@/components/ClassTabs";
import { ClassesSummary } from "@/components/ClassesSummary";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Hero } from "@/components/Hero";
import { Logo } from "@/components/Logo";
import { PlannerSkeleton } from "@/components/PlannerSkeleton";
import { SemesterView } from "@/components/SemesterView";
import { SignedOutLanding } from "@/components/SignedOutLanding";
import { SkywardConnectModal } from "@/components/SkywardConnectModal";
import { SkywardSyncButton } from "@/components/SkywardSyncButton";
import { SkywardSyncResultModal } from "@/components/SkywardSyncResultModal";
import { SkywardTermPicker } from "@/components/SkywardTermPicker";
import { loadSkywardTerm, saveSkywardTerm, type SkywardTerm } from "@/lib/syncPrefs";
import { SyncControl } from "@/components/SyncControl";
import { Topbar } from "@/components/Topbar";
import { usePlannerState } from "@/hooks/usePlannerState";
import { useSkywardSync } from "@/hooks/useSkywardSync";
import { normalizeParsedCourses, newBlankClass } from "@/lib/normalize";
import { SAMPLE_NAMES } from "@/lib/samples";
import type { ClassData, ParsedCourse } from "@/lib/types";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const {
    classes,
    setClasses,
    activeId,
    setActiveId,
    view,
    setView,
    tweaks,
    hydrated,
    cloudActive,
    cloudAvailable,
    syncStatus,
    isCloudLoading,
    disableCloudSync,
    enableCloudSync,
    retrySync,
    resetAll,
  } = usePlannerState(Boolean(isSignedIn));

  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showSkywardConnect, setShowSkywardConnect] = useState(false);
  const [skywardToast, setSkywardToast] = useState<string | null>(null);
  const [skywardTerm, setSkywardTerm] = useState<SkywardTerm>("Q4");

  useEffect(() => {
    setSkywardTerm(loadSkywardTerm());
  }, []);

  const skywardStatus = useQuery(api.skywardData.hasCredentials, isSignedIn ? {} : "skip");
  const clearSkyward = useAction(api.skyward.clearCredentials);
  const skywardConnected = skywardStatus?.connected === true;
  const skywardBaseUrl = skywardStatus?.connected ? skywardStatus.baseUrl : null;

  const {
    state: skywardSyncState,
    sync: runSkywardSync,
    cancelReview: cancelSkywardReview,
    applyReview: applySkywardReview,
  } = useSkywardSync({ classes, applyClasses: setClasses });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = tweaks.accent;
    root.dataset.type = tweaks.type;
    root.dataset.density = tweaks.density;
    root.dataset.bg = tweaks.bg;
  }, [tweaks]);

  useEffect(() => {
    if (!skywardToast) return;
    const t = setTimeout(() => setSkywardToast(null), 4000);
    return () => clearTimeout(t);
  }, [skywardToast]);

  const handleParse = (parsed: ParsedCourse[]) => {
    const newClasses = normalizeParsedCourses(parsed, SAMPLE_NAMES);
    setClasses(newClasses);
    setActiveId(newClasses[0]?.id ?? null);
  };

  const handleStartBlank = () => {
    const cls = newBlankClass();
    setClasses([cls]);
    setActiveId(cls.id);
  };

  const handleAddParsed = (courses: ParsedCourse[], optionalSingleName?: string) => {
    const parsedClasses = normalizeParsedCourses(courses, SAMPLE_NAMES);
    if (optionalSingleName && parsedClasses.length === 1) {
      parsedClasses[0] = { ...parsedClasses[0], name: optionalSingleName };
    }
    setClasses((prev) => [...prev, ...parsedClasses]);
    setActiveId(parsedClasses[0]?.id ?? activeId);
    setShowAdd(false);
  };

  const handleAddBlank = (name?: string) => {
    const cls = newBlankClass(name);
    setClasses((prev) => [...prev, cls]);
    setActiveId(cls.id);
    setShowAdd(false);
  };

  const handleUpdate = (next: ClassData) => {
    setClasses((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const handleDelete = (id: string) => {
    setClasses((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(filtered[0]?.id ?? null);
      return filtered;
    });
  };

  const active = classes.find((c) => c.id === activeId) ?? null;

  if (!isLoaded || !hydrated) {
    return <PlannerSkeleton />;
  }

  if (!isSignedIn) {
    return <SignedOutLanding />;
  }

  const footerPrivacy = cloudActive
    ? "Your grades save to your account and stay available on every device you sign in on."
    : "Cloud sync is off — your grades stay only on this device.";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-12 max-sm:px-5">
      <Topbar
        hasClasses={classes.length > 0}
        view={view}
        setView={setView}
        onAddClass={() => setShowAdd(true)}
        onReset={() => setShowReset(true)}
        skywardButton={
          cloudAvailable ? (
            <div className="inline-flex items-center gap-2">
              {skywardConnected ? (
                <SkywardTermPicker
                  value={skywardTerm}
                  disabled={skywardSyncState.kind === "syncing"}
                  onChange={(t) => {
                    setSkywardTerm(t);
                    saveSkywardTerm(t);
                  }}
                />
              ) : null}
              <SkywardSyncButton
                connected={skywardConnected}
                syncing={skywardSyncState.kind === "syncing"}
                errored={skywardSyncState.kind === "error"}
                onConnect={() => setShowSkywardConnect(true)}
                onSync={() => {
                  if (skywardSyncState.kind === "error" && skywardSyncState.reason === "auth") {
                    setShowSkywardConnect(true);
                  } else {
                    void runSkywardSync(skywardTerm);
                  }
                }}
              />
            </div>
          ) : null
        }
        syncControl={
          <SyncControl
            status={syncStatus}
            cloudActive={cloudActive}
            cloudAvailable={cloudAvailable}
            onRetry={retrySync}
            onDisable={() => disableCloudSync(true)}
            onEnable={enableCloudSync}
            skywardConnected={skywardConnected}
            skywardBaseUrl={skywardBaseUrl}
            onSkywardConnect={() => setShowSkywardConnect(true)}
            onSkywardDisconnect={async () => {
              try {
                await clearSkyward({});
                setSkywardToast("Skyward disconnected.");
              } catch (e: unknown) {
                setSkywardToast(
                  e instanceof Error ? `Disconnect failed: ${e.message}` : "Disconnect failed.",
                );
              }
            }}
          />
        }
        userMenu={<UserButton />}
      />

      {isCloudLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-[var(--muted)]">
          <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <div className="font-mono text-[11px] uppercase tracking-[0.12em]">Loading your data…</div>
        </div>
      ) : classes.length === 0 ? (
        <Hero onParse={handleParse} onStartBlank={handleStartBlank} />
      ) : (
        <div className="py-8 flex flex-col gap-8">
          <ClassesSummary classes={classes} />

          {view === "semester" ? (
            <SemesterView
              classes={classes}
              onOpenClass={(id) => {
                setActiveId(id);
                setView("class");
              }}
            />
          ) : (
            <>
              <ClassTabs
                classes={classes}
                activeId={activeId}
                onSelect={setActiveId}
                onAdd={() => setShowAdd(true)}
              />
              {active ? (
                <ClassDetail
                  cls={active}
                  onUpdate={handleUpdate}
                  onDelete={() => handleDelete(active.id)}
                  skywardSyncing={skywardSyncState.kind === "syncing"}
                  onSkywardSync={
                    skywardConnected
                      ? (className) => {
                          void runSkywardSync(skywardTerm, className);
                        }
                      : undefined
                  }
                />
              ) : null}
            </>
          )}
        </div>
      )}

      {showAdd ? (
        <AddClassModal
          onClose={() => setShowAdd(false)}
          onAddParsed={handleAddParsed}
          onAddBlank={handleAddBlank}
        />
      ) : null}

      {showSkywardConnect ? (
        <SkywardConnectModal
          initialBaseUrl={skywardBaseUrl ?? undefined}
          onClose={() => setShowSkywardConnect(false)}
          onSaved={({ syncNow }) => {
            setShowSkywardConnect(false);
            if (syncNow) void runSkywardSync(skywardTerm);
          }}
        />
      ) : null}

      {skywardSyncState.kind === "review" ? (
        <SkywardSyncResultModal
          review={skywardSyncState.review}
          onCancel={cancelSkywardReview}
          onApply={(params) => {
            applySkywardReview(params);
            const total =
              skywardSyncState.review.summary.added + skywardSyncState.review.summary.updated;
            setSkywardToast(total > 0 ? `Synced — ${total} change${total === 1 ? "" : "s"}.` : "Synced.");
          }}
        />
      ) : null}

      {skywardSyncState.kind === "error" ? (
        <ConfirmModal
          title="Sync failed"
          body={
            skywardSyncState.reason === "auth"
              ? "Skyward rejected the login. Re-enter your username and password."
              : skywardSyncState.reason === "no-credentials"
                ? "Skyward isn't connected yet. Connect to start syncing."
                : (skywardSyncState.message ?? "Couldn't reach Skyward. Try again in a moment.")
          }
          confirmLabel={
            skywardSyncState.reason === "auth" || skywardSyncState.reason === "no-credentials"
              ? "Reconnect"
              : "Retry"
          }
          cancelLabel="Dismiss"
          onConfirm={() => {
            if (
              skywardSyncState.reason === "auth" ||
              skywardSyncState.reason === "no-credentials" ||
              skywardSyncState.reason === "config"
            ) {
              setShowSkywardConnect(true);
            } else {
              void runSkywardSync(skywardTerm);
            }
          }}
          onCancel={cancelSkywardReview}
        />
      ) : null}

      {skywardToast ? (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] border border-[var(--ink)] bg-[var(--bg)] shadow-[4px_4px_0_var(--ink)] px-4 py-2 text-[13px] font-mono"
          role="status"
          onClick={() => setSkywardToast(null)}
        >
          {skywardToast}
        </div>
      ) : null}

      {showReset ? (
        <ConfirmModal
          title="Clear all classes?"
          body="This removes every class, assignment, and target from this device. If cloud sync is on, your cloud copy is cleared too. This can't be undone."
          confirmLabel="Clear everything"
          cancelLabel="Keep my data"
          destructive
          onConfirm={() => {
            setShowReset(false);
            void resetAll();
          }}
          onCancel={() => setShowReset(false)}
        />
      ) : null}

      <footer className="mt-auto border-t border-[var(--rule)] py-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="inline-flex items-center gap-2 font-display italic text-[16px]">
            <Logo size={20} />
            <strong className="font-semibold not-italic">Comeback / Protocol</strong>
          </div>
          <div className="text-[12px] text-[var(--muted)] flex-1">{footerPrivacy}</div>
          <div className="font-display italic text-[14px] text-[var(--muted)]">
            Built for the 1am spiral. Use the slider. Make the plan. Sleep.
          </div>
          <div className="font-mono text-[11px] tracking-[0.04em] text-[var(--muted)]">
            Built by{" "}
            <a
              href="https://christianfurr.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ink-soft)] underline decoration-[var(--border-strong)] underline-offset-2 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
            >
              Christian Furr
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
