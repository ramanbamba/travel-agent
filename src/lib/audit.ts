import { SupabaseClient } from "@supabase/supabase-js";

interface AuditEntry {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert an entry into the audit_log table.
 * Fire-and-forget — failures are logged to console but never throw.
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}
