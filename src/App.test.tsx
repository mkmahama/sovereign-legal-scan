import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn((_collection, onNext) => {
    onNext({ forEach: vi.fn() });
    return vi.fn();
  }),
}));

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme-accent");
    document.documentElement.removeAttribute("style");
  });

  it("opens the seeded matter in the review workspace", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "CASE DESK" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Republic v. Mensah").length).toBeGreaterThan(0);
  });

  it("navigates to the cases workspace", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(document.querySelector("#sidebar-link-documents")!);

    expect(screen.getByRole("heading", { name: "CASES" })).toBeInTheDocument();
    expect(screen.getByTestId("case-card-republic-v-mensah")).toBeInTheDocument();
  });

  it("opens the Ghana Law research workspace", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(document.querySelector("#sidebar-link-ghana-law")!);

    expect(screen.getByRole("heading", { name: "GHANA LAW" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ghana legal research" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Judgments" })).toBeInTheDocument();
  });

  it("opens a case from Cases into the redesigned Case Desk", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(document.querySelector("#sidebar-link-documents")!);
    await user.click(screen.getByTestId("case-card-republic-v-mensah"));

    expect(await screen.findByRole("heading", { name: "CASE DESK" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate draft/ })).toBeInTheDocument();
  });

  it("opens settings with every seeded profile and protected platform configuration", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(document.querySelector("#sidebar-link-settings")!);

    expect(screen.getByRole("heading", { name: "SETTINGS" })).toBeInTheDocument();
    expect(screen.getByText("Abdul Karim")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Platform configuration" })).toBeInTheDocument();

    await user.click(document.querySelector("#switch-user-collab_1")!);
    await waitFor(() => expect(window.localStorage.getItem("sovereign-active-user")).toBe("collab_1"));
  });

  it("renders Apple theme colors and persists the selected accent", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(document.querySelector("#sidebar-link-settings")!);
    expect(screen.getByRole("heading", { name: "Theme color" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Blue theme color" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Teal theme color" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "Purple theme color" }));

    expect(window.localStorage.getItem("sovereign-theme-accent")).toBe("purple");
    expect(document.documentElement.dataset.themeAccent).toBe("purple");
    expect(document.documentElement.style.getPropertyValue("--accent-color")).toBe("#AF52DE");
  });

  it("restores a saved Apple theme accent on startup", async () => {
    window.localStorage.setItem("sovereign-theme-accent", "orange");

    render(<App />);

    await waitFor(() => expect(document.documentElement.dataset.themeAccent).toBe("orange"));
    expect(document.documentElement.style.getPropertyValue("--accent-color")).toBe("#FF9500");
  });
});
