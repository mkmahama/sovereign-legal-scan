import { auth } from "./firebase";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const localToken = window.localStorage?.getItem("sovereign-local-auth-token") || "";
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : localToken ? { Authorization: `Bearer ${localToken}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, payload?.error?.code || "REQUEST_FAILED", payload?.error?.message || "Request failed.");
  }
  return payload as T;
}
