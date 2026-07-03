import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

let adminDb: Firestore | null = null;

try {
  if (process.env.AUTH_MODE === "postgres" || process.env.DATA_STORE === "postgres") {
    throw Object.assign(new Error("Firebase Admin skipped in Postgres mode."), { code: "POSTGRES_MODE" });
  }
  const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();
  const app = getApps()[0] || initializeApp({
    credential: credentials,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
  adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  if ((error as any)?.code !== "POSTGRES_MODE") {
    console.warn("Firebase Admin is not configured; authenticated SaaS endpoints will return a service configuration error.");
  }
}

export function requireAdminDb(): Firestore {
  if (!adminDb) throw Object.assign(new Error("Firebase Admin credentials are not configured."), { status: 503, code: "ADMIN_NOT_CONFIGURED" });
  return adminDb;
}

export function adminAuth() {
  if (!adminDb) throw Object.assign(new Error("Firebase Admin credentials are not configured."), { status: 503, code: "ADMIN_NOT_CONFIGURED" });
  return getAuth();
}

export function adminStorage() {
  if (!adminDb) throw Object.assign(new Error("Firebase Admin credentials are not configured."), { status: 503, code: "ADMIN_NOT_CONFIGURED" });
  return getStorage();
}
