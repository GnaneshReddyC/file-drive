import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (file.userId !== identity.subject) {
      throw new Error("You can only delete your own files");
    }

    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return args.id;
  },
});


export const createFile = mutation({
  args: { 
    name: v.string(), 
    orgId: v.optional(v.string()),
    fileId: v.string(),
    url: v.string(),
    type: v.string(),
    fileType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId = args.orgId || "";

    await ctx.db.insert("files", {
      name: args.name,
      userId: identity.subject,
      orgId: orgId,
      type: args.type,
      fileType: args.fileType,
      fileId: args.fileId,
      url: args.url,
      size: args.size,
      isFavorite: false,
      isDeleted: false,
    });
  },
});

export const getFiles = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (args.orgId) {
      return await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
    } else {
      return await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .filter((q) => q.eq(q.field("orgId"), ""))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
    }
  },
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
export const restoreFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (file.userId !== identity.subject) {
      throw new Error("You can only restore your own files");
    }

    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
    });

    return args.id;
  },
});
export const permanentDeleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (file.userId !== identity.subject) {
      throw new Error("You can only permanently delete your own files");
    }

    // Delete from storage if there's a storageId
    if (file.fileId && file.fileId !== "") {
      await ctx.storage.delete(file.fileId);
    }

    // Delete the document from the database
    await ctx.db.delete(args.id);

    return args.id;
  },
});
export const getTrashFiles = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (args.orgId) {
      return await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .filter((q) => q.eq(q.field("isDeleted"), true))
        .collect();
    } else {
      return await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .filter((q) => q.eq(q.field("orgId"), ""))
        .filter((q) => q.eq(q.field("isDeleted"), true))
        .collect();
    }
  },
});

export const toggleFavorite = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (file.userId !== identity.subject) {
      throw new Error("You can only favorite your own files");
    }

    await ctx.db.patch(args.id, {
      isFavorite: !file.isFavorite,
    });

    return !file.isFavorite;
  },
});