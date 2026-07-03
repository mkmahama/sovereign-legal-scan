import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || "postgres://sovereign:sovereign_dev_password@postgres:5432/sovereign_legal";
const password = process.env.SEED_TEST_PASSWORD || "SovereignTest123!";
const reset = process.env.SEED_RESET === "true";
const seedTag = "sovereign-postgres-test-seed";
const createdAt = "2026-06-24T12:00:00.000Z";
const updatedAt = new Date().toISOString();

const pool = new Pool({ connectionString: databaseUrl });

const users = [
  ["seed_platform_owner", "owner.seed@sovereign.test", "Nana Owusu Platform Owner", "Admin", "Owner", "Lawyer", true, "Active", "+233200000001"],
  ["seed_verified_lawyer", "lawyer.seed@sovereign.test", "Ama Mensah Verified Lawyer", "Lawyer", "Member", "Lawyer", true, "Active", "+233200000002"],
  ["seed_paralegal", "paralegal.seed@sovereign.test", "Kojo Boateng Paralegal", "Paralegal", "Member", "Paralegal", false, "Active", "+233200000003"],
  ["seed_guest_cocounsel", "guest.seed@sovereign.test", "Esi Adjei Co-counsel Guest", "Lawyer", "Guest", "Lawyer", true, "Active", "+233200000004"],
  ["seed_suspended_user", "suspended.seed@sovereign.test", "Kwame Sarpong Suspended User", "Paralegal", "Member", "Operations", false, "Suspended", "+233200000005"],
].map(([uid, email, displayName, role, firmRole, professionalRole, lawyerVerified, status, phoneNumber]) => ({
  uid, email, displayName, role, firmRole, professionalRole, lawyerVerified, status, phoneNumber,
}));

const firm = {
  firmId: "firm_seed_alpha_law",
  name: "Seed Alpha Law Chambers",
  countryCode: "GH",
  createdByUid: "seed_platform_owner",
  createdAt,
  updatedAt,
  status: "Active",
  seeded: true,
  seedTag,
};

const permissions = {
  viewer: { canView: true, canEdit: false, canShare: false, canMessage: false, canUpload: false, canGenerateDrafts: false, canApproveFilings: false, canExport: false },
  contributor: { canView: true, canEdit: true, canShare: false, canMessage: true, canUpload: true, canGenerateDrafts: true, canApproveFilings: false, canExport: true },
  coCounsel: { canView: true, canEdit: true, canShare: true, canMessage: true, canUpload: true, canGenerateDrafts: true, canApproveFilings: true, canExport: true },
  manager: { canView: true, canEdit: true, canShare: true, canMessage: true, canUpload: true, canGenerateDrafts: true, canApproveFilings: true, canExport: true },
};

const primaryCase = {
  caseId: "case_seed_procurement_dispute",
  title: "Seed Republic v. Adusei",
  clientName: "Accra Procurement Bureau",
  caseNumber: "SEED-HRC-2026-001",
  status: "Active",
  createdByUid: "seed_platform_owner",
  firmId: firm.firmId,
  createdAt,
  updatedAt,
  proceduralPosture: "Witness statement review and filing preparation",
  jurisdictionCode: "GH",
  courtLevel: "High Court",
  documentText: "[PAGE 1]\nWITNESS STATEMENT OF EFUA DANSO\n\nI make this statement voluntarily concerning procurement records reviewed on 15 March 2026.\n\nThe tender evaluation notes showed three missing vendor declarations. I notified counsel by email the same day.\n\n[END PAGE 1]\n[PAGE 2]\nThe committee minutes later recorded that all declarations had been received before award. I did not personally see those declarations in the file room.\n\nSigned: Efua Danso\n[END PAGE 2]",
  extraction: { mode: "verbatim", source: "direct-text", pageCount: 2, characterCount: 401, completedAt: createdAt },
  extractedInfo: { title: "Seed Republic v. Adusei", clientName: "Accra Procurement Bureau", caseNumber: "SEED-HRC-2026-001", courtName: "Accra High Court", judgeName: "Unassigned", jurisdiction: "Republic of Ghana", claimValue: "Administrative procurement matter", caseType: "Witness Statement Assessment" },
  summaries: {
    backgroundFacts: "The seeded matter concerns procurement records and conflicting statements about whether vendor declarations were present before award.",
    coreArgumentsPlaintiffs: "The applicant argues the procurement record was incomplete at the material time and requires court-directed disclosure.",
    coreArgumentsDefendants: "The respondent is expected to argue that committee minutes confirm compliance before the award decision.",
  },
  criticalEvidence: [
    { id: "seed-evidence-1", statement: "The tender evaluation notes showed three missing vendor declarations.", category: "Document gap", significance: "Supports a compliance concern and a request for complete tender records.", nlpClassification: "CRITICAL" },
    { id: "seed-evidence-2", statement: "The committee minutes later recorded that all declarations had been received before award.", category: "Contradiction", significance: "Creates a conflict between the file-room observation and the official minutes.", nlpClassification: "CONTRADICTION" },
  ],
  isE2EEncrypted: true,
  encryptedPayload: "SEEDED-AES-GCM-PLACEHOLDER-PAYLOAD",
  chatbotWebhookToken: "seed-webhook-token",
  seeded: true,
  seedTag,
};

