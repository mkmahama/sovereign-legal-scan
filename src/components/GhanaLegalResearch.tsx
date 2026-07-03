import React from "react";
import { AlertTriangle, BookOpen, Clipboard, ExternalLink, FileSearch, Gavel, Loader2, Search } from "lucide-react";
import { LegalResearchCollection, LegalResearchResult } from "../types";
import { apiRequest } from "../lib/api";

const tabs: Array<{ id: LegalResearchCollection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "judgments", label: "Judgments", icon: Gavel },
  { id: "legislation", label: "Legislation", icon: BookOpen },
];

function citationFor(result: LegalResearchResult) {
  return [
    result.title,
    result.portionTitle,
    result.expressionDate,
    result.publicUrl || result.portionUrl,
  ].filter(Boolean).join(" - ");
}

function percentScore(score: number) {
  if (!Number.isFinite(score) || score <= 0) return "Matched";
  if (score <= 1) return `${Math.round(score * 100)}%`;
  return score.toFixed(score >= 10 ? 0 : 2);
}

export default function GhanaLegalResearch() {
  const [collection, setCollection] = React.useState<LegalResearchCollection>("judgments");
  const [query, setQuery] = React.useState("");
  const [topK, setTopK] = React.useState(10);
  const [results, setResults] = React.useState<LegalResearchResult[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const runSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setMessage("Enter a Ghana legal research query.");
      setResults([]);
      return;
    }
    setBusy(true);
    setMessage("");
    setCopiedId(null);
    try {
      const payload = await apiRequest<{ results: LegalResearchResult[] }>("/api/legal-research/search", {
        method: "POST",
        body: JSON.stringify({ collection, query: trimmed, topK }),
      });
      setResults(payload.results || []);
      if (!payload.results?.length) setMessage("No matching Laws.Africa records were returned for that query.");
    } catch (error: any) {
      setResults([]);
      setMessage(error?.message || "Ghana legal research is unavailable.");
    } finally {
      setBusy(false);
    }
  };

  const copyCitation = async (result: LegalResearchResult) => {
    const citation = citationFor(result);
    await navigator.clipboard?.writeText(citation).catch(() => undefined);
    setCopiedId(result.id);
    window.setTimeout(() => setCopiedId((current) => current === result.id ? null : current), 1600);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1 sm:pr-2 mobile-scroll">
      <div className="space-y-4 sm:space-y-5">
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 accent-text" />
                Ghana legal research
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Search Ghana judgments and legislation through Laws.Africa Knowledge Bases. External API tokens stay on the server.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] min-w-[220px]">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="font-black text-slate-700">Default source</div>
                <div className="accent-text font-bold mt-0.5">Ghana judgments</div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <div className="font-black text-emerald-800">Token status</div>
                <div className="text-emerald-700 font-bold mt-0.5">Server-side</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 mobile-scroll scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = collection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCollection(tab.id);
                    setResults([]);
                    setMessage("");
                  }}
                  className={`px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap min-h-[44px] inline-flex items-center gap-2 ${
                    selected ? "accent-border accent-text" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={runSearch} className="mt-4 grid lg:grid-cols-[1fr_140px_auto] gap-3">
            <label className="relative block">
              <span className="sr-only">Ghana legal research query</span>
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                aria-label="Ghana legal research query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={collection === "judgments" ? "Search Ghana cases, issues, parties, or holdings..." : "Search Ghana Acts, constitutional articles, or statutory topics..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#090F24] focus:bg-white text-slate-800 transition-all font-medium"
              />
            </label>
            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-655 font-bold">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Results</span>
              <select
                aria-label="Result count"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="bg-transparent focus:outline-none font-bold cursor-pointer flex-1"
              >
                {[5, 10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <button
              disabled={busy}
              className="accent-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm min-h-[44px] disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              {busy ? "Searching" : "Search Ghana Law"}
            </button>
          </form>
        </section>

        {message && (
          <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <section className="space-y-3">
          {busy && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 accent-text" />
              Searching Laws.Africa knowledge bases...
            </div>
          )}

          {!busy && results.map((result) => (
            <article key={result.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs accent-border-hover">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] accent-badge font-black px-2 py-0.5 rounded uppercase">
                      {collection === "judgments" ? "Case law" : "Legislation"}
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-650 font-bold px-2 py-0.5 rounded uppercase">
                      {percentScore(result.score)}
                    </span>
                    {result.expressionDate && <span className="text-[9px] text-slate-500 font-bold">{result.expressionDate}</span>}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-2 leading-snug">{result.title}</h3>
                  {result.portionTitle && <p className="text-[11px] accent-text font-bold mt-1">{result.portionTitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void copyCitation(result)}
                    className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 min-h-[40px]"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    {copiedId === result.id ? "Copied" : "Copy citation"}
                  </button>
                  {(result.publicUrl || result.portionUrl) && (
                    <a
                      href={result.publicUrl || result.portionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold min-h-[40px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Source
                    </a>
                  )}
                </div>
              </div>

              {(result.blurb || result.flynote) && (
                <div className="mt-3 grid md:grid-cols-2 gap-2 text-[11px]">
                  {result.blurb && <div className="bg-slate-50 border border-slate-100 rounded-lg p-3"><strong>Blurb:</strong> {result.blurb}</div>}
                  {result.flynote && <div className="bg-slate-50 border border-slate-100 rounded-lg p-3"><strong>Flynote:</strong> {result.flynote}</div>}
                </div>
              )}

              <p className="text-xs text-slate-650 leading-relaxed mt-3 whitespace-pre-wrap">
                {result.text || "No excerpt was returned for this result."}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                {result.workFrbrUri && <span className="bg-slate-50 border border-slate-100 rounded px-2 py-1 break-all">{result.workFrbrUri}</span>}
                {(result.publicUrl || result.portionUrl) && <span className="bg-slate-50 border border-slate-100 rounded px-2 py-1 break-all">{result.publicUrl || result.portionUrl}</span>}
              </div>
            </article>
          ))}

          {!busy && !message && results.length === 0 && (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center shadow-xs">
              <BookOpen className="w-6 h-6 mx-auto text-slate-400" />
              <div className="text-xs font-bold text-slate-700 mt-3">Ready to search Ghana law</div>
              <p className="text-[11px] text-slate-500 mt-1">Try a party name, constitutional topic, criminal procedure issue, or statutory phrase.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
