import React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Download, FileCheck2, FilePenLine, Plus, Printer, Scale, Sparkles } from "lucide-react";
import { CaseDeadline, CaseFile, CourtDocument, CourtFee, DocumentRevision, DocumentSuggestion, UserProfile } from "../types";
import { apiRequest } from "../lib/api";
import { auth } from "../lib/firebase";

type Tab = "suggested" | "drafts" | "approved" | "filed" | "fees" | "deadlines";

function localSuggestions(caseFile: CaseFile): DocumentSuggestion[] {
  const common = { caseId: caseFile.caseId, sources: [], rulePackVersion: "GH-DRAFT-1", confidence: "Needs verification" as const };
  return [
    { ...common, suggestionId: "suggestion-motion", title: "Motion for directions", documentType: "Motion", rationale: "The matter contains disputed evidence and may benefit from procedural directions before hearing.", supportingFacts: [caseFile.summaries?.backgroundFacts?.slice(0, 150) || "Case record requires review."], missingFacts: ["Confirmed procedural posture", "Applicable filing window"], estimatedFee: "Registry verification required", deadlineBasis: "No verified deadline source attached" },
    { ...common, suggestionId: "suggestion-affidavit", title: "Supporting affidavit", documentType: "Affidavit", rationale: "A sworn factual record may be needed to support a motion or application.", supportingFacts: caseFile.criticalEvidence?.slice(0, 2).map((item) => item.statement) || [], missingFacts: ["Deponent identity", "Exhibit references"], estimatedFee: "Registry verification required", deadlineBasis: "Filed with the related application" },
  ];
}

