import React from "react";
import { Bot, CheckCircle2, Cloud, Database, Eye, EyeOff, FileKey2, MessageCircle, Save, Settings2, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";

type SecretStatus = { configured: boolean; masked?: string | null; count?: number };
type ConfigurationView = {
  applicationName: string;
  defaultJurisdiction: string;
  defaultCurrency: string;
  retentionDays: number;
  maxUploadMb: number;
  requireVerifiedCourtSources: boolean;
  messagingMode: "deferred" | "whatsapp";
  olmocrProvider: "disabled" | "huggingface" | "runpod";
  olmocrServerUrl: string;
  olmocrModel: string;
  firebase: { projectId: string; databaseId: string; storageBucket: string; adminCredentialsConfigured: boolean };
  secrets: Record<string, SecretStatus>;
  persistence: { enabled: boolean; persisted: boolean };
};

const initial: ConfigurationView = {
  applicationName: "Sovereign Legal", defaultJurisdiction: "GH", defaultCurrency: "GHS", retentionDays: 365, maxUploadMb: 20, requireVerifiedCourtSources: true, messagingMode: "deferred", olmocrProvider: "disabled", olmocrServerUrl: "", olmocrModel: "allenai/olmOCR-2-7B-1025-FP8",
  firebase: { projectId: "", databaseId: "", storageBucket: "", adminCredentialsConfigured: false }, secrets: {}, persistence: { enabled: false, persisted: false },
};

export default function SystemConfigurationCenter() {
  const [config, setConfig] = React.useState<ConfigurationView>(initial);
  const [secrets, setSecrets] = React.useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = React.useState(false);
  const [busy, setBusy] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [denied, setDenied] = React.useState(false);

  React.useEffect(() => {
    void apiRequest<ConfigurationView>("/api/admin/configuration").then(setConfig).catch((error: any) => { setDenied(true); setMessage(error?.message || "Platform configuration is unavailable."); }).finally(() => setBusy(false));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const updated = await apiRequest<ConfigurationView & { persisted?: boolean }>("/api/admin/configuration", { method: "PATCH", body: JSON.stringify({
        applicationName: config.applicationName, defaultJurisdiction: config.defaultJurisdiction, defaultCurrency: config.defaultCurrency,
        retentionDays: config.retentionDays, maxUploadMb: config.maxUploadMb, requireVerifiedCourtSources: config.requireVerifiedCourtSources,
        messagingMode: config.messagingMode, olmocrProvider: config.olmocrProvider, olmocrServerUrl: config.olmocrServerUrl, olmocrModel: config.olmocrModel,
        ...Object.fromEntries(Object.entries(secrets).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim()))),
      }) });
      setConfig(updated); setSecrets({});
      setMessage(updated.persistence.enabled ? "Configuration saved and encrypted." : "Configuration applied for this server session. Add CONFIG_ENCRYPTION_KEY to persist it securely.");
    } catch (error: any) { setMessage(error?.message || "Unable to save configuration."); }
    finally { setBusy(false); }
  };

  const secretField = (key: string, label: string, placeholder: string) => (
    <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</span><div className="relative mt-1"><input type={showSecrets ? "text" : "password"} value={secrets[key] || ""} onChange={(event) => setSecrets((current) => ({ ...current, [key]: event.target.value }))} placeholder={config.secrets[key]?.masked || placeholder} autoComplete="off" className="auth-input pr-9 font-mono" /><span className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${config.secrets[key]?.configured ? "bg-emerald-500" : "bg-slate-300"}`} /></div></label>
  );

  if (denied) return <section className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-slate-400" /><div><h3 className="text-sm font-bold text-slate-900">Platform configuration</h3><p className="text-xs text-slate-500 mt-1">Only a UID listed in PLATFORM_ADMIN_UIDS can manage system-wide configuration.</p></div></div></section>;

  return (
    <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Settings2 className="w-4 h-4 accent-text" />Application configuration</h3><p className="text-xs text-slate-500 mt-1">Manage application behavior and server-side integrations without exposing stored secrets.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setShowSecrets((value) => !value)} className="p-2 border border-slate-200 rounded-lg text-slate-500" aria-label={showSecrets ? "Hide configuration secrets" : "Show configuration secrets"}>{showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button><button disabled={busy} className="inline-flex items-center gap-2 accent-primary disabled:opacity-50 rounded-lg px-4 py-2 text-xs font-bold"><Save className="w-4 h-4" />{busy ? "Saving..." : "Save configuration"}</button></div></div>

      <div className="p-4 sm:p-6 grid xl:grid-cols-2 gap-4">
        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><Settings2 className="w-4 h-4 accent-text" />Application defaults</h4><input aria-label="Application name" value={config.applicationName} onChange={(event) => setConfig({ ...config, applicationName: event.target.value })} className="auth-input" /><div className="grid grid-cols-2 gap-2"><input aria-label="Default jurisdiction" value={config.defaultJurisdiction} onChange={(event) => setConfig({ ...config, defaultJurisdiction: event.target.value })} className="auth-input" /><input aria-label="Default currency" value={config.defaultCurrency} onChange={(event) => setConfig({ ...config, defaultCurrency: event.target.value })} className="auth-input" /></div></section>

        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-600" />AI provider</h4>{secretField("geminiApiKey", "Gemini API key", "Paste Gemini API key")}<p className="text-[10px] text-slate-500">The active key is masked after saving and is used immediately for OCR, analysis, and court suggestions.</p></section>

        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><Bot className="w-4 h-4 text-sky-600" />Convert2text olmOCR</h4><select aria-label="olmOCR provider" value={config.olmocrProvider} onChange={(event) => setConfig({ ...config, olmocrProvider: event.target.value as ConfigurationView["olmocrProvider"] })} className="auth-input"><option value="disabled">Disabled</option><option value="runpod">Runpod Serverless</option><option value="huggingface">OpenAI-compatible endpoint</option></select><input aria-label="olmOCR endpoint URL" value={config.olmocrServerUrl} onChange={(event) => setConfig({ ...config, olmocrServerUrl: event.target.value })} placeholder="https://api.runpod.ai/v2/ENDPOINT_ID" className="auth-input font-mono text-[11px]" /><input aria-label="olmOCR model" value={config.olmocrModel} onChange={(event) => setConfig({ ...config, olmocrModel: event.target.value })} placeholder="allenai/olmOCR-2-7B-1025-FP8" className="auth-input font-mono text-[11px]" />{secretField("olmocrApiKey", "Runpod API key", "Paste Runpod API key")}<p className="text-[10px] text-slate-500">API key stays server-side. Native Runpod URLs use https://api.runpod.ai/v2/ENDPOINT_ID; the server appends /runsync.</p></section>

        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><FileKey2 className="w-4 h-4 text-emerald-600" />Laws.Africa</h4>{secretField("lawsAfricaApiToken", "Laws.Africa API token", "Paste Laws.Africa token")}<p className="text-[10px] text-slate-500">Used only by the server-side Ghana Law search proxy. Rotate any token that has been exposed before saving it here.</p></section>

        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><FileKey2 className="w-4 h-4 text-amber-600" />Documents & security</h4><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-slate-600">Retention days<input aria-label="Retention days" type="number" min="30" max="3650" value={config.retentionDays} onChange={(event) => setConfig({ ...config, retentionDays: Number(event.target.value) })} className="auth-input mt-1" /></label><label className="text-[10px] font-bold text-slate-600">Maximum upload MB<input aria-label="Maximum upload MB" type="number" min="1" max="50" value={config.maxUploadMb} onChange={(event) => setConfig({ ...config, maxUploadMb: Number(event.target.value) })} className="auth-input mt-1" /></label></div><label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={config.requireVerifiedCourtSources} onChange={(event) => setConfig({ ...config, requireVerifiedCourtSources: event.target.checked })} />Require verified sources for court fees and deadlines</label>{secretField("scannerWebhookSecret", "Scanner webhook secret", "Set malware scanner secret")}{secretField("platformAdminUids", "Platform administrator UIDs", "Comma-separated Firebase UIDs")}</section>

        <section className="border border-slate-200 rounded-xl p-4 space-y-3"><div className="flex items-center justify-between gap-3"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-600" />Messaging</h4><span className="text-[9px] font-bold rounded-full px-2 py-1 bg-slate-100 text-slate-600">LATER PHASE</span></div><select aria-label="Messaging mode" value={config.messagingMode} onChange={(event) => setConfig({ ...config, messagingMode: event.target.value as ConfigurationView["messagingMode"] })} className="auth-input"><option value="deferred">Deferred — messaging disabled</option><option value="whatsapp">Enable WhatsApp Cloud API</option></select>{config.messagingMode === "whatsapp" && <div className="grid sm:grid-cols-2 gap-2">{secretField("whatsappVerifyToken", "Verify token", "WhatsApp verify token")}{secretField("whatsappAppSecret", "App secret", "Meta app secret")}{secretField("whatsappAccessToken", "Access token", "Meta access token")}{secretField("whatsappPhoneNumberId", "Phone number ID", "WhatsApp phone number ID")}</div>}<p className="text-[10px] text-slate-500">Deferred mode disables outbound adapters and keeps WhatsApp from blocking the rest of the product.</p></section>

        <section className="border border-slate-200 rounded-xl p-4 xl:col-span-2"><h4 className="text-xs font-bold text-slate-900 flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-600" />Firebase bootstrap</h4><div className="mt-3 grid md:grid-cols-3 gap-2 text-[10px]"><div className="bg-slate-50 rounded-lg p-3"><div className="text-slate-500">Project</div><div className="font-mono font-bold mt-1 break-all">{config.firebase.projectId}</div></div><div className="bg-slate-50 rounded-lg p-3"><div className="text-slate-500">Database</div><div className="font-mono font-bold mt-1 break-all">{config.firebase.databaseId}</div></div><div className="bg-slate-50 rounded-lg p-3"><div className="text-slate-500">Admin credentials</div><div className={`font-bold mt-1 ${config.firebase.adminCredentialsConfigured ? "text-emerald-700" : "text-amber-700"}`}>{config.firebase.adminCredentialsConfigured ? "Configured" : "Bootstrap required"}</div></div></div><p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1"><Database className="w-3.5 h-3.5" />Firebase Admin credentials and CONFIG_ENCRYPTION_KEY remain deployment secrets; storing them inside the database would create a circular security dependency.</p></section>
      </div>
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className="text-[10px] text-slate-500">Persistence: {config.persistence.enabled ? config.persistence.persisted ? "encrypted and saved" : "ready" : "runtime only - encryption key required"}</div>{message && <div className="text-[11px] accent-text flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{message}</div>}</div>
    </form>
  );
}
