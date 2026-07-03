import crypto from "node:crypto";
import { requireAdminDb } from "./firebaseAdmin.js";

export interface SystemConfiguration {
  applicationName: string;
  defaultJurisdiction: string;
  defaultCurrency: string;
  retentionDays: number;
  maxUploadMb: number;
  requireVerifiedCourtSources: boolean;
  messagingMode: "deferred" | "whatsapp";
  geminiApiKey: string;
  scannerWebhookSecret: string;
  platformAdminUids: string;
  whatsappVerifyToken: string;
  whatsappAppSecret: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  lawsAfricaApiToken: string;
  olmocrProvider: "disabled" | "huggingface" | "runpod";
  olmocrServerUrl: string;
  olmocrModel: string;
  olmocrApiKey: string;
}

const defaults: SystemConfiguration = {
  applicationName: "Sovereign Legal",
  defaultJurisdiction: "GH",
  defaultCurrency: "GHS",
  retentionDays: 365,
  maxUploadMb: 20,
  requireVerifiedCourtSources: true,
  messagingMode: "deferred",
  geminiApiKey: "",
  scannerWebhookSecret: "",
  platformAdminUids: "",
  whatsappVerifyToken: "",
  whatsappAppSecret: "",
  whatsappAccessToken: "",
  whatsappPhoneNumberId: "",
  lawsAfricaApiToken: "",
  olmocrProvider: "disabled",
  olmocrServerUrl: "",
  olmocrModel: "allenai/olmOCR-2-7B-1025-FP8",
  olmocrApiKey: "",
};

let current: SystemConfiguration = { ...defaults };
let persisted = false;

function encryptionKey() {
  const raw = process.env.CONFIG_ENCRYPTION_KEY || "";
  return raw ? crypto.createHash("sha256").update(raw).digest() : null;
}

function encrypt(value: SystemConfiguration) {
  const key = encryptionKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
}

function decrypt(payload: any): SystemConfiguration {
  const key = encryptionKey();
  if (!key) throw new Error("CONFIG_ENCRYPTION_KEY is not configured.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8");
  return { ...defaults, ...JSON.parse(plain) };
}

export async function loadSystemConfiguration() {
  current = {
    ...defaults,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "",
    scannerWebhookSecret: process.env.SCANNER_WEBHOOK_SECRET || "",
    platformAdminUids: process.env.PLATFORM_ADMIN_UIDS || "",
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || "",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    lawsAfricaApiToken: process.env.LAWS_AFRICA_API_TOKEN || "",
    olmocrProvider: process.env.OLMOCR_PROVIDER === "huggingface" || process.env.OLMOCR_PROVIDER === "runpod" ? process.env.OLMOCR_PROVIDER : "disabled",
    olmocrServerUrl: process.env.OLMOCR_SERVER_URL || "",
    olmocrModel: process.env.OLMOCR_MODEL || defaults.olmocrModel,
    olmocrApiKey: process.env.OLMOCR_API_KEY || "",
  };
  // Local demos intentionally run without Firebase Admin credentials. Avoid
  // starting an Application Default Credentials lookup that cannot succeed.
  if ((process.env.AUTH_MODE === "postgres" || process.env.DATA_STORE === "postgres") || (process.env.VITE_DEMO_MODE === "true" && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) {
    return current;
  }
  try {
    const snapshot = await requireAdminDb().collection("systemConfiguration").doc("runtime").get();
    if (snapshot.exists && snapshot.data()?.encrypted) {
      current = { ...current, ...decrypt(snapshot.data()?.encrypted) };
      persisted = true;
    }
  } catch (error) {
    console.warn("Dashboard configuration is using environment/runtime defaults.");
  }
  return current;
}

export function systemConfiguration() { return current; }

export async function updateSystemConfiguration(updates: Partial<SystemConfiguration>, actorUid: string) {
  current = { ...current, ...updates };
  const encrypted = encrypt(current);
  if (!encrypted) { persisted = false; return { configuration: current, persisted: false }; }
  await requireAdminDb().collection("systemConfiguration").doc("runtime").set({ encrypted, updatedAt: new Date().toISOString(), updatedByUid: actorUid });
  persisted = true;
  return { configuration: current, persisted };
}

export function configurationPersistenceEnabled() { return Boolean(encryptionKey()); }
export function configurationPersisted() { return persisted; }
export function maskSecret(value: string) { return value ? `${value.slice(0, 4)}${"•".repeat(8)}${value.slice(-4)}` : null; }