const limitedCase = {
  caseId: "case_seed_guest_review",
  title: "Seed Mensah Advisory Review",
  clientName: "Mensah Family Office",
  caseNumber: "SEED-CV-2026-014",
  status: "Active",
  createdByUid: "seed_verified_lawyer",
  firmId: firm.firmId,
  createdAt,
  updatedAt,
  proceduralPosture: "External co-counsel review",
  jurisdictionCode: "GH",
  courtLevel: "Circuit Court",
  documentText: "[PAGE 1]\nThis seeded matter is visible to the guest co-counsel account with limited permissions.\n[END PAGE 1]",
  extraction: { mode: "verbatim", source: "direct-text", pageCount: 1, characterCount: 96, completedAt: createdAt },
  extractedInfo: { title: "Seed Mensah Advisory Review", clientName: "Mensah Family Office", caseNumber: "SEED-CV-2026-014", courtName: "Accra Circuit Court", judgeName: "Unassigned", jurisdiction: "Republic of Ghana", claimValue: "Advisory", caseType: "Civil Advisory" },
  summaries: { backgroundFacts: "Seeded limited-access matter for guest and co-counsel permissions testing.", coreArgumentsPlaintiffs: "N/A", coreArgumentsDefendants: "N/A" },
  criticalEvidence: [],
  seeded: true,
  seedTag,
};

const seedDocIds = {
  auditEvents: ["seed_audit_firm_created", "seed_audit_case_created"],
  caseDeadlines: ["seed_deadline_disclosure"],
  caseMemberships: [
    "case_seed_procurement_dispute_seed_platform_owner",
    "case_seed_procurement_dispute_seed_verified_lawyer",
    "case_seed_procurement_dispute_seed_paralegal",
    "case_seed_guest_review_seed_verified_lawyer",
    "case_seed_guest_review_seed_guest_cocounsel",
  ],
  cases: [primaryCase.caseId, limitedCase.caseId],
  channelIdentities: users.map((user) => `whatsapp_${user.uid}`),
  courtFees: ["seed_fee_filing"],
  courtRulePacks: ["seed_gh_high_court_rules"],
  firms: [firm.firmId],
  firmMemberships: users.map((user) => `${firm.firmId}_${user.uid}`),
  invitations: ["seed_invitation_pending"],
  messages: ["seed_message_intro"],
  messageThreads: ["case_seed_procurement_dispute_whatsapp"],
  systemConfiguration: ["seedStatus"],
  users: users.map((user) => user.uid),
};

function hashPassword(value, salt = crypto.randomBytes(16).toString("hex")) {
  return `scrypt:${salt}:${crypto.scryptSync(value, salt, 64).toString("hex")}`;
}

