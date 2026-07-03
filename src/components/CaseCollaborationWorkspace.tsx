import React from "react";
import { Check, ChevronDown, MessageCircle, Paperclip, ShieldCheck, UserPlus, Users } from "lucide-react";
import { CaseAccessPreset, CaseFile, PermissionSet, QuarantinedFile, UserProfile } from "../types";
import { CASE_PERMISSION_PRESETS, permissionsForPreset } from "../lib/permissions";
import { apiRequest } from "../lib/api";
import { auth } from "../lib/firebase";

interface Props {
  caseFile: CaseFile;
  activeUser: UserProfile;
  colleagues: UserProfile[];
  onUpdateCase: (updated: CaseFile) => void;
}

interface LocalMember { user: UserProfile; preset: CaseAccessPreset; permissions: PermissionSet; guest: boolean; }

const permissionLabels: Array<[keyof PermissionSet, string]> = [
  ["canView", "View case"], ["canEdit", "Edit case"], ["canShare", "Manage access"],
  ["canMessage", "Case messaging"], ["canUpload", "Upload files"],
  ["canGenerateDrafts", "Generate drafts"], ["canApproveFilings", "Approve filings"], ["canExport", "Export documents"],
];

export default function CaseCollaborationWorkspace({ caseFile, activeUser, colleagues, onUpdateCase }: Props) {
  const initial = colleagues.filter((u) => caseFile.sharedWithUids?.includes(u.uid)).map((user) => ({
    user, preset: "Co-counsel" as CaseAccessPreset, permissions: permissionsForPreset("Co-counsel"), guest: user.firmId !== caseFile.firmId,
  }));
  const [members, setMembers] = React.useState<LocalMember[]>(initial);
  const [directory, setDirectory] = React.useState<UserProfile[]>(colleagues);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [invitePhone, setInvitePhone] = React.useState("+233");
  const [invitePreset, setInvitePreset] = React.useState<CaseAccessPreset>("Co-counsel");
  const [expandedUid, setExpandedUid] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ messageId: string; body: string; senderUid: string; status: string; createdAt: string }>>([]);
  const [messageBody, setMessageBody] = React.useState("");
  const [quarantinedFiles, setQuarantinedFiles] = React.useState<Array<QuarantinedFile & { scanStatus?: string }>>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    void Promise.all([
      apiRequest<{ members: Array<{ uid: string; preset: CaseAccessPreset; permissions: PermissionSet; isGuest: boolean; profile?: UserProfile }> }>(`/api/cases/${caseFile.caseId}/members`),
      activeUser.firmId === caseFile.firmId
        ? apiRequest<{ members: Array<{ status: string; profile?: UserProfile }> }>(`/api/firms/${caseFile.firmId}/members`)
        : Promise.resolve({ members: [] as Array<{ status: string; profile?: UserProfile }> }),
    ])
      .then(([caseResult, firmResult]) => {
        setMembers(caseResult.members.filter((item) => item.profile && item.uid !== activeUser.uid).map((item) => ({ user: item.profile!, preset: item.preset, permissions: item.permissions, guest: item.isGuest })));
        setDirectory(firmResult.members.flatMap((item) => item.status === "Active" && item.profile ? [item.profile] : []));
      })
      .catch((caught: any) => setError(caught?.message || "Unable to load case members."));
  }, [activeUser.uid, caseFile.caseId]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    void apiRequest<{ messages: typeof messages }>(`/api/cases/${caseFile.caseId}/messages`).then((result) => setMessages(result.messages)).catch(() => undefined);
    void apiRequest<{ files: Array<QuarantinedFile & { scanStatus?: string }> }>(`/api/cases/${caseFile.caseId}/quarantined-files`).then((result) => setQuarantinedFiles(result.files)).catch(() => undefined);
  }, [caseFile.caseId]);

  const syncLegacy = (next: LocalMember[]) => {
    setMembers(next);
    if (!auth.currentUser) onUpdateCase({ ...caseFile, sharedWithUids: next.map((member) => member.user.uid) });
  };

  const persistMember = async (member: LocalMember, status: "Active" | "Revoked" = "Active") => {
    if (!auth.currentUser) return;
    await apiRequest(`/api/cases/${caseFile.caseId}/members/${member.user.uid}`, { method: "PUT", body: JSON.stringify({ preset: member.preset, permissions: member.permissions, isGuest: member.guest, messagingOptIn: member.permissions.canMessage, status }) });
  };

  const addColleague = (user: UserProfile) => {
    if (members.some((member) => member.user.uid === user.uid)) return;
    const member = { user, preset: "Contributor" as CaseAccessPreset, permissions: permissionsForPreset("Contributor"), guest: false };
    syncLegacy([...members, member]);
    void persistMember(member).catch((caught: any) => setError(caught?.message || "Unable to grant case access."));
  };

  const updatePreset = (uid: string, preset: CaseAccessPreset) => {
    const next = members.map((member) => member.user.uid === uid ? { ...member, preset, permissions: permissionsForPreset(preset) } : member);
    syncLegacy(next);
    const changed = next.find((member) => member.user.uid === uid);
    if (changed) void persistMember(changed).catch((caught: any) => setError(caught?.message || "Unable to update access."));
  };

  const togglePermission = (uid: string, key: keyof PermissionSet) => {
    const next = members.map((member) => member.user.uid === uid ? { ...member, permissions: { ...member.permissions, [key]: !member.permissions[key] } } : member);
    syncLegacy(next);
    const changed = next.find((member) => member.user.uid === uid);
    if (changed) void persistMember(changed).catch((caught: any) => setError(caught?.message || "Unable to update permission."));
  };

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (auth.currentUser) {
        const result = await apiRequest<{ acceptancePath: string }>(`/api/firms/${caseFile.firmId}/invitations`, { method: "POST", body: JSON.stringify({ email: inviteEmail, phoneNumber: invitePhone, firmRole: "Guest", professionalRole: "Lawyer", caseId: caseFile.caseId, preset: invitePreset, permissions: permissionsForPreset(invitePreset), idempotencyKey: crypto.randomUUID() }) });
        setNotice(`Invitation created for ${inviteEmail}. Secure acceptance link: ${window.location.origin}${result.acceptancePath}`);
      } else setNotice(`Invitation prepared for ${inviteEmail}. Access expires in 7 days.`);
      setInviteEmail(""); setInviteOpen(false);
    } catch (caught: any) { setError(caught?.message || "Unable to invite counsel."); }
  };

  const revokeMember = (member: LocalMember) => {
    syncLegacy(members.filter((item) => item.user.uid !== member.user.uid));
    void persistMember(member, "Revoked").catch((caught: any) => setError(caught?.message || "Unable to revoke access."));
  };

  const sendCaseMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageBody.trim()) return;
    try {
      const result = await apiRequest<{ message: { messageId: string; body: string; senderUid: string; status: string; createdAt: string } }>(`/api/cases/${caseFile.caseId}/messages`, { method: "POST", body: JSON.stringify({ body: messageBody, idempotencyKey: crypto.randomUUID() }) });
      setMessages((current) => [...current, result.message]); setMessageBody("");
    } catch (caught: any) { setError(caught?.message || "Unable to relay the case message."); }
  };

  const approveQuarantinedFile = async (file: QuarantinedFile) => {
    try {
      await apiRequest(`/api/quarantined-files/${file.fileId}/approve`, { method: "POST", body: JSON.stringify({ classification: "Case document" }) });
      setQuarantinedFiles((current) => current.map((item) => item.fileId === file.fileId ? { ...item, status: "Approved" } : item));
    } catch (caught: any) { setError(caught?.message || "Unable to approve the file."); }
  };

  const available = directory.filter((user) => user.uid !== activeUser.uid && !members.some((member) => member.user.uid === user.uid));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h3 className="text-sm font-bold text-slate-900">Case team & access</h3><p className="text-xs text-slate-500 mt-1">Firm members and invited counsel only see the capabilities granted here.</p></div>
        <button onClick={() => setInviteOpen(!inviteOpen)} className="inline-flex items-center justify-center gap-2 accent-primary text-white rounded-lg px-3 py-2 text-xs font-bold min-h-[44px]"><UserPlus className="w-4 h-4" /> Invite outside counsel</button>
      </div>

      {inviteOpen && (
        <form onSubmit={sendInvite} className="grid md:grid-cols-[1fr_0.8fr_0.7fr_auto] gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <input aria-label="Counsel email" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="counsel@chambers.com" className="auth-input" />
          <input aria-label="WhatsApp phone" required value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} className="auth-input" />
          <select aria-label="Access preset" value={invitePreset} onChange={(e) => setInvitePreset(e.target.value as CaseAccessPreset)} className="auth-input">{Object.keys(CASE_PERMISSION_PRESETS).map((preset) => <option key={preset}>{preset}</option>)}</select>
          <button className="px-4 rounded-lg bg-slate-900 text-white text-xs font-bold min-h-[44px]">Send invite</button>
        </form>
      )}
      {notice && <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-2"><Check className="w-4 h-4" />{notice}</div>}
      {error && <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-100 rounded-lg p-3">{error}</div>}

      {available.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Available firm members</div>
          <div className="flex gap-2 flex-wrap">{available.map((user) => <button key={user.uid} onClick={() => addColleague(user)} className="bg-white border border-slate-200 accent-border-hover rounded-lg px-3 py-2 text-xs font-semibold min-h-[44px]">+ {user.displayName}</button>)}</div>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
        {members.length === 0 ? (
          <div className="p-8 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto" /><p className="text-sm font-semibold text-slate-700 mt-3">Only you can access this case</p><p className="text-xs text-slate-500 mt-1">Add a firm member or invite outside counsel.</p></div>
        ) : members.map((member) => (
          <div key={member.user.uid} className="bg-white">
              <div className="p-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="w-9 h-9 rounded-full accent-badge flex items-center justify-center font-black text-xs">{member.user.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-900 truncate">{member.user.displayName}</span>{member.guest && <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 font-bold">GUEST</span>}</div><div className="text-[10px] text-slate-500 truncate">{member.user.email} · {member.user.phoneNumber || "WhatsApp not verified"}</div></div>
              <select aria-label={`Access for ${member.user.displayName}`} value={member.preset} onChange={(e) => updatePreset(member.user.uid, e.target.value as CaseAccessPreset)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-slate-50 w-full md:w-auto">{Object.keys(CASE_PERMISSION_PRESETS).map((preset) => <option key={preset}>{preset}</option>)}</select>
              <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
                <button onClick={() => setExpandedUid(expandedUid === member.user.uid ? null : member.user.uid)} className="text-xs font-bold text-slate-600 inline-flex items-center justify-center gap-1 border border-slate-200 rounded-lg px-3 py-2 md:border-0 md:px-0 md:py-0">Customize <ChevronDown className={`w-3.5 h-3.5 transition ${expandedUid === member.user.uid ? "rotate-180" : ""}`} /></button>
                <button onClick={() => revokeMember(member)} className="text-xs font-bold text-rose-600 border border-rose-100 rounded-lg px-3 py-2 md:border-0 md:px-0 md:py-0">Revoke</button>
              </div>
            </div>
            {expandedUid === member.user.uid && <div className="px-3 pb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">{permissionLabels.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2"><input type="checkbox" checked={member.permissions[key]} onChange={() => togglePermission(member.user.uid, key)} />{label}</label>)}</div>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-slate-200 rounded-xl p-3"><MessageCircle className="w-4 h-4 text-emerald-600" /><div className="text-xs font-bold mt-2">WhatsApp case bridge</div><p className="text-[10px] text-slate-500 mt-1">Authorized, opted-in numbers only. Revoked users stop receiving messages immediately.</p></div>
        <div className="border border-slate-200 rounded-xl p-3"><Paperclip className="w-4 h-4 text-amber-600" /><div className="text-xs font-bold mt-2">Files quarantined</div><p className="text-[10px] text-slate-500 mt-1">Inbound media needs lawyer classification and approval before entering evidence.</p></div>
        <div className="border border-slate-200 rounded-xl p-3"><ShieldCheck className="w-4 h-4 accent-text" /><div className="text-xs font-bold mt-2">Audited changes</div><p className="text-[10px] text-slate-500 mt-1">Invites, permission changes, messages, and file promotions are recorded.</p></div>
      </div>

      {auth.currentUser && <div className="grid lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div><h4 className="text-xs font-bold text-slate-900">WhatsApp team relay</h4><p className="text-[10px] text-slate-500 mt-1">Messages are relayed only to opted-in, authorized case members.</p></div>
          <div className="max-h-48 overflow-y-auto space-y-2">{messages.length === 0 ? <p className="text-[10px] text-slate-400 italic">No relayed case messages yet.</p> : messages.map((message) => <div key={message.messageId} className="bg-slate-50 border border-slate-100 rounded-lg p-2"><p className="text-[11px] text-slate-700">{message.body}</p><div className="text-[9px] text-slate-400 mt-1">{message.senderUid === activeUser.uid ? "You" : "Case counsel"} · {message.status}</div></div>)}</div>
          <form onSubmit={sendCaseMessage} className="flex gap-2"><input aria-label="Case relay message" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Send a case update through WhatsApp…" className="auth-input min-w-0 flex-1" /><button className="accent-primary rounded-lg px-3 text-xs font-bold min-h-[44px]">Relay</button></form>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div><h4 className="text-xs font-bold text-slate-900">Inbound file quarantine</h4><p className="text-[10px] text-slate-500 mt-1">Files stay isolated until malware scanning and lawyer approval are complete.</p></div>
          {quarantinedFiles.length === 0 ? <p className="text-[10px] text-slate-400 italic">No inbound files awaiting review.</p> : quarantinedFiles.map((file) => <div key={file.fileId} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg p-2"><div className="min-w-0"><div className="text-[11px] font-bold text-slate-800 truncate">{file.fileName}</div><div className="text-[9px] text-slate-500">Scan: {file.scanStatus || "Pending"} · {file.status}</div></div>{file.status === "Quarantined" && <button disabled={file.scanStatus !== "Clean"} onClick={() => void approveQuarantinedFile(file)} className="text-[10px] font-bold accent-text disabled:text-slate-400">Approve</button>}</div>)}
        </div>
      </div>}
    </div>
  );
}
