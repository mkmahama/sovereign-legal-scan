import React from "react";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { Scale, ShieldCheck, Smartphone, Building2 } from "lucide-react";
import { auth } from "../lib/firebase";
import { apiRequest } from "../lib/api";
import { UserProfile } from "../types";

interface AuthGatewayProps {
  children: (profile: UserProfile) => React.ReactNode;
}

type Stage = "auth" | "phone-code" | "firm";
const isPostgresAuth = import.meta.env.VITE_AUTH_MODE === "postgres";
const SEEDED_PASSWORD = "SovereignTest123!";
const SEEDED_LOGINS = [
  { label: "Owner / Admin", email: "owner.seed@sovereign.test", name: "Nana Owusu", status: "Active" },
  { label: "Verified Lawyer", email: "lawyer.seed@sovereign.test", name: "Ama Mensah", status: "Active" },
  { label: "Paralegal", email: "paralegal.seed@sovereign.test", name: "Kojo Boateng", status: "Active" },
  { label: "Guest Co-counsel", email: "guest.seed@sovereign.test", name: "Esi Adjei", status: "Active" },
  { label: "Suspended User", email: "suspended.seed@sovereign.test", name: "Kwame Sarpong", status: "Suspended" },
];

export default function AuthGateway({ children }: AuthGatewayProps) {
  const inviteToken = React.useMemo(() => window.location.pathname.match(/^\/invite\/([^/]+)$/)?.[1] || null, []);
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [stage, setStage] = React.useState<Stage>("auth");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("+233");
  const [code, setCode] = React.useState("");
  const [firmName, setFirmName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [confirmation, setConfirmation] = React.useState<ConfirmationResult | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const loadSession = React.useCallback(async (user: User) => {
    try {
      if (inviteToken && !window.sessionStorage.getItem(`accepted-invite-${inviteToken}`)) {
        await apiRequest(`/api/invitations/${inviteToken}/accept`, { method: "POST", body: JSON.stringify({ displayName: user.displayName || undefined }) });
        window.sessionStorage.setItem(`accepted-invite-${inviteToken}`, "true");
        window.history.replaceState({}, "", "/");
      }
      const data = await apiRequest<{ profile: UserProfile }>("/api/session");
      setProfile(data.profile);
    } catch (requestError: any) {
      if (requestError?.status === 404) {
        setDisplayName(user.displayName || "");
        setStage("firm");
      } else {
        setError(requestError?.message || "Unable to load your secure workspace.");
      }
    }
  }, [inviteToken]);

  React.useEffect(() => {
    if (isPostgresAuth) return;
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) void loadSession(user);
      else { setProfile(null); setStage("auth"); }
    });
  }, [loadSession]);

  React.useEffect(() => {
    if (!isPostgresAuth) return;
    const token = window.localStorage?.getItem("sovereign-local-auth-token");
    if (!token) return;
    void apiRequest<{ profile: UserProfile }>("/api/session")
      .then((data) => setProfile(data.profile))
      .catch(() => window.localStorage?.removeItem("sovereign-local-auth-token"));
  }, []);

  if (profile) return <>{children(profile)}</>;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await action(); } catch (caught: any) { setError(caught?.message || "Authentication failed."); }
    finally { setBusy(false); }
  };

  const startPhone = () => run(async () => {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    setConfirmation(result); setStage("phone-code");
  });

  const createFirm = () => run(async () => {
    const data = await apiRequest<{ profile: UserProfile }>("/api/firms", {
      method: "POST",
      body: JSON.stringify({ name: firmName, displayName, countryCode: "GH", phoneNumber: firebaseUser?.phoneNumber }),
    });
    setProfile(data.profile);
  });

  const localSignIn = (credentials?: { email: string; password: string }) => run(async () => {
    const loginEmail = credentials?.email || email;
    const loginPassword = credentials?.password || password;
    const response = await fetch("/api/local-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || "Invalid email or password.");
    window.localStorage?.setItem("sovereign-local-auth-token", data.token);
    setProfile(data.profile);
  });

  const localRegister = () => run(async () => {
    const response = await fetch("/api/local-auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, firmName, countryCode: "GH" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || "Unable to create local account.");
    window.localStorage?.setItem("sovereign-local-auth-token", data.token);
    setProfile(data.profile);
  });

  const useSeededLogin = (seed: typeof SEEDED_LOGINS[number]) => {
    setEmail(seed.email);
    setPassword(SEEDED_PASSWORD);
    if (seed.status !== "Suspended") {
      void localSignIn({ email: seed.email, password: SEEDED_PASSWORD });
    }
  };

  return (
    <div className="min-h-dvh bg-[#090F24] text-slate-100 grid lg:grid-cols-[1.05fr_0.95fr] overflow-auto">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-[radial-gradient(circle_at_top_left,_#134e4a_0,_#090F24_48%)]">
        <div className="flex items-center gap-3"><Scale className="w-9 h-9 accent-text" /><span className="font-black tracking-[0.22em]">SOVEREIGN</span></div>
        <div className="max-w-xl">
          <div className="accent-text text-xs font-bold uppercase tracking-[0.2em]">Private legal operations</div>
          <h1 className="text-4xl font-display font-bold mt-4 leading-tight">One firm. The right counsel. Every filing under control.</h1>
          <p className="text-slate-300 mt-5 leading-relaxed">Tenant-isolated case collaboration, Ghana-first court drafts, and permission-aware messaging for modern legal teams.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Identity and case access are verified server-side.</div>
      </section>

      <main className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
          <div className="lg:hidden flex items-center gap-2 mb-7"><Scale className="w-7 h-7 accent-text" /><span className="font-black tracking-widest">SOVEREIGN</span></div>
          {stage === "firm" ? (
            <form onSubmit={(e) => { e.preventDefault(); void createFirm(); }} className="space-y-4">
              <Building2 className="w-9 h-9 accent-text" />
              <div><h2 className="text-xl font-bold">Create your firm</h2><p className="text-sm text-slate-500 mt-1">You will become the workspace owner.</p></div>
              <input aria-label="Your name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" className="auth-input" />
              <input aria-label="Firm name" required value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="Firm or chambers name" className="auth-input" />
              <button disabled={busy} className="auth-primary">{busy ? "Creating…" : "Create secure workspace"}</button>
            </form>
          ) : stage === "phone-code" ? (
            <form onSubmit={(e) => { e.preventDefault(); void run(async () => { await confirmation?.confirm(code); }); }} className="space-y-4">
              <Smartphone className="w-9 h-9 accent-text" /><h2 className="text-xl font-bold">Verify your number</h2>
              <p className="text-sm text-slate-500">Enter the SMS code sent to {phone}.</p>
              <input aria-label="SMS code" required value={code} onChange={(e) => setCode(e.target.value)} className="auth-input" inputMode="numeric" />
              <button disabled={busy} className="auth-primary">Verify and continue</button>
            </form>
          ) : (
            <div className="space-y-5">
              <div><h2 className="text-2xl font-bold">{inviteToken ? "Accept counsel invitation" : "Welcome to Sovereign"}</h2><p className="text-sm text-slate-500 mt-1">{inviteToken ? "Sign in with the invited email address to join the case." : "Sign in or create your firm workspace."}</p></div>
              <form onSubmit={(e) => { e.preventDefault(); void (isPostgresAuth ? localSignIn() : run(() => signInWithEmailAndPassword(auth, email, password))); }} className="space-y-3">
                <input aria-label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="work@firm.com" className="auth-input" />
                <input aria-label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="auth-input" />
                {isPostgresAuth && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input aria-label="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" className="auth-input" />
                    <input aria-label="Firm name" value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="Firm or chambers" className="auth-input" />
                  </div>
                )}
                <button disabled={busy} className="auth-primary">Sign in with email</button>
                {isPostgresAuth
                  ? <button type="button" disabled={busy} onClick={() => void localRegister()} className="auth-secondary">Create local account</button>
                  : <button type="button" disabled={busy} onClick={() => void run(() => createUserWithEmailAndPassword(auth, email, password))} className="auth-secondary">Create account</button>}
              </form>
              {isPostgresAuth ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seeded test logins</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Local Docker Postgres mode is active. Pick a profile to sign in instantly.</p>
                    </div>
                    <span className="text-[9px] font-black accent-badge rounded-full px-2 py-1">LOCAL</span>
                  </div>
                  <div className="grid gap-2">
                    {SEEDED_LOGINS.map((seed) => {
                      const disabled = seed.status === "Suspended";
                      return (
                        <button
                          key={seed.email}
                          type="button"
                          disabled={busy || disabled}
                          onClick={() => useSeededLogin(seed)}
                          className={`w-full min-h-11 rounded-lg border px-3 py-2 text-left transition-all flex items-center justify-between gap-3 ${
                            disabled
                              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-white border-slate-200 accent-border-hover accent-soft-hover text-slate-800 shadow-xs"
                          }`}
                          title={disabled ? "This seeded account is intentionally suspended" : `Sign in as ${seed.name}`}
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-black truncate">{seed.label}</span>
                            <span className="block text-[10px] font-mono text-slate-500 truncate">{seed.email}</span>
                          </span>
                          <span className={`shrink-0 text-[9px] font-black uppercase rounded-full px-2 py-0.5 border ${
                            disabled
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}>
                            {disabled ? "Disabled" : "Login"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    Shared password: <code className="font-mono font-bold text-slate-800">{SEEDED_PASSWORD}</code>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase font-bold"><span className="h-px bg-slate-200 flex-1" />or<span className="h-px bg-slate-200 flex-1" /></div>
                  <button onClick={() => void run(() => signInWithPopup(auth, new GoogleAuthProvider()))} className="auth-secondary">Continue with Google</button>
                  <div className="flex gap-2"><input aria-label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="auth-input flex-1" /><button onClick={() => void startPhone()} className="px-4 rounded-lg bg-slate-900 text-white text-xs font-bold">SMS</button></div>
                  <div id="recaptcha-container" />
                </>
              )}
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">{error}</p>}
        </div>
      </main>
    </div>
  );
}
