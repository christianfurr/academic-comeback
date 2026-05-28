import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  returns: v.union(v.null(), v.object({ version: v.number(), stateJson: v.string() })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const row = await ctx.db
      .query("plannerStates")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) return null;
    return { version: row.version, stateJson: row.stateJson };
  },
});

export const set = mutation({
  args: { version: v.number(), stateJson: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("plannerStates")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const updatedAt = Date.now();

    if (!existing) {
      await ctx.db.insert("plannerStates", {
        userId: identity.subject,
        version: args.version,
        stateJson: args.stateJson,
        updatedAt,
      });
      return null;
    }

    await ctx.db.patch(existing._id, {
      version: args.version,
      stateJson: args.stateJson,
      updatedAt,
    });
    return null;
  },
});

export const clear = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db
      .query("plannerStates")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

