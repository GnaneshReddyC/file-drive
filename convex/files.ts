import { mutation, query, type DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { canCreateFile, canManageFile, canReadFile, canReadFolder, isOrgMember } from "./authz";
import type { Doc, Id } from "./_generated/dataModel";

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

async function findActiveFolderWithName(
  db: DatabaseReader,
  {
    orgId,
    userId,
    parentId,
    name,
  }: {
    orgId: string;
    userId: string;
    parentId?: Id<"folders">;
    name: string;
  }
) {
  const folders = await db
    .query("folders")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .filter((q) => q.eq(q.field("isDeleted"), false))
    .collect();
  const normalizedName = name.toLowerCase();

  return folders.find((folder) => {
    if (!orgId && folder.userId !== userId) return false;
    return folder.parentId === parentId && folder.name.toLowerCase() === normalizedName;
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

export const moveFiles = mutation({
  args: {
    ids: v.array(v.id("files")),
    folderId: v.optional(v.union(v.id("folders"), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const uniqueIds = Array.from(new Set(args.ids));
    if (uniqueIds.length === 0) return { success: true, ids: uniqueIds };

    let destinationOrgId: string | null = null;
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.isDeleted) return { success: false, message: "Folder not found" };
      if (!canReadFolder(identity, folder)) {
        return { success: false, message: "You do not have permission to move files there" };
      }
      destinationOrgId = folder.orgId;
    }

    for (const id of uniqueIds) {
      const file = await ctx.db.get(id);
      if (!file) throw new Error("File not found");

      if (!canManageFile(identity, file)) {
        throw new Error("You do not have permission to move one or more selected files");
      }

      if (destinationOrgId !== null && file.orgId !== destinationOrgId) {
        return { success: false, message: "Files can only move to folders in the same workspace" };
      }

      await ctx.db.patch(id, {
        folderId: args.folderId ?? undefined,
      });
    }

    return { success: true, ids: uniqueIds };
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

export const moveFile = mutation({
  args: {
    id: v.id("files"),
    folderId: v.optional(v.union(v.id("folders"), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to move this file");
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.isDeleted) return { success: false, message: "Folder not found" };

      if (!canReadFolder(identity, folder) || folder.orgId !== file.orgId) {
        return { success: false, message: "You do not have permission to move this file there" };
      }
    }

    await ctx.db.patch(args.id, {
      folderId: args.folderId ?? undefined,
    });

    return { success: true, id: args.id };
  },
});


export const createFile = mutation({
  args: { 
    name: v.string(), 
    orgId: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
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

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.isDeleted) {
        await ctx.storage.delete(args.fileId);
        return { success: false, message: "Folder not found" };
      }

      if (!canReadFolder(identity, folder) || folder.orgId !== orgId) {
        await ctx.storage.delete(args.fileId);
        return { success: false, message: "You do not have permission to upload to this folder" };
      }
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
      folderId: args.folderId,
      type: args.type,
      fileType: args.fileType,
      fileId: args.fileId,
      url: args.url,
      size: args.size,
      isFavorite: false,
      isPinned: false,
      isDeleted: false,
    });

    return { success: true, id };
  },
});

export const getFiles = query({
  args: {
    orgId: v.optional(v.string()),
    folderId: v.optional(v.union(v.id("folders"), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    if (args.orgId) {
      if (!isOrgMember(identity, args.orgId)) return [];

      let files = await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
      if (args.folderId !== undefined) {
        files = files.filter((file) => (file.folderId ?? null) === args.folderId);
      }
      return sortPinnedFirst(files);
    } else {
      let files = await ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .filter((q) => q.eq(q.field("orgId"), ""))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();
      if (args.folderId !== undefined) {
        files = files.filter((file) => (file.folderId ?? null) === args.folderId);
      }
      return sortPinnedFirst(files);
    }
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    orgId: v.optional(v.string()),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId = args.orgId || "";
    if (!canCreateFile(identity, orgId)) {
      throw new Error("You do not have permission to create folders here");
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.isDeleted) return { success: false, message: "Parent folder not found" };
      if (!canReadFolder(identity, parent) || parent.orgId !== orgId) {
        return { success: false, message: "You do not have permission to create a folder here" };
      }
    }

    const name = args.name.trim();
    if (!name) return { success: false, message: "Folder name is required" };

    const duplicate = await findActiveFolderWithName(ctx.db, {
      orgId,
      userId: identity.subject,
      parentId: args.parentId,
      name,
    });
    if (duplicate) return { success: false, message: "A folder with this name already exists" };

    const id = await ctx.db.insert("folders", {
      name,
      orgId,
      userId: identity.subject,
      parentId: args.parentId,
      isDeleted: false,
    });

    return { success: true, id };
  },
});

export const renameFolder = mutation({
  args: {
    id: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.isDeleted) throw new Error("Folder not found");

    if (!canReadFolder(identity, folder)) {
      throw new Error("You do not have permission to rename this folder");
    }

    const name = args.name.trim();
    if (!name) return { success: false, message: "Folder name is required" };
    if (name === folder.name) return { success: true, id: args.id };

    const duplicate = await findActiveFolderWithName(ctx.db, {
      orgId: folder.orgId,
      userId: folder.userId,
      parentId: folder.parentId,
      name,
    });
    if (duplicate) return { success: false, message: "A folder with this name already exists" };

    await ctx.db.patch(args.id, { name });

    return { success: true, id: args.id };
  },
});

export const deleteFolder = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.isDeleted) throw new Error("Folder not found");

    if (!canReadFolder(identity, folder)) {
      throw new Error("You do not have permission to delete this folder");
    }

    const childFolder = await ctx.db
      .query("folders")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.id))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();
    if (childFolder) return { success: false, message: "Delete or move nested folders first" };

    const childFile = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("folderId"), args.id))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();
    if (childFile) return { success: false, message: "Move or delete files in this folder first" };

    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return { success: true, id: args.id };
  },
});