export default function CourtDocumentsWorkspace({ caseFile, activeUser }: { caseFile: CaseFile; activeUser: UserProfile }) {
  const [tab, setTab] = React.useState<Tab>("suggested");
  const [suggestions, setSuggestions] = React.useState(() => localSuggestions(caseFile));
  const [documents, setDocuments] = React.useState<Array<CourtDocument & { revision: DocumentRevision }>>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [fees, setFees] = React.useState<CourtFee[]>([]);
  const [deadlines, setDeadlines] = React.useState<CaseDeadline[]>([]);
  const [feeForm, setFeeForm] = React.useState({ label: "", amount: "", sourceUrl: "", effectiveDate: "" });
  const [deadlineForm, setDeadlineForm] = React.useState({ title: "", dueAt: "", basis: "", sourceUrl: "" });
  const selected = documents.find((document) => document.documentId === selectedId);

  React.useEffect(() => {
    setSuggestions(localSuggestions(caseFile)); setDocuments([]); setSelectedId(null);
    if (auth.currentUser) void apiRequest<{ documents: Array<CourtDocument & { revision: DocumentRevision }> }>(`/api/cases/${caseFile.caseId}/court-documents`).then((result) => setDocuments(result.documents)).catch(() => undefined);
    if (auth.currentUser) void apiRequest<{ fees: CourtFee[]; deadlines: CaseDeadline[] }>(`/api/cases/${caseFile.caseId}/court-obligations`).then((result) => { setFees(result.fees); setDeadlines(result.deadlines); }).catch(() => undefined);
  }, [caseFile.caseId]);

  const refreshSuggestions = async () => {
    setBusy(true); setNotice("");
    try {
      const result = await apiRequest<{ suggestions: DocumentSuggestion[] }>(`/api/cases/${caseFile.caseId}/document-suggestions`, { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) });
      setSuggestions(result.suggestions);
    } catch {
      setNotice("Secure generation service is unavailable; showing unverified local planning suggestions.");
    } finally { setBusy(false); }
  };

  const createDraft = async (suggestion: DocumentSuggestion) => {
    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const body = `IN THE ${caseFile.extractedInfo?.courtName?.toUpperCase() || "COURT"}\n\n${caseFile.title.toUpperCase()}\nSUIT NO. ${caseFile.caseNumber || "[REQUIRED]"}\n\n${suggestion.title.toUpperCase()}\n\nThe Applicant respectfully seeks the following relief:\n\n[REQUIRED: State the orders requested]\n\nGROUNDS\n${suggestion.rationale}\n\nSUPPORTING FACTS\n${suggestion.supportingFacts.map((fact, index) => `${index + 1}. ${fact}`).join("\n") || "[REQUIRED: Add grounded case facts]"}\n\n[REQUIRED: Counsel name and signature block]\n[REQUIRED: Service details]`;
    const revision: DocumentRevision = { revisionId: crypto.randomUUID(), documentId, version: 1, title: suggestion.title, body, requiredFieldsComplete: false, contentHash: "pending-server-hash", createdByUid: activeUser.uid, createdAt: now };
    const document: CourtDocument = { documentId, caseId: caseFile.caseId, firmId: caseFile.firmId, documentType: suggestion.documentType, status: "Draft", templateId: "ghana-firm-template", rulePackVersion: suggestion.rulePackVersion, currentRevisionId: revision.revisionId, createdAt: now, updatedAt: now };
    setDocuments((current) => [{ ...document, revision }, ...current]); setSelectedId(documentId); setTab("drafts");
    try {
      const saved = await apiRequest<{ documentId: string; revisionId: string; contentHash: string }>(`/api/cases/${caseFile.caseId}/court-documents`, { method: "POST", body: JSON.stringify({ title: revision.title, body: revision.body, documentType: document.documentType, templateId: document.templateId, rulePackVersion: document.rulePackVersion, idempotencyKey: crypto.randomUUID() }) });
      setDocuments((current) => current.map((item) => item.documentId === documentId ? { ...item, documentId: saved.documentId, currentRevisionId: saved.revisionId, revision: { ...item.revision, documentId: saved.documentId, revisionId: saved.revisionId, contentHash: saved.contentHash } } : item));
      setSelectedId(saved.documentId);
    } catch { setNotice("Draft is available in this browser but has not synced to the secure service."); }
  };

  const saveBody = (body: string) => selected && setDocuments((current) => current.map((document) => document.documentId === selected.documentId ? { ...document, status: "Draft", updatedAt: new Date().toISOString(), revision: { ...document.revision, body, approvedAt: undefined, approvedByUid: undefined, requiredFieldsComplete: !body.includes("[REQUIRED") } } : document));
  const canApprove = activeUser.lawyerVerified === true || (activeUser.lawyerVerified === undefined && activeUser.role === "Lawyer");
  const approve = async () => {
    if (!selected || !canApprove || !selected.revision.requiredFieldsComplete) return;
    try {
      if (selected.revision.contentHash !== "pending-server-hash") {
        await apiRequest(`/api/court-documents/${selected.documentId}/revisions`, { method: "POST", body: JSON.stringify({ title: selected.revision.title, body: selected.revision.body, idempotencyKey: crypto.randomUUID() }) });
        await apiRequest(`/api/court-documents/${selected.documentId}/approve`, { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) });
      }
    } catch (caught: any) { setNotice(caught?.message || "Approval could not be recorded."); return; }
    setDocuments((current) => current.map((document) => document.documentId === selected.documentId ? { ...document, status: "Approved", revision: { ...document.revision, approvedByUid: activeUser.uid, approvedAt: new Date().toISOString() } } : document));
    setNotice("Exact revision approved and locked for export."); setTab("approved");
  };
  const print = () => window.print();
  const exportApproved = async (format: "pdf" | "docx") => {
    if (!selected || selected.status !== "Approved") return;
    if (selected.revision.contentHash === "pending-server-hash") { setNotice("Sync this draft before exporting an official file."); return; }
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/court-documents/${selected.documentId}/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) { setNotice("The approved export could not be prepared."); return; }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${selected.revision.title}.${format}`; anchor.click(); URL.revokeObjectURL(url);
  };

  const addFee = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await apiRequest<{ fee: CourtFee }>(`/api/cases/${caseFile.caseId}/court-fees`, { method: "POST", body: JSON.stringify({ ...feeForm, amount: feeForm.amount ? Number(feeForm.amount) : undefined, currency: "GHS", idempotencyKey: crypto.randomUUID() }) });
      setFees((current) => [...current, result.fee]); setFeeForm({ label: "", amount: "", sourceUrl: "", effectiveDate: "" });
    } catch (caught: any) { setNotice(caught?.message || "Unable to add the court fee."); }
  };

  const updateFeeStatus = async (fee: CourtFee, status: "Due" | "Paid" | "Waived") => {
    try { await apiRequest(`/api/court-fees/${fee.feeId}/status`, { method: "POST", body: JSON.stringify({ status }) }); setFees((current) => current.map((item) => item.feeId === fee.feeId ? { ...item, status } : item)); }
    catch (caught: any) { setNotice(caught?.message || "Unable to update the fee."); }
  };

  const addDeadline = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await apiRequest<{ deadline: CaseDeadline }>(`/api/cases/${caseFile.caseId}/deadlines`, { method: "POST", body: JSON.stringify({ ...deadlineForm, dueAt: deadlineForm.dueAt ? new Date(deadlineForm.dueAt).toISOString() : undefined, idempotencyKey: crypto.randomUUID() }) });
      setDeadlines((current) => [...current, result.deadline]); setDeadlineForm({ title: "", dueAt: "", basis: "", sourceUrl: "" });
    } catch (caught: any) { setNotice(caught?.message || "Unable to add the deadline."); }
  };

  const completeDeadline = async (deadline: CaseDeadline) => {
    try { await apiRequest(`/api/deadlines/${deadline.deadlineId}/status`, { method: "POST", body: JSON.stringify({ status: "Completed" }) }); setDeadlines((current) => current.map((item) => item.deadlineId === deadline.deadlineId ? { ...item, status: "Completed" } : item)); }
    catch (caught: any) { setNotice(caught?.message || "Unable to complete the deadline."); }
  };

  const visibleDocuments = documents.filter((document) => tab === "drafts" ? document.status === "Draft" : tab === "approved" ? document.status === "Approved" : tab === "filed" ? ["Filed", "Archived"].includes(document.status) : false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">Court documents</h3><p className="text-xs text-slate-500 mt-1">Ghana-first suggestions and lawyer-controlled filing drafts.</p></div><button onClick={() => void refreshSuggestions()} disabled={busy} className="inline-flex items-center justify-center gap-2 px-3 py-2 accent-primary rounded-lg text-xs font-bold min-h-[44px]"><Sparkles className="w-4 h-4" />{busy ? "Reviewing case…" : "Refresh suggestions"}</button></div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mobile-scroll scrollbar-none">{(["suggested", "drafts", "approved", "filed", "fees", "deadlines"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`px-3 py-2 text-xs font-bold capitalize border-b-2 whitespace-nowrap min-h-[44px] ${tab === item ? "accent-border accent-text" : "border-transparent text-slate-500"}`}>{item === "filed" ? "Filed / archived" : item}</button>)}</div>
      {notice && <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-lg p-3 text-xs flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{notice}</div>}

      {tab === "suggested" && <div className="grid lg:grid-cols-2 gap-3">{suggestions.map((suggestion) => <div key={suggestion.suggestionId} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs"><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">{suggestion.documentType}</span><h4 className="text-sm font-bold text-slate-900 mt-2">{suggestion.title}</h4></div><Scale className="w-5 h-5 accent-text" /></div><p className="text-xs text-slate-600 mt-3 leading-relaxed">{suggestion.rationale}</p><div className="mt-3 bg-slate-50 rounded-lg p-3 text-[10px] text-slate-600 space-y-1"><div><strong>Fee:</strong> {suggestion.estimatedFee}</div><div><strong>Deadline:</strong> {suggestion.deadlineBasis}</div><div><strong>Rule pack:</strong> {suggestion.rulePackVersion}</div><div className="text-amber-700 font-bold">{suggestion.confidence} · Lawyer must verify sources</div></div><button onClick={() => createDraft(suggestion)} className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2 min-h-[44px]"><FilePenLine className="w-4 h-4" />Generate editable draft</button></div>)}</div>}

      {["drafts", "approved", "filed"].includes(tab) && <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[430px]"><div className="border border-slate-200 rounded-xl overflow-hidden h-fit">{visibleDocuments.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">No documents in this stage.</div> : visibleDocuments.map((document) => <button key={document.documentId} onClick={() => setSelectedId(document.documentId)} className={`w-full text-left p-3 border-b border-slate-100 min-h-[58px] ${selectedId === document.documentId ? "accent-soft" : "bg-white"}`}><div className="text-xs font-bold text-slate-900">{document.revision.title}</div><div className="text-[10px] text-slate-500 mt-1">Version {document.revision.version} · {document.status}</div></button>)}</div>{selected ? <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 sm:p-4"><div className="flex items-center justify-between gap-3 mb-3"><div><div className="text-xs font-bold text-slate-900">{selected.revision.title}</div><div className="text-[10px] text-slate-500">Revision {selected.revision.version} · {selected.rulePackVersion}</div></div><div className="flex gap-2"><button onClick={print} disabled={selected.status !== "Approved"} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 touch-target sm:min-h-0 sm:min-w-0" title="Print approved revision"><Printer className="w-4 h-4" /></button><button onClick={() => void exportApproved("pdf")} disabled={selected.status !== "Approved"} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 touch-target sm:min-h-0 sm:min-w-0" title="Export approved PDF"><Download className="w-4 h-4" /></button><button onClick={() => void exportApproved("docx")} disabled={selected.status !== "Approved"} className="px-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-[9px] font-bold touch-target sm:min-h-0 sm:min-w-0" title="Export approved DOCX">DOCX</button></div></div><textarea aria-label="Court document draft" value={selected.revision.body} onChange={(e) => saveBody(e.target.value)} readOnly={selected.status === "Approved"} className="w-full min-h-[330px] bg-white border border-slate-200 rounded-lg p-3 sm:p-5 text-xs font-mono leading-relaxed text-slate-800 outline-none focus-accent-border print:border-0 print:min-h-0" /><div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className={`text-[10px] font-bold ${selected.revision.requiredFieldsComplete ? "text-emerald-700" : "text-amber-700"}`}>{selected.revision.requiredFieldsComplete ? "Required fields complete" : "Complete every [REQUIRED] field before approval"}</div>{selected.status === "Draft" && <button onClick={() => void approve()} disabled={!canApprove || !selected.revision.requiredFieldsComplete} className="accent-primary rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-40 inline-flex items-center justify-center gap-2 min-h-[44px]"><FileCheck2 className="w-4 h-4" />Approve exact revision</button>}{selected.status === "Approved" && <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Approved</span>}</div></div> : <div className="border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-500 min-h-[180px]">Select a document.</div>}</div>}

      {tab === "fees" && <div className="space-y-3"><form onSubmit={addFee} className="grid md:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3"><input aria-label="Fee label" required value={feeForm.label} onChange={(event) => setFeeForm({ ...feeForm, label: event.target.value })} placeholder="Filing fee" className="auth-input" /><input aria-label="Fee amount" type="number" min="0" step="0.01" value={feeForm.amount} onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })} placeholder="GHS amount" className="auth-input" /><input aria-label="Fee source URL" type="url" value={feeForm.sourceUrl} onChange={(event) => setFeeForm({ ...feeForm, sourceUrl: event.target.value })} placeholder="Official source URL" className="auth-input" /><input aria-label="Fee effective date" type="date" value={feeForm.effectiveDate} onChange={(event) => setFeeForm({ ...feeForm, effectiveDate: event.target.value })} className="auth-input" /><button className="accent-primary rounded-lg px-3 text-xs font-bold inline-flex items-center justify-center gap-1 min-h-[44px]"><Plus className="w-3.5 h-3.5" />Add fee</button></form><div className="border border-slate-200 rounded-xl overflow-hidden"><div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-500"><span>Item</span><span>Status</span><span>Amount</span></div>{fees.length === 0 ? <div className="p-4 text-xs text-slate-500">No court fees recorded. Amounts remain blank until an authoritative source is attached.</div> : fees.map((fee) => <div key={fee.feeId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-3 border-t border-slate-100 text-xs"><div><div className="font-bold text-slate-800">{fee.label}</div>{fee.sourceUrl && <a href={fee.sourceUrl} target="_blank" rel="noreferrer" className="text-[9px] accent-text">Verified source</a>}</div><button disabled={fee.status === "Needs verification"} onClick={() => void updateFeeStatus(fee, fee.status === "Paid" ? "Due" : "Paid")} className={`font-bold min-h-[44px] ${fee.status === "Paid" ? "text-emerald-700" : fee.status === "Needs verification" ? "text-amber-700" : "text-slate-600"}`}>{fee.status}</button><span>{fee.amount == null ? "—" : fee.amount.toLocaleString()} {fee.currency}</span></div>)}</div></div>}
      {tab === "deadlines" && <div className="space-y-3"><form onSubmit={addDeadline} className="grid md:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3"><input aria-label="Deadline title" required value={deadlineForm.title} onChange={(event) => setDeadlineForm({ ...deadlineForm, title: event.target.value })} placeholder="Response deadline" className="auth-input" /><input aria-label="Deadline due date" type="datetime-local" value={deadlineForm.dueAt} onChange={(event) => setDeadlineForm({ ...deadlineForm, dueAt: event.target.value })} className="auth-input" /><input aria-label="Deadline basis" required value={deadlineForm.basis} onChange={(event) => setDeadlineForm({ ...deadlineForm, basis: event.target.value })} placeholder="Triggering rule or order" className="auth-input" /><input aria-label="Deadline source URL" type="url" value={deadlineForm.sourceUrl} onChange={(event) => setDeadlineForm({ ...deadlineForm, sourceUrl: event.target.value })} placeholder="Official source URL" className="auth-input" /><button className="accent-primary rounded-lg px-3 text-xs font-bold inline-flex items-center justify-center gap-1 min-h-[44px]"><Plus className="w-3.5 h-3.5" />Add deadline</button></form>{deadlines.length === 0 ? <div className="border border-slate-200 rounded-xl p-5 flex items-start gap-3"><CalendarClock className="w-5 h-5 text-amber-600" /><div><div className="text-xs font-bold text-slate-900">No verified procedural deadlines</div><p className="text-[11px] text-slate-500 mt-1">Add the applicable source and triggering event before relying on a date.</p></div></div> : <div className="space-y-2">{deadlines.map((deadline) => <div key={deadline.deadlineId} className="border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="text-xs font-bold text-slate-900">{deadline.title}</div><div className="text-[10px] text-slate-500 mt-1">{deadline.dueAt ? new Date(deadline.dueAt).toLocaleString() : "Date needs verification"} · {deadline.basis}</div></div><button disabled={deadline.status === "Needs verification" || deadline.status === "Completed"} onClick={() => void completeDeadline(deadline)} className={`text-[10px] font-bold min-h-[44px] self-start sm:self-auto ${deadline.status === "Completed" ? "text-emerald-700" : deadline.status === "Needs verification" ? "text-amber-700" : "accent-text"}`}>{deadline.status === "Upcoming" ? "Mark complete" : deadline.status}</button></div>)}</div>}</div>}
    </div>
  );
}
