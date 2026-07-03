import React from "react";
import { CheckCircle2, FileText, Loader2, Upload, Wand2 } from "lucide-react";
import { CaseFile, CaseFileAttachment } from "../types";

type AddFilesOptions = { extractionProvider?: "default" | "olmocr" };

interface Props {
  cases: CaseFile[];
  activeCase: CaseFile;
  onSelectCase: (caseFile: CaseFile) => void;
  onAddFiles: (files: FileList | File[], options?: AddFilesOptions) => Promise<CaseFileAttachment[]>;
}

const acceptedTypes = "application/pdf,image/png,image/jpeg,image/jpg,text/plain,text/markdown,application/json,application/xml";

export default function Convert2TextWorkspace({ cases, activeCase, onSelectCase, onAddFiles }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = React.useState<File[]>([]);
  const [isConverting, setIsConverting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [lastUploads, setLastUploads] = React.useState<CaseFileAttachment[]>([]);

  const chooseFiles = (files: FileList | null) => {
    setMessage("");
    setLastUploads([]);
    setQueuedFiles(files ? Array.from(files) : []);
  };

  const convert = async () => {
    if (!queuedFiles.length) {
      setMessage("Choose one or more files to convert.");
      return;
    }
    setIsConverting(true);
    setMessage("Converting with Convert2text...");
    try {
      const uploaded = await onAddFiles(queuedFiles, { extractionProvider: "olmocr" });
      setLastUploads(uploaded);
      setQueuedFiles([]);
      setMessage(uploaded.length ? `Converted and attached ${uploaded.length} file${uploaded.length === 1 ? "" : "s"} to ${activeCase.title}.` : "Files were preserved for this matter.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Convert2text could not process the selected files.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pr-1 sm:pr-2 mobile-scroll scrollbar-thin">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <section className="native-sheet bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 accent-text" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Convert2text</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                OCR PDFs, scans, images, and text files into the active case record.
              </p>
            </div>
            <select
              aria-label="Target case"
              value={activeCase.caseId}
              onChange={(event) => {
                const selected = cases.find((item) => item.caseId === event.target.value);
                if (selected) onSelectCase(selected);
              }}
              className="auth-input sm:max-w-xs text-xs"
            >
              {cases.map((caseFile) => (
                <option key={caseFile.caseId} value={caseFile.caseId}>
                  {caseFile.title}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="android-ripple w-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-250 bg-slate-50 hover:bg-white hover:accent-border transition-colors flex flex-col items-center justify-center gap-3 text-center px-4"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <div className="text-sm font-black text-slate-900">Add files for C2T</div>
                <div className="text-xs text-slate-500 mt-1">PDF, PNG, JPEG, TXT, JSON, or XML</div>
              </div>
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={acceptedTypes}
              className="hidden"
              onChange={(event) => {
                chooseFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />

            {queuedFiles.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Ready to convert
                </div>
                <div className="divide-y divide-slate-100">
                  {queuedFiles.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · {file.type || "file"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void convert()}
              disabled={isConverting || queuedFiles.length === 0}
              className="android-ripple inline-flex items-center justify-center gap-2 rounded-xl accent-primary px-4 py-3 text-xs font-black disabled:opacity-50 min-h-[46px]"
            >
              {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Convert to text
            </button>

            {message && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-850">
                {message}
              </div>
            )}

            {lastUploads.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Attached to the same case files list.
              </div>
            )}
          </div>
        </section>

        <aside className="native-sheet bg-white border border-slate-200 rounded-xl p-4 shadow-xs h-fit space-y-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Target matter</div>
          <div>
            <div className="text-sm font-black text-slate-950">{activeCase.title}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">{activeCase.caseNumber || activeCase.caseId}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 leading-relaxed">
            Convert2text saves the original file in the same case-file store, then appends extracted text to the case transcript for review, search, and analysis.
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[10px] text-slate-600 leading-relaxed">
            Hosted olmOCR is used when the server has a Runpod or Hugging Face endpoint URL and API key configured. Searchable PDFs still use the local text layer first because it is faster and exact.
          </div>
        </aside>
      </div>
    </div>
  );
}
