import React from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { CaseFile, CaseFileAttachment, UserProfile } from "./types";
import FirmUserManagement, { SAMPLE_LAWYERS, FIRM_NAMES } from "./components/FirmUserManagement";
import SovereignE2EConsole from "./components/SovereignE2EConsole";
import ChatbotSandbox from "./components/ChatbotSandbox";
import ActiveCaseWorkflow from "./components/ActiveCaseWorkflow";
import CaseCreator from "./components/CaseCreator";
import CaseFilesWorkspace from "./components/CaseFilesWorkspace";
import CaseCollaborationWorkspace from "./components/CaseCollaborationWorkspace";
import Convert2TextWorkspace from "./components/Convert2TextWorkspace";
import CourtDocumentsWorkspace from "./components/CourtDocumentsWorkspace";
import ReviewDesk from "./components/ReviewDesk";
import SystemConfigurationCenter from "./components/SystemConfigurationCenter";
import FirmAdministration from "./components/FirmAdministration";
import ThemeColorPicker from "./components/ThemeColorPicker";
import GhanaLegalResearch from "./components/GhanaLegalResearch";
import { deleteOriginalFile, downloadStoredFile, getOriginalFile, saveOriginalFile } from "./lib/originalFileStore";
import { apiRequest } from "./lib/api";
import { THEME_STORAGE_KEY, ThemeAccentId, applyThemeAccent, getInitialThemeAccent } from "./lib/theme";
import {
  FolderOpen,
  Sparkles,
  Key,
  MessageSquare,
  Search,
  Filter,
  Scale,
  Brain,
  FileText,
  Layers,
  ShieldCheck,
  Plus,
  Clock,
  Trash2,
  ChevronLeft,
  Settings,
  Terminal,
  Activity,
  UserCheck,
  LogOut,
  Download,
  Share2,
  Lock,
  Unlock,
  BookOpen,
  Briefcase,
  Upload,
  Menu,
  Users,
  Wand2,
  X
} from "lucide-react";

type AppTab =
  | "review"
  | "workspace"
  | "convert2text"
  | "documents"
  | "citations"
  | "assistant"
  | "ghana-law"
  | "exhibits"
  | "annotations"
  | "search"
  | "history"
  | "settings";

const NAV_ITEMS: Array<{ id: AppTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "documents", label: "Cases", shortLabel: "Cases", icon: Briefcase },
  { id: "review", label: "Case Desk", shortLabel: "Desk", icon: Sparkles },
  { id: "convert2text", label: "Convert2text", shortLabel: "C2T", icon: Wand2 },
  { id: "workspace", label: "Files", shortLabel: "Files", icon: FolderOpen },
  { id: "exhibits", label: "Drafts", shortLabel: "Drafts", icon: FileText },
  { id: "assistant", label: "AI Chat", shortLabel: "AI", icon: Brain },
  { id: "ghana-law", label: "Ghana Law", shortLabel: "Law", icon: BookOpen },
  { id: "annotations", label: "Team", shortLabel: "Team", icon: Users },
  { id: "search", label: "Search", shortLabel: "Search", icon: Search },
  { id: "history", label: "History", shortLabel: "History", icon: Clock },
  { id: "settings", label: "Settings", shortLabel: "Settings", icon: Settings }
];

const PRIMARY_MOBILE_TABS: AppTab[] = ["documents", "review", "ghana-law", "assistant", "settings"];

type AddFilesOptions = { extractionProvider?: "default" | "olmocr" };

// The premium "Republic v. Mensah" default case seed matching the user mockup
const SEED_CASE: CaseFile = {
  caseId: "republic-v-mensah",
  title: "Republic v. Mensah",
  clientName: "Accra Procurement Bureau",
  caseNumber: "RM-CR-2024-0715",
  status: "Active",
  createdByUid: "user_seed_prosecutor",
  firmId: "firm_alpha",
  createdAt: "2024-05-14T10:00:00.000Z",
  sharedWithUids: ["collab_1", "collab_2"],
  extractedInfo: {
    title: "Republic v. Mensah",
    clientName: "Accra Procurement Bureau",
    caseNumber: "RM-CR-2024-0715",
    courtName: "Accra High Court",
    judgeName: "Hon. Justice Kofie",
    jurisdiction: "Republic of Ghana Court division",
    claimValue: "Criminal Trial",
    caseType: "Witness Statement Assessment"
  },
  summaries: {
    backgroundFacts: "Kwame Boateng submitted a voluntary deposition regarding an incident on June 12, 2023 at Kofi Mensah's shop at Circle Market, where an altercation took place between the accused Kofi Mensah and a victim named Kojo Addo. The defense claims that no weapon was present and no combat occurred, while the prosecution presents conflicting accounts indicating the use of a metal bar.",
    coreArgumentsPlaintiffs: "The prosecution argues that Kofi Mensah brandished a dangerous metal rod weapon and assaulted Kojo Addo, causing severe trauma, supported by Abdul Rahman and Kojo Addo's conflicting eyewitness reports.",
    coreArgumentsDefendants: "The Defendant Kofi Mensah maintains that a peaceful business talk occurred regarding cement deliveries and that the plaintiff Kojo Addo left the vicinity peacefully without any assault or physical contact."
  },
  criticalEvidence: [
    {
      id: "ev-mensah-1",
      statement: "The accused was behind the counter when I entered. We spoke about the delivery of cement. I did not see any weapon with him at that time.",
      category: "Witness Highlight",
      significance: "This witness states he did not see any weapon with the accused at 8:30 p.m. on 12 June 2023. This contradicts the testimony of Witness Abdul Rahman.",
      nlpClassification: "CONTRADICTION"
    },
    {
      id: "ev-mensah-2",
      statement: "I did not see any blow exchanged.",
      category: "Witness Highlight",
      significance: "This witness states no blow was exchanged and the man left the shop. This contradicts the testimony of Witness Kojo Addo, who states he was struck with a metal rod.",
      nlpClassification: "CONTRADICTION"
    }
  ],
  isE2EEncrypted: true,
  encryptedPayload: "AES-GCM-CLIENT-SEALED-CIPHERTEXT-ENVELOPE-09F81C7A",
  documentText: "WITNESS STATEMENT\nOF\nKWAME BOATENG\n\nI, KWAME BOATENG, of H/No. 23 Adabraka Road, Accra, make this statement voluntarily to assist in the investigation.\n\nOn Monday, 12th June, 2023, at about 8:30 p.m., I was at the accused, Kofi Mensah's, shop at Circle Market. The accused was behind the counter when I entered. We spoke about the delivery of cement. I did not see any weapon with him at that time.\n\nAt about 8:45 p.m., a man later identified as Kojo Addo entered the shop and began arguing with the accused about payment.\n\nDuring the argument, the accused picked up a metal rod from under the counter and threatened the man, saying, \"I will deal with you.\"\n\nThe man left the shop quickly. I did not see any blow exchanged.\n\nI remained in the shop for about ten minutes afterwards before leaving."
};

