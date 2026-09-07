"use node";

import { v } from "convex/values";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { SkywardClient, SkywardError, currentTermFor, resolveTerm } from "../src/lib/skyward";
import type { ParsedCategory, ParsedCourse } from "../src/lib/types";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

const ALGO = "aes-256-gcm";
const DEFAULT_BASE_URL =
  "https://skystu.jordan.k12.ut.us/scripts/wsisa.dll/WService=wsEAplus";
const VALID_BASE_URL = /^https:\/\/[^/]+\/scripts\/wsisa\.dll\/WService=wsEAplus$/;

function loadKey(): Buffer {
  const raw = process.env.SKYWARD_ENC_KEY;
  if (!raw) {
    throw new Error(
      "SKYWARD_ENC_KEY is not set. Set with: npx convex env set SKYWARD_ENC_KEY $(openssl rand -base64 32)",
    );
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(`SKYWARD_ENC_KEY must decode to 32 bytes, got ${buf.length}`);
  }
  return buf;
}

function encryptString(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

function decryptString(ciphertext: string, iv: string, authTag: string): string {
  const key = loadKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

const parsedAssignmentValidator = v.object({
  name: v.string(),
  letter: v.union(v.string(), v.null()),
  date: v.union(v.string(), v.null()),
  score: v.union(v.number(), v.null()),
  total: v.number(),
  missing: v.boolean(),
  noCount: v.boolean(),
});

const parsedCategoryValidator = v.object({
  name: v.string(),
  weight: v.union(v.number(), v.null()),
  assignments: v.array(parsedAssignmentValidator),
});

const parsedCourseValidator = v.object({
  name: v.string(),
  categories: v.array(parsedCategoryValidator),
});

const syncResultValidator = v.union(
  v.object({
    ok: v.literal(false),
    reason: v.union(
      v.literal("no-credentials"),
      v.literal("auth"),
      v.literal("network"),
      v.literal("scrape"),
      v.literal("config"),
    ),
    message: v.optional(v.string()),
  }),
  v.object({
    ok: v.literal(true),
    courses: v.array(parsedCourseValidator),
    classMeta: v.array(
      v.object({
        name: v.string(),
        currentTerm: v.union(v.string(), v.null()),
        letter: v.union(v.string(), v.null()),
        percent: v.union(v.number(), v.null()),
      }),
    ),
    errors: v.array(v.object({ className: v.string(), message: v.string() })),
  }),
);

export const setCredentials = action({
  args: {
    username: v.string(),
    password: v.string(),
    baseUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const username = args.username.trim();
    const password = args.password;
    if (!username) throw new Error("Username is required");
    if (!password) throw new Error("Password is required");

    const baseUrl = (args.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
    if (!VALID_BASE_URL.test(baseUrl)) {
      throw new Error(
        "Base URL should look like https://<host>/scripts/wsisa.dll/WService=wsEAplus",
      );
    }

    const u = encryptString(username);
    const p = encryptString(password);

    await ctx.runMutation(internal.skywardData.upsertCredentials, {
      usernameCiphertext: u.ciphertext,
      usernameIv: u.iv,
      usernameAuthTag: u.authTag,
      passwordCiphertext: p.ciphertext,
      passwordIv: p.iv,
      passwordAuthTag: p.authTag,
      baseUrl,
    });
    return null;
  },
});

export const clearCredentials = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    await ctx.runMutation(internal.skywardData.deleteCredentials, {});
    return null;
  },
});

const CONCURRENCY = 4;

function isKphsClassName(name: string): boolean {
  return /^kphs\//i.test(name.trim());
}

function displayClassName(name: string): string {
  const match = name.match(/^kphs\/\s*([^()]+?)(?:\s*\([^)]*\))?\s*$/i);
  return match?.[1]?.trim() || name;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export const syncFromSkyward = action({
  args: {
    /** Term label like "Q4" or bucket like "TERM 4". If omitted, picks each class's latest non-empty term. */
    term: v.optional(v.string()),
    /** When set, only sync the Skyward class whose name matches (fuzzy, case-insensitive). */
    targetClassName: v.optional(v.string()),
  },
  returns: syncResultValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { ok: false as const, reason: "no-credentials" as const };

    let row;
    try {
      row = await ctx.runQuery(internal.skywardData.getCredentialsForAction, {});
    } catch (e: unknown) {
      return {
        ok: false as const,
        reason: "config" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }
    if (!row) return { ok: false as const, reason: "no-credentials" as const };

    let username: string;
    let password: string;
    try {
      username = decryptString(row.usernameCiphertext, row.usernameIv, row.usernameAuthTag);
      password = decryptString(row.passwordCiphertext, row.passwordIv, row.passwordAuthTag);
    } catch {
      return {
        ok: false as const,
        reason: "config" as const,
        message:
          "Failed to decrypt stored credentials — SKYWARD_ENC_KEY may have changed. Reconnect Skyward to re-encrypt with the current key.",
      };
    }

    let client: SkywardClient;
    try {
      client = await SkywardClient.login({ baseUrl: row.baseUrl, username, password });
    } catch (e: unknown) {
      if (e instanceof SkywardError) {
        return {
          ok: false as const,
          reason: (e.reason === "scrape" ? "auth" : e.reason) as "auth" | "network",
          message: e.message,
        };
      }
      return {
        ok: false as const,
        reason: "network" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }

    let classes;
    try {
      classes = await client.getClasses();
    } catch (e: unknown) {
      if (e instanceof SkywardError) {
        return { ok: false as const, reason: e.reason, message: e.message };
      }
      return {
        ok: false as const,
        reason: "network" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }

    const courses: ParsedCourse[] = [];
    const classMeta: {
      name: string;
      currentTerm: string | null;
      letter: string | null;
      percent: number | null;
    }[] = [];
    const errors: { className: string; message: string }[] = [];

    const targetNorm = args.targetClassName?.trim().toLowerCase();
    const filteredClasses = targetNorm
      ? classes.filter((c) => {
          const n = c.name.trim().toLowerCase();
          return n === targetNorm || n.includes(targetNorm) || targetNorm.includes(n);
        })
      : classes;

    await mapWithConcurrency(filteredClasses, CONCURRENCY, async (cls) => {
      // If a term was requested, only pull classes that *have* a grade row for that
      // term. Otherwise fall back to each class's latest non-empty term.
      // KPHS classes are online-course records and may only expose their active Q1
      // grade while the shared picker is already on Q4. Keep those courses visible
      // by falling back to their latest graded term instead of dropping them.
      const term = args.term
        ? resolveTerm(cls, args.term) ?? (isKphsClassName(cls.name) ? currentTermFor(cls) : null)
        : currentTermFor(cls);
      if (!term) return; // skip — class isn't enrolled in this term
      // If the requested term has no letter, the class hasn't been graded there;
      // treat that as "not enrolled this term" and skip rather than pulling stale assignments.
      if (args.term && !term.letter) return;
      try {
        const result = await client.getAssignmentsForClass(cls, term.term);
        const categories: ParsedCategory[] = result.categories;
        const name = displayClassName(cls.name);
        courses.push({ name, categories });
        classMeta.push({
          name,
          currentTerm: term.term,
          letter: result.termLetter ?? term.letter,
          percent: result.termPercent,
        });
      } catch (e: unknown) {
        errors.push({
          className: displayClassName(cls.name),
          message: e instanceof Error ? e.message : String(e),
        });
        classMeta.push({
          name: displayClassName(cls.name),
          currentTerm: term.term,
          letter: term.letter,
          percent: null,
        });
      }
    });

    return { ok: true as const, courses, classMeta, errors };
  },
});
