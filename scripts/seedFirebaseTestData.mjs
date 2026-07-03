import crypto from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const createdAt = "2026-06-24T12:00:00.000Z";
const updatedAt = new Date().toISOString();
const password = process.env.SEED_TEST_PASSWORD || "SovereignTest123!";
const reset = process.env.SEED_RESET === "true";
const seedTag = "sovereign-firebase-test-seed";

const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON is required to seed Firebase test data.");
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(credentialsJson);
} catch {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.");
  process.exit(1);
}

const app = getApps()[0] || initializeApp({
  credential: cert(credentials),
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const permissions = {
  viewer: {
    canView: true,
    canEdit: false,
    canShare: false,
    canMessage: false,
    canUpload: false,
    canGenerateDrafts: false,
    canApproveFilings: false,
    canExport: false,
  },
  contributor: {
    canView: true,
    canEdit: true,
    canShare: false,
    canMessage: true,
    canUpload: true,
    canGenerateDrafts: true,
    canApproveFilings: false,
    canExport: true,
  },
  coCounsel: {
    canView: true,
    canEdit: true,
    canShare: true,
    canMessage: true,
    canUpload: true,
    canGenerateDrafts: true,
    canApproveFilings: true,
    canExport: true,
  },
  manager: {
    canView: true,
    canEdit: true,
    canShare: true,
    canMessage: true,
    canUpload: true,
    canGenerateDrafts: true,
    canApproveFilings: true,
    canExport: true,
  },
};

const users = [
  {
    uid: "seed_platform_owner",
    email: "owner.seed@sovereign.test",
    displayName: "Nana Owusu Platform Owner",
    role: "Admin",
    firmRole: "Owner",
    professionalRole: "Lawyer",
    lawyerVerified: true,
    status: "Active",
    phoneNumber: "+233200000001",
  },
  {
    uid: "seed_verified_lawyer",
    email: "lawyer.seed@sovereign.test",
    displayName: "Ama Mensah Verified Lawyer",
    role: "Lawyer",
    firmRole: "Member",
    professionalRole: "Lawyer",
    lawyerVerified: true,
    status: "Active",
    phoneNumber: "+233200000002",
  },
  {
    uid: "seed_paralegal",
    email: "paralegal.seed@sovereign.test",
    displayName: "Kojo Boateng Paralegal",
    role: "Paralegal",
    firmRole: "Member",
    professionalRole: "Paralegal",
    lawyerVerified: false,
    status: "Active",
    phoneNumber: "+233200000003",
  },
  {
    uid: "seed_guest_cocounsel",
    email: "guest.seed@sovereign.test",
    displayName: "Esi Adjei Co-counsel Guest",
    role: "Lawyer",
    firmRole: "Guest",
    professionalRole: "Lawyer",
    lawyerVerified: true,
    status: "Active",
    phoneNumber: "+233200000004",
  },
  {
    uid: "seed_suspended_user",
    email: "suspended.seed@sovereign.test",
    displayName: "Kwame Sarpong Suspended User",
    role: "Paralegal",
    firmRole: "Member",
    professionalRole: "Operations",
    lawyerVerified: false,
    status: "Suspended",
    phoneNumber: "+233200000005",
  },
];

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
  extraction: {
    mode: "verbatim",
    source: "direct-text",
    pageCount: 2,
    characterCount: 401,
    completedAt: createdAt,
  },
  extractedInfo: {
    title: "Seed Republic v. Adusei",
    clientName: "Accra Procurement Bureau",
    caseNumber: "SEED-HRC-2026-001",
    courtName: "Accra High Court",
    judgeName: "Unassigned",
    jurisdiction: "Republic of Ghana",
    claimValue: "Administrative procurement matter",
    caseType: "Witness Statement Assessment",
  },
  summaries: {
    backgroundFacts: "The seeded matter concerns procurement records and conflicting statements about whether vendor declarations were present before award.",
    coreArgumentsPlaintiffs: "The applicant argues the procurement record was incomplete at the material time and requires court-directed disclosure.",
    coreArgumentsDefendants: "The respondent is expected to argue that committee minutes confirm compliance before the award decision.",
  },
  criticalEvidence: [
    {
      id: "seed-evidence-1",
      statement: "The tender evaluation notes showed three missing vendor declarations.",
      category: "Document gap",
      significance: "Supports a compliance concern and a request for complete tender records.",
      nlpClassification: "CRITICAL",
    },
    {
      id: "seed-evidence-2",
      statement: "The committee minutes later recorded that all declarations had been received before award.",
      category: "Contradiction",
      significance: "Creates a conflict between the file-room observation and the official minutes.",
      nlpClassification: "CONTRADICTION",
    },
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
  extraction: {
    mode: "verbatim",
    source: "direct-text",
    pageCount: 1,
    characterCount: 96,
    completedAt: createdAt,
  },
  extractedInfo: {
    title: "Seed Mensah Advisory Review",
    clientName: "Mensah Family Office",
    caseNumber: "SEED-CV-2026-014",
    courtName: "Accra Circuit Court",
    judgeName: "Unassigned",
    jurisdiction: "Republic of Ghana",
    claimValue: "Advisory",
    caseType: "Civil Advisory",
  },
  summaries: {
    backgroundFacts: "Seeded limited-access matter for guest and co-counsel permissions testing.",
    coreArgumentsPlaintiffs: "N/A",
    coreArgumentsDefendants: "N/A",
  },
  criticalEvidence: [],
  seeded: true,
  seedTag,
};

const collectionsWithStableSeedDocs = {
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

async function deleteSeededData() {
  for (const [collectionName, docIds] of Object.entries(collectionsWithStableSeedDocs)) {
    for (const docId of docIds) {
      await db.collection(collectionName).doc(docId).delete();
    }
  }

  for (const user of users) {
    await auth.deleteUser(user.uid).catch((error) => {
      if (error?.code !== "auth/user-not-found") throw error;
    });
  }
}

async function upsertAuthUser(user) {
  const authPayload = {
    email: user.email,
    emailVerified: true,
    password,
    displayName: user.displayName,
    disabled: user.status === "Suspended",
  };

  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, authPayload);
    return "updated";
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    await auth.createUser({ uid: user.uid, ...authPayload });
    return "created";
  }
}

function membershipFor(user) {
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

function profileFor(user) {
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

function caseMembership(caseId, user, preset, permissionSet, overrides = {}) {
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
    ...overrides,
  };
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function seedData() {
  const authResults = [];
  for (const user of users) {
    authResults.push(`${user.email}: ${await upsertAuthUser(user)}`);
  }

  const batch = db.batch();

  batch.set(db.collection("firms").doc(firm.firmId), firm, { merge: true });

  for (const user of users) {
    batch.set(db.collection("users").doc(user.uid), profileFor(user), { merge: true });
    batch.set(db.collection("firmMemberships").doc(`${firm.firmId}_${user.uid}`), membershipFor(user), { merge: true });
    batch.set(db.collection("channelIdentities").doc(`whatsapp_${user.uid}`), {
      channelIdentityId: `whatsapp_${user.uid}`,
      uid: user.uid,
      provider: "whatsapp",
      address: user.phoneNumber.replace(/^\+/, ""),
      verified: true,
      consentedAt: createdAt,
      seeded: true,
      seedTag,
    }, { merge: true });
  }

  batch.set(db.collection("cases").doc(primaryCase.caseId), primaryCase, { merge: true });
  batch.set(db.collection("cases").doc(limitedCase.caseId), limitedCase, { merge: true });

  batch.set(db.collection("caseMemberships").doc(`${primaryCase.caseId}_seed_platform_owner`), caseMembership(primaryCase.caseId, users[0], "Manager", permissions.manager), { merge: true });
  batch.set(db.collection("caseMemberships").doc(`${primaryCase.caseId}_seed_verified_lawyer`), caseMembership(primaryCase.caseId, users[1], "Co-counsel", permissions.coCounsel), { merge: true });
  batch.set(db.collection("caseMemberships").doc(`${primaryCase.caseId}_seed_paralegal`), caseMembership(primaryCase.caseId, users[2], "Contributor", permissions.contributor), { merge: true });
  batch.set(db.collection("caseMemberships").doc(`${limitedCase.caseId}_seed_verified_lawyer`), caseMembership(limitedCase.caseId, users[1], "Manager", permissions.manager), { merge: true });
  batch.set(db.collection("caseMemberships").doc(`${limitedCase.caseId}_seed_guest_cocounsel`), caseMembership(limitedCase.caseId, users[3], "Viewer", permissions.viewer), { merge: true });

  batch.set(db.collection("courtRulePacks").doc("seed_gh_high_court_rules"), {
    rulePackId: "seed_gh_high_court_rules",
    jurisdictionCode: "GH",
    courtLevel: "High Court",
    version: "GH-SEED-2026.1",
    title: "Seed Ghana High Court Civil Procedure Rules",
    sourceTitle: "Seed source for local testing only",
    sourceUrl: "https://example.com/seed-ghana-high-court-rules",
    effectiveDate: "2026-01-01",
    lastVerifiedAt: createdAt,
    status: "Active",
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("courtFees").doc("seed_fee_filing"), {
    feeId: "seed_fee_filing",
    caseId: primaryCase.caseId,
    firmId: firm.firmId,
    label: "Seed originating motion filing fee",
    amount: 250,
    currency: "GHS",
    status: "Due",
    sourceUrl: "https://example.com/seed-fees",
    effectiveDate: "2026-01-01",
    lastVerifiedAt: createdAt,
    createdByUid: users[0].uid,
    createdAt,
    updatedAt,
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("caseDeadlines").doc("seed_deadline_disclosure"), {
    deadlineId: "seed_deadline_disclosure",
    caseId: primaryCase.caseId,
    firmId: firm.firmId,
    title: "Seed disclosure bundle due",
    dueAt: "2026-07-15T12:00:00.000Z",
    basis: "Seeded local testing deadline with source URL",
    sourceUrl: "https://example.com/seed-disclosure-rule",
    responsibleUid: users[1].uid,
    status: "Upcoming",
    createdByUid: users[0].uid,
    createdAt,
    updatedAt,
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("messageThreads").doc("case_seed_procurement_dispute_whatsapp"), {
    threadId: "case_seed_procurement_dispute_whatsapp",
    caseId: primaryCase.caseId,
    firmId: firm.firmId,
    provider: "whatsapp",
    status: "Active",
    participantUids: [users[0].uid, users[1].uid, users[2].uid],
    createdAt,
    updatedAt,
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("messages").doc("seed_message_intro"), {
    messageId: "seed_message_intro",
    threadId: "case_seed_procurement_dispute_whatsapp",
    caseId: primaryCase.caseId,
    firmId: firm.firmId,
    senderUid: users[0].uid,
    provider: "whatsapp",
    body: "Seed message: please review the missing declarations before draft filing.",
    status: "Delivered",
    deliveredRecipients: [users[1].uid, users[2].uid],
    deliveredAt: createdAt,
    createdAt,
    seeded: true,
    seedTag,
  }, { merge: true });

  const invitationToken = "seed-invitation-token";
  batch.set(db.collection("invitations").doc("seed_invitation_pending"), {
    invitationId: "seed_invitation_pending",
    firmId: firm.firmId,
    email: "pending.seed@sovereign.test",
    phoneNumber: "+233200000099",
    firmRole: "Guest",
    professionalRole: "Lawyer",
    caseId: primaryCase.caseId,
    preset: "Co-counsel",
    permissions: permissions.coCounsel,
    tokenHash: hash(invitationToken),
    status: "Pending",
    expiresAt: "2026-12-31T23:59:59.000Z",
    createdAt,
    updatedAt,
    createdByUid: users[0].uid,
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("auditEvents").doc("seed_audit_firm_created"), {
    auditEventId: "seed_audit_firm_created",
    firmId: firm.firmId,
    caseId: null,
    actorUid: users[0].uid,
    action: "seed.firm.created",
    targetType: "firm",
    targetId: firm.firmId,
    createdAt,
    metadata: { seeded: true, seedTag },
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("auditEvents").doc("seed_audit_case_created"), {
    auditEventId: "seed_audit_case_created",
    firmId: firm.firmId,
    caseId: primaryCase.caseId,
    actorUid: users[0].uid,
    action: "seed.case.created",
    targetType: "case",
    targetId: primaryCase.caseId,
    createdAt,
    metadata: { seeded: true, seedTag },
    seeded: true,
    seedTag,
  }, { merge: true });

  batch.set(db.collection("systemConfiguration").doc("seedStatus"), {
    seedTag,
    seeded: true,
    updatedAt: FieldValue.serverTimestamp(),
    authUsers: users.map((user) => user.email),
    firmId: firm.firmId,
    caseIds: [primaryCase.caseId, limitedCase.caseId],
  }, { merge: true });

  await batch.commit();
  return authResults;
}

if (reset) {
  console.log("Resetting known Sovereign Firebase seed data before reseeding...");
  await deleteSeededData();
}

const authResults = await seedData();

console.log("Firebase test data seed complete.");
console.log(`Project: ${firebaseConfig.projectId}`);
console.log(`Database: ${firebaseConfig.firestoreDatabaseId}`);
console.log(`Firm: ${firm.name} (${firm.firmId})`);
console.log(`Password for all seeded test users: ${password}`);
console.log("Seeded Auth users:");
for (const result of authResults) console.log(`- ${result}`);
