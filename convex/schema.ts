import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
  
  files: defineTable({
    name: v.string(),
    orgId: v.string(),
    userId: v.string(),
    fileId: v.string(),
    url: v.string(),
    type: v.string(),
    fileType: v.optional(v.string()),
    size: v.number(),
    isFavorite: v.boolean(),
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_orgId", ["orgId"])
    .index("by_fileType", ["fileType"])
    .index("by_isDeleted", ["isDeleted"]),
});