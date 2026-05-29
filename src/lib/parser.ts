import type { ParsedAssignment, ParsedCategory, ParsedCourse } from "@/lib/types";

const MISSING_TOKENS = new Set([
  "",
  "-",
  "--",
  "missing",
  "not yet",
  "m",
  "n/a",
  "na",
  "tbd",
  "late",
  "incomplete",
]);

function isMissingToken(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim().toLowerCase();
  return MISSING_TOKENS.has(s);
}

function toNum(v: unknown): number | null {
  if (isMissingToken(v)) return null;
  const cleaned = String(v).replace(/[^\d.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " "));
}

function splitCells(line: string): string[] {
  if (line.includes("\t")) return line.split("\t");
  return line.split(/\s{2,}/);
}

// ===================================================================
// PORTAL FORMAT (Skyward/PowerSchool-style "weighted at X%")
// ===================================================================
function tryPortalFormat(text: string): ParsedCourse[] | null {
  const lines = splitLines(text);
  const allCats: Array<{
    name: string;
    weight: number;
    assignments: Array<{
      date: string;
      name: string;
      letter: string | null;
      score: number | null;
      total: number;
      missing: boolean;
      noCount: boolean;
    }>;
  }> = [];

  let currentCat: (typeof allCats)[number] | null = null;
  let i = 0;

  if (lines[0] && /^(due\b|date\b)/i.test(lines[0])) i = 1;

  while (i < lines.length) {
    const line = lines[i];
    if (!line || !line.trim()) {
      i++;
      continue;
    }
    const tabs = line.split("\t");
    const col0 = (tabs[0] ?? "").trimEnd();
    const col1 = (tabs[1] ?? "").trim();

    if (col0.trim() === "" && col1 && !/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(col1)) {
      const nextLine = (lines[i + 1] ?? "").trim();
      const wm = nextLine.match(/^weighted at\s+([\d.]+)\s*%/i);
      if (wm) {
        currentCat = {
          name: col1,
          weight: Number.parseFloat(wm[1]),
          assignments: [],
        };
        allCats.push(currentCat);
        i += 2;
        continue;
      }
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(col0.trim()) && currentCat) {
      const date = col0.trim();
      const name = col1;
      const gradeStr = (tabs[2] ?? "")
        .replace(/special\s*code/gi, "")
        .replace(/comments/gi, "")
        .trim();
      const pointsStr = (tabs[4] ?? "").trim();

      let earned: number | null = null;
      let possible: number | null = null;

      const pm = pointsStr.match(/([\d.]+|\*)\s+out of\s+([\d.]+)/i);
      if (pm) {
        earned = pm[1] === "*" ? null : Number.parseFloat(pm[1]);
        possible = Number.parseFloat(pm[2]);
      } else {
        // Standards-based grading: tabs[3] = score (0-4), tabs[4] = assignment weight.
        // Scale by weight so sum(score)/sum(total) yields the weighted category average.
        const scoreN = Number.parseFloat((tabs[3] ?? "").trim());
        const weightN = Number.parseFloat((tabs[4] ?? "").trim());
        if (Number.isFinite(scoreN) && Number.isFinite(weightN) && weightN > 0) {
          earned = scoreN * weightN;
          possible = 4 * weightN;
        }
      }

      const missingStr = (tabs[5] ?? "").trim();
      const noCountStr = (tabs[6] ?? "").trim();
      const missing = /missing/i.test(missingStr);
      const noCount = /no count/i.test(noCountStr);

      if (possible === null || possible === 0) {
        i++;
        continue;
      }
      if (missing) earned = 0;

      currentCat.assignments.push({
        date,
        name,
        letter: gradeStr || null,
        score: earned,
        total: possible,
        missing,
        noCount,
      });
      i++;
      continue;
    }

    i++;
  }

  if (allCats.length === 0) return null;
  return groupIntoCourses(allCats);
}

function groupIntoCourses(
  allCats: Array<{
    name: string;
    weight: number;
    assignments: Array<{
      date: string;
      name: string;
      letter: string | null;
      score: number | null;
      total: number;
      missing: boolean;
      noCount: boolean;
    }>;
  }>,
): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  let current: ParsedCourse["categories"] = [];
  let sum = 0;

  for (const cat of allCats) {
    current.push({
      name: cat.name,
      weight: cat.weight,
      assignments: cat.assignments.map((a) => ({
        name: a.name,
        letter: a.letter,
        date: a.date,
        score: a.missing ? null : a.score,
        total: a.total,
        missing: a.missing,
        noCount: a.noCount,
      })),
    });
    sum += cat.weight || 0;
    if (Math.abs(sum - 100) < 0.6) {
      courses.push({ name: "Untitled Class", categories: current });
      current = [];
      sum = 0;
    }
  }
  if (current.length) courses.push({ name: "Untitled Class", categories: current });
  return courses;
}

// ===================================================================
// GENERIC FORMAT — "Category (40%)" header + tab-sep rows
// ===================================================================
function parseCategoryHeader(line: string): { name: string; weight: number } | null {
  const m = line.match(
    /^([A-Za-z &/\-]+?)\s*[\(\-\u2013\u2014:]\s*(\d+(?:\.\d+)?)\s*%?\s*\)?\s*$/,
  );
  if (m && m[2]) return { name: m[1].trim(), weight: Number.parseFloat(m[2]) };
  return null;
}

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return /\b(assignment|category|score|points|grade|out of|possible|total|earned|weight|due)\b/.test(
    joined,
  );
}

type ColumnMap = {
  name: number;
  category: number;
  score: number;
  total: number;
  weight: number;
  due: number;
};

function mapColumns(headerCells: string[]): ColumnMap {
  const cols: ColumnMap = { name: -1, category: -1, score: -1, total: -1, weight: -1, due: -1 };
  headerCells.forEach((cell, i) => {
    const c = cell.toLowerCase().trim();
    if (cols.category < 0 && /category|type|group/.test(c)) cols.category = i;
    else if (cols.name < 0 && /assignment|name|title|description|item/.test(c)) cols.name = i;
    else if (
      cols.score < 0 &&
      /(^|\s)(score|earned|points earned|points|grade|pts)\b/.test(c) &&
      !/possible|total|out/.test(c)
    )
      cols.score = i;
    else if (cols.total < 0 && /(out of|possible|total|points possible|max|pts\.? possible)/.test(c))
      cols.total = i;
    else if (cols.weight < 0 && /weight|%/.test(c)) cols.weight = i;
    else if (cols.due < 0 && /date|due/.test(c)) cols.due = i;
  });
  return cols;
}

function parseFraction(cell: string): { score: number | null; total: number | null } | null {
  const m = String(cell).match(/(-?\d+(?:\.\d+)?|-|--|missing)\s*\/\s*(\d+(?:\.\d+)?)/i);
  if (m) return { score: toNum(m[1]), total: toNum(m[2]) };
  return null;
}

