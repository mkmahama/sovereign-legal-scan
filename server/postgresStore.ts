import crypto from "node:crypto";
import { Pool } from "pg";

let pool: Pool | null = null;

export function isPostgresMode() {
  return process.env.AUTH_MODE === "postgres" || process.env.DATA_STORE === "postgres";
}

export function postgresConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPostgresPool() {
  if (!process.env.DATABASE_URL) {
    throw Object.assign(new Error("DATABASE_URL is not configured."), { status: 503, code: "POSTGRES_NOT_CONFIGURED" });
  }
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function initPostgresSchema() {
  const db = getPostgresPool();
  await db.query(`
    create table if not exists app_records (
      collection text not null,
      id text not null,
      data jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (collection, id)
    );
    create index if not exists app_records_collection_idx on app_records (collection);
    create index if not exists app_records_data_gin_idx on app_records using gin (data);
    create table if not exists local_auth_users (
      uid text primary key,
      email text not null unique,
      password_hash text not null,
      disabled boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function getRecord<T = any>(collection: string, id: string): Promise<T | null> {
  await initPostgresSchema();
  const result = await getPostgresPool().query("select data from app_records where collection = $1 and id = $2", [collection, id]);
  return result.rows[0]?.data || null;
}

export async function setRecord(collection: string, id: string, data: Record<string, unknown>) {
  await initPostgresSchema();
  await getPostgresPool().query(
    `insert into app_records (collection, id, data, updated_at)
     values ($1, $2, $3::jsonb, now())
     on conflict (collection, id)
     do update set data = excluded.data, updated_at = now()`,
    [collection, id, JSON.stringify(data)],
  );
}

export async function deleteRecord(collection: string, id: string) {
  await initPostgresSchema();
  await getPostgresPool().query("delete from app_records where collection = $1 and id = $2", [collection, id]);
}

export async function findRecords<T = any>(collection: string, filters: Record<string, string> = {}, limit = 500): Promise<T[]> {
  await initPostgresSchema();
  const values: unknown[] = [collection];
  const clauses = ["collection = $1"];
  Object.entries(filters).forEach(([key, value]) => {
    values.push(value);
    clauses.push(`data->>'${key.replace(/'/g, "''")}' = $${values.length}`);
  });
  values.push(limit);
  const result = await getPostgresPool().query(
    `select data from app_records where ${clauses.join(" and ")} limit $${values.length}`,
    values,
  );
  return result.rows.map((row) => row.data);
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), candidate);
}

function tokenSecret() {
  return process.env.LOCAL_AUTH_SECRET || process.env.CONFIG_ENCRYPTION_KEY || "sovereign-local-dev-secret";
}

export function signLocalToken(payload: { uid: string; email: string }) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyLocalToken(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw Object.assign(new Error("Authentication is required."), { status: 401, code: "AUTH_REQUIRED" });
  const expected = crypto.createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw Object.assign(new Error("Authentication is required."), { status: 401, code: "AUTH_REQUIRED" });
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) throw Object.assign(new Error("Session expired."), { status: 401, code: "AUTH_EXPIRED" });
  return payload as { uid: string; email: string; exp: number };
}
