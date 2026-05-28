import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  plannerStates: defineTable({
    userId: v.string(),
    version: v.number(),
    stateJson: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  skywardCredentials: defineTable({
    userId: v.string(),
    usernameCiphertext: v.string(),
    usernameIv: v.string(),
    usernameAuthTag: v.string(),
    passwordCiphertext: v.string(),
    passwordIv: v.string(),
    passwordAuthTag: v.string(),
    baseUrl: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});

