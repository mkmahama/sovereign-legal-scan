import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SystemConfigurationCenter from "./SystemConfigurationCenter";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../lib/api", () => ({ apiRequest }));

const configuration = {
  applicationName: "Sovereign Legal",
  defaultJurisdiction: "GH",
  defaultCurrency: "GHS",
  retentionDays: 365,
  maxUploadMb: 20,
  requireVerifiedCourtSources: true,
  messagingMode: "deferred" as const,
  firebase: { projectId: "sovereign-legal", databaseId: "sovereign-legal", storageBucket: "sovereign-legal.appspot.com", adminCredentialsConfigured: true },
  secrets: { geminiApiKey: { configured: true, masked: "AIza••••••••test" } },
  persistence: { enabled: true, persisted: true },
};

describe("SystemConfigurationCenter", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue(configuration);
  });

  it("loads admin-managed defaults with messaging deferred", async () => {
    render(<SystemConfigurationCenter />);

    expect(await screen.findByRole("heading", { name: "Application configuration" })).toBeInTheDocument();
    expect(screen.getByLabelText("Application name")).toHaveValue("Sovereign Legal");
    expect(screen.getByLabelText("Messaging mode")).toHaveValue("deferred");
    expect(screen.queryByText("Verify token")).not.toBeInTheDocument();
  });

  it("saves changed configuration through the protected admin API", async () => {
    const user = userEvent.setup();
    render(<SystemConfigurationCenter />);
    await screen.findByRole("heading", { name: "Application configuration" });

    await user.clear(screen.getByLabelText("Application name"));
    await user.type(screen.getByLabelText("Application name"), "Sovereign Chambers");
    await user.click(screen.getByRole("button", { name: "Save configuration" }));

    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith(
      "/api/admin/configuration",
      expect.objectContaining({ method: "PATCH" }),
    ));
    const body = JSON.parse(apiRequest.mock.calls.at(-1)?.[1]?.body as string);
    expect(body).toMatchObject({ applicationName: "Sovereign Chambers", messagingMode: "deferred" });
  });
});
