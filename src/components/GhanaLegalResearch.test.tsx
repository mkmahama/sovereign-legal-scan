import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GhanaLegalResearch from "./GhanaLegalResearch";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../lib/api", () => ({ apiRequest }));

describe("GhanaLegalResearch", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn() },
    });
  });

  it("searches Ghana judgments by default", async () => {
    const user = userEvent.setup();
    apiRequest.mockResolvedValue({
      results: [
        {
          id: "judgment-1",
          title: "Republic v Mensah",
          score: 0.82,
          text: "A Ghana criminal procedure holding.",
          publicUrl: "https://example.test/judgment",
          metadata: {},
        },
      ],
    });

    render(<GhanaLegalResearch />);

    await user.type(screen.getByLabelText("Ghana legal research query"), "criminal procedure");
    await user.click(screen.getByRole("button", { name: "Search Ghana Law" }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "/api/legal-research/search",
      expect.objectContaining({ method: "POST" }),
    ));
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toMatchObject({
      collection: "judgments",
      query: "criminal procedure",
      topK: 10,
    });
    expect(await screen.findByText("Republic v Mensah")).toBeInTheDocument();
  });

  it("searches legislation after switching tabs", async () => {
    const user = userEvent.setup();
    apiRequest.mockResolvedValue({ results: [] });

    render(<GhanaLegalResearch />);

    await user.click(screen.getByRole("button", { name: "Legislation" }));
    await user.type(screen.getByLabelText("Ghana legal research query"), "Article 14");
    await user.click(screen.getByRole("button", { name: "Search Ghana Law" }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toMatchObject({
      collection: "legislation",
      query: "Article 14",
    });
    expect(await screen.findByText("No matching Laws.Africa records were returned for that query.")).toBeInTheDocument();
  });

  it("renders API errors cleanly", async () => {
    const user = userEvent.setup();
    apiRequest.mockRejectedValue(new Error("Configure LAWS_AFRICA_API_TOKEN"));

    render(<GhanaLegalResearch />);

    await user.type(screen.getByLabelText("Ghana legal research query"), "contract");
    await user.click(screen.getByRole("button", { name: "Search Ghana Law" }));

    expect(await screen.findByText("Configure LAWS_AFRICA_API_TOKEN")).toBeInTheDocument();
  });
});
