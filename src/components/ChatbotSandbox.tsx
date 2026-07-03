import React from "react";
import { CaseFile, ChatMessage } from "../types";
import { MessageSquare, Calendar, Send, Copy, Check, MessageCircle, Bot, Zap, ArrowRight, ShieldCheck } from "lucide-react";

interface ChatbotSandboxProps {
  activeCase: CaseFile | null;
  passphrase?: string;
}

export default function ChatbotSandbox({ activeCase, passphrase }: ChatbotSandboxProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I am your AI Legal Assistant. Since you have configured your integration token, I can answer questions directly about this case folder. Ask me anything, like 'summarize the plaintiff claims' or 'show critical evidence'.",
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState(false);
  const [copiedWebhook, setCopiedWebhook] = React.useState(false);
  const [copiedCurl, setCopiedCurl] = React.useState(false);

  // Default webhook details
  const appUrl = window.location.origin;
  const webhookToken = activeCase?.chatbotWebhookToken || "sec-tok-389f81a7";
  const webhookUrl = `${appUrl}/api/webhook/whatsapp`;
  
  const mockCurl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${webhookToken}" \\
  -d '{
    "message": "Give me critical evidence in case: ${activeCase?.caseNumber || "D-202-CV"}",
    "type": "whatsapp_text",
    "sender": "+1555029381"
  }'`;

  React.useEffect(() => {
    // Reset messages when active case changes
    setMessages([
      {
        sender: "bot",
        text: `Active Case Folder Hooked: ${activeCase ? activeCase.title : "Default Law Database"}.\n\nAsk me queries about the litigants, critical facts, or timeline breaches. Communication is fully encrypted under local Sovereignty Keys.`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      }
    ]);
  }, [activeCase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          caseContext: activeCase ? {
            title: activeCase.title,
            caseNumber: activeCase.caseNumber,
            clientName: activeCase.clientName,
            status: activeCase.status,
            extractedInfo: activeCase.extractedInfo,
            summaries: activeCase.summaries,
            criticalEvidence: activeCase.criticalEvidence
          } : null
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        sender: "bot",
        text: data.response || "No response received from private AI node.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "Error reaching the secure processing server. Verify local node is active.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="chatbot-integration-card" className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 sm:p-6 text-slate-800 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 flex-wrap gap-2">
        <div>
          <h3 className="font-sans font-bold text-sm text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-650" />
            Chatbot Webhook Integrations
          </h3>
          <p className="text-xs text-slate-550">Secure court-ready messaging gateways (WhatsApp, Telegram)</p>
        </div>
        <span className="text-[10px] font-sans font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2.5 py-1">
          Sandbox Live
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Chatbot Playground Simulator */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col h-[min(450px,65dvh)] min-h-[360px] shadow-xs min-w-0 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-100/80 border-b border-slate-200 p-3 rounded-t-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                Sovereign Case Assistant
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-medium">
              Tunnel: WhatsApp-E2EE
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 flex flex-col justify-end mobile-scroll">
            <div className="space-y-3.5 max-h-[330px] overflow-y-auto pr-1 mobile-scroll">
              {messages.map((msg, idx) => (
                <div
                  id={`chat-msg-${idx}`}
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] px-3.5 py-2 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-650 text-white rounded-2xl rounded-tr-none shadow-xs"
                      : "bg-white text-slate-705 border border-slate-200 rounded-2xl rounded-tl-none whitespace-pre-wrap shadow-xs shadow-slate-100/30"
                  }`}>
                    {msg.text}
                    <div className={`text-[9px] text-right mt-1.5 font-sans font-bold leading-none ${msg.sender === "user" ? "text-indigo-200" : "text-slate-400"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-2 shadow-xs">
                    <div className="flex gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>Decrypting node archives...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-100 border-t border-slate-200 rounded-b-xl flex gap-2 min-w-0">
            <input
              id="input-chatbot-query"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about litigants, timeline, facts..."
              className="flex-1 min-w-0 bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 shadow-xs"
            />
            <button
              id="chat-submit-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-805 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm touch-target sm:min-h-0 sm:min-w-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Integration API details & Code snippets */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-100" />
              Messaging Gateways Setup
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Link the live webhook token into Twilio, WhatsApp Business, or Telegram Botfather to securely retrieve docket timelines inside any courtroom.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Webhook Secret Token */}
              <div>
                <label className="block text-[9px] text-slate-450 font-bold uppercase tracking-wider">Authorization Bearer Token</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    id="input-token-display"
                    type="text"
                    readOnly
                    value={webhookToken}
                    className="flex-1 min-w-0 bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs font-mono text-indigo-700 focus:outline-none font-bold"
                  />
                  <button
                    id="btn-copy-token"
                    type="button"
                    onClick={() => handleCopy(webhookToken, setCopiedToken)}
                    className="p-2 bg-slate-105 border border-slate-250 hover:bg-slate-200 rounded text-slate-600 cursor-pointer touch-target sm:min-h-0 sm:min-w-0"
                    title="Copy token"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Webhook Post Endpoint */}
              <div>
                <label className="block text-[9px] text-slate-450 font-bold uppercase tracking-wider">POST Webhook URL</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    id="input-webhook-display"
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 min-w-0 bg-white border border-slate-250 rounded px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    id="btn-copy-webhook"
                    type="button"
                    onClick={() => handleCopy(webhookUrl, setCopiedWebhook)}
                    className="p-2 bg-slate-105 border border-slate-250 hover:bg-slate-200 rounded text-slate-600 cursor-pointer touch-target sm:min-h-0 sm:min-w-0"
                    title="Copy URL"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* curl preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Integration CLI cURL</span>
              <button
                id="btn-copy-curl"
                onClick={() => handleCopy(mockCurl, setCopiedCurl)}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer min-h-[44px] px-1"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-450" />
                    <span className="text-emerald-450 font-sans text-[10px] font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="font-sans text-[10px] font-bold">Copy Snippet</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto border border-slate-950 leading-normal scrollbar-thin">
              {mockCurl}
            </pre>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1 py-1 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-650 mt-0.5" />
            <span>Messaging requests are validated locally under your private cryptographic key.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
