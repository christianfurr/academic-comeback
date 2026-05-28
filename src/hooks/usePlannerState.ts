"use client";

import { api } from "../../convex/_generated/api";
import { DEFAULT_TWEAKS } from "@/lib/helpers";
import { appStateToJson, buildAppState, parseAppStateJson } from "@/lib/plannerSerialize";
import {
  clearLocalState,
  loadLocalState,
  saveLocalState,
  STATE_VERSION,
} from "@/lib/storage";
import { loadCloudOptOut, saveCloudOptOut } from "@/lib/syncPrefs";
import type { AppState, ClassData, Tweaks, ViewMode } from "@/lib/types";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAVE_DEBOUNCE_MS = 800;

export type SyncStatus = "off" | "loading" | "syncing" | "saved" | "error";

export function usePlannerState(isSignedIn: boolean) {
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const [cloudOptOut, setCloudOptOut] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("class");
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [hydrated, setHydrated] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  const [remoteApplied, setRemoteApplied] = useState(false);

  const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
  const cloudActive =
    !cloudOptOut && isSignedIn && convexConfigured && isAuthenticated && !convexAuthLoading;

  const remoteRow = useQuery(api.plannerStates.get, cloudActive ? {} : "skip");
  const saveRemote = useMutation(api.plannerStates.set);
  const clearRemote = useMutation(api.plannerStates.clear);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemoteSaveRef = useRef(false);

  const applySnapshot = useCallback((snapshot: AppState) => {
    setClasses(snapshot.classes);
    setActiveId(snapshot.activeId ?? snapshot.classes[0]?.id ?? null);
    setView(snapshot.view ?? "class");
    if (snapshot.tweaks && snapshot.version === STATE_VERSION) {
      setTweaks((t) => ({ ...t, ...snapshot.tweaks }));
    }
  }, []);

  const getSnapshot = useCallback(
    (): AppState => buildAppState(classes, activeId, view, tweaks),
    [classes, activeId, view, tweaks],
  );

  // Load preferences (client only).
  useEffect(() => {
    setCloudOptOut(loadCloudOptOut());
    setPrefsLoaded(true);
  }, []);

  // Bootstrap planner state from localStorage.
  useEffect(() => {
    if (hydrated) return;
    const local = loadLocalState();
    if (local) applySnapshot(local);
    setHydrated(true);
  }, [hydrated, applySnapshot]);

  // Reset remote-applied flag when cloud becomes inactive (sign out, opt out).
  useEffect(() => {
    if (!cloudActive) {
      setRemoteApplied(false);
      pendingRemoteSaveRef.current = false;
    }
  }, [cloudActive]);

  // On first remote load: if remote exists, take it; otherwise push local up.
  useEffect(() => {
    if (!hydrated || !cloudActive || remoteApplied) {
      if (!cloudActive) setSyncStatus(cloudOptOut && isSignedIn ? "off" : "off");
      return;
    }

    if (remoteRow === undefined) {
      setSyncStatus("loading");
      return;
    }

    if (remoteRow !== null) {
      const remoteState = parseAppStateJson(remoteRow.stateJson);
      if (remoteState) {
        applySnapshot(remoteState);
        saveLocalState(remoteState);
      }
      setRemoteApplied(true);
      setSyncStatus("saved");
      return;
    }

    // Remote is empty: push current local up so this becomes the source of truth.
    setRemoteApplied(true);
    const snapshot = getSnapshot();
    if (snapshot.classes.length === 0) {
      setSyncStatus("saved");
      return;
    }
    pendingRemoteSaveRef.current = true;
    setSyncStatus("syncing");
    saveRemote({ version: snapshot.version, stateJson: appStateToJson(snapshot) })
      .then(() => {
        pendingRemoteSaveRef.current = false;
        setSyncStatus("saved");
      })
      .catch(() => {
        pendingRemoteSaveRef.current = false;
        setSyncStatus("error");
      });
  }, [
    hydrated,
    cloudActive,
    remoteRow,
    remoteApplied,
    getSnapshot,
    saveRemote,
    cloudOptOut,
    isSignedIn,
    applySnapshot,
  ]);

  // Always persist locally after hydration.
  useEffect(() => {
    if (!hydrated) return;
    saveLocalState(getSnapshot());
  }, [classes, activeId, view, tweaks, hydrated, getSnapshot]);

  // Debounced cloud save once first sync is done.
  useEffect(() => {
    if (!hydrated || !cloudActive || !remoteApplied) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingRemoteSaveRef.current = true;
    setSyncStatus("syncing");

    saveTimerRef.current = setTimeout(() => {
      const snapshot = getSnapshot();
      saveRemote({ version: snapshot.version, stateJson: appStateToJson(snapshot) })
        .then(() => {
          pendingRemoteSaveRef.current = false;
          setSyncStatus("saved");
        })
        .catch(() => {
          pendingRemoteSaveRef.current = false;
          setSyncStatus("error");
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [classes, activeId, view, tweaks, hydrated, cloudActive, remoteApplied, getSnapshot, saveRemote]);

  const retrySync = useCallback(() => {
    if (!cloudActive) return;
    const snapshot = getSnapshot();
    pendingRemoteSaveRef.current = true;
    setSyncStatus("syncing");
    saveRemote({ version: snapshot.version, stateJson: appStateToJson(snapshot) })
      .then(() => {
        pendingRemoteSaveRef.current = false;
        setSyncStatus("saved");
      })
      .catch(() => {
        pendingRemoteSaveRef.current = false;
        setSyncStatus("error");
      });
  }, [cloudActive, getSnapshot, saveRemote]);

  const disableCloudSync = useCallback(
    async (deleteRemote: boolean) => {
      if (deleteRemote && isSignedIn && convexConfigured) {
        try {
          await clearRemote({});
        } catch {
          // best-effort; user is opting out anyway
        }
      }
      saveCloudOptOut(true);
      setCloudOptOut(true);
      setSyncStatus("off");
    },
    [clearRemote, convexConfigured, isSignedIn],
  );

  const enableCloudSync = useCallback(() => {
    saveCloudOptOut(false);
    setCloudOptOut(false);
  }, []);

  const resetAll = useCallback(async () => {
    setClasses([]);
    setActiveId(null);
    clearLocalState();
    if (cloudActive) {
      try {
        await clearRemote({});
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }
  }, [cloudActive, clearRemote]);

  return {
    classes,
    setClasses,
    activeId,
    setActiveId,
    view,
    setView,
    tweaks,
    setTweaks,
    hydrated: hydrated && prefsLoaded,
    cloudActive,
    cloudOptOut,
    cloudAvailable: convexConfigured && isSignedIn,
    syncStatus,
    isCloudLoading: cloudActive && !remoteApplied,
    disableCloudSync,
    enableCloudSync,
    retrySync,
    resetAll,
  };
}