function tryGenericFormat(text: string): ParsedCourse[] | null {
  const lines = splitLines(text).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const assignments: Array<{
    name: string;
    category: string;
    score: number;
    total: number;
    missing: boolean;
    noCount: boolean;
  }> = [];

  const categoryWeights: Record<string, number> = {};
  let currentCategory: string | null = null;
  let columnMap: ColumnMap | null = null;
  let className: string | null = null;

  const firstCells = splitCells(lines[0])
    .map((c) => c.trim())
    .filter(Boolean);
  if (
    firstCells.length === 1 &&
    !/\d/.test(firstCells[0]) &&
    firstCells[0].length < 60 &&
    !parseCategoryHeader(firstCells[0])
  ) {
    className = firstCells[0];
  }

  for (const raw of lines) {
    const cells = splitCells(raw).map((c) => c.trim());
    if (/^(overall|current|class|total|cumulative)\s+(grade|average|score)/i.test(raw)) continue;

    const nonEmptyCells = cells.filter(Boolean);

    if (nonEmptyCells.length === 1) {
      const ch = parseCategoryHeader(nonEmptyCells[0]);
      if (ch) {
        currentCategory = ch.name;
        categoryWeights[ch.name] = ch.weight;
        continue;
      }
      if (/^[A-Za-z][A-Za-z &/\-]+$/.test(nonEmptyCells[0]) && nonEmptyCells[0].length < 30) {
        currentCategory = nonEmptyCells[0].trim();
        continue;
      }
    }

    if (!columnMap && isHeaderRow(cells)) {
      columnMap = mapColumns(cells);
      continue;
    }

    let name: string | null = null;
    let category = currentCategory;
    let score: number | null = null;
    let total: number | null = null;

    if (columnMap) {
      if (columnMap.name >= 0) name = cells[columnMap.name] ?? null;
      if (columnMap.category >= 0 && cells[columnMap.category]) category = cells[columnMap.category];
      if (columnMap.score >= 0) score = toNum(cells[columnMap.score]);
      if (columnMap.total >= 0) total = toNum(cells[columnMap.total]);

      if (columnMap.score >= 0 && (score === null || total === null)) {
        const frac = parseFraction(cells[columnMap.score] ?? "");
        if (frac) {
          score = score ?? frac.score;
          total = total ?? frac.total;
        }
      }
    } else {
      let fracIdx = -1;
      let frac: { score: number | null; total: number | null } | null = null;
      for (let j = 0; j < cells.length; j++) {
        const f = parseFraction(cells[j] ?? "");
        if (f) {
          fracIdx = j;
          frac = f;
          break;
        }
      }

      if (frac) {
        score = frac.score;
        total = frac.total;
        const candidateName =
          cells
            .filter((_, idx) => idx !== fracIdx)
            .filter((c) => c && !/^\d+(\.\d+)?%?$/.test(c))
            .sort((a, b) => b.length - a.length)[0] ?? cells[0];
        name = candidateName ?? null;
      } else {
        for (let j = 0; j < cells.length - 1; j++) {
          const a = toNum(cells[j]);
          const b = toNum(cells[j + 1]);
          const aMissing = isMissingToken(cells[j]);
          if ((a !== null || aMissing) && b !== null && b > 0) {
            score = aMissing ? null : a;
            total = b;
            const before = cells.slice(0, j).filter((c) => c && !/^\d{1,2}\/\d{1,2}/.test(c));
            if (before.length === 1) name = before[0] ?? null;
            else if (before.length > 1) {
              category = category || (before[0] ?? null);
              name = before.slice(1).join(" ");
            }
            break;
          }
        }
      }
    }

    if (!name || total === null || total === 0) continue;
    const missing = score === null;

    assignments.push({
      name: name.trim(),
      category: (category || "Uncategorized").trim(),
      score: missing ? 0 : (score ?? 0),
      total,
      missing,
      noCount: false,
    });
  }

  if (assignments.length === 0) return null;

  const catMap: Record<string, { name: string; weight: number | null; assignments: ParsedCourse["categories"][number]["assignments"] }> =
    {};

  assignments.forEach((a) => {
    if (!catMap[a.category]) {
      catMap[a.category] = { name: a.category, weight: categoryWeights[a.category] ?? null, assignments: [] };
    }
    catMap[a.category].assignments.push({
      name: a.name,
      score: a.missing ? null : a.score,
      total: a.total,
      missing: a.missing,
      noCount: false,
      letter: null,
      date: null,
    });
  });

  const categories = Object.values(catMap).map((c) => ({
    name: c.name,
    weight: c.weight,
    assignments: c.assignments,
  }));

  const hasWeights = categories.some((c) => c.weight !== null && c.weight > 0);
  if (!hasWeights) {
    const each = Math.round(100 / categories.length);
    categories.forEach((c, idx) => {
      c.weight = idx === categories.length - 1 ? 100 - each * (categories.length - 1) : each;
    });
  } else {
    const totalWeight = categories.reduce((s, c) => s + (c.weight || 0), 0);
    const remaining = Math.max(0, 100 - totalWeight);
    const nullCats = categories.filter((c) => c.weight === null);
    if (nullCats.length > 0) {
      const each = remaining / nullCats.length;
      nullCats.forEach((c) => {
        c.weight = each;
      });
    }
  }

  return [
    {
      name: className || "Untitled Class",
      categories: categories.map((c) => ({
        name: c.name,
        weight: c.weight,
        assignments: c.assignments,
      })),
    },
  ];
}

