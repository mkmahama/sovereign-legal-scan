import { NextFunction, Request, Response } from "express";
import { adminAuth, requireAdminDb } from "./firebaseAdmin.js";
import { getRecord, isPostgresMode, verifyLocalToken } from "./postgresStore.js";

export interface AuthenticatedRequest extends Request {
  identity?: { uid: string; email?: string; phoneNumber?: string };
}

const firmManagerPermissions = {
  canView: true,
  canEdit: true,
  canShare: true,
  canMessage: true,
  canUpload: true,
  canGenerateDrafts: true,
  canApproveFilings: true,
  canExport: true,
};

export async function requireIdentity(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) throw Object.assign(new Error("Authentication is required."), { status: 401, code: "AUTH_REQUIRED" });
    if (isPostgresMode()) {
      const decoded = verifyLocalToken(header.slice(7));
      const profile = await getRecord<any>("users", decoded.uid);
      if (!profile) throw Object.assign(new Error("Create a firm or accept an invitation to continue."), { status: 404, code: "PROFILE_NOT_FOUND" });
      if (profile.status === "Suspended") throw Object.assign(new Error("This account is suspended."), { status: 403, code: "ACCOUNT_SUSPENDED" });
      req.identity = { uid: decoded.uid, email: decoded.email };
      next();
      return;
    }
    const decoded = await adminAuth().verifyIdToken(header.slice(7), true);
    const profile = await requireAdminDb().collection("users").doc(decoded.uid).get();
    if (profile.exists && profile.data()?.status === "Suspended") throw Object.assign(new Error("This account is suspended."), { status: 403, code: "ACCOUNT_SUSPENDED" });
    req.identity = { uid: decoded.uid, email: decoded.email, phoneNumber: decoded.phone_number };
    next();
  } catch (error) { next(error); }
}

export async function getCaseAccess(caseId: string, uid: string) {
  if (isPostgresMode()) {
    const [caseData, member] = await Promise.all([
      getRecord<any>("cases", caseId),
      getRecord<any>("caseMemberships", `${caseId}_${uid}`),
    ]);
    if (!caseData) throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
    if (caseData.createdByUid === uid) {
      return { caseData, permissions: firmManagerPermissions };
    }
    const firmMember = await getRecord<any>("firmMemberships", `${caseData.firmId}_${uid}`);
    if (firmMember?.status === "Active" && ["Owner", "Admin", "Member"].includes(firmMember.firmRole)) {
      return { caseData, permissions: firmManagerPermissions };
    }
    if (!member || member.status !== "Active" || !member.permissions?.canView) {
      throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
    }
    return { caseData, permissions: member.permissions };
  }
  const db = requireAdminDb();
  const [caseSnap, memberSnap] = await Promise.all([
    db.collection("cases").doc(caseId).get(),
    db.collection("caseMemberships").doc(`${caseId}_${uid}`).get(),
  ]);
  if (!caseSnap.exists) throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
  const caseData = caseSnap.data()!;
  const member = memberSnap.data();
  if (caseData.createdByUid === uid) {
    return { caseData, permissions: firmManagerPermissions };
  }
  const firmMemberSnap = await db.collection("firmMemberships").doc(`${caseData.firmId}_${uid}`).get();
  const firmMember = firmMemberSnap.data();
  if (firmMemberSnap.exists && firmMember?.status === "Active" && ["Owner", "Admin", "Member"].includes(firmMember?.firmRole)) {
    return { caseData, permissions: firmManagerPermissions };
  }
  if (!memberSnap.exists || member?.status !== "Active" || !member?.permissions?.canView) {
    throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
  }
  return { caseData, permissions: member.permissions };
}

export async function requireFirmRole(firmId: string, uid: string, roles: string[]) {
  if (isPostgresMode()) {
    const data = await getRecord<any>("firmMemberships", `${firmId}_${uid}`);
    if (!data || data.status !== "Active" || !roles.includes(data.firmRole)) {
      throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
    }
    return data;
  }
  const membership = await requireAdminDb().collection("firmMemberships").doc(`${firmId}_${uid}`).get();
  const data = membership.data();
  if (!membership.exists || data?.status !== "Active" || !roles.includes(data?.firmRole)) {
    throw Object.assign(new Error("Resource not found."), { status: 404, code: "NOT_FOUND" });
  }
  return data!;
}

export function requireCapability(permissions: Record<string, boolean>, capability: string) {
  if (!permissions?.[capability]) throw Object.assign(new Error("You do not have permission to perform this action."), { status: 403, code: "FORBIDDEN" });
}