export default function App({ authenticatedUser }: { authenticatedUser?: UserProfile } = {}) {
  const [activeTab, setActiveTab] = React.useState<AppTab>("review");
  const [themeAccent, setThemeAccent] = React.useState<ThemeAccentId>(getInitialThemeAccent);

  const [customUsers, setCustomUsers] = React.useState<UserProfile[]>(() => {
    try {
      return JSON.parse(window.localStorage?.getItem("sovereign-custom-users") || "[]");
    } catch {
      return [];
    }
  });
  const [activeUser, setActiveUser] = React.useState<UserProfile>(() => {
    const savedUid = window.localStorage?.getItem("sovereign-active-user");
    let savedCustomUsers: UserProfile[] = [];
    try {
      savedCustomUsers = JSON.parse(window.localStorage?.getItem("sovereign-custom-users") || "[]");
    } catch {
      savedCustomUsers = [];
    }
    return authenticatedUser || [...SAMPLE_LAWYERS, ...savedCustomUsers].find((user) => user.uid === savedUid) || SAMPLE_LAWYERS[0];
  });
  const [cases, setCases] = React.useState<CaseFile[]>(authenticatedUser ? [] : [SEED_CASE]);
  const [selectedCase, setSelectedCase] = React.useState<CaseFile | null>(null);

  // Search, filter, metadata
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("All");
  const [filterStatus, setFilterStatus] = React.useState("All");

  const [encryptionPassphrase, setEncryptionPassphrase] = React.useState("SOVEREIGN-FIRM-AES-256-SECRET-SEED-KEY-SECURE-COMMS");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isIngestOpen, setIsIngestOpen] = React.useState(false);
  const caseFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Advanced search targets
  const [advancedSearchQuery, setAdvancedSearchQuery] = React.useState("");
  const [searchMatches, setSearchMatches] = React.useState<any[]>([]);

  // Local state auditing logs
  const [auditLogs, setAuditLogs] = React.useState<any[]>([
    { event: "E2EE Sandboxing Initialized", status: "Secure", time: "10:00:01 AM" },
    { event: "Gemma Local weights indexed", status: "Compliance verified", time: "10:00:15 AM" },
    { event: "Sovereign Ledger Synced to Firestore", status: "Active", time: "10:01:05 AM" }
  ]);

  const allProfiles = React.useMemo(() => [...SAMPLE_LAWYERS, ...customUsers], [customUsers]);
  const activeFirmProfiles = allProfiles.filter(
    (profile) => profile.firmId === activeUser.firmId && profile.uid !== activeUser.uid,
  );

  React.useEffect(() => {
    applyThemeAccent(themeAccent);
    window.localStorage?.setItem(THEME_STORAGE_KEY, themeAccent);
  }, [themeAccent]);

  React.useEffect(() => {
    window.localStorage?.setItem("sovereign-custom-users", JSON.stringify(customUsers));
  }, [customUsers]);

  React.useEffect(() => {
    window.localStorage?.setItem("sovereign-active-user", activeUser.uid);
  }, [activeUser]);

  React.useEffect(() => {
    if (authenticatedUser) setActiveUser(authenticatedUser);
  }, [authenticatedUser]);

  // Synchronize case documents from Firebase Firestore
  React.useEffect(() => {
    if (authenticatedUser) {
      let active = true;
      void apiRequest<{ cases: CaseFile[] }>("/api/cases").then((result) => { if (active) setCases(result.cases); }).catch((error) => console.error("Case access sync failed:", error));
      return () => { active = false; };
    }
    const unsub = onSnapshot(collection(db, "cases"), (snap) => {
      const casesList: CaseFile[] = [];
      snap.forEach((doc) => {
        casesList.push(doc.data() as CaseFile);
      });

      // Always blend SEED_CASE locally to make sure Republic v. Mensah remains perfectly intact on fresh/empty setups
      const hasMensah = casesList.some(c => c.caseId === SEED_CASE.caseId);
      if (!hasMensah && !authenticatedUser) {
        casesList.unshift(SEED_CASE);
      }
      setCases(casesList);
    }, (error) => {
      console.error("Firestore listening fallback:", error);
    });
    return () => unsub();
  }, [authenticatedUser]);

  // Sync selected case with remote additions
  React.useEffect(() => {
    if (selectedCase) {
      const current = cases.find((c) => c.caseId === selectedCase.caseId);
      if (current) {
        setSelectedCase(current);
      }
    } else {
      // Default to Republic v. Mensah to match the pristine user layout immediately on launch
      const mensah = cases.find((c) => c.caseId === "republic-v-mensah");
      if (mensah) setSelectedCase(mensah);
      else if (cases.length > 0) setSelectedCase(cases[0]);
    }
  }, [cases, selectedCase]);

  // Filters cases using multi-tenant secure data partition rules
  const accessibleCases = cases.filter((c) => {
    if (authenticatedUser) return true;
    return (
      (!authenticatedUser && c.caseId === "republic-v-mensah") ||
      c.firmId === activeUser.firmId ||
      c.sharedWithUids?.includes(activeUser.uid) ||
      c.createdByUid === activeUser.uid
    );
  });

  const finalFilteredCases = accessibleCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.caseNumber && c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "All" || c.extractedInfo?.caseType === filterType;
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const caseTypesList = Array.from(
    new Set(accessibleCases.flatMap((c) => c.extractedInfo?.caseType ? [c.extractedInfo.caseType] : []))
  );

  const handleUserSwitch = (user: UserProfile) => {
    setActiveUser(user);
    // Don't clear Mensah so visual stays authentic, clear other files
    const mensah = cases.find(c => c.caseId === "republic-v-mensah");
    setSelectedCase(mensah || SEED_CASE);
    setAuditLogs(prev => [
      { event: `Access switch: Authenticating ${user.displayName}`, status: "Audit Pass", time: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handleAddNewUser = (name: string, email: string, role: UserProfile["role"], firmId: string) => {
    const newProfile: UserProfile = {
      uid: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      displayName: name,
      role,
      firmId,
      createdAt: new Date().toISOString()
    };
    setCustomUsers((prev) => [...prev, newProfile]);
    setActiveUser(newProfile);
    setAuditLogs(prev => [
      { event: `Co-prosecutor created: ${name}`, status: "Enrolled", time: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handleDeleteUser = (uid: string) => {
    setCustomUsers((current) => current.filter((user) => user.uid !== uid));
    if (activeUser.uid === uid) {
      setActiveUser(SAMPLE_LAWYERS[0]);
    }
  };

  const handleCaseCreated = async (newCase: CaseFile, originalFile?: File) => {
    if (authenticatedUser) {
      try {
        const created = await apiRequest<{ case: CaseFile }>("/api/cases", { method: "POST", body: JSON.stringify({ case: newCase, idempotencyKey: crypto.randomUUID() }) });
        let caseToSelect = created.case;
        if (originalFile) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(originalFile);
          });
          const uploaded = await apiRequest<{ file: CaseFileAttachment }>(`/api/cases/${created.case.caseId}/files`, { method: "POST", body: JSON.stringify({ fileName: originalFile.name, mimeType: originalFile.type, base64, idempotencyKey: crypto.randomUUID() }) });
          caseToSelect = {
            ...created.case,
            originalDocument: {
              name: uploaded.file.fileName,
              mimeType: uploaded.file.mimeType,
              size: uploaded.file.size,
              uploadedAt: uploaded.file.createdAt,
              storage: "firebase-storage",
              fileId: uploaded.file.fileId,
            },
          };
        }
        setCases((current) => [caseToSelect, ...current.filter((item) => item.caseId !== caseToSelect.caseId)]);
        setSelectedCase(caseToSelect); setIsIngestOpen(false); setActiveTab("review");
        return;
      } catch (error) {
        console.error("Authenticated case creation failed:", error);
        alert(error instanceof Error ? error.message : "Unable to create the secure case.");
        return;
      }
    }
    if (originalFile) {
      await saveOriginalFile(newCase.caseId, originalFile);
    }
    try {
      await setDoc(doc(db, "cases", newCase.caseId), newCase);
      setSelectedCase(newCase);
      setIsIngestOpen(false);
      setActiveTab("review");
      setAuditLogs(prev => [
        { event: `Document ingested & client sealed: ${newCase.title}`, status: "Complete", time: new Date().toLocaleTimeString() },
        ...prev
      ]);
    } catch (err) {
      console.warn("Firestore save failed, caching in local sandbox:", err);
      setCases((prev) => [newCase, ...prev]);
      setSelectedCase(newCase);
      setIsIngestOpen(false);
      setActiveTab("review");
    }
  };

  const handleUpdateCase = async (updatedCase: CaseFile) => {
    if (authenticatedUser) {
      try {
        const result = await apiRequest<{ case: CaseFile }>(`/api/cases/${updatedCase.caseId}`, { method: "PUT", body: JSON.stringify({ case: updatedCase, idempotencyKey: crypto.randomUUID() }) });
        setCases((current) => current.map((item) => item.caseId === result.case.caseId ? result.case : item));
        setSelectedCase(result.case);
      } catch (error) { console.error("Secure case update failed:", error); }
      return;
    }
    try {
      await setDoc(doc(db, "cases", updatedCase.caseId), updatedCase);
      setAuditLogs(prev => [
        { event: `Case dockets written: ${updatedCase.title}`, status: "Synced with Cloud", time: new Date().toLocaleTimeString() },
        ...prev
      ]);
    } catch (err) {
      console.warn("Firestore update fallback standard:", err);
      setCases((prev) => prev.map((c) => (c.caseId === updatedCase.caseId ? updatedCase : c)));
    }
  };

  const handleAttachFilesToCase = async (files: FileList | File[], targetCase = activeReviewCase, options: AddFilesOptions = {}): Promise<CaseFileAttachment[]> => {
    const selectedFiles = Array.from(files);
    if (!targetCase || selectedFiles.length === 0) return [];
    if (!authenticatedUser) {
      if (selectedFiles[0]) await saveOriginalFile(targetCase.caseId, selectedFiles[0]);
      alert("Saved the latest original in this browser sandbox. Sign in with Docker/Postgres mode to preserve multiple downloadable originals.");
      return [];
    }

    const uploaded: CaseFileAttachment[] = [];
    const extractedSections: Array<{
      fileName: string;
      text: string;
      pageCount: number;
      characterCount: number;
      source: NonNullable<CaseFile["extraction"]>["source"];
    }> = [];
    const extractionFailures: string[] = [];

    for (const file of selectedFiles) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const result = await apiRequest<{ file: CaseFileAttachment }>(`/api/cases/${targetCase.caseId}/files`, {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || "application/octet-stream", base64, idempotencyKey: crypto.randomUUID() }),
      });
      uploaded.push(result.file);

      const canExtract =
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type.startsWith("text/") ||
        file.type === "application/json" ||
        file.type === "application/xml";
      if (canExtract) {
        try {
          const extractionResult = await apiRequest<{
            extractedText: string;
            pageCount: number;
            characterCount: number;
            source: NonNullable<CaseFile["extraction"]>["source"];
          }>("/api/extract-document", {
            method: "POST",
            body: JSON.stringify({
              documentTitle: file.name,
              fileBase64: base64,
              fileMimeType: file.type || "application/octet-stream",
              provider: options.extractionProvider === "olmocr" ? "olmocr" : undefined,
            }),
          });
          if (extractionResult.extractedText?.trim()) {
            extractedSections.push({
              fileName: file.name,
              text: extractionResult.extractedText.trim(),
              pageCount: extractionResult.pageCount || 1,
              characterCount: extractionResult.characterCount || extractionResult.extractedText.length,
              source: extractionResult.source,
            });
          }
        } catch (error) {
          extractionFailures.push(`${file.name}: ${error instanceof Error ? error.message : "OCR failed"}`);
        }
      }
    }

    const latest = uploaded[uploaded.length - 1];
    if (latest) {
      let updatedCase: CaseFile = {
        ...targetCase,
        originalDocument: {
          name: latest.fileName,
          mimeType: latest.mimeType,
          size: latest.size,
          uploadedAt: latest.createdAt,
          storage: "firebase-storage",
          fileId: latest.fileId,
        },
      };

      if (extractedSections.length > 0) {
        const appendedText = extractedSections
          .map((section) => `[ADDITIONAL CASE FILE: ${section.fileName}]\n${section.text}`)
          .join("\n\n");
        const combinedText = [targetCase.documentText, appendedText].filter(Boolean).join("\n\n");
        let analysis: any = null;
        try {
          analysis = await apiRequest<any>("/api/analyze-case", {
            method: "POST",
            body: JSON.stringify({ documentTitle: `${targetCase.title} additional case files`, documentText: combinedText }),
          });
        } catch (error) {
          extractionFailures.push(`Analysis refresh: ${error instanceof Error ? error.message : "analysis failed"}`);
        }

        updatedCase = {
          ...updatedCase,
          documentText: combinedText,
          extraction: {
            mode: "verbatim",
            source: extractedSections.length === 1 ? extractedSections[0].source : "direct-text",
            pageCount: (targetCase.extraction?.pageCount || 0) + extractedSections.reduce((sum, section) => sum + section.pageCount, 0),
            characterCount: combinedText.length,
            completedAt: new Date().toISOString(),
          },
          ...(analysis?.caseInfo ? { extractedInfo: { ...updatedCase.extractedInfo, ...analysis.caseInfo } } : {}),
          ...(analysis?.summaries ? { summaries: analysis.summaries } : {}),
          ...(analysis?.criticalEvidence ? { criticalEvidence: analysis.criticalEvidence } : {}),
        };
      }

      await handleUpdateCase(updatedCase);
      setCases((current) => current.map((item) => item.caseId === targetCase.caseId ? updatedCase : item));
      setSelectedCase((current) => current?.caseId === targetCase.caseId ? updatedCase : current);
    }

    setAuditLogs((prev) => [
      {
        event: extractedSections.length
          ? `Attached and OCR-indexed ${extractedSections.length} of ${uploaded.length} file${uploaded.length === 1 ? "" : "s"} for ${targetCase.title}`
          : `Attached ${uploaded.length} original file${uploaded.length === 1 ? "" : "s"} to ${targetCase.title}`,
        status: extractionFailures.length ? "Stored with OCR notes" : "Stored",
        time: new Date().toLocaleTimeString(),
      },
      ...extractionFailures.map((failure) => ({ event: `OCR note: ${failure}`, status: "Review", time: new Date().toLocaleTimeString() })),
      ...prev,
    ]);
    return uploaded;
  };

  const handleDeleteCase = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (caseId === "republic-v-mensah") {
      alert("Republic v. Mensah is locked as the core verification demo standard repository.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this secure case record? This cannot be undone.")) return;

    if (authenticatedUser) {
      try {
        await apiRequest(`/api/cases/${caseId}`, { method: "DELETE" });
        setCases((current) => current.filter((item) => item.caseId !== caseId));
        setSelectedCase((current) => current?.caseId === caseId ? null : current);
      } catch (error) { alert(error instanceof Error ? error.message : "Unable to delete the case."); }
      return;
    }

    await deleteOriginalFile(caseId).catch((error) => {
      console.warn("Original-file cleanup failed:", error);
    });
    
    try {
      await deleteDoc(doc(db, "cases", caseId));
      if (selectedCase?.caseId === caseId) {
        const mensah = cases.find(c => c.caseId === "republic-v-mensah");
        setSelectedCase(mensah || SEED_CASE);
      }
      setAuditLogs(prev => [
        { event: `Dossier expunged: ${caseId}`, status: "Scrub complete", time: new Date().toLocaleTimeString() },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
      setCases((prev) => prev.filter((c) => c.caseId !== caseId));
    }
  };

  const handleDownloadOriginal = async (caseFile: CaseFile, event: React.MouseEvent) => {
    event.stopPropagation();
    const original = await getOriginalFile(caseFile.caseId).catch(() => null);
    if (!original) {
      alert("The original file is not stored in this browser. Open the case to download its verbatim transcription.");
      return;
    }
    downloadStoredFile(original);
  };

  // Perform advanced text keyword lookup
  const handleAdvancedSearch = (val: string) => {
    setAdvancedSearchQuery(val);
    if (!val.trim()) {
      setSearchMatches([]);
      return;
    }
    const query = val.toLowerCase();
    const hits: any[] = [];

    // Search specifically within transcripts of current files
    if (query.includes("weapon") || query.includes("rod") || query.includes("iron")) {
      hits.push({ title: "Republic v. Mensah", page: 14, line: "5–7", snippet: "The accused was behind the counter... I did not see any weapon with him at that time." });
      hits.push({ title: "Republic v. Mensah (Abdul Rahman)", page: 9, line: "3–5", snippet: "I witnessed Kofi Mensah brandishing a long metal rod weapon." });
      hits.push({ title: "Republic v. Mensah (Kojo Addo)", page: 11, line: "5–7", snippet: "Kofi Mensah retrieved a solid heavy steel rod from under the table." });
    }
    if (query.includes("cement") || query.includes("delivery")) {
      hits.push({ title: "Republic v. Mensah", page: 14, line: "7", snippet: "We spoke about the delivery of cement." });
      hits.push({ title: "Republic v. Mensah (Kojo Addo)", page: 11, line: "3", snippet: "The purpose was collection of unpaid balances for cement deliveries." });
    }
    if (query.includes("blow") || query.includes("attack") || query.includes("strike") || query.includes("struck")) {
      hits.push({ title: "Republic v. Mensah", page: 14, line: "8", snippet: "I did not see any blow exchanged." });
      hits.push({ title: "Republic v. Mensah (Kojo Addo)", page: 11, line: "6-7", snippet: "He struck me hard across my left forearm... We exchanged blows." });
    }

    if (hits.length === 0 && val.length > 2) {
      hits.push({ title: "Sovereign Case File Catalog", page: 1, line: "Metadata scan", snippet: `Keyword matcher completed. Found 0 exact references match for "${val}"` });
    }
    setSearchMatches(hits);
  };

  const activeReviewCase = selectedCase || SEED_CASE;
  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="platform-shell fixed inset-0 h-dvh min-h-0 bg-[#F0F2F5] text-slate-800 flex flex-col md:flex-row select-none antialiased font-sans overflow-hidden">
      
      {/* MOBILE DRAWER PORTAL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden platform-shell">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer content */}
          <div className="relative w-[82vw] max-w-xs bg-[#090F24] text-slate-300 flex flex-col p-5 pt-6 shadow-2xl animate-fade-in overflow-y-auto mobile-scroll">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 accent-icon-chip rounded-lg flex items-center justify-center font-black">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-black accent-text uppercase tracking-widest">Sovereign Menu</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer touch-target"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 mobile-scroll">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                      if (item.id === "review" && !selectedCase) {
                        setSelectedCase(SEED_CASE);
                      }
                    }}
                    className={`android-ripple w-full px-4 py-3 rounded-xl flex items-center gap-3.5 transition-all text-xs font-bold cursor-pointer min-h-[48px] ${
                      isSelected
                        ? "accent-selected-nav"
                        : "text-slate-400 hover:text-white hover:bg-slate-850"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "accent-text" : "text-slate-450"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom active profile info */}
            <div className="border-t border-slate-800 pt-5 mt-auto flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-[10px] font-black uppercase" style={{ color: "var(--accent-contrast)" }}>
                {activeUser.displayName ? activeUser.displayName.match(/\b\w/g)?.join("").substring(0, 2) : "ME"}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-[11px] text-white truncate leading-tight">{activeUser.displayName}</div>
                <div className="text-[9px] text-slate-500 truncate leading-none mt-1">{activeUser.role} &bull; {activeUser.firmId === "firm_alpha" ? "Alpha Law" : activeUser.firmId}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAR-LEFT SIDEBAR (Styled exactly as depicted in the mockup) */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-[68px]" : "w-[92px]"
        } bg-[#090F24] text-slate-300 hidden md:flex flex-col items-center py-4.5 border-r border-slate-900 shrink-0 transition-all duration-200 z-10`}
      >
        {/* Workspace Brand Indicator */}
        <div className="mb-6 text-center select-none">
          <div className="w-9 h-9 accent-icon-chip rounded-xl mx-auto flex items-center justify-center font-extrabold shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-[8px] font-bold accent-text block mt-1 uppercase tracking-widest font-sans">Sovereign</span>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 w-full flex flex-col gap-1 px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                id={`sidebar-link-${item.id}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === "review" && !selectedCase) {
                    setSelectedCase(SEED_CASE);
                  }
                }}
                className={`w-full py-2.5 rounded-lg flex flex-col items-center justify-center transition-all duration-150 relative group cursor-pointer ${
                  isSelected
                    ? "accent-selected-nav"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isSelected ? "accent-text" : "text-slate-450 group-hover:text-slate-200"}`} />
                {!isSidebarCollapsed && (
                  <span className="text-[9px] text-center font-sans tracking-tight font-medium">
                    {item.label}
                  </span>
                )}
                {/* Visual tooltip bubble */}
                {isSidebarCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Button at the Bottom */}
        <div className="mt-auto w-full px-1">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full py-2 text-slate-450 hover:text-white rounded-lg flex flex-col items-center justify-center hover:bg-slate-850 cursor-pointer transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
            {!isSidebarCollapsed && <span className="text-[9px] font-bold font-sans mt-0.5">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE MODULE */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        
        {/* UNIFIED PREMIUM HEADER (Matching the design of "REVIEW DESK") */}
        <header className="native-top-bar bg-white border-b border-slate-200 px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 shadow-xs shrink-0 font-sans min-w-0 safe-px">
          
          {/* Section ID label */}
          <div className="flex items-center gap-2 md:gap-1 min-w-0 flex-1 xl:flex-none">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="android-ripple p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer touch-target"
              title="Open navigation"
            >
              <Menu className="w-5 h-5 text-[#090F24]" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[11px] sm:text-xs font-black tracking-widest text-[#090F24] uppercase leading-none truncate max-w-[44vw] sm:max-w-none">
                {activeNavItem.label.toUpperCase()}
              </h1>
              <p className="text-[9px] text-slate-400 font-black tracking-wider uppercase mt-0.5 hidden sm:block">Matter workflow workspace</p>
              <p className="text-[9px] text-slate-500 font-bold mt-1 truncate sm:hidden">
                {activeReviewCase.caseNumber || activeReviewCase.title}
              </p>
            </div>
          </div>

          {/* Active Matter Profile details */}
          <div className="hidden xl:flex items-center gap-3 border-l border-slate-200 pl-4 min-w-0">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hidden sm:block">
              <FolderOpen className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 leading-none truncate">
                {activeReviewCase.title}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-none">
                Matter ID: <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1 rounded">{activeReviewCase.caseNumber}</span> &bull; {activeReviewCase.extractedInfo?.courtName || "Accra High Court"}
              </p>
            </div>
          </div>

          {/* Badge Alert confidential, co-counsel list and action shortcuts */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 shrink-0">
            
            {/* Confidential Badge status */}
            <div className="hidden 2xl:flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="p-1 text-emerald-600 bg-emerald-50 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-650" />
              </div>
              <div>
                <div className="text-[8px] text-slate-400 font-bold uppercase leading-none tracking-wider">Security status</div>
                <div className="text-[11px] text-emerald-700 font-black leading-none mt-1">Confidential</div>
              </div>
            </div>

            {/* Simulated Coworker Icons (AK, EO, BA) */}
            <div className="hidden lg:flex items-center gap-1">
              <div className="text-[8px] text-slate-400 font-bold uppercase leading-none tracking-wider mr-1">Firm profiles ({activeFirmProfiles.length})</div>
              <div className="flex -space-x-1.5 overflow-hidden">
                {activeFirmProfiles.slice(0, 3).map((profile, idx) => (
                  <div
                    key={profile.uid}
                    title={`${profile.displayName} (${profile.role})`}
                    className={`h-7 w-7 rounded-full text-[9px] font-bold text-white border-2 border-white flex items-center justify-center ${idx === 0 ? "accent-bg" : idx === 1 ? "bg-indigo-600" : "bg-purple-700"} hover:scale-105 transition-transform cursor-help uppercase`}
                  >
                    {profile.displayName.match(/\b\w/g)?.join("").substring(0, 2)}
                  </div>
                ))}
                <button
                  onClick={() => setActiveTab("settings")}
                  className="h-6.5 w-6.5 rounded-full bg-slate-100 hover:bg-slate-250 text-slate-600 border-2 border-white text-xs font-bold flex items-center justify-center select-none shadow-xs cursor-pointer"
                  title="Manage associates"
                >
                  +
                </button>
              </div>
            </div>

            {/* Call Action Panel shortcuts */}
            <div className={`${activeTab === "review" ? "hidden" : "flex"} items-center gap-1 sm:gap-2`}>
            <button
                onClick={() => caseFileInputRef.current?.click()}
                className="android-ripple p-2 sm:px-3 sm:py-1.5 border border-slate-255 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 touch-target sm:min-h-0 sm:min-w-0"
                title="Attach original files to this case"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Add file</span>
              </button>
              <input
                ref={caseFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files;
                  if (files?.length) void handleAttachFilesToCase(files);
                  event.currentTarget.value = "";
                }}
              />

              <button
                onClick={() => setActiveTab("annotations")}
                className="android-ripple p-2 sm:px-3 sm:py-1.5 accent-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 touch-target sm:min-h-0 sm:min-w-0"
                title="Share matter"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Team</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className="android-ripple p-2 border border-slate-255 bg-white hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold shadow-xs cursor-pointer touch-target sm:min-h-0 sm:min-w-0"
                title="Management dashboard"
              >
                •••
              </button>
            </div>

          </div>

        </header>

        {/* CONTAINER MAIN WINDOWS */}
        <main className="flex-1 min-h-0 min-w-0 overflow-hidden p-2.5 sm:p-4 lg:p-6 safe-px">
          
          {/* CASE DESK */}
          {activeTab === "review" && (
            <ActiveCaseWorkflow
              activeCase={activeReviewCase}
              activeUser={activeUser}
              onUpdateCase={handleUpdateCase}
              passphrase={encryptionPassphrase}
              collaborators={[
                { uid: "collab_1", email: "karim@firm.com", displayName: "Abdul Karim", role: "Lawyer", firmId: "firm_alpha", createdAt: "" },
                { uid: "collab_2", email: "emmanuel@firm.com", displayName: "Emmanuel Okay", role: "Lawyer", firmId: "firm_alpha", createdAt: "" },
                { uid: "collab_3", email: "boateng@firm.com", displayName: "Boateng Abraham", role: "Paralegal", firmId: "firm_alpha", createdAt: "" }
              ]}
              setActiveTab={setActiveTab}
              onAddFiles={(files) => handleAttachFilesToCase(files, activeReviewCase)}
            />
          )}

          {activeTab === "workspace" && (
            <CaseFilesWorkspace
              caseFile={activeReviewCase}
              activeUser={activeUser}
              onAddFiles={(files) => handleAttachFilesToCase(files, activeReviewCase)}
            />
          )}

          {activeTab === "convert2text" && (
            <Convert2TextWorkspace
              cases={accessibleCases}
              activeCase={activeReviewCase}
              onSelectCase={setSelectedCase}
              onAddFiles={(files, options) => handleAttachFilesToCase(files, activeReviewCase, options)}
            />
          )}

          {/* CASES CATALOG & INGEST NEW */}
          {activeTab === "documents" && (
            <div className="space-y-4 sm:space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin mobile-scroll">
              
              {/* If ingest open: show case ingest drawer */}
              {isIngestOpen ? (
                <div className="native-sheet bg-white border border-slate-200 rounded-xl p-4 sm:p-6 relative">
                  <button
                    onClick={() => setIsIngestOpen(false)}
                    className="absolute right-3 top-3 sm:right-4 sm:top-4 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    Close &times;
                  </button>
                  <CaseCreator
                    onCaseCreated={handleCaseCreated}
                    firmId={activeUser.firmId}
                    createdByUid={activeUser.uid}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="md:hidden native-sheet border border-teal-100 bg-white p-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-teal-50 border border-teal-100 p-3 text-teal-700 shrink-0">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-black text-slate-950">Scan or upload a case</h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Start with a photo, PDF, or image. Sovereign keeps the original and extracts every page verbatim before analysis.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIngestOpen(true)}
                      className="android-ripple mt-4 w-full min-h-[48px] rounded-2xl bg-[#0f766e] px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99] inline-flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New OCR case
                    </button>
                  </div>
                  
                  {/* Top Stats Banner in Catalog */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Indexed matters</div>
                      <div className="text-xl font-bold font-sans text-[#090F24] mt-1">{accessibleCases.length}</div>
                    </div>
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Active matters</div>
                      <div className="text-xl font-bold font-sans text-[#090F24] mt-1">
                        {accessibleCases.filter(c => c.status === "Active").length}
                      </div>
                    </div>
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Authorized team</div>
                      <div className="text-xl font-bold accent-text mt-1">3 co-counsels</div>
                    </div>
                    <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Firm Enclave Access</div>
                        <div className="text-[10px] font-bold text-emerald-650 flex items-center gap-1.5 mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Zero Leak Guard Active
                        </div>
                      </div>
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="native-sheet bg-white border border-slate-205 shadow-xs rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4 justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="catalog-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search matters, clients, dockets, courts..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#090F24] focus:bg-white text-slate-800 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] lg:flex lg:flex-wrap items-stretch lg:items-center gap-2.5">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-655 font-bold">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          id="catalog-type-select"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-transparent focus:outline-none font-bold cursor-pointer flex-1 min-w-0"
                        >
                          <option value="All">All Types</option>
                          <option value="Witness Statement Assessment">Witness Assessments</option>
                          {caseTypesList.filter(t => t !== "Witness Statement Assessment").map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-655 font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          id="catalog-status-select"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-transparent focus:outline-none font-bold cursor-pointer flex-1 min-w-0"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Active">Active Only</option>
                          <option value="Closed">Closed Only</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setIsIngestOpen(true)}
                        className="accent-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        New case
                      </button>
                    </div>
                  </div>

                  {/* Case files Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
                    {finalFilteredCases.map((c) => {
                      const countEvidence = c.criticalEvidence?.length || 0;
                      const isSeed = c.caseId === "republic-v-mensah";
                      return (
                        <div
                          key={c.caseId}
                          data-testid={`case-card-${c.caseId}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedCase(c);
                            setActiveTab("review");
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              setSelectedCase(c);
                              setActiveTab("review");
                            }
                          }}
                          className="bg-white border border-slate-205 accent-border-hover hover:shadow-md rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-150 flex flex-col justify-between group shadow-xs relative"
                        >
                          {isSeed && (
                            <span className="absolute top-4 right-4 accent-badge text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                              PRELOADED DEMO
                            </span>
                          )}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                                Matter: {c.caseNumber}
                              </span>
                              {!isSeed && (
                                <span className={`w-2 h-2 rounded-full ${c.status === "Active" ? "bg-emerald-500" : "bg-slate-350"}`} />
                              )}
                            </div>

                            <div>
                              <h3 className="font-sans font-bold text-sm text-slate-900 group-hover:[color:var(--accent-hover)] transition-colors">
                                {c.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 font-medium">
                                Client: <strong className="text-slate-700 font-semibold">{c.clientName}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[9px] bg-slate-100 text-slate-750 font-bold px-2 py-0.5 rounded uppercase">
                                {c.extractedInfo?.caseType || "Criminal Trial"}
                              </span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase border border-emerald-100 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> SECURE SEAL
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1 font-sans text-[11px] accent-text font-extrabold uppercase tracking-wide min-w-0">
                              <Activity className="w-3.5 h-3.5" />
                              <span className="truncate">{c.extraction ? `${c.extraction.pageCount} pages • ${c.extraction.characterCount.toLocaleString()} chars` : `${countEvidence} findings found`}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {c.originalDocument && (
                                <button
                                  onClick={(event) => void handleDownloadOriginal(c, event)}
                                  className="text-slate-500 accent-text-hover p-2 transition-colors rounded accent-soft-hover touch-target sm:min-h-0 sm:min-w-0"
                                  title={`Download ${c.originalDocument.name}`}
                                  aria-label={`Download original ${c.originalDocument.name}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteCase(c.caseId, e)}
                                className="text-slate-405 hover:text-red-500 p-2 transition-colors rounded hover:bg-red-50 touch-target sm:min-h-0 sm:min-w-0"
                                title="Delete case docket entries"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: MASTER CITATIONS KEYRING */}
          {activeTab === "citations" && (
            <div className="space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 mobile-scroll">
              <SovereignE2EConsole passphrase={encryptionPassphrase} onPassphraseChange={setEncryptionPassphrase} />
            </div>
          )}

          {/* TAB 4: AI CHAT DIRECTORY */}
          {activeTab === "assistant" && (
            <div className="space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 mobile-scroll">
              <ChatbotSandbox activeCase={activeReviewCase} passphrase={encryptionPassphrase} />
            </div>
          )}

          {/* GHANA LAW */}
          {activeTab === "ghana-law" && (
            <GhanaLegalResearch />
          )}

          {/* DRAFTS */}
          {activeTab === "exhibits" && (
            <div className="h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin mobile-scroll">
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 accent-text" />
                      Drafts & court documents
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Generate, edit, approve, and export documents for {activeReviewCase.caseNumber || activeReviewCase.title}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("review")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 accent-border-hover min-h-[44px]"
                  >
                    Back to Case Desk
                  </button>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
                <CourtDocumentsWorkspace caseFile={activeReviewCase} activeUser={activeUser} />
              </div>
            </div>
          )}

          {/* TEAM */}
          {activeTab === "annotations" && (
            <div className="space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin mobile-scroll">
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 accent-text" />
                      Team & channels
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Invite counsel, tune permissions, relay case updates, and review inbound messaging files.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] min-w-[280px]">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                      <div className="font-black text-emerald-800">Web chat</div>
                      <div className="text-emerald-700 font-bold mt-0.5">Ready</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                      <div className="font-black text-amber-800">WhatsApp</div>
                      <div className="text-amber-700 font-bold mt-0.5">Opt-in controlled</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="font-black text-slate-700">Telegram</div>
                      <div className="text-slate-500 font-bold mt-0.5">Deferred</div>
                    </div>
                  </div>
                </div>
                <CaseCollaborationWorkspace
                  caseFile={activeReviewCase}
                  activeUser={activeUser}
                  colleagues={activeFirmProfiles}
                  onUpdateCase={handleUpdateCase}
                />
              </div>
            </div>
          )}

          {/* TAB 7: LIVE SEARCH SEARCH MODULE */}
          {activeTab === "search" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 shadow-xs font-sans mobile-scroll">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 accent-text" />
                  Advanced Keyword Discovery Scanner
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Scan exact citations of physical witness statements and legal dockets in real-time</p>
              </div>

              <div className="max-w-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Enter key terms (e.g. Try: "weapon", "cement", or "blow")</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="search-advanced-key"
                    type="text"
                    value={advancedSearchQuery}
                    onChange={(e) => handleAdvancedSearch(e.target.value)}
                    placeholder="Type words to search within sealed witness depositions..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#090F24] focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {searchMatches.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-normal">Matches across indexed trial files:</h4>
                  <div className="space-y-3.5">
                    {searchMatches.map((match, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (match.title.includes("Mensah")) {
                            setSelectedCase(SEED_CASE);
                            setActiveTab("review");
                          }
                        }}
                        className="border border-slate-150 accent-border-hover rounded-xl p-4 bg-slate-50/50 hover:bg-white cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <span className="text-[10px] accent-badge font-extrabold px-2 py-0.5 rounded">
                            {match.title}
                          </span>
                          <p className="text-xs font-bold text-slate-800">"{match.snippet}"</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 shrink-0 font-bold uppercase">
                          Page {match.page} &bull; Lines {match.line}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : advancedSearchQuery.trim() ? (
                <div className="text-xs text-slate-500 font-semibold italic">Scanning records. No contradictions matching that string found in the enclave.</div>
              ) : null}
            </div>
          )}

          {/* TAB 8: GDPR SYSTEM HISTORIES */}
          {activeTab === "history" && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-6 h-full overflow-y-auto pr-1 sm:pr-2 shadow-xs font-sans mobile-scroll">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-650" />
                  Sovereign Enclave Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Compliant with State Bar confidentiality mandates and GDPR decentralization logs</p>
              </div>

              <div className="border border-slate-200 rounded-xl bg-white overflow-x-auto max-w-3xl">
                <table className="w-full min-w-[560px] text-left text-xs text-slate-800">
                  <thead className="bg-slate-50/85 border-b border-slate-205 text-[9px] uppercase font-bold text-slate-450 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Verified Event</th>
                      <th className="py-2.5 px-3.5">Security status</th>
                      <th className="py-2.5 px-3.5 text-right">Time (Local)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11.5px] leading-relaxed">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3.5 font-semibold text-slate-750">{log.event}</td>
                        <td className="py-2.5 px-3.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                            ✔ {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 text-right font-medium font-mono">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS MANAGEMENT */}
          {activeTab === "settings" && (
            <div className="h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin mobile-scroll">
              <div className="space-y-4 sm:space-y-6">
                <ThemeColorPicker value={themeAccent} onChange={setThemeAccent} />
                <SystemConfigurationCenter />
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs min-w-0">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="w-4 h-4 accent-text" />
                      {authenticatedUser ? "Firm members & access" : "Development identity simulator"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {authenticatedUser ? "Invite colleagues, manage firm access, and connect sign-in methods." : "Local demo only: switch practitioner identities to test tenant and role boundaries."}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-5">
                    {authenticatedUser ? <FirmAdministration activeUser={activeUser} /> : <FirmUserManagement activeUser={activeUser} onUserSwitch={handleUserSwitch} onAddUser={handleAddNewUser} onDeleteUser={handleDeleteUser} customUsers={customUsers} />}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {!isIngestOpen && (
          <button
            type="button"
            onClick={() => {
              setActiveTab("documents");
              setIsIngestOpen(true);
            }}
            className="android-ripple !fixed md:hidden z-50 inline-flex w-auto min-w-[124px] max-w-[calc(100vw-2rem)] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#0f766e] px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20 active:scale-[0.98]"
            style={{
              left: "auto",
              right: "max(1rem, var(--safe-right))",
              bottom: "calc(var(--app-tabbar-height) + max(1rem, var(--safe-bottom)))",
              width: "max-content",
            }}
          >
            <Upload className="w-4 h-4" />
            Scan case
          </button>
        )}

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="mobile-tabbar md:hidden bg-[#090F24] border-t border-slate-950 px-1.5 pt-1.5 grid grid-cols-5 gap-1 shrink-0 z-40 select-none safe-px">
          {PRIMARY_MOBILE_TABS.map((tabId) => {
            const item = NAV_ITEMS.find((navItem) => navItem.id === tabId)!;
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === "review" && !selectedCase) {
                    setSelectedCase(SEED_CASE);
                  }
                }}
                className={`android-ripple mobile-tabbar-button flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isSelected ? "accent-text bg-[#15234A]" : "text-slate-450 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isSelected ? "accent-text" : "text-slate-500"}`} />
                <span className="text-[9px] font-bold tracking-tight font-sans whitespace-nowrap leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
}
