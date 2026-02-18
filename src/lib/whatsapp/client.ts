// ============================================================================
// WhatsApp Cloud API Client
// Handles sending messages. In mock mode (WHATSAPP_MOCK=true), logs to console.
// ============================================================================

import type {
  WhatsAppTextPayload,
  WhatsAppInteractiveListPayload,
  WhatsAppInteractiveButtonPayload,
  WhatsAppTemplatePayload,
  WhatsAppDocumentPayload,
  WhatsAppMarkReadPayload,
  WhatsAppAPIResponse,
  WhatsAppListSection,
  WhatsAppButton,
  WhatsAppTemplateComponent,
} from "./types";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

function isMockMode(): boolean {
  return process.env.WHATSAPP_MOCK !== "false";
}

function getConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  };
}

async function sendToWhatsApp(
  payload: Record<string, unknown>
): Promise<WhatsAppAPIResponse | null> {
  if (isMockMode()) {
    console.log("[WhatsApp Mock] Sending:", JSON.stringify(payload, null, 2));
    return {
      messaging_product: "whatsapp",
      messages: [{ id: `mock_${Date.now()}` }],
    };
  }

  const { accessToken, phoneNumberId } = getConfig();

  const res = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("[WhatsApp] API error:", res.status, error);
    return null;
  }

  return res.json();
}

// ── Public API ──

export async function sendTextMessage(
  to: string,
  text: string
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppTextPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}

export async function sendInteractiveList(
  to: string,
  header: string,
  body: string,
  buttonText: string,
  sections: WhatsAppListSection[],
  footer?: string
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppInteractiveListPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: header },
      body: { text: body },
      ...(footer && { footer: { text: footer } }),
      action: {
        button: buttonText,
        sections,
      },
    },
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: WhatsAppButton[],
  footer?: string
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppInteractiveButtonPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      ...(footer && { footer: { text: footer } }),
      action: { buttons: buttons.slice(0, 3) }, // max 3 buttons
    },
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}

export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string = "en",
  components?: WhatsAppTemplateComponent[]
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppTemplatePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && { components }),
    },
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}

export async function sendDocument(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppDocumentPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "document",
    document: {
      link: documentUrl,
      filename,
      ...(caption && { caption }),
    },
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}

export async function markAsRead(
  messageId: string
): Promise<WhatsAppAPIResponse | null> {
  const payload: WhatsAppMarkReadPayload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  };
  return sendToWhatsApp(payload as unknown as Record<string, unknown>);
}
