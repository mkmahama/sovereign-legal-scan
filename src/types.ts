export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "Admin" | "Lawyer" | "Paralegal";
  firmId: string;
  createdAt: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  professionalRole?: "Lawyer" | "Paralegal" | "Operations";
  lawyerVerified?: boolean;
  status?: "Active" | "Invited" | "Suspended";
}

export type FirmRole = "Owner" | "Admin" | "Member" | "Guest";
export type ProfessionalRole = "Lawyer" | "Paralegal" | "Operations";
export type CaseAccessPreset = "Viewer" | "Contributor" | "Co-counsel" | "Manager";

export interface PermissionSet {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canMessage: boolean;
  canUpload: boolean;
  canGenerateDrafts: boolean;
  canApproveFilings: boolean;
  canExport: boolean;
}

export interface Firm {
  firmId: string;
  name: string;
  countryCode: "GH" | string;
  createdByUid: string;
  createdAt: string;
  status: "Active" | "Suspended";
}

export interface FirmMembership {
  membershipId: string;
  firmId: string;
  uid: string;
  firmRole: FirmRole;
  professionalRole: ProfessionalRole;
  lawyerVerified: boolean;
  status: "Active" | "Invited" | "Suspended";
  createdAt: string;
}

export interface Invitation {
  invitationId: string;
  firmId: string;
  email: string;
  phoneNumber?: string;
  firmRole: FirmRole;
  professionalRole: ProfessionalRole;
  caseId?: string;
  preset?: CaseAccessPreset;
  status: "Pending" | "Accepted" | "Expired" | "Revoked";
  expiresAt: string;
  createdAt: string;
}

export interface CaseMembership {
  membershipId: string;
  caseId: string;
  firmId: string;
  uid: string;
  preset: CaseAccessPreset;
  permissions: PermissionSet;
  isGuest: boolean;
  messagingOptIn: boolean;
  status: "Active" | "Revoked";
  createdAt: string;
}

export interface CaseInfo {
  title: string;
  clientName: string;
  caseNumber: string;
  courtName: string;
  judgeName: string;
  jurisdiction: string;
  claimValue: string;
  caseType: string;
}

export interface CaseSummaries {
  backgroundFacts: string;
  coreArgumentsPlaintiffs: string;
  coreArgumentsDefendants: string;
}

export interface EvidenceItem {
  id: string;
  statement: string;
  category: string;
  significance: string;
  nlpClassification: string; // e.g. "CRITICAL" | "HIGHLY RELEVANT" | "STANDARD"
}

export interface ReasoningAnalysis {
  generatedAt: string;
  provider: "server-gemini" | "user-gemini" | "openai-compatible" | "ollama" | "local-fallback";
  model: string;
  executiveFinding: string;
  confidence: "High" | "Medium" | "Low" | "Needs lawyer review";
  decisionTrail: Array<{
    step: string;
    finding: string;
    rationale: string;
    citations: string[];
  }>;
  evidenceAssessment: Array<{
    claim: string;
    supports: string;
    contradicts: string;
    weight: "Strong" | "Moderate" | "Weak" | "Unclear";
    rationale: string;
    citations: string[];
  }>;
  openQuestions: string[];
  recommendedActions: string[];
  caveats: string[];
}

export interface CaseFile {
  caseId: string;
  title: string;
  clientName: string;
  caseNumber: string;
  status: "Active" | "Closed";
  createdByUid: string;
  firmId: string;
  createdAt: string;
  /** @deprecated Access is derived from caseMemberships. Kept only for seed migration. */
  sharedWithUids?: string[];
  proceduralPosture?: string;
  jurisdictionCode?: string;
  courtLevel?: string;
  
  // OCR & NLP outputs
  documentText?: string;
  originalDocument?: {
    name: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    storage: "browser-indexeddb" | "firebase-storage";
    fileId?: string;
  };
  extraction?: {
    mode: "verbatim";
    source: "pdf-text-layer" | "gemini-ocr" | "ollama-ocr" | "olmocr-hf" | "olmocr-runpod" | "direct-text";
    pageCount: number;
    characterCount: number;
    completedAt: string;
  };
  extractedInfo?: CaseInfo;
  summaries?: CaseSummaries;
  criticalEvidence?: EvidenceItem[];
  reasoningAnalysis?: ReasoningAnalysis;
  
