import { describe, expect, it } from "vitest";
import { canApproveCourtDocument, permissionsForPreset } from "./permissions";

describe("case permission presets", () => {
  it("keeps viewers read-only and managers fully capable", () => {
    expect(permissionsForPreset("Viewer")).toMatchObject({ canView: true, canEdit: false, canExport: false });
    expect(Object.values(permissionsForPreset("Manager")).every(Boolean)).toBe(true);
  });

  it("requires verified lawyer status in addition to approval permission", () => {
    const manager = permissionsForPreset("Manager");
    expect(canApproveCourtDocument(manager, "Lawyer", true)).toBe(true);
    expect(canApproveCourtDocument(manager, "Lawyer", false)).toBe(false);
    expect(canApproveCourtDocument(manager, "Paralegal", true)).toBe(false);
  });
});
