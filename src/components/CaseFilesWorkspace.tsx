import React from "react";
import { Download, FileText, FolderOpen, Loader2, Paperclip, ShieldCheck, Upload } from "lucide-react";
import { CaseFile, CaseFileAttachment, UserProfile } from "../types";
import { apiRequest } from "../lib/api";
import { downloadStoredFile, getOriginalFile } from "../lib/originalFileStore";

interface Props {
  caseFile: CaseFile;
  activeUser: UserProfile;
  onAddFiles?: (files: FileList | File[]) => Promise<CaseFileAttachment[]>;
}

function blobFromBase64(base64: string, mimeType: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType || "application/octet-stream" });
}

export default function CaseFilesWorkspace({ caseFile, activeUser, onAddFiles }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = React.useState<CaseFileAttachment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const loadFiles = React.useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const result = await apiRequest<{ files: CaseFileAttachment[] }>(`/api/cases/${caseFile.caseId}/files`);
      setFiles(result.files || []);
    } catch {
      setFiles([]);
      if (caseFile.originalDocument) setMessage("Showing this browser's locally preserved source record.");
    } finally {
      setIsLoading(false);
    }
  }, [caseFile.caseId, caseFile.originalDocument]);

  React.useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const addFiles = async (selected: FileList | null) => {
    if (!selected?.length || !onAddFiles) return;
    setIsAdding(true);
    setMessage("");
    try {
      const uploaded = await onAddFiles(selected);
      await loadFiles();
      setMessage(uploaded.length ? `Added ${uploaded.length} case file${uploaded.length === 1 ? "" : "s"}.` : "File preserved for this matter.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add the selected files.");
    } finally {
      setIsAdding(false);
    }
  };

  const downloadServerFile = async (file: CaseFileAttachment) => {
    try {
      const payload = await apiRequest<{ fileName: string; mimeType: string; size: number; base64: string }>(`/api/case-files/${file.fileId}/download`);
      downloadStoredFile({
        caseId: caseFile.caseId,
        name: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
        uploadedAt: file.createdAt,
        blob: blobFromBase64(payload.base64, payload.mimeType),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This file is not downloadable.");
    }
  };

  const downloadLocalOriginal = async () => {
    const original = await getOriginalFile(caseFile.caseId).catch(() => null);
    if (!original) {
      setMessage("The original file is not stored in this browser.");
      return;
    }
    downloadStoredFile(original);
  };

  const hasLocalOriginal = Boolean(caseFile.originalDocument);

  return (
    <div className="h-full overflow-y-auto pr-1 sm:pr-2 mobile-scroll scrollbar-thin">
      <div className="space-y-4">
        <div className="native-sheet bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 accent-text" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Case Files</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Source uploads, exhibits, scans, and supporting files for {caseFile.caseNumber || caseFile.title}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isAdding || !onAddFiles}
              className="android-ripple inline-flex items-center justify-center gap-2 rounded-xl accent-primary px-4 py-2 text-xs font-bold disabled:opacity-50 min-h-[44px]"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Add case file
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void addFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="native-sheet bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span>File</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading case files...</div>
            ) : files.length === 0 && !hasLocalOriginal ? (
              <div className="p-8 text-center">
                <Paperclip className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800 mt-3">No additional files yet</p>
                <p className="text-xs text-slate-500 mt-1">Add pleadings, exhibits, scanned correspondence, or source evidence.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {hasLocalOriginal && (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] sm:items-center gap-3 px-4 py-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{caseFile.originalDocument?.name}</div>
                        <div className="text-[10px] text-slate-500">{caseFile.originalDocument?.mimeType || "source file"} · browser preserved</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:contents">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 justify-self-start">Available</span>
                    <button onClick={() => void downloadLocalOriginal()} className="android-ripple inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700 accent-border-hover min-h-[44px]">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    </div>
                  </div>
                )}
                {files.map((file) => (
                  <div key={file.fileId} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] sm:items-center gap-3 px-4 py-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{file.fileName}</div>
                        <div className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · {file.mimeType || "file"}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:contents">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 justify-self-start">{file.status}</span>
                    <button
                      onClick={() => void downloadServerFile(file)}
                      disabled={!file.downloadable}
                      className="android-ripple inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700 accent-border-hover disabled:opacity-45 min-h-[44px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="native-sheet bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-fit space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              File controls
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Files stay attached to this case and use the same access rules as the active matter. Inbound WhatsApp or Telegram files remain quarantined in Team until reviewed.
            </p>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[10px] text-slate-600">
              Current lawyer: <strong className="text-slate-900">{activeUser.displayName}</strong>
            </div>
            {message && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold text-amber-800">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
