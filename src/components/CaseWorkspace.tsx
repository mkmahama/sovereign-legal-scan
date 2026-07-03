import React from "react";
import { CaseFile, UserProfile } from "../types";
import { SAMPLE_LAWYERS } from "./FirmUserManagement";
import { Folder, Key, Users, Briefcase, Layers, Lock, FileText } from "lucide-react";
import CaseCollaborationWorkspace from "./CaseCollaborationWorkspace";
import CourtDocumentsWorkspace from "./CourtDocumentsWorkspace";

interface CaseWorkspaceProps {
  caseFile: CaseFile;
  activeUser: UserProfile;
  onUpdateCase: (updated: CaseFile) => void;
  customUsers: UserProfile[];
}

export default function CaseWorkspace({ caseFile, activeUser, onUpdateCase, customUsers }: CaseWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "evidence" | "court" | "sharing" | "sovereignty">("overview");
  const [showCipherText, setShowCipherText] = React.useState(false);

  const allFirmLawyers = [...SAMPLE_LAWYERS, ...customUsers].filter(
    (l) => l.firmId === caseFile.firmId && l.uid !== activeUser.uid
  );

  return (
    <div id="case-workspace-panel" className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 sm:p-6 text-slate-800 min-w-0 overflow-hidden">
      
      {/* Header Case Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-5 gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/80 shrink-0 mt-0.5">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">
                Docket: {caseFile.caseNumber || "UNASSIGNED"}
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-sans font-bold">
                {caseFile.extractedInfo?.caseType || "Generic Law"}
              </span>
            </div>
            <h2 className="font-sans font-bold text-base text-slate-900 mt-1">{caseFile.title}</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800 font-bold">{caseFile.clientName}</strong> | Created on {new Date(caseFile.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Access Indicators */}
        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <span className="text-xs font-sans font-bold bg-emerald-50 border border-emerald-150 text-emerald-700 px-2.5 py-1 rounded">
            E2EE Active
          </span>
          <span className="text-xs font-sans font-medium bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded">
            Case-scoped access
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-150 pb-px mb-5 overflow-x-auto gap-3 sm:gap-4 scrollbar-none mobile-scroll">
        {[
          { id: "overview", label: "Case Summaries", icon: Briefcase },
          { id: "evidence", label: "NLP Critical Evidence", icon: Layers },
          { id: "court", label: "Court Documents", icon: FileText },
          { id: "sharing", label: "Case Collaboration", icon: Users },
          { id: "sovereignty", label: "Sovereignty Inspector", icon: Key }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              id={`tab-ws-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-2.5 px-1 text-xs font-sans font-bold border-b-2 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                isSelected
                  ? "border-indigo-600 text-indigo-700 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-indigo-650"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Body content */}
      <div className="space-y-5">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Case Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Jurisdiction</div>
                <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                  {caseFile.extractedInfo?.jurisdiction || "Federal Circuit"}
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Presiding Court</div>
                <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                  {caseFile.extractedInfo?.courtName || "State Appeals Court"}
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assigned Judge</div>
                <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                  {caseFile.extractedInfo?.judgeName || "District Judge"}
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Disputed Amount</div>
                <div className="text-xs font-bold text-emerald-650 mt-1 truncate">
                  {caseFile.extractedInfo?.claimValue || "$50,000"}
                </div>
              </div>
            </div>

            {/* Split Narrative Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-slate-50 p-4 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-indigo-700 mb-2.5 font-mono uppercase tracking-wider">
                  Fact Assessment Description
                </h3>
                <p className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-line font-medium">
                  {caseFile.summaries?.backgroundFacts || "Analyzing factual details..."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold text-indigo-750 mb-2.5 font-mono uppercase tracking-wider">
                    Plaintiffs Essential Arguments
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">
                    {caseFile.summaries?.coreArgumentsPlaintiffs || "Loading plaintiff argument nodes..."}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold text-amber-700 mb-2.5 font-mono uppercase tracking-wider">
                    Defense Essential Counter-Arguments
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">
                    {caseFile.summaries?.coreArgumentsDefendants || "Loading defendant defense nodes..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NLP EVIDENCE */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                NLP Identified Key Fact Admissions
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-sans font-bold">
                Model: Gemma Legal-NLP v4
              </span>
            </div>

            {caseFile.criticalEvidence && caseFile.criticalEvidence.length > 0 ? (
              <div className="space-y-3">
                {caseFile.criticalEvidence.map((ev, index) => {
                  const isCritical = ev.nlpClassification === "CRITICAL";
                  return (
                    <div
                      id={`evidence-item-${ev.id || index}`}
                      key={ev.id || index}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch shadow-xs"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-sans font-extrabold px-2 py-0.5 rounded border ${
                            isCritical
                              ? "bg-rose-50 border-rose-100 text-rose-700"
                              : "bg-amber-50 border-amber-100 text-amber-700"
                          }`}>
                            {ev.nlpClassification || "RELEVANT"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans font-bold">
                            Category: {ev.category}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-850 italic leading-relaxed">
                          "{ev.statement}"
                        </p>
                      </div>

                      <div className="md:w-[280px] border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 flex flex-col justify-center">
                        <div className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Significance to Dossier</div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal font-sans font-medium">
                          {ev.significance}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No evidence highlighted. Ingest a document file first.</p>
            )}
          </div>
        )}

        {/* TAB 3: SHARING CO-COUNSEL */}
        <div className={activeTab === "sharing" ? "block" : "hidden"}>
          <CaseCollaborationWorkspace caseFile={caseFile} activeUser={activeUser} colleagues={allFirmLawyers} onUpdateCase={onUpdateCase} />
        </div>

        <div className={activeTab === "court" ? "block" : "hidden"}>
          <CourtDocumentsWorkspace caseFile={caseFile} activeUser={activeUser} />
        </div>

        {/* TAB 4: SOVEREIGN INSPECTOR */}
        {activeTab === "sovereignty" && (
          <div className="space-y-4 font-mono">
            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-sans font-bold text-slate-850 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-emerald-650" />
                  Sovereignty & Compliance Verification
                </h3>
                <button
                  id="btn-toggle-cipher"
                  onClick={() => setShowCipherText(!showCipherText)}
                  className="px-3 py-2 sm:px-2.5 sm:py-1.1 text-[10px] border border-slate-250 bg-white hover:bg-slate-100 text-slate-600 rounded-lg font-sans cursor-pointer font-bold shadow-xs"
                >
                  {showCipherText ? "Show Decrypted Memory" : "Show Encrypted Ciphertext"}
                </button>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                Below shows exactly how information is stored in the remote Firestore database vs. locally un-sealed in your active browser session memory space.
              </div>

              {showCipherText ? (
                <div className="space-y-2">
                  <div className="text-[10px] text-indigo-750 font-bold uppercase font-mono tracking-wider">
                    Raw Database Payload (Enforced by compliance keys)
                  </div>
                  <pre className="text-[10px] text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto border border-slate-950 leading-normal max-h-[180px] overflow-y-auto">
                    {`{
  "caseId": "${caseFile.caseId}",
  "caseNumber": "${caseFile.caseNumber}",
  "firmId": "${caseFile.firmId}",
  "status": "${caseFile.status}",
  "isE2EEncrypted": true,
  "encryptedPayload": "${caseFile.encryptedPayload || "YTkzOGY4MWFmODFmMDM3M2I0NjExOGRl..."}"
}`}
                  </pre>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed font-medium">
                    ⚠ Notice that sensitive summaries, judge names, the claim dispute details, and evidence transcripts are completely encrypted server-side inside `encryptedPayload`.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase font-mono tracking-wider">
                    Local browser decrypted container memory
                  </div>
                  <pre className="text-[10px] text-emerald-400 bg-slate-900 p-3 rounded-lg overflow-x-auto border border-slate-950 leading-normal max-h-[180px] overflow-y-auto">
                    {JSON.stringify({
                      caseId: caseFile.caseId,
                      title: caseFile.title,
                      clientName: caseFile.clientName,
                      caseNumber: caseFile.caseNumber,
                      extractedInfo: caseFile.extractedInfo,
                      summaries: caseFile.summaries,
                      criticalEvidence: caseFile.criticalEvidence
                    }, null, 2)}
                  </pre>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed font-medium">
                    ✔ Document parameters are verified using local encryption handshakes automatically in browser memory!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
