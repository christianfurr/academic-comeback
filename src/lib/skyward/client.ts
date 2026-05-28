import type { ParsedCategory } from "@/lib/types";
import { login, skywardFetch } from "./auth";
import { parseAssignmentsAsCategories, parseTermSummary } from "./parsers/assignments";
import { parseGradebook } from "./parsers/gradebook";
import { SkywardError, type SkywardClass, type SkywardSession, type TermGrade } from "./types";

export const DEFAULT_BASE_URL =
  "https://skystu.jordan.k12.ut.us/scripts/wsisa.dll/WService=wsEAplus";

type LoginArgs = { baseUrl?: string; username: string; password: string };

function looksExpired(text: string): boolean {
  if (/session has expired/i.test(text)) return true;
  return text.includes("tryLogin") && text.includes("skyporthttp.w") && text.length < 50_000;
}

function formBody(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) params.append(k, v);
  return params.toString();
}

export class SkywardClient {
  private session: SkywardSession;
  private readonly username: string;
  private readonly password: string;
  private readonly minInterval = 250; // ms — be polite, Skyward's frontend throttles itself
  private lastRequestAt = 0;
  private classesCache: SkywardClass[] | null = null;

  private constructor(session: SkywardSession, username: string, password: string) {
    this.session = session;
    this.username = username;
    this.password = password;
  }

  static async login(args: LoginArgs): Promise<SkywardClient> {
    const baseUrl = args.baseUrl ?? DEFAULT_BASE_URL;
    const session = await login(baseUrl, args.username, args.password);
    return new SkywardClient(session, args.username, args.password);
  }

  private async throttle(): Promise<void> {
    const wait = this.lastRequestAt + this.minInterval - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  private authForm(extra?: Record<string, string>): Record<string, string> {
    return {
      sessionid: this.session.sessionid,
      encses: this.session.encses,
      ...(extra ?? {}),
    };
  }

  private xhrForm(extra?: Record<string, string>): Record<string, string> {
    return {
      sessionid: this.session.sessionid,
      encses: this.session.encses,
      dwd: this.session.params.dwd ?? "",
      wfaacl: this.session.params.wfaacl ?? "",
      ...(extra ?? {}),
    };
  }

  private async post(
    path: string,
    opts: {
      extra?: Record<string, string>;
      referer?: string;
      xhr?: boolean;
      retryOnExpiry?: boolean;
    } = {},
  ): Promise<string> {
    await this.throttle();
    const body = formBody(opts.xhr ? this.xhrForm(opts.extra) : this.authForm(opts.extra));
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (opts.referer) headers["Referer"] = `${this.session.baseUrl}/${opts.referer}`;
    if (opts.xhr) headers["X-Requested-With"] = "XMLHttpRequest";

    const r = await skywardFetch(`${this.session.baseUrl}/${path}`, {
      method: "POST",
      headers,
      body,
      cookies: this.session.cookies,
    });
    if (r.cookies) this.session = { ...this.session, cookies: r.cookies };
    if (r.status !== 200) {
      throw new SkywardError("scrape", `HTTP ${r.status} from ${path}`);
    }
    if (looksExpired(r.text) && opts.retryOnExpiry !== false) {
      // Re-login and retry once.
      const fresh = await login(this.session.baseUrl, this.username, this.password);
      this.session = fresh;
      this.classesCache = null;
      return this.post(path, { ...opts, retryOnExpiry: false });
    }
    return r.text;
  }

  async getClasses(opts: { refresh?: boolean } = {}): Promise<SkywardClass[]> {
    if (this.classesCache && !opts.refresh) return this.classesCache;
    const html = await this.post("sfgradebook001.w");
    this.classesCache = parseGradebook(html);
    return this.classesCache;
  }

  /**
   * Fetch a class's assignment popup for the given term. `term` accepts either
   * the display label ("Q4") or the bucket label ("TERM 4"). Returns the
   * assignments AND the (letter, percent) summary from the popup's term-summary
   * grid — the gradebook landing page only ships the letter, so this is the
   * cheapest place to pick up the numeric percent.
   */
  async getAssignmentsForClass(
    cls: SkywardClass,
    term: string,
  ): Promise<{
    categories: ParsedCategory[];
    termLetter: string | null;
    termPercent: number | null;
  }> {
    const grade = resolveTerm(cls, term);
    if (!grade || !grade.gbId) {
      const available = cls.grades.map((g) => g.term).join(", ");
      throw new SkywardError(
        "scrape",
        `No graded term ${JSON.stringify(term)} for ${cls.name}. Available: ${available}`,
      );
    }

    const xml = await this.post("httploader.p?file=sfgradebook001.w", {
      referer: "sfgradebook001.w",
      xhr: true,
      extra: {
        action: "viewGradeInfoDialog",
        gridCount: "1",
        fromHttp: "yes",
        stuId: this.session.params.nameid ?? "",
        entityId: cls.entityId ?? "",
        corNumId: cls.classId,
        track: cls.track ?? "0",
        section: cls.section ?? "",
        gbId: grade.gbId,
        bucket: grade.bucket ?? term,
        subjectId: "",
        dialogLevel: "1",
        isEoc: "no",
        ishttp: "true",
        "javascript.filesAdded":
          "jquery.1.8.2.js,qsfmain001.css,sfgradebook.css,qsfmain001.min.js,sfgradebook.js,sfprint001.js",
        requestId: String(Date.now()),
      },
    });

    const { letter, percent } = parseTermSummary(xml);
    return {
      categories: parseAssignmentsAsCategories(xml),
      termLetter: letter,
      termPercent: percent,
    };
  }
}

export function resolveTerm(cls: SkywardClass, term: string): TermGrade | null {
  const needle = term.trim().toLowerCase();
  for (const g of cls.grades) {
    if (g.term.toLowerCase() === needle || (g.bucket ?? "").toLowerCase() === needle) return g;
  }
  return null;
}

/** Pick the latest non-empty graded term, used when the caller didn't specify one. */
export function currentTermFor(cls: SkywardClass): TermGrade | null {
  const withLetter = cls.grades.filter((g) => g.letter && g.letter.trim());
  if (withLetter.length === 0) return null;
  return withLetter[withLetter.length - 1];
}
