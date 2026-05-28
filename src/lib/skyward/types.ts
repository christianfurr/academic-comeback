export type TermGrade = {
  /** Display label, e.g. "Q1" */
  term: string;
  /** Skyward bucket label, e.g. "TERM 1" */
  bucket: string | null;
  letter: string | null;
  /** Gradebook record ID used to fetch the assignment popup. */
  gbId: string | null;
};

export type SkywardClass = {
  /** Skyward `corNumId` */
  classId: string;
  name: string;
  period: string | null;
  teacher: string | null;
  /** populated from grade cells; needed for the assignment popup request */
  track: string | null;
  section: string | null;
  entityId: string | null;
  grades: TermGrade[];
};

export type SkywardAssignment = {
  name: string;
  category: string | null;
  /** "MM/DD/YY" string, matches ParsedAssignment.date downstream. */
  date: string | null;
  /** Raw "<earned> out of <possible>" or letter cell. */
  score: string | null;
  pointsEarned: number | null;
  pointsPossible: number | null;
  percent: number | null;
  letter: string | null;
  missing: boolean;
};

export type SkywardSession = {
  baseUrl: string;
  sessionid: string;
  encses: string;
  params: Record<string, string>;
  cookies: string;
};

export type SkywardErrorReason = "auth" | "network" | "scrape";

export class SkywardError extends Error {
  reason: SkywardErrorReason;
  constructor(reason: SkywardErrorReason, message: string) {
    super(message);
    this.reason = reason;
    this.name = "SkywardError";
  }
}
