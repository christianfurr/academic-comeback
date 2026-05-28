import { parseHTML } from "linkedom";
import type { ParsedAssignment, ParsedCategory } from "@/lib/types";
import { SkywardError } from "../types";

const CDATA_OUTPUT = /<output><!\[CDATA\[([\s\S]*?)\]\]><\/output>/;
const POINTS = /^\s*([\d.]+|\*)\s+out of\s+([\d.]+)\s*$/i;
const DATE = /^\d{2}\/\d{2}\/\d{2,4}$/;
const WEIGHTED = /weighted at\s+([\d.]+)\s*%/i;

function maybeDateLike(text: string): string | null {
  const trimmed = text.trim();
  return DATE.test(trimmed) ? trimmed : null;
}

function maybeFloat(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

function cellText(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function extractInner(xml: string): string {
  const m = xml.match(CDATA_OUTPUT);
  return m ? m[1] : xml;
}

export function parseTermSummary(xml: string): { letter: string | null; percent: number | null } {
  const inner = extractInner(xml);
  const { document } = parseHTML(inner);
  const grid = document.querySelector('table[id^="grid_stuTermSummaryGrid_"]');
  if (!grid) return { letter: null, percent: null };
  const body = grid.querySelector("tbody") ?? grid;
  const row = body.querySelector("tr");
  if (!row) return { letter: null, percent: null };
  const cells = Array.from(row.querySelectorAll(":scope > td")) as Element[];
  if (cells.length === 0) return { letter: null, percent: null };
  const letter = cellText(cells[0]) || null;
  const percent = cells.length > 1 ? maybeFloat(cellText(cells[cells.length - 1])) : null;
  return { letter, percent };
}

/**
 * Parse the per-class assignment popup into ParsedCategory[] — directly compatible
 * with the existing diffClassFromParsed pipeline.
 *
 * The popup lays out rows as: optional category-name row, optional weight row
 * ("Assignment weighted at X%"), then real assignment rows. We tolerate both
 * "name on its own row" and "name inline with weight".
 */
export function parseAssignmentsAsCategories(xml: string): ParsedCategory[] {
  const inner = extractInner(xml);
  const { document } = parseHTML(inner);
  const grid = document.querySelector('table[id^="grid_stuAssignmentSummaryGrid_"]');
  if (!grid) {
    throw new SkywardError(
      "scrape",
      `No assignment grid in popup response (snippet: ${inner.slice(0, 300)})`,
    );
  }

  const body = grid.querySelector("tbody") ?? grid;
  const rows = Array.from(body.querySelectorAll(":scope > tr")) as Element[];

  type CatBuilder = { name: string; weight: number | null; assignments: ParsedAssignment[] };
  const cats: CatBuilder[] = [];
  let current: CatBuilder | null = null;
  let pendingName: string | null = null;

  const ensureCategory = (name: string, weight: number | null): CatBuilder => {
    const cat: CatBuilder = { name, weight, assignments: [] };
    cats.push(cat);
    return cat;
  };

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll(":scope > td")) as Element[];
    if (cells.length === 0) continue;
    const texts = cells.map(cellText);

    const due = maybeDateLike(texts[0] ?? "");
    if (due === null) {
      const label = (texts.length > 1 && texts[1] ? texts[1] : texts[0]) || "";
      if (!label) continue;
      const wm = label.match(WEIGHTED);
      if (wm) {
        const weight = Number.parseFloat(wm[1]);
        const namePart = label.replace(/^assignment\s+/i, "").replace(WEIGHTED, "").trim();
        const name = pendingName || (namePart && !/^assignment$/i.test(namePart) ? namePart : "Category");
        current = ensureCategory(name, weight);
        pendingName = null;
      } else {
        pendingName = label;
      }
      continue;
    }

    if (!current) {
      // Assignment appeared before any category header — bucket into a synthetic category.
      current = ensureCategory(pendingName ?? "Uncategorized", null);
      pendingName = null;
    }

    const name = texts[1] ?? "";
    const letter =
      (texts[2] || "")
        .replace(/special\s*code/gi, "")
        .replace(/comments/gi, "")
        .trim() || null;

    let pointsEarned: number | null = null;
    let pointsPossible: number | null = null;
    if (texts.length > 4) {
      const pm = texts[4].match(POINTS);
      if (pm) {
        pointsEarned = pm[1] === "*" ? null : Number.parseFloat(pm[1]);
        pointsPossible = Number.parseFloat(pm[2]);
      } else {
        // Standards-based grading: texts[3] = score (0-4), texts[4] = assignment weight.
        // Scale by weight so sum(score)/sum(total) yields the weighted category average.
        const scoreN = maybeFloat(texts[3] ?? "");
        const weightN = maybeFloat(texts[4] ?? "");
        if (scoreN !== null && weightN !== null && weightN > 0) {
          pointsEarned = scoreN * weightN;
          pointsPossible = 4 * weightN;
        }
      }
    }
    const missing = texts.length > 5 ? texts[5].trim().length > 0 : false;
    const noCount = texts.length > 6 ? /no\s*count/i.test(texts[6]) : false;

    // Skip rows we can't anchor.
    if (pointsPossible === null || pointsPossible === 0) continue;

    current.assignments.push({
      name,
      letter,
      date: due,
      score: missing ? null : pointsEarned,
      total: pointsPossible,
      missing,
      noCount,
    });
  }

  return cats.map((c) => ({ name: c.name, weight: c.weight, assignments: c.assignments }));
}
