import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthGateway from "./AuthGateway";

const state = vi.hoisted(() => ({ user: null as null | { uid: string; email: string; displayName: string } }));
const apiRequest = vi.hoisted(() => vi.fn());

vi.mock("../lib/firebase", () => ({ auth: {} }));
vi.mock("../lib/api", () => ({ apiRequest }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class {},
  RecaptchaVerifier: class {},
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => { callback(state.user); return vi.fn(); }),
}));

describe("AuthGateway", () => {
  beforeEach(() => { state.user = null; apiRequest.mockReset(); window.history.replaceState({}, "", "/"); });

  it("explains invitation acceptance when opened from a secure invite link", () => {
    window.history.replaceState({}, "", "/invite/secure-token");
    render(<AuthGateway>{() => <div>Workspace</div>}</AuthGateway>);
    expect(screen.getByRole("heading", { name: "Accept counsel invitation" })).toBeInTheDocument();
    expect(screen.getByText("Sign in with the invited email address to join the case.")).toBeInTheDocument();
  });

  it("routes a newly authenticated user into self-serve firm creation", async () => {
    state.user = { uid: "new-owner", email: "owner@example.com", displayName: "Ama Owner" };
    apiRequest.mockRejectedValueOnce(Object.assign(new Error("missing"), { status: 404 }));
    render(<AuthGateway>{() => <div>Workspace</div>}</AuthGateway>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Create your firm" })).toBeInTheDocument());
    expect(screen.getByLabelText("Your name")).toHaveValue("Ama Owner");
  });
});
