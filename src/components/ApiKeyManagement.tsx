import React from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";

type ApiKeyStatus = {
  configured: boolean;
  source: "environment" | "session" | "none";
  maskedKey: string | null;
};

const EMPTY_STATUS: ApiKeyStatus = {
  configured: false,
  source: "none",
  maskedKey: null,
};

export default function ApiKeyManagement() {
  const [status, setStatus] = React.useState<ApiKeyStatus>(EMPTY_STATUS);
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const loadStatus = React.useCallback(async () => {
    try {
      const response = await fetch("/api/settings/api-key");
      if (!response.ok) throw new Error("Unable to read API configuration");
      setStatus(await response.json());
    } catch {
      setMessage("API configuration status is temporarily unavailable.");
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const activateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to activate API key");
      setStatus(result);
      setApiKey("");
      setShowKey(false);
      setMessage("Session API key activated. New AI requests will use it immediately.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to activate API key.");
    } finally {
      setIsSaving(false);
    }
  };

  const useEnvironmentKey = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings/api-key", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to restore environment key");
      setStatus(result);
      setMessage("Environment API key restored.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to restore environment key.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs h-fit">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 accent-text" />
            AI Provider Key
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Swap the Gemini credential used by this running server without exposing the active key in the browser.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 self-start text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          status.configured
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {status.configured ? <ShieldCheck className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {status.configured ? "Configured" : "Key required"}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Active source</div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              {status.source === "session" ? "Session override" : status.source === "environment" ? "Environment default" : "Not configured"}
            </div>
          </div>
          <code className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono">
            {status.maskedKey || "No active credential"}
          </code>
        </div>
      </div>

      <form onSubmit={activateKey} className="mt-5 space-y-3">
        <label htmlFor="api-key-override" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          Session override key
        </label>
        <div className="relative">
          <input
            id="api-key-override"
            type={showKey ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Paste another Gemini API key"
            className="w-full rounded-lg border border-slate-200 bg-white pl-3.5 pr-11 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus-accent-border focus:ring-2 focus:ring-[var(--accent-ring)]"
          />
          <button
            type="button"
            onClick={() => setShowKey((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={isSaving || !apiKey.trim()}
            className="min-h-10 flex-1 accent-primary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            {isSaving ? "Applying…" : "Activate Override"}
          </button>
          <button
            type="button"
            disabled={isSaving || status.source !== "session"}
            onClick={useEnvironmentKey}
            className="min-h-10 flex-1 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
          >
            Restore Environment Key
          </button>
        </div>
      </form>

      {message && (
        <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 accent-text mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <p className="mt-4 text-[10px] text-slate-400 leading-relaxed">
        Overrides live only in server memory and are cleared when the server restarts. Keys are never returned to the client.
      </p>
    </section>
  );
}
