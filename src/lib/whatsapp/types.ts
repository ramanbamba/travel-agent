// ============================================================================
// WhatsApp Cloud API Types
// ============================================================================

// ── Incoming Webhook Event ──

export interface WhatsAppWebhookEvent {
  object: "whatsapp_business_account";
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppChangeValue;
  field: "messages";
}

export interface WhatsAppChangeValue {
  messaging_product: "whatsapp";
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsAppIncomingMessage {
  from: string; // sender phone number
  id: string; // message ID
  timestamp: string;
  type: "text" | "interactive" | "button" | "image" | "document" | "location" | "reaction";
  text?: { body: string };
  interactive?: {
    type: "list_reply" | "button_reply";
    list_reply?: { id: string; title: string; description?: string };
    button_reply?: { id: string; title: string };
  };
  button?: { text: string; payload: string };
}

export interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message: string }>;
}

// ── Outgoing Messages ──

export interface WhatsAppTextPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { preview_url: boolean; body: string };
}

export interface WhatsAppInteractiveListPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "interactive";
  interactive: {
    type: "list";
    header?: { type: "text"; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      button: string; // CTA button text (max 20 chars)
      sections: WhatsAppListSection[];
    };
  };
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

export interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppInteractiveButtonPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    body: { text: string };
    footer?: { text: string };
    action: {
      buttons: WhatsAppButton[];
    };
  };
}

export interface WhatsAppButton {
  type: "reply";
  reply: {
    id: string;
    title: string; // max 20 chars
  };
}

export interface WhatsAppTemplatePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: WhatsAppTemplateComponent[];
  };
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text" | "currency" | "date_time" | "image" | "document";
    text?: string;
  }>;
}

export interface WhatsAppDocumentPayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "document";
  document: {
    link: string;
    filename: string;
    caption?: string;
  };
}

export interface WhatsAppMarkReadPayload {
  messaging_product: "whatsapp";
  status: "read";
  message_id: string;
}

// ── API Response ──

export interface WhatsAppAPIResponse {
  messaging_product: "whatsapp";
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
}

// ── Handler Types ──

export interface ParsedIncomingMessage {
  from: string;
  messageId: string;
  timestamp: string;
  type: "text" | "interactive_list" | "interactive_button" | "unknown";
  text: string; // normalized text content
  contactName?: string;
}
