import type { UserIdentity } from "convex/server";
import type { Doc } from "./_generated/dataModel";

const ADMIN_ROLES = new Set(["admin", "org:admin"]);
const MEMBER_ROLES = new Set(["member", "org:member", "admin", "org:admin"]);

function claimAsRecord(identity: UserIdentity, key: string) {
  const value = identity[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function claimAsString(identity: UserIdentity, key: string) {
  const value = identity[key];
  return typeof value === "string" ? value : undefined;
}

export function getActiveOrgId(identity: UserIdentity) {
  const organization = claimAsRecord(identity, "o");
  const organizationId = organization?.id;

  return claimAsString(identity, "org_id") || (typeof organizationId === "string" ? organizationId : undefined);
}

export function getActiveOrgRole(identity: UserIdentity) {
  const organization = claimAsRecord(identity, "o");
  const organizationRole = organization?.rol;

  return claimAsString(identity, "org_role") || (typeof organizationRole === "string" ? organizationRole : undefined);
}

export function isOrgAdmin(identity: UserIdentity, orgId: string) {
  return getActiveOrgId(identity) === orgId && ADMIN_ROLES.has(getActiveOrgRole(identity) ?? "");
}

export function isOrgMember(identity: UserIdentity, orgId: string) {
  return getActiveOrgId(identity) === orgId && MEMBER_ROLES.has(getActiveOrgRole(identity) ?? "");
}

export function canCreateFile(identity: UserIdentity, orgId: string) {
  return orgId === "" || isOrgMember(identity, orgId);
}

export function canReadFile(identity: UserIdentity, file: Doc<"files">) {
  if (file.orgId) {
    return isOrgMember(identity, file.orgId);
  }

  return file.userId === identity.subject;
}

export function canManageFile(identity: UserIdentity, file: Doc<"files">) {
  if (file.orgId) {
    return isOrgAdmin(identity, file.orgId);
  }

  return file.userId === identity.subject;
}
