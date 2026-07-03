export interface ChannelMessage {
  to: string;
  text: string;
}
import { systemConfiguration } from "./systemConfiguration.js";

export interface ChannelAdapter {
  provider: "whatsapp" | "telegram";
  send(message: ChannelMessage): Promise<{ providerMessageId: string }>;
}

export class WhatsAppCloudAdapter implements ChannelAdapter {
  provider = "whatsapp" as const;
  constructor(private accessToken: string, private phoneNumberId: string) {}
  async send(message: ChannelMessage) {
    const response = await fetch(`https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: message.to, type: "text", text: { body: message.text } }),
    });
    const payload: any = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "WhatsApp delivery failed.");
    return { providerMessageId: payload.messages?.[0]?.id || "unknown" };
  }
}

export class TelegramAdapter implements ChannelAdapter {
  provider = "telegram" as const;
  async send(): Promise<{ providerMessageId: string }> {
    throw Object.assign(new Error("Telegram is not enabled for this release."), { code: "PROVIDER_DISABLED" });
  }
}

export function activeWhatsAppAdapter() {
  const config = systemConfiguration();
  if (config.messagingMode !== "whatsapp") return null;
  const token = config.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = config.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  return token && phoneId ? new WhatsAppCloudAdapter(token, phoneId) : null;
}
