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
    isPinned: v.optional(v.boolean()),
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
  }).index("by_orgId", ["orgId"])
    .index("by_fileId", ["fileId"])
    .index("by_fileType", ["fileType"])
    .index("by_isDeleted", ["isDeleted"]),

  fileShares: defineTable({
    fileId: v.id("files"),
    shareId: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_shareId", ["shareId"])
    .index("by_fileId", ["fileId"]),
});
