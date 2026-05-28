import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const hasCredentials = query({
  args: {},
  returns: v.union(
    v.object({ connected: v.literal(false) }),
    v.object({ connected: v.literal(true), baseUrl: v.string() }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { connected: false } as const;
    const row = await ctx.db
      .query("skywardCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!row) return { connected: false } as const;
    return { connected: true, baseUrl: row.baseUrl } as const;
  },
});

export const getCredentialsForAction = internalQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      usernameCiphertext: v.string(),
      usernameIv: v.string(),
      usernameAuthTag: v.string(),
      passwordCiphertext: v.string(),
      passwordIv: v.string(),
      passwordAuthTag: v.string(),
      baseUrl: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const row = await ctx.db
      .query("skywardCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!row) return null;
    return {
      usernameCiphertext: row.usernameCiphertext,
      usernameIv: row.usernameIv,
      usernameAuthTag: row.usernameAuthTag,
      passwordCiphertext: row.passwordCiphertext,
      passwordIv: row.passwordIv,
      passwordAuthTag: row.passwordAuthTag,
      baseUrl: row.baseUrl,
    };
  },
});

export const upsertCredentials = internalMutation({
  args: {
    usernameCiphertext: v.string(),
    usernameIv: v.string(),
    usernameAuthTag: v.string(),
    passwordCiphertext: v.string(),
    passwordIv: v.string(),
    passwordAuthTag: v.string(),
    baseUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const existing = await ctx.db
      .query("skywardCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    const updatedAt = Date.now();
    if (!existing) {
      await ctx.db.insert("skywardCredentials", {
        userId: identity.subject,
        updatedAt,
        ...args,
      });
      return null;
    }
    await ctx.db.patch(existing._id, { ...args, updatedAt });
    return null;
  },
});

export const deleteCredentials = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const existing = await ctx.db
      .query("skywardCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});