export const getFolders = query({
  args: {
    orgId: v.optional(v.string()),
    parentId: v.optional(v.union(v.id("folders"), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = args.orgId || "";
    if (orgId && !isOrgMember(identity, orgId)) return [];

    let folders = await ctx.db
      .query("folders")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    if (!orgId) {
      folders = folders.filter((folder) => folder.userId === identity.subject);
    }

    const parentId = args.parentId ?? null;
    return folders
      .filter((folder) => (folder.parentId ?? null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  },
});

export const getAllFolders = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = args.orgId || "";
    if (orgId && !isOrgMember(identity, orgId)) return [];

    let folders = await ctx.db
      .query("folders")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    if (!orgId) {
      folders = folders.filter((folder) => folder.userId === identity.subject);
    }

    return folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  },
});

export const getFolderPath = query({
  args: { folderId: v.optional(v.union(v.id("folders"), v.null())) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !args.folderId) return [];

    const path: Array<{ _id: Id<"folders">; name: string }> = [];
    let currentId: Id<"folders"> | undefined = args.folderId;

    while (currentId) {
      const folder: Doc<"folders"> | null = await ctx.db.get(currentId);
      if (!folder || folder.isDeleted || !canReadFolder(identity, folder)) return [];

      path.unshift({ _id: folder._id, name: folder.name });
      currentId = folder.parentId;
    }

    return path;
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

export const createShareLink = mutation({
  args: {
    id: v.id("files"),
    expiresInDays: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canReadFile(identity, file)) {
      throw new Error("You do not have permission to share this file");
    }

    const expiresInDays = Math.min(Math.max(Math.floor(args.expiresInDays), 1), 30);
    const shareId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

    await ctx.db.insert("fileShares", {
      fileId: args.id,
      shareId,
      createdBy: identity.subject,
      createdAt: now,
      expiresAt,
    });

    return { shareId, expiresAt };
  },
});

export const createFolderShareLink = mutation({
  args: {
    id: v.id("folders"),
    expiresInDays: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.isDeleted) throw new Error("Folder not found");

    if (!canReadFolder(identity, folder)) {
      throw new Error("You do not have permission to share this folder");
    }

    const expiresInDays = Math.min(Math.max(Math.floor(args.expiresInDays), 1), 30);
    const shareId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

    await ctx.db.insert("folderShares", {
      folderId: args.id,
      shareId,
      createdBy: identity.subject,
      createdAt: now,
      expiresAt,
    });

    return { shareId, expiresAt };
  },
});

export const getSharedFile = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("fileShares")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!share) return null;
    if (share.expiresAt < Date.now()) return { expired: true as const };

    const file = await ctx.db.get(share.fileId);
    if (!file || file.isDeleted) return null;

    return {
      expired: false as const,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.fileId ? await ctx.storage.getUrl(file.fileId) : file.url,
      expiresAt: share.expiresAt,
    };
  },
});

export const getSharedItem = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const fileShare = await ctx.db
      .query("fileShares")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .first();

    if (fileShare) {
      if (fileShare.expiresAt < Date.now()) return { expired: true as const };

      const file = await ctx.db.get(fileShare.fileId);
      if (!file || file.isDeleted) return null;

      return {
        expired: false as const,
        kind: "file" as const,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.fileId ? await ctx.storage.getUrl(file.fileId) : file.url,
        expiresAt: fileShare.expiresAt,
      };
    }

    const folderShare = await ctx.db
      .query("folderShares")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!folderShare) return null;
    if (folderShare.expiresAt < Date.now()) return { expired: true as const };

    const folder = await ctx.db.get(folderShare.folderId);
    if (!folder || folder.isDeleted) return null;

    const files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", folder.orgId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_parentId", (q) => q.eq("parentId", folder._id))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    const sharedFiles = await Promise.all(
      files
        .filter((file) => (file.folderId ?? null) === folder._id)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map(async (file) => ({
          id: file._id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.fileId ? await ctx.storage.getUrl(file.fileId) : file.url,
        }))
    );

    return {
      expired: false as const,
      kind: "folder" as const,
      name: folder.name,
      expiresAt: folderShare.expiresAt,
      folders: folders
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map((childFolder) => ({
          id: childFolder._id,
          name: childFolder.name,
        })),
      files: sharedFiles,
    };
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

export const togglePin = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    if (!canManageFile(identity, file)) {
      throw new Error("You do not have permission to update this file");
    }

    const isPinned = !Boolean(file.isPinned);
    await ctx.db.patch(args.id, { isPinned });

    return isPinned;
  },
});

function sortPinnedFirst<T extends { isPinned?: boolean; _creationTime: number }>(files: T[]) {
  return files.sort((a, b) => {
    const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinDiff !== 0) return pinDiff;
    return b._creationTime - a._creationTime;
  });
}
