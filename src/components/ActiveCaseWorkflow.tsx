import React from "react";
import { Bot, FilePenLine, FolderOpen, MessageCircle, ShieldCheck, Upload, Users } from "lucide-react";
import { CaseFile, CaseFileAttachment, UserProfile } from "../types";
import ChatbotSandbox from "./ChatbotSandbox";
import ReviewDesk from "./ReviewDesk";

interface Props {
  activeCase: CaseFile;
  activeUser: UserProfile;
  passphrase: string;
  collaborators: UserProfile[];
  onUpdateCase: (updated: CaseFile) => Promise<void>;
  onAddFiles: (files: FileList | File[]) => Promise<CaseFileAttachment[]>;
  setActiveTab: (tab: any) => void;
}

export default function ActiveCaseWorkflow({
  activeCase,
  activeUser,
  passphrase,
  collaborators,
  onUpdateCase,
  onAddFiles,
  setActiveTab,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 sm:gap-4">
      <section className="native-sheet bg-white border border-slate-200 rounded-xl shadow-xs p-3 sm:p-4 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-lg accent-badge px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confidential matter
              </span>
              <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-mono font-bold text-slate-700">
                {activeCase.caseNumber || "No docket"}
              </span>
              <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                {activeCase.status}
              </span>
            </div>
            <h2 className="mt-2 text-base sm:text-lg font-black text-slate-950 truncate">{activeCase.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Client: <strong className="text-slate-800">{activeCase.clientName}</strong>
              <span className="hidden sm:inline"> · {activeCase.extractedInfo?.courtName || "Court not assigned"} · {activeCase.extractedInfo?.caseType || "Matter review"}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Add case file"
              className="android-ripple inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-700 accent-border-hover accent-soft-hover min-h-[44px]"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add file
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exhibits")}
              title="Generate court draft"
              aria-label="Generate draft"
              className="android-ripple inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-slate-900 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-white hover:bg-slate-800 min-h-[44px]"
            >
              <FilePenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Draft
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              title="Open case files"
              className="android-ripple inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-700 accent-border-hover min-h-[44px]"
            >
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Files
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("annotations")}
              title="Open team"
              className="android-ripple inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-700 accent-border-hover min-h-[44px]"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Team
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) void onAddFiles(files);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_390px] gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="min-h-0 overflow-hidden">
          <ReviewDesk
            activeCase={activeCase}
            activeUser={activeUser}
            onUpdateCase={onUpdateCase}
            onBackToDashboard={() => setActiveTab("documents")}
            passphrase={passphrase}
            collaborators={collaborators}
            setActiveTab={setActiveTab}
            onAddFiles={onAddFiles}
          />
        </div>

        <aside className="hidden 2xl:flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="native-sheet bg-white border border-slate-200 rounded-xl shadow-xs p-4 shrink-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
              <MessageCircle className="w-4 h-4 accent-text" />
              Channel status
            </div>
            <div className="mt-3 grid gap-2 text-[10px]">
              <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                <span className="font-bold text-emerald-900">Web chat</span>
                <span className="font-black text-emerald-700">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                <span className="font-bold text-amber-900">WhatsApp</span>
                <span className="font-black text-amber-700">Opt-in required</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="font-bold text-slate-700">Telegram</span>
                <span className="font-black text-slate-500">Deferred</span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full [&>#chatbot-integration-card]:h-full [&>#chatbot-integration-card]:p-4 [&>#chatbot-integration-card>div:nth-child(2)]:grid-cols-1 [&>#chatbot-integration-card>div:nth-child(2)>div:nth-child(2)]:hidden">
              <ChatbotSandbox activeCase={activeCase} passphrase={passphrase} />
            </div>
          </div>

          <div className="native-sheet bg-white border border-slate-200 rounded-xl p-3 text-[10px] text-slate-600 shrink-0">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <span>Ask AI about facts, missing files, contradictions, draft strategy, or the next step for this matter.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
