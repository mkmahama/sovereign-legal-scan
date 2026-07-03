import React from "react";
import { UserProfile } from "../types";
import { Shield, Trash2, Users } from "lucide-react";

// Pre-configured firm lawyers to demonstrate sharing and data sovereignty partition
export const SAMPLE_LAWYERS: UserProfile[] = [
  {
    uid: "lawyer_elena_123",
    email: "elena.vance@lexissovereign.com",
    displayName: "Elena Vance, Esq.",
    role: "Lawyer",
    firmId: "firm_lexis_sovereign",
    createdAt: "2026-01-10T10:00:00Z"
  },
  {
    uid: "lawyer_jordan_456",
    email: "jordan.brooks@lexissovereign.com",
    displayName: "Jordan Brooks, Esq.",
    role: "Lawyer",
    firmId: "firm_lexis_sovereign",
    createdAt: "2026-02-15T11:30:00Z"
  },
  {
    uid: "lawyer_marcus_789",
    email: "marcus.thorne@centuriondefense.com",
    displayName: "Marcus Thorne, Esq.",
    role: "Lawyer",
    firmId: "firm_centurion_defense",
    createdAt: "2026-03-01T09:15:00Z"
  },
  {
    uid: "lawyer_sasha_321",
    email: "sasha.patel@centuriondefense.com",
    displayName: "Sasha Patel, Esq.",
    role: "Paralegal",
    firmId: "firm_centurion_defense",
    createdAt: "2026-04-20T14:45:00Z"
  },
  {
    uid: "collab_1",
    email: "karim@alphalaw.com",
    displayName: "Abdul Karim",
    role: "Admin",
    firmId: "firm_alpha",
    createdAt: "2025-11-04T08:30:00Z"
  },
  {
    uid: "collab_2",
    email: "emmanuel@alphalaw.com",
    displayName: "Emmanuel Okay",
    role: "Lawyer",
    firmId: "firm_alpha",
    createdAt: "2026-01-18T12:00:00Z"
  },
  {
    uid: "collab_3",
    email: "boateng@alphalaw.com",
    displayName: "Boateng Abraham",
    role: "Paralegal",
    firmId: "firm_alpha",
    createdAt: "2026-02-09T15:20:00Z"
  }
];

export const FIRM_NAMES: { [key: string]: string } = {
  firm_lexis_sovereign: "Lexis Sovereign Partners",
  firm_centurion_defense: "Centurion Defense Group",
  firm_alpha: "Alpha Law Chambers"
};

interface FirmUserManagementProps {
  activeUser: UserProfile;
  onUserSwitch: (user: UserProfile) => void;
  onAddUser: (name: string, email: string, role: UserProfile["role"], firmId: string) => void;
  onDeleteUser: (uid: string) => void;
  customUsers: UserProfile[];
}

export default function FirmUserManagement({
  activeUser,
  onUserSwitch,
  onAddUser,
  onDeleteUser,
  customUsers
}: FirmUserManagementProps) {
  const [nameInput, setNameInput] = React.useState("");
  const [emailInput, setEmailInput] = React.useState("");
  const [roleInput, setRoleInput] = React.useState<UserProfile["role"]>("Lawyer");
  const [firmInput, setFirmInput] = React.useState("firm_lexis_sovereign");
  const [isAdding, setIsAdding] = React.useState(false);

  const allLawyers = [...SAMPLE_LAWYERS, ...customUsers];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !emailInput) return;
    onAddUser(nameInput, emailInput, roleInput, firmInput);
    setNameInput("");
    setEmailInput("");
    setIsAdding(false);
  };

  return (
    <div id="firm-id-panel" className="bg-[#0f172a] border border-slate-700 rounded-xl p-4 sm:p-5 text-slate-300 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-emerald-400" />
          <h3 className="font-sans font-bold text-xs text-slate-100 uppercase tracking-wider">Access & Identity</h3>
        </div>
        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
          SECURE PORT
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
        Simulate multi-tenant legal protection by toggling user credentials below.
      </p>

      {/* Current Active Lawyer Profile info */}
      <div className="bg-slate-900/60 rounded-lg p-3.5 border border-slate-700 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] text-indigo-400 font-bold tracking-wider uppercase">Active Identity</div>
            <div className="text-xs font-bold text-white font-sans mt-0.5">{activeUser.displayName}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 break-all">{activeUser.email}</div>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700 leading-none">
            {activeUser.role}
          </span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-750/80 flex items-center justify-between text-[11px] text-indigo-300">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" />
            <span className="font-bold font-sans truncate max-w-[140px]">{FIRM_NAMES[activeUser.firmId]}</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">ID: {activeUser.firmId.replace("firm_", "")}</span>
        </div>
      </div>

      {/* Select Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto mb-4 pr-1 scrollbar-thin">
        {allLawyers.map((lawyer) => {
          const isActive = lawyer.uid === activeUser.uid;
          const isCustom = customUsers.some((user) => user.uid === lawyer.uid);
          return (
            <div key={lawyer.uid} className={`rounded-lg border transition-all duration-150 flex items-stretch ${
              isActive
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-inner"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
            }`}>
              <button
                id={`switch-user-${lawyer.uid}`}
                onClick={() => onUserSwitch(lawyer)}
                className="min-w-0 flex-1 text-left p-2.5 text-[11px] flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{lawyer.displayName}</div>
                  <div className="text-[9px] text-slate-500 font-sans truncate">{FIRM_NAMES[lawyer.firmId] || lawyer.firmId}</div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] shrink-0">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {lawyer.role}
                </div>
              </button>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteUser(lawyer.uid)}
                  className="px-2.5 border-l border-slate-700 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-r-lg"
                  aria-label={`Delete ${lawyer.displayName}`}
                  title="Remove custom profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new user form toggle */}
      {!isAdding ? (
        <button
          id="btn-add-partner"
          onClick={() => setIsAdding(true)}
          className="w-full py-2 border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-lg text-[11px] font-bold text-center transition-colors cursor-pointer"
        >
          + Provision Colleague
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg space-y-3 shadow-md">
          <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-widest">Provision User</div>
          
          <div>
            <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Full Legal Name</label>
            <input
              id="input-new-user-name"
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Rachel Zane, Esq."
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">E-mail Address</label>
            <input
              id="input-new-user-email"
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="rachel.zane@firm.com"
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Role Type</label>
              <select
                id="select-new-user-role"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as UserProfile["role"])}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="Lawyer">Lawyer</option>
                <option value="Paralegal">Paralegal</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Firm</label>
              <select
                id="select-new-user-firm"
                value={firmInput}
                onChange={(e) => setFirmInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="firm_lexis_sovereign">Lexis Sovereign</option>
                <option value="firm_centurion_defense">Centurion</option>
                <option value="firm_alpha">Alpha Law</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              id="btn-cancel-user"
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded transition-colors text-[10px] uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-user"
              type="submit"
              className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded transition-colors text-[10px] uppercase cursor-pointer"
            >
              Provision
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