// ===================================================================
// SKYWARD PASTE FORMAT — category rows + "X out of Y", no weights
//   Due | Assignment | Grade | Score(%) | Points Earned | Missing | No Count | Absent
// Categories are rows with no leading date; real assignments always
// start with a MM/DD/YY date. Categories may carry no weight at all.
// ===================================================================
const SKY_DATE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const SKY_POINTS = /^([\d.]+|\*)\s+out of\s+([\d.]+)$/i;
const SKY_PERCENT = /^\d+(?:\.\d+)?%?$/;
const SKY_LETTER = /^[A-F][+\-]?(?:\s+comments)?$/i;
const SKY_FLAG = /^(missing|no count|excused|unexcused|exempt|late|absent)\b/i;
const SKY_EMPTY_CAT = /^there are no .* assignments?\.?$/i;

function isSkywardHeader(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return /\bassignment\b/.test(joined) && /(points earned|score\s*\(?%)/.test(joined);
}

function firstMetaIndex(cells: string[], from: number): number {
  for (let i = from; i < cells.length; i++) {
    const c = cells[i];
    if (SKY_LETTER.test(c) || SKY_PERCENT.test(c) || SKY_POINTS.test(c) || SKY_FLAG.test(c)) {
      return i;
    }
  }
  return cells.length;
}

function trySkywardPasteFormat(text: string): ParsedCourse[] | null {
  const lines = splitLines(text);
  let sawHeader = false;

  const cats: Array<{
    name: string;
    assignments: ParsedAssignment[];
  }> = [];
  let current: (typeof cats)[number] | null = null;

  const ensureCat = (name: string) => {
    let cat = cats.find((c) => c.name === name);
    if (!cat) {
      cat = { name, assignments: [] };
      cats.push(cat);
    }
    current = cat;
  };

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const cells = splitCells(raw)
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length === 0) continue;

    if (SKY_EMPTY_CAT.test(cells.join(" "))) continue;

    const hasDate = SKY_DATE.test(cells[0]);

    if (!hasDate) {
      if (isSkywardHeader(cells)) {
        sawHeader = true;
        continue;
      }
      // No date → category header (the rollup row, if any, is ignored).
      const meta = firstMetaIndex(cells, 1);
      ensureCat(cells.slice(0, meta).join(" "));
      continue;
    }

    if (!current) ensureCat("Uncategorized");

    const meta = firstMetaIndex(cells, 1);
    const name = cells.slice(1, meta).join(" ");
    if (!name) continue;

    const pointsCell = cells.find((c) => SKY_POINTS.test(c));
    if (!pointsCell) continue;
    const pm = pointsCell.match(SKY_POINTS);
    if (!pm) continue;
    const total = Number.parseFloat(pm[2]);
    if (!Number.isFinite(total) || total === 0) continue;
    let earned: number | null = pm[1] === "*" ? null : Number.parseFloat(pm[1]);

    const letterCell = cells.slice(1, meta + 2).find((c) => SKY_LETTER.test(c));
    const letter = letterCell ? letterCell.replace(/\s+comments$/i, "").trim() : null;

    const missing = earned === null || cells.some((c) => /^missing\b/i.test(c));
    const noCount = cells.some((c) => /^no count\b/i.test(c));
    if (missing) earned = null;

    current!.assignments.push({
      name,
      letter,
      date: cells[0],
      score: missing ? null : earned,
      total,
      missing,
      noCount,
    });
  }

  if (!sawHeader) return null;

  const filled = cats.filter((c) => c.assignments.length > 0);
  if (filled.length === 0) return null;

  // No weights in this format — distribute equally across non-empty categories.
  const each = Math.round(100 / filled.length);
  const categories: ParsedCategory[] = filled.map((c, idx) => ({
    name: c.name,
    weight: idx === filled.length - 1 ? 100 - each * (filled.length - 1) : each,
    assignments: c.assignments,
  }));

  return [{ name: "Untitled Class", categories }];
}

// ===================================================================
// PUBLIC API — returns array of courses
// ===================================================================
export function parseGradeData(text: string): ParsedCourse[] | null {
  if (!text.trim()) return null;

  let result = tryPortalFormat(text);
  if (
    result &&
    result.length > 0 &&
    result.some((c) => c.categories.some((cat) => cat.assignments.length > 0))
  ) {
    return result;
  }

  result = trySkywardPasteFormat(text);
  if (
    result &&
    result.length > 0 &&
    result.some((c) => c.categories.some((cat) => cat.assignments.length > 0))
  ) {
    return result;
  }

  result = tryGenericFormat(text);
  if (result && result.length > 0) return result;

  return null;
}

