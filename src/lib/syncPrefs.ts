const CLOUD_OPT_OUT_KEY = "comeback-cloud-opt-out";
const SKYWARD_TERM_KEY = "comeback-skyward-term";

export function loadCloudOptOut(): boolean {
  try {
    return localStorage.getItem(CLOUD_OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveCloudOptOut(optOut: boolean): void {
  try {
    if (optOut) localStorage.setItem(CLOUD_OPT_OUT_KEY, "true");
    else localStorage.removeItem(CLOUD_OPT_OUT_KEY);
  } catch {
    // ignore
  }
}

export type SkywardTerm = "Q1" | "Q2" | "Q3" | "Q4";

export function loadSkywardTerm(fallback: SkywardTerm = "Q4"): SkywardTerm {
  try {
    const v = localStorage.getItem(SKYWARD_TERM_KEY);
    if (v === "Q1" || v === "Q2" || v === "Q3" || v === "Q4") return v;
  } catch {
    // ignore
  }
  return fallback;
}

export function saveSkywardTerm(term: SkywardTerm): void {
  try {
    localStorage.setItem(SKYWARD_TERM_KEY, term);
  } catch {
    // ignore
  }
}
