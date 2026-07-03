import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CourtDocumentsWorkspace from "./CourtDocumentsWorkspace";
import { CaseFile, UserProfile } from "../types";

vi.mock("../lib/api", () => ({ apiRequest: vi.fn().mockRejectedValue(new Error("offline")) }));

const lawyer: UserProfile = { uid: "lawyer-1", email: "lawyer@example.com", displayName: "Ama Mensah", role: "Lawyer", professionalRole: "Lawyer", lawyerVerified: true, firmId: "firm-1", createdAt: "2026-01-01T00:00:00Z" };
const caseFile: CaseFile = { caseId: "case-1", title: "Mensah v Republic", clientName: "Kofi Mensah", caseNumber: "HRC/1/2026", status: "Active", createdByUid: lawyer.uid, firmId: lawyer.firmId, createdAt: "2026-01-01T00:00:00Z", summaries: { backgroundFacts: "The parties dispute the admissibility and timing of witness evidence.", coreArgumentsPlaintiffs: "", coreArgumentsDefendants: "" } };

describe("CourtDocumentsWorkspace", () => {
  it("creates an editable watermarked draft and blocks approval until required fields are complete", async () => {
    const user = userEvent.setup();
    render(<CourtDocumentsWorkspace caseFile={caseFile} activeUser={lawyer} />);
    await user.click(screen.getAllByRole("button", { name: "Generate editable draft" })[0]);
    const editor = screen.getByLabelText("Court document draft") as HTMLTextAreaElement;
    expect(editor.value).toContain("[REQUIRED");
    expect(screen.getByRole("button", { name: /Approve exact revision/ })).toBeDisabled();
    await user.clear(editor);
    await user.type(editor, "IN THE HIGH COURT\nMOTION FOR DIRECTIONS\nRelief requested.\nSigned by Ama Mensah.\nService on all parties.");
    expect(screen.getByRole("button", { name: /Approve exact revision/ })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /Approve exact revision/ }));
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
});
