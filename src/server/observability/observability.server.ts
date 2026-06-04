/**
 * ==============================
 * GATEWAY OS — OBSERVABILITY LAYER (Phase 5)
 * ==============================
 *
 * Unified structured logger for every critical gateway action.
 *
 * Each event is:
 *   1. Emitted as a single-line JSON record to stdout (structured logs).
 *   2. Persisted to the `audit_logs` table (durable, queryable trail).
 *
 * Shape (per spec):
 *   - userId            (actor / null for anonymous)
 *   - action            (verb, SCREAMING_SNAKE_CASE)
 *   - timestamp         (ISO-8601)
 *   - entityType        (table / domain noun)
 *   - entityId          (uuid or external id, optional)
 *   - success           (boolean)
 *   - metadata          (free-form, sanitized by caller)
 *
 * Server-only. Do NOT import from client code.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ObservabilityEvent = {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  success: boolean;
  metadata?: Record<string, unknown>;
};

/**
 * Record a structured event: stdout JSON + persistent audit_logs insert.
 * Never throws — observability failures must not break the caller.
 */
export async function recordEvent(event: ObservabilityEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  const record = {
    layer: "GATEWAY",
    timestamp,
    userId: event.userId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId ?? null,
    success: event.success,
    metadata: event.metadata ?? {},
  };

  // 1. Structured stdout — captured by worker log pipeline.
  try {
    console.log(JSON.stringify(record));
  } catch {
    // ignore JSON.stringify cycles
  }

  // 2. Persist to audit_logs (durable).
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: event.userId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId ?? null,
      metadata: {
        success: event.success,
        timestamp,
        ...(event.metadata ?? {}),
      },
    });
    if (error) {
      console.error("[observability.recordEvent] audit_logs insert failed", {
        action: event.action,
        error: error.message,
      });
    }
  } catch (err) {
    console.error("[observability.recordEvent] threw", {
      action: event.action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Wrap an async handler so success + failure are both recorded.
 * The wrapped function re-throws any error after logging it.
 */
export async function observe<T>(
  meta: Omit<ObservabilityEvent, "success">,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    await recordEvent({ ...meta, success: true });
    return result;
  } catch (err) {
    await recordEvent({
      ...meta,
      success: false,
      metadata: {
        ...(meta.metadata ?? {}),
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}