<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run Sovereign Legal locally

This repo is configured to run the full local app through Docker Compose with
Postgres-backed auth and data storage. Firebase remains available for a later
production SaaS deployment, but local development should use Docker/Postgres.

View your app in AI Studio: https://ai.studio/apps/24f8f94c-9f71-41b2-9700-e604a931b043

## Run locally with Docker and Postgres

**Prerequisites:** Docker Desktop or Docker Engine with Compose.

Build and start the local production container with Postgres-backed seeded
test users:

```bash
npm run docker:up
```

The compose setup starts Postgres, runs the one-shot `postgres-seed` service,
then publishes the app on `http://localhost:3004` by default. Override the host
port when needed:

```bash
APP_PORT=3002 npm run docker:up
```

Useful Docker commands:

```bash
npm run docker:up:detached
npm run docker:logs
npm run docker:down
npm run docker:reset
```

`docker:reset` removes the local Postgres volume and reseeds the known local
test data.

Default local Docker login accounts are backed by the `postgres` service:

| Role | Email | Password |
| --- | --- | --- |
| Platform/admin owner | `owner.seed@sovereign.test` | `SovereignTest123!` |
| Verified lawyer | `lawyer.seed@sovereign.test` | `SovereignTest123!` |
| Paralegal | `paralegal.seed@sovereign.test` | `SovereignTest123!` |
| Guest co-counsel | `guest.seed@sovereign.test` | `SovereignTest123!` |
| Suspended user | `suspended.seed@sovereign.test` | login disabled |

Use `SEED_TEST_PASSWORD` to change the active users' seeded password and
`SEED_RESET=true` to reset only known seeded records before reseeding:

```bash
SEED_RESET=true SEED_TEST_PASSWORD='NewLocalPassword123!' npm run docker:up
```

Server integrations are passed through Docker Compose from the host environment
or `.env` file, including:

```bash
GEMINI_API_KEY=
LAWS_AFRICA_API_TOKEN=
LAWS_AFRICA_JUDGMENTS_KB_CODE=judgments-gh
LAWS_AFRICA_LEGISLATION_KB_CODE=legislation-gh
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### Optional Node dev server

For quick UI iteration outside Docker, install dependencies and run the Node
dev server with Postgres-mode environment variables. Docker remains the source
of truth for local full-stack testing.

```bash
npm install
AUTH_MODE=postgres DATA_STORE=postgres VITE_AUTH_MODE=postgres DATABASE_URL='postgres://sovereign:sovereign_dev_password@localhost:5433/sovereign_legal' npm run dev
```

Stop the local Docker stack with:

```bash
npm run docker:down
```

### Firebase mode

To run against real Firebase services instead of local Postgres, place the
bootstrap values from `.env.example` in `.env`, override `AUTH_MODE` and
`DATA_STORE` away from `postgres`, set `VITE_AUTH_MODE=firebase`, and provide
`FIREBASE_SERVICE_ACCOUNT_JSON`.


### Seed Firebase test users with Docker

The project includes an explicit one-shot Docker seed service for creating
repeatable Firebase Auth users and matching Firestore test data. This targets
the Firebase project/database in `firebase-applet-config.json`, so use only a
development or disposable Firebase project unless you intentionally want these
records in that environment.

Required environment:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Optional controls:

```bash
SEED_TEST_PASSWORD='SovereignTest123!'
SEED_RESET=false
```

Run the seed service:

```bash
docker compose --profile seed up --build firebase-seed
```

Re-run safely at any time; the script uses stable IDs and upserts the same
seeded records. To delete and recreate only the known seeded records first:

```bash
SEED_RESET=true docker compose --profile seed up --build firebase-seed
```

Seeded login accounts all use the same password from `SEED_TEST_PASSWORD`:

| Role | Email | UID |
| --- | --- | --- |
| Platform/admin owner | `owner.seed@sovereign.test` | `seed_platform_owner` |
| Verified lawyer | `lawyer.seed@sovereign.test` | `seed_verified_lawyer` |
| Paralegal | `paralegal.seed@sovereign.test` | `seed_paralegal` |
| Guest co-counsel | `guest.seed@sovereign.test` | `seed_guest_cocounsel` |
| Suspended user | `suspended.seed@sovereign.test` | `seed_suspended_user` |

The seeder writes `seeded: true` and `seedTag: sovereign-firebase-test-seed`
metadata to the Firestore records it owns. It creates a seed firm, firm
memberships, case memberships, two sample cases, a court rule pack, a fee, a
deadline, a message thread, one pending invitation, channel identities, and
audit events.

If your npm registry connection times out during image build, run the local Docker
profile instead. It uses the host-built `dist/` and installed `node_modules/` inside a
Node container:

```bash
npm install
VITE_DEMO_MODE=true npm run build
docker compose -f docker-compose.local.yml up -d
```

The same Firebase seeding profile is available for this local compose file:

```bash
docker compose -f docker-compose.local.yml --profile seed up firebase-seed
```

Stop that local profile with:

```bash
docker compose -f docker-compose.local.yml down
```

Platform administrators manage application defaults, AI credentials, document retention,
upload limits, court-source verification, scanner credentials, administrator UIDs, and
messaging mode from **Settings → Application configuration**. Stored secrets are masked
in the browser and encrypted before Firestore persistence when `CONFIG_ENCRYPTION_KEY` is set.

### Document ingestion

Uploaded PDFs and images follow a preservation-first pipeline:

1. Text-based PDFs are extracted page by page from the PDF text layer.
2. Convert2text (`C2T`) can route image OCR through a Runpod Serverless olmOCR endpoint at `https://api.runpod.ai/v2/<ENDPOINT_ID>` when `OLMOCR_PROVIDER=runpod`, `OLMOCR_SERVER_URL`, `OLMOCR_MODEL`, and `OLMOCR_API_KEY` are configured server-side. The server appends `/runsync` for native Runpod workers.
3. Scanned PDFs and images use a transcription-only OCR pass with verified page start/end markers.
4. The complete verbatim transcript is saved separately from generated summaries and evidence analysis.
5. The untouched original binary is stored in browser IndexedDB and remains viewable/downloadable after refresh on that browser.

For multi-device or multi-user production access, replace the IndexedDB storage adapter with
Firebase Storage or an encrypted object store while retaining the same case-file metadata.

### Runpod olmOCR worker image

The Runpod Serverless worker lives in `runpod/olmocr-worker`. Because AllenAI's
official olmOCR CUDA/model image is very large, the preferred deployment avoids
building a custom image in GitHub Actions. Instead, deploy the official image
directly on Runpod and inject the small handler from this repo.

Print the values to paste into Runpod:

```bash
node runpod/olmocr-worker/print-direct-deploy-config.mjs
```

Then create a Runpod **Serverless → Deploy from a Docker image** endpoint:

```text
Container image: alleninstituteforai/olmocr:latest-with-model
Start command: printed by the script
Endpoint type: Queue
```

Paste the printed environment variables into Runpod. The app calls the endpoint
at `https://api.runpod.ai/v2/<ENDPOINT_ID>/runsync`.

### Review Desk AI analysis

The Review Desk includes a reasoning-focused analysis panel. It shows an
auditable decision rationale, evidence weights, open questions, recommended
next steps, confidence, provider, and model. The model selector supports:

- the server's configured Gemini key,
- a user-provided Gemini API key for one run,
- an OpenAI-compatible API endpoint with custom base URL, model, and key.
- Ollama local models discovered through the server-side `OLLAMA_BASE_URL`
  proxy. In Docker, the default is `http://host.docker.internal:11434`, so
  Ollama should be running on the host machine with at least one pulled model.

The panel does not display private model chain-of-thought. It displays concise
lawyer-auditable reasoning summaries, citations, uncertainty, and action items.

## Testing

- Run the test suite once: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run the TypeScript check: `npm run lint`

Tests use Vitest, React Testing Library, and jsdom. Shared browser-test setup lives in
`src/test/setup.ts`; colocate new tests with source files using the `*.test.ts(x)` suffix.

## Production SaaS configuration

1. Enable Email/Password, Google, and Phone providers in Firebase Authentication.
2. Provide Firebase Admin credentials through `FIREBASE_SERVICE_ACCOUNT_JSON` or Application Default Credentials.
3. Deploy both `firestore.rules` and `storage.rules`; sensitive court-document and messaging collections are server-only.
4. Leave messaging in **Deferred** mode until WhatsApp is ready. Later, add the four Meta credentials in the admin dashboard and enable WhatsApp Cloud API; the webhook remains `/api/webhooks/whatsapp`.
5. Add reviewed Ghana court rule packs to `courtRulePacks`. Each active pack must include a source URL, effective date, last verification date, and explicit fee/deadline data. The app deliberately shows “Needs verification” when these are absent.
6. Bootstrap `PLATFORM_ADMIN_UIDS` through the environment, then manage the administrator UID list from the dashboard. Filing approval stays disabled until lawyer verification is recorded through the administrative API.

Firebase Admin credentials and `CONFIG_ENCRYPTION_KEY` intentionally remain deployment
secrets. They cannot safely be sourced from the same database they protect and decrypt.

Deploy the database, indexes, and storage rules with `firebase deploy --only firestore,storage` after authenticating the Firebase CLI for the configured project.

Set `VITE_DEMO_MODE=true` only for local demonstrations. Production mode requires Firebase Authentication and never exposes the seeded identity switcher.
