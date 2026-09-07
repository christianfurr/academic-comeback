export type Assignment = {
  id: string;
  name: string;
  letter: string | null;
  /** "MM/DD/YY" */
  date: string | null;
  /** null when missing */
  score: number | null;
  total: number;
  missing: boolean;
  noCount: boolean;
  /** 0–100, used for projected math */
  whatIf: number | null;
};

export type Category = {
  id: string;
  name: string;
  /** 0–100, should sum to 100 across class */
  weight: number;
  assignments: Assignment[];
};

export type ClassSource = "skyward" | "paste" | "manual";

export type ClassData = {
  id: string;
  name: string;
  /** 50–100 */
  target: number;
  categories: Category[];
  /** How this class entered the tracker. Undefined on legacy data → treat as "manual". */
  source?: ClassSource;
  /** Epoch ms; only set when source === "skyward". */
  lastSyncedAt?: number;
};

export type Tweaks = {
  accent: "comeback" | "electric" | "ink";
  bg: "parchment" | "paper" | "midnight";
  type: "editorial" | "sport" | "minimal";
  density: "comfortable" | "compact";
};

export type ViewMode = "class" | "semester";

export type PlanTask = {
  id: string;
  classId: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
};

export type AppState = {
  version: number;
  classes: ClassData[];
  activeId: string | null;
  view: ViewMode;
  tweaks: Tweaks;
  tasks: PlanTask[];
};

// Parser output (pre-normalization)
export type ParsedAssignment = {
  name: string;
  letter: string | null;
  date: string | null;
  score: number | null;
  total: number;
  missing: boolean;
  noCount: boolean;
};

export type ParsedCategory = {
  name: string;
  weight: number | null;
  assignments: ParsedAssignment[];
};

export type ParsedCourse = {
  name: string;
  categories: ParsedCategory[];
};
