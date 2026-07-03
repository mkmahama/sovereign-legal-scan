import { CaseAccessPreset, PermissionSet } from "../types";

export const CASE_PERMISSION_PRESETS: Record<CaseAccessPreset, PermissionSet> = {
  Viewer: {
    canView: true, canEdit: false, canShare: false, canMessage: false,
    canUpload: false, canGenerateDrafts: false, canApproveFilings: false, canExport: false,
  },
  Contributor: {
    canView: true, canEdit: true, canShare: false, canMessage: true,
    canUpload: true, canGenerateDrafts: false, canApproveFilings: false, canExport: false,
  },
  "Co-counsel": {
    canView: true, canEdit: true, canShare: false, canMessage: true,
    canUpload: true, canGenerateDrafts: true, canApproveFilings: false, canExport: true,
  },
  Manager: {
    canView: true, canEdit: true, canShare: true, canMessage: true,
    canUpload: true, canGenerateDrafts: true, canApproveFilings: true, canExport: true,
  },
};

export function permissionsForPreset(preset: CaseAccessPreset): PermissionSet {
  return { ...CASE_PERMISSION_PRESETS[preset] };
}

export function canApproveCourtDocument(
  permissions: PermissionSet,
  professionalRole?: string,
  lawyerVerified = false,
): boolean {
  return permissions.canApproveFilings && professionalRole === "Lawyer" && lawyerVerified;
}
