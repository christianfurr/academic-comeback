import { parseHTML } from "linkedom";
import { SkywardError, type SkywardClass, type TermGrade } from "../types";

const CLASS_TABLE_ID = /^classDesc_(\d+)_(\d+)_\d+_(\w+)$/;
const PERIOD_RE = /Period\s+(\S+)/i;

// Grade cells live inside JS-escaped HTML strings shipped in <script> tags.
// Quotes may be plain or backslash-escaped depending on Skyward's JSON encoder.
const GRADE_CELL =
  /id=\\?['"]showGradeInfo\\?['"][^>]*?data-sId=\\?['"]([^'"]+)\\?['"][^>]*?data-eId=\\?['"]([^'"]+)\\?['"][^>]*?data-cNI=\\?['"]([^'"]+)\\?['"][^>]*?data-trk=\\?['"]([^'"]*)\\?['"][^>]*?data-sec=\\?['"]([^'"]*)\\?['"][^>]*?data-gId=\\?['"]([^'"]*)\\?['"][^>]*?data-bkt=\\?['"]([^'"]*)\\?['"][^>]*?data-lit=\\?['"]([^'"]*)\\?['"][^>]*?>([^<]*)</g;

function normSpace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function elementText(el: Element | null | undefined): string {
  if (!el) return "";
  return normSpace(el.textContent ?? "");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function parseGradebook(html: string): SkywardClass[] {
  const { document } = parseHTML(html);

  const classes = new Map<string, SkywardClass>();

  for (const table of document.querySelectorAll("table[id]") as unknown as Iterable<Element>) {
    const id = (table as Element).getAttribute("id") ?? "";
    const m = id.match(CLASS_TABLE_ID);
    if (!m) continue;
    const cni = m[2];
    if (classes.has(cni)) continue;

    const rows = Array.from((table as Element).querySelectorAll(":scope > tbody > tr, :scope > tr"));
    if (rows.length === 0) continue;

    const nameEl =
      (rows[0] as Element).querySelector("span.classDesc") ?? (rows[0] as Element);
    const name = elementText(nameEl);

    let period: string | null = null;
    if (rows.length > 1) {
      const ptext = elementText(rows[1] as Element);
      const pm = ptext.match(PERIOD_RE);
      if (pm) period = pm[1];
    }

    let teacher: string | null = null;
    if (rows.length > 2) {
      const t = elementText(rows[2] as Element);
      teacher = t || null;
    }

    classes.set(cni, {
      classId: cni,
      name,
      period,
      teacher,
      track: null,
      section: null,
      entityId: null,
      grades: [],
    });
  }

  if (classes.size === 0) {
    throw new SkywardError(
      "scrape",
      `No classDesc_* tables found on gradebook page (snippet: ${html.slice(0, 300)})`,
    );
  }

  const seen = new Set<string>();
  for (const match of html.matchAll(GRADE_CELL)) {
    const [, , eid, cni, trk, sec, gid, bkt, lit, letterRaw] = match;
    const cls = classes.get(cni);
    if (!cls) continue;
    const key = `${cni}|${bkt}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (cls.track === null) cls.track = trk;
    if (cls.section === null) cls.section = sec;
    if (cls.entityId === null) cls.entityId = eid;

    const letter = decodeHtmlEntities(letterRaw).trim();
    const grade: TermGrade = {
      term: lit || bkt,
      bucket: bkt || null,
      letter: letter || null,
      gbId: gid || null,
    };
    cls.grades.push(grade);
  }

  return Array.from(classes.values());
}