  // Security Compliance
  isE2EEncrypted?: boolean;
  encryptedPayload?: string; // Client-side AES-GCM or Simulated standard cipher block representation
  
  // Integrations
  chatbotWebhookToken?: string;
}

export interface CaseFileAttachment {
  fileId: string;
  caseId: string;
  firmId: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256?: string;
  status: "Active" | "Archived" | string;
  createdByUid: string;
  createdAt: string;
  downloadable?: boolean;
}

export type LegalResearchCollection = "judgments" | "legislation";

export interface LegalResearchResult {
  id: string;
  title: string;
  score: number;
  text: string;
  publicUrl?: string;
  portionTitle?: string;
  portionUrl?: string;
  expressionDate?: string;
  blurb?: string;
  flynote?: string;
  workFrbrUri?: string;
  metadata: Record<string, unknown>;
}

export interface CourtRulePack {
  rulePackId: string;
  jurisdictionCode: string;
  courtLevel: string;
  version: string;
  title: string;
  sourceTitle: string;
  sourceUrl: string;
  effectiveDate: string;
  lastVerifiedAt: string;
  status: "Active" | "Stale" | "Draft";
}

export interface CourtDocumentTemplate {
  templateId: string;
  firmId?: string;
  rulePackId: string;
  title: string;
  documentType: string;
  body: string;
  requiredFields: string[];
  version: string;
  approved: boolean;
}

export interface DocumentSuggestion {
  suggestionId: string;
  caseId: string;
  title: string;
  documentType: string;
  rationale: string;
  supportingFacts: string[];
  sources: Array<{ label: string; url: string }>;
  missingFacts: string[];
  estimatedFee?: string;
  deadlineBasis?: string;
  confidence: "High" | "Medium" | "Needs verification";
  rulePackVersion: string;
}

export interface DocumentRevision {
  revisionId: string;
  documentId: string;
  version: number;
  title: string;
  body: string;
  requiredFieldsComplete: boolean;
  contentHash: string;
  createdByUid: string;
  createdAt: string;
  approvedByUid?: string;
  approvedAt?: string;
}

export interface CourtDocument {
  documentId: string;
  caseId: string;
  firmId: string;
  documentType: string;
  status: "Draft" | "Approved" | "Filed" | "Archived";
  templateId: string;
  rulePackVersion: string;
  currentRevisionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourtFee {
  feeId: string;
  caseId: string;
  label: string;
  amount?: number;
  currency: "GHS" | string;
  status: "Estimated" | "Due" | "Paid" | "Waived" | "Needs verification";
  sourceUrl?: string;
  effectiveDate?: string;
  lastVerifiedAt?: string;
}

export interface CaseDeadline {
  deadlineId: string;
  caseId: string;
  title: string;
  dueAt?: string;
  basis: string;
  sourceUrl?: string;
  responsibleUid?: string;
  status: "Upcoming" | "Completed" | "Needs verification";
}

export interface MessageThread {
  threadId: string;
  caseId: string;
  firmId: string;
  provider: "whatsapp" | "telegram";
  status: "Active" | "Paused";
  participantUids: string[];
  createdAt: string;
}

export interface ChannelIdentity {
  channelIdentityId: string;
  uid: string;
  provider: "whatsapp" | "telegram";
  address: string;
  verified: boolean;
  consentedAt?: string;
  revokedAt?: string;
}

export interface QuarantinedFile {
  fileId: string;
  caseId: string;
  firmId: string;
  senderUid: string;
  provider: "whatsapp" | "telegram";
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: "Quarantined" | "Approved" | "Rejected";
  createdAt: string;
  reviewedByUid?: string;
}

export interface AuditEvent {
  auditEventId: string;
  firmId: string;
  caseId?: string;
  actorUid: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}
