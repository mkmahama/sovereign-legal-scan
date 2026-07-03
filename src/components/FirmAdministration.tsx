import React from "react";
import { Building2, CheckCircle2, Link2, LogOut, ShieldCheck, Smartphone, UserPlus } from "lucide-react";
import { ConfirmationResult, GoogleAuthProvider, RecaptchaVerifier, linkWithPhoneNumber, linkWithPopup, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { apiRequest } from "../lib/api";
import { Firm, FirmMembership, Invitation, UserProfile } from "../types";

const isPostgresAuth = import.meta.env.VITE_AUTH_MODE === "postgres";

export default function FirmAdministration({ activeUser }: { activeUser: UserProfile }) {
  const [members, setMembers] = React.useState<Array<FirmMembership & { profile?: UserProfile }>>([]);
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("+233");
  const [professionalRole, setProfessionalRole] = React.useState("Lawyer");
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");
  const [workspaces, setWorkspaces] = React.useState<Array<{ membership: FirmMembership; firm: Firm | null }>>([]);
  const [myPhone, setMyPhone] = React.useState("+233");
  const [smsCode, setSmsCode] = React.useState("");
  const [phoneConfirmation, setPhoneConfirmation] = React.useState<ConfirmationResult | null>(null);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);

  React.useEffect(() => {
    void apiRequest<{ members: Array<FirmMembership & { profile?: UserProfile }> }>(`/api/firms/${activeUser.firmId}/members`).then((result) => setMembers(result.members)).catch(() => setMembers([]));
    void apiRequest<{ workspaces: Array<{ membership: FirmMembership; firm: Firm | null }> }>("/api/session/workspaces").then((result) => setWorkspaces(result.workspaces)).catch(() => setWorkspaces([]));
    void apiRequest<{ invitations: Invitation[] }>(`/api/firms/${activeUser.firmId}/invitations`).then((result) => setInvitations(result.invitations)).catch(() => setInvitations([]));
  }, [activeUser.firmId]);

  const switchWorkspace = async (firmId: string) => {
    if (firmId === activeUser.firmId) return;
    await apiRequest("/api/session/active-firm", { method: "POST", body: JSON.stringify({ firmId }) });
    window.location.reload();
  };

  const linkGoogle = async () => {
    setError("");
    try { if (auth.currentUser) await linkWithPopup(auth.currentUser, new GoogleAuthProvider()); setNotice("Google sign-in connected to this account."); }
    catch (caught: any) { setError(caught?.message || "Unable to connect Google sign-in."); }
  };

  const startPhoneLink = async () => {
    setError("");
    try {
      if (!auth.currentUser) return;
      const verifier = new RecaptchaVerifier(auth, "profile-recaptcha", { size: "invisible" });
      setPhoneConfirmation(await linkWithPhoneNumber(auth.currentUser, myPhone, verifier));
      setNotice(`SMS code sent to ${myPhone}.`);
    } catch (caught: any) { setError(caught?.message || "Unable to send SMS verification."); }
  };

  const confirmPhone = async () => {
    setError("");
    try {
      await phoneConfirmation?.confirm(smsCode);
      await auth.currentUser?.getIdToken(true);
      await apiRequest("/api/profile/whatsapp-identity", { method: "POST", body: "{}" });
      setPhoneConfirmation(null); setSmsCode(""); setNotice("Phone verified for SMS sign-in and WhatsApp case access.");
    } catch (caught: any) { setError(caught?.message || "Unable to verify the SMS code."); }
  };

  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const created = await apiRequest<{ acceptancePath: string }>(`/api/firms/${activeUser.firmId}/invitations`, { method: "POST", body: JSON.stringify({ email, phoneNumber: phone, firmRole: "Member", professionalRole, idempotencyKey: crypto.randomUUID() }) });
      setNotice(`Invitation created. Secure acceptance link: ${window.location.origin}${created.acceptancePath}`); setEmail("");
      const result = await apiRequest<{ invitations: Invitation[] }>(`/api/firms/${activeUser.firmId}/invitations`); setInvitations(result.invitations);
    } catch (caught: any) { setError(caught?.message || "Unable to create invitation."); }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      await apiRequest(`/api/firms/${activeUser.firmId}/invitations/${invitationId}/revoke`, { method: "POST", body: "{}" });
      setInvitations((current) => current.map((item) => item.invitationId === invitationId ? { ...item, status: "Revoked" } : item));
    } catch (caught: any) { setError(caught?.message || "Unable to revoke invitation."); }
  };

  const setMemberStatus = async (member: FirmMembership, status: "Active" | "Suspended") => {
    try {
      await apiRequest(`/api/firms/${activeUser.firmId}/members/${member.uid}/status`, { method: "POST", body: JSON.stringify({ status }) });
      setMembers((current) => current.map((item) => item.uid === member.uid ? { ...item, status } : item));
    } catch (caught: any) { setError(caught?.message || "Unable to update member status."); }
  };

  const signOutCurrentUser = async () => {
    if (isPostgresAuth) {
      window.localStorage?.removeItem("sovereign-local-auth-token");
      window.location.reload();
      return;
    }
    await signOut(auth);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-4 sm:p-5 text-slate-300 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Building2 className="w-5 h-5 accent-text" /><div><h3 className="text-xs font-bold text-white uppercase tracking-wider">Firm administration</h3><p className="text-[10px] text-slate-400 mt-1">{activeUser.firmId}</p></div></div><button onClick={() => void signOutCurrentUser()} className="text-[10px] font-bold text-slate-400 hover:text-white inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5" />Sign out</button></div>
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center gap-3"><div className="w-9 h-9 accent-bg rounded-full flex items-center justify-center text-white font-black text-xs">{activeUser.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-white">{activeUser.displayName}</div><div className="text-[10px] text-slate-400 truncate">{activeUser.email} · {activeUser.professionalRole || activeUser.role}</div></div>{activeUser.phoneVerified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}</div>
      {workspaces.length > 1 && <div><label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Active workspace</label><select aria-label="Active firm workspace" value={activeUser.firmId} onChange={(event) => void switchWorkspace(event.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white">{workspaces.map((workspace) => <option key={workspace.membership.membershipId} value={workspace.membership.firmId}>{workspace.firm?.name || workspace.membership.firmId} · {workspace.membership.firmRole}</option>)}</select></div>}
      <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-3 space-y-3">
        <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2"><Link2 className="w-3.5 h-3.5" />Sign-in & channel connections</div>
        <button type="button" onClick={() => void linkGoogle()} className="w-full border border-slate-700 accent-border-hover rounded px-3 py-2 text-xs text-left font-bold">Connect Google sign-in</button>
        <div className="flex gap-2"><input aria-label="My WhatsApp number" value={myPhone} onChange={(event) => setMyPhone(event.target.value)} className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white" />{phoneConfirmation ? <><input aria-label="Profile SMS code" value={smsCode} onChange={(event) => setSmsCode(event.target.value)} placeholder="SMS code" className="w-24 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white" /><button type="button" onClick={() => void confirmPhone()} className="accent-bg rounded px-3 text-xs font-bold">Verify</button></> : <button type="button" onClick={() => void startPhoneLink()} className="bg-slate-800 rounded px-3 text-xs font-bold inline-flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" />Link</button>}</div>
        <div id="profile-recaptcha" />
      </div>
      <form onSubmit={invite} className="grid md:grid-cols-2 gap-2 bg-slate-900/70 border border-slate-700 rounded-lg p-3">
        <div className="md:col-span-2 text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" />Invite firm member</div>
        <input aria-label="Member email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lawyer@firm.com" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus-accent-border" />
        <input aria-label="Member phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus-accent-border" />
        <select aria-label="Professional role" value={professionalRole} onChange={(e) => setProfessionalRole(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white"><option>Lawyer</option><option>Paralegal</option><option>Operations</option></select>
        <button className="accent-primary rounded px-3 py-2 text-xs text-white font-bold">Create invitation</button>
      </form>
      {notice && <p className="text-[10px] text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{notice}</p>}{error && <p className="text-[10px] text-rose-300">{error}</p>}
      {invitations.some((item) => item.status === "Pending") && <div className="space-y-2"><div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Pending invitations</div>{invitations.filter((item) => item.status === "Pending").map((item) => <div key={item.invitationId} className="flex items-center justify-between gap-3 border-t border-slate-800 pt-2 text-[10px]"><span className="text-slate-200 truncate">{item.email} · {item.professionalRole}</span><button onClick={() => void revokeInvitation(item.invitationId)} className="text-rose-400 font-bold">Revoke</button></div>)}</div>}
      {members.length > 0 && <div className="space-y-2"><div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Firm members</div>{members.map((member) => <div key={member.membershipId} className="flex items-center justify-between gap-3 border-t border-slate-800 pt-2 text-[10px]"><span className="text-slate-200 min-w-0 truncate">{member.profile?.displayName || member.uid} · {member.firmRole} · {member.professionalRole}</span>{member.uid !== activeUser.uid && member.firmRole !== "Owner" && <button onClick={() => void setMemberStatus(member, member.status === "Active" ? "Suspended" : "Active")} className={member.status === "Active" ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{member.status === "Active" ? "Suspend" : "Reactivate"}</button>}</div>)}</div>}
    </div>
  );
}
