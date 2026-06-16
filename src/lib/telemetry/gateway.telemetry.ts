/**
 * ==============================
 * GATEWAY OS — TELEMETRY FEED
 * ==============================
 * System-wide audit + intelligence stream
 */

export type TelemetryEventType =
  | "ROUTE_ALLOW"
  | "ROUTE_BLOCK"
  | "ROUTE_INVALID"
  | "AUTH_RESOLVED"
  | "AUTH_DENIED"
  | "FIREWALL_ERROR"
  | "GIT_GUARD_TRIGGER"
  | "PETRI_ACTION";

export interface TelemetryEvent {
  type: TelemetryEventType;
  path?: string;
  role?: string;
  message?: string;
  timestamp: number;
  meta?: Record<string, any>;
}

/**
 * In-memory buffer (Phase 2C simple mode)
 * Later upgraded to Supabase / event bus / Kafka equivalent
 */
const TELEMETRY_BUFFER: TelemetryEvent[] = [];

export function emitTelemetry(event: Omit<TelemetryEvent, "timestamp">) {
  const fullEvent: TelemetryEvent = {
    ...event,
    timestamp: Date.now(),
  };

  TELEMETRY_BUFFER.push(fullEvent);

  // DEV visibility
  if (import.meta.env.DEV) {
    console.log("ðŸ“¡ TELEMETRY:", fullEvent);
  }
}

export function getTelemetryFeed(limit = 100) {
  return TELEMETRY_BUFFER.slice(-limit);
}

export function clearTelemetryFeed() {
  TELEMETRY_BUFFER.length = 0;
}
