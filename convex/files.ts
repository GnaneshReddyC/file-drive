import { mutation, query, type DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { canCreateFile, canManageFile, canReadFile, isOrgMember } from "./authz";
import type { Id } from "./_generated/dataModel";

async function findActiveFileWithName(
  db: DatabaseReader,
  {
    orgId,
    userId,
    name,
    excludeId,
  }: {
    orgId: string;
    userId: string;
    name: string;
    excludeId?: Id<"files">;
  }
) {
  const files = await db
    .query("files")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .filter((q) => q.eq(q.field("isDeleted"), false))
    .collect();
  const normalizedName = name.toLowerCase();

  return files.find((file) => {
    if (excludeId && file._id === excludeId) return false;
    if (!orgId && file.userId !== userId) return false;
    return file.name.toLowerCase() === normalizedName;
  });
}

export const generateUploadUrl = mutation({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId = args.orgId || "";
    if (!canCreateFile(identity, orgId)) {
      throw new Error("You do not have permission to upload files here");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to delete this file");
    }

    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return args.id;
  },
});

export const deleteFiles = mutation({
  args: { ids: v.array(v.id("files")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const uniqueIds = Array.from(new Set(args.ids));
    const deletedAt = Date.now();

    for (const id of uniqueIds) {
      const file = await ctx.db.get(id);
      if (!file) throw new Error("File not found");

      if (!canManageFile(identity, file)) {
        throw new Error("You do not have permission to delete one or more selected files");
      }

      await ctx.db.patch(id, {
        isDeleted: true,
        deletedAt,
      });
    }

    return uniqueIds;
  },
});

export const renameFile = mutation({
  args: {
    id: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to rename this file");
    }

    const name = args.name.trim();
    if (!name) return { success: false, message: "File name is required" };

    const duplicate = await findActiveFileWithName(ctx.db, {
      orgId: file.orgId,
      userId: file.userId,
      name,
      excludeId: args.id,
    });
    if (duplicate) return { success: false, message: "A file with this name already exists" };

    await ctx.db.patch(args.id, { name });

    return { success: true, id: args.id };
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
    if (!canCreateFile(identity, orgId)) {
      throw new Error("You do not have permission to upload files here");
    }

    const name = args.name.trim();
    if (!name) {
      await ctx.storage.delete(args.fileId);
      return { success: false, message: "File name is required" };
    }

    const duplicate = await findActiveFileWithName(ctx.db, {
      orgId,
      userId: identity.subject,
      name,
    });
    if (duplicate) {
      await ctx.storage.delete(args.fileId);
      return { success: false, message: "A file with this name already exists" };
    }

    const id = await ctx.db.insert("files", {
      name,
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

    return { success: true, id };
  },
});

export const getFiles = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (args.orgId) {
      if (!isOrgMember(identity, args.orgId)) return [];

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

export const getFilesForAi = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const files = args.orgId
      ? isOrgMember(identity, args.orgId)
        ? await ctx.db
            .query("files")
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .filter((q) => q.eq(q.field("isDeleted"), false))
            .collect()
        : []
      : await ctx.db
          .query("files")
          .filter((q) => q.eq(q.field("userId"), identity.subject))
          .filter((q) => q.eq(q.field("orgId"), ""))
          .filter((q) => q.eq(q.field("isDeleted"), false))
          .collect();

    return await Promise.all(
      files.map(async (file) => ({
        _id: file._id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.fileId ? await ctx.storage.getUrl(file.fileId) : file.url || null,
      }))
    );
  },
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.storageId))
      .first();

    if (!file || !canReadFile(identity, file)) return null;

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

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to restore this file");
    }

    const duplicate = await findActiveFileWithName(ctx.db, {
      orgId: file.orgId,
      userId: file.userId,
      name: file.name,
      excludeId: args.id,
    });
    if (duplicate) return { success: false, message: "A file with this name already exists" };

    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
    });

    return { success: true, id: args.id };
  },
});

export const restoreFiles = mutation({
  args: { ids: v.array(v.id("files")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const uniqueIds = Array.from(new Set(args.ids));

    for (const id of uniqueIds) {
      const file = await ctx.db.get(id);
      if (!file) throw new Error("File not found");

      if (!canManageFile(identity, file)) {
        throw new Error("You do not have permission to restore one or more selected files");
      }

      const duplicate = await findActiveFileWithName(ctx.db, {
        orgId: file.orgId,
        userId: file.userId,
        name: file.name,
        excludeId: id,
      });
      if (duplicate) return { success: false, message: `A file named "${file.name}" already exists` };

      await ctx.db.patch(id, {
        isDeleted: false,
        deletedAt: undefined,
      });
    }

    return { success: true, ids: uniqueIds };
  },
});

export const permanentDeleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to permanently delete this file");
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

export const permanentDeleteFiles = mutation({
  args: { ids: v.array(v.id("files")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const uniqueIds = Array.from(new Set(args.ids));

    for (const id of uniqueIds) {
      const file = await ctx.db.get(id);
      if (!file) throw new Error("File not found");

      if (!canManageFile(identity, file)) {
        throw new Error("You do not have permission to permanently delete one or more selected files");
      }

      if (file.fileId && file.fileId !== "") {
        await ctx.storage.delete(file.fileId);
      }

      await ctx.db.delete(id);
    }

    return uniqueIds;
  },
});

export const getTrashFiles = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (args.orgId) {
      if (!isOrgMember(identity, args.orgId)) return [];

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

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to update this file");
    }

    await ctx.db.patch(args.id, {
      isFavorite: !file.isFavorite,
    });

    return !file.isFavorite;
  },
});