async function initSchema() {
  await pool.query(`
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

async function setRecord(collection, id, data) {
  await pool.query(
    `insert into app_records (collection, id, data, updated_at)
     values ($1, $2, $3::jsonb, now())
     on conflict (collection, id)
     do update set data = excluded.data, updated_at = now()`,
    [collection, id, JSON.stringify(data)],
  );
}

function userProfile(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    firmId: firm.firmId,
    createdAt,
    updatedAt,
    phoneNumber: user.phoneNumber,
    phoneVerified: true,
    professionalRole: user.professionalRole,
    lawyerVerified: user.lawyerVerified,
    status: user.status,
    seeded: true,
    seedTag,
  };
}

function firmMembership(user) {
  return {
    membershipId: `${firm.firmId}_${user.uid}`,
    firmId: firm.firmId,
    uid: user.uid,
    firmRole: user.firmRole,
    professionalRole: user.professionalRole,
    lawyerVerified: user.lawyerVerified,
    status: user.status,
    createdAt,
    updatedAt,
    seeded: true,
    seedTag,
  };
}

function caseMembership(caseId, user, preset, permissionSet) {
  return {
    membershipId: `${caseId}_${user.uid}`,
    caseId,
    firmId: firm.firmId,
    uid: user.uid,
    preset,
    permissions: permissionSet,
    isGuest: user.firmRole === "Guest",
    messagingOptIn: user.status === "Active" && permissionSet.canMessage,
    status: user.status === "Active" ? "Active" : "Revoked",
    createdAt,
    updatedAt,
    seeded: true,
    seedTag,
  };
}

async function resetSeedData() {
  for (const [collection, ids] of Object.entries(seedDocIds)) {
    for (const id of ids) await pool.query("delete from app_records where collection = $1 and id = $2", [collection, id]);
  }
  for (const user of users) await pool.query("delete from local_auth_users where uid = $1", [user.uid]);
}

async function seed() {
  if (reset) await resetSeedData();

  for (const user of users) {
    await pool.query(
      `insert into local_auth_users (uid, email, password_hash, disabled, updated_at)
       values ($1, $2, $3, $4, now())
       on conflict (uid)
       do update set email = excluded.email, password_hash = excluded.password_hash, disabled = excluded.disabled, updated_at = now()`,
      [user.uid, user.email, hashPassword(password), user.status === "Suspended"],
    );
    await setRecord("users", user.uid, userProfile(user));
    await setRecord("firmMemberships", `${firm.firmId}_${user.uid}`, firmMembership(user));
    await setRecord("channelIdentities", `whatsapp_${user.uid}`, {
      channelIdentityId: `whatsapp_${user.uid}`,
      uid: user.uid,
      provider: "whatsapp",
      address: user.phoneNumber.replace(/^\+/, ""),
      verified: true,
      consentedAt: createdAt,
      seeded: true,
      seedTag,
    });
  }

  await setRecord("firms", firm.firmId, firm);
  await setRecord("cases", primaryCase.caseId, primaryCase);
  await setRecord("cases", limitedCase.caseId, limitedCase);
  await setRecord("caseMemberships", `${primaryCase.caseId}_seed_platform_owner`, caseMembership(primaryCase.caseId, users[0], "Manager", permissions.manager));
  await setRecord("caseMemberships", `${primaryCase.caseId}_seed_verified_lawyer`, caseMembership(primaryCase.caseId, users[1], "Co-counsel", permissions.coCounsel));
  await setRecord("caseMemberships", `${primaryCase.caseId}_seed_paralegal`, caseMembership(primaryCase.caseId, users[2], "Contributor", permissions.contributor));
  await setRecord("caseMemberships", `${limitedCase.caseId}_seed_verified_lawyer`, caseMembership(limitedCase.caseId, users[1], "Manager", permissions.manager));
  await setRecord("caseMemberships", `${limitedCase.caseId}_seed_guest_cocounsel`, caseMembership(limitedCase.caseId, users[3], "Viewer", permissions.viewer));

  await setRecord("courtRulePacks", "seed_gh_high_court_rules", { rulePackId: "seed_gh_high_court_rules", jurisdictionCode: "GH", courtLevel: "High Court", version: "GH-SEED-2026.1", title: "Seed Ghana High Court Civil Procedure Rules", sourceTitle: "Seed source for local testing only", sourceUrl: "https://example.com/seed-ghana-high-court-rules", effectiveDate: "2026-01-01", lastVerifiedAt: createdAt, status: "Active", seeded: true, seedTag });
  await setRecord("courtFees", "seed_fee_filing", { feeId: "seed_fee_filing", caseId: primaryCase.caseId, firmId: firm.firmId, label: "Seed originating motion filing fee", amount: 250, currency: "GHS", status: "Due", sourceUrl: "https://example.com/seed-fees", effectiveDate: "2026-01-01", lastVerifiedAt: createdAt, createdByUid: users[0].uid, createdAt, updatedAt, seeded: true, seedTag });
  await setRecord("caseDeadlines", "seed_deadline_disclosure", { deadlineId: "seed_deadline_disclosure", caseId: primaryCase.caseId, firmId: firm.firmId, title: "Seed disclosure bundle due", dueAt: "2026-07-15T12:00:00.000Z", basis: "Seeded local testing deadline with source URL", sourceUrl: "https://example.com/seed-disclosure-rule", responsibleUid: users[1].uid, status: "Upcoming", createdByUid: users[0].uid, createdAt, updatedAt, seeded: true, seedTag });
  await setRecord("messageThreads", "case_seed_procurement_dispute_whatsapp", { threadId: "case_seed_procurement_dispute_whatsapp", caseId: primaryCase.caseId, firmId: firm.firmId, provider: "whatsapp", status: "Active", participantUids: [users[0].uid, users[1].uid, users[2].uid], createdAt, updatedAt, seeded: true, seedTag });
  await setRecord("messages", "seed_message_intro", { messageId: "seed_message_intro", threadId: "case_seed_procurement_dispute_whatsapp", caseId: primaryCase.caseId, firmId: firm.firmId, senderUid: users[0].uid, provider: "whatsapp", body: "Seed message: please review the missing declarations before draft filing.", status: "Delivered", deliveredRecipients: [users[1].uid, users[2].uid], deliveredAt: createdAt, createdAt, seeded: true, seedTag });
  await setRecord("invitations", "seed_invitation_pending", { invitationId: "seed_invitation_pending", firmId: firm.firmId, email: "pending.seed@sovereign.test", phoneNumber: "+233200000099", firmRole: "Guest", professionalRole: "Lawyer", caseId: primaryCase.caseId, preset: "Co-counsel", permissions: permissions.coCounsel, tokenHash: crypto.createHash("sha256").update("seed-invitation-token").digest("hex"), status: "Pending", expiresAt: "2026-12-31T23:59:59.000Z", createdAt, updatedAt, createdByUid: users[0].uid, seeded: true, seedTag });
  await setRecord("auditEvents", "seed_audit_firm_created", { auditEventId: "seed_audit_firm_created", firmId: firm.firmId, caseId: null, actorUid: users[0].uid, action: "seed.firm.created", targetType: "firm", targetId: firm.firmId, createdAt, metadata: { seeded: true, seedTag }, seeded: true, seedTag });
  await setRecord("auditEvents", "seed_audit_case_created", { auditEventId: "seed_audit_case_created", firmId: firm.firmId, caseId: primaryCase.caseId, actorUid: users[0].uid, action: "seed.case.created", targetType: "case", targetId: primaryCase.caseId, createdAt, metadata: { seeded: true, seedTag }, seeded: true, seedTag });
  await setRecord("systemConfiguration", "seedStatus", { seedTag, seeded: true, updatedAt, authUsers: users.map((user) => user.email), firmId: firm.firmId, caseIds: [primaryCase.caseId, limitedCase.caseId] });
}

await initSchema();
await seed();

console.log("Postgres seed data loaded.");
console.log(`Database: ${databaseUrl.replace(/:[^:@/]+@/, ":****@")}`);
console.log(`Password for seeded active users: ${password}`);
console.log("Login accounts:");
for (const user of users) {
  console.log(`- ${user.displayName} | ${user.email} | ${user.status}${user.status === "Suspended" ? " (login disabled)" : ""}`);
}

await pool.end();
