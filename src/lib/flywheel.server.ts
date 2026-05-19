/**
 * Phase 7 â€” Autonomous Funding Flywheel
 *
 * Compiles proof-of-impact for a sponsor's completed funding package, then
 * automatically generates the suggested funding package for next month.
 *
 * Autonomy gating:
 *   L3 (Autonomous) â†’ status='sent', auto-emails report + checkout link
 *   L0â€“L2          â†’ status='draft' / 'pending_review', awaits Operator
 *                     approval inside the God View before being sent.
 *
 * Server-only â€” must NOT be imported from client code.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildFundingPackage, type FundingPackage } from "./sponsor-decision.server";

export type FlywheelArtifacts = {
  delivery_events: Array<{
    id: string;
    event_type: string;
    status: string | null;
    provider: string | null;
    cost: number | null;
    currency: string | null;
    created_at: string;
  }>;
  verified_photos: Array<{
    id: string;
    bucket: string | null;
    path: string | null;
    confidence: number | null;
    created_at: string;
  }>;
  receipts: Array<{
    invoice_number: string;
    gross_amount: number;
    currency: string;
    issued_at: string;
  }>;
  totals: {
    delivered_count: number;
    photo_count: number;
    receipt_total: number;
  };
};

export type FlywheelOutcome = {
  ok: true;
  report_id: string;
  status: "draft" | "pending_review" | "sent";
  autonomy_level: number;
  auto_sent: boolean;
  next_package_total: number;
  currency: string;
};

/**
 * Run the flywheel for a single sponsor + completed package.
 *
 * Idempotent â€” second call with the same package_signature updates the
 * existing row (re-aggregates artifacts and refreshes the next package),
 * but never downgrades a `sent` report.
 */
export async function generateSponsorFlywheelReport(args: {
  sponsorUserId: string;
  packageSignature: string;
  packageTotal: number;
  currency?: string;
  /**
   * Sponsorship rows whose blessings completed this cycle. Used to scope
   * artifact aggregation. If omitted, we infer from sponsorships joined to
   * fulfillment_events with status='delivered'.
   */
  sponsorshipIds?: string[];
}): Promise<FlywheelOutcome> {
  const currency = args.currency ?? "USD";

  // Look up sponsor row (for sponsor_id link).
  const { data: sponsorRow } = await supabaseAdmin
    .from("sponsors")
    .select("id")
    .eq("user_id", args.sponsorUserId)
    .maybeSingle();

  // Resolve sponsorships to scope artifacts to.
  let sponsorshipIds = args.sponsorshipIds ?? [];
  if (sponsorshipIds.length === 0) {
    const { data: sps } = await supabaseAdmin
      .from("sponsorships")
      .select("id")
      .eq("sponsor_user_id", args.sponsorUserId)
      .eq("status", "FULFILLED");
    sponsorshipIds = (sps ?? []).map((s) => s.id);
  }

  const artifacts = await aggregateArtifacts(args.sponsorUserId, sponsorshipIds);

  // Compose human-readable summary.
  const summary = composeSummary({
    sponsorUserId: args.sponsorUserId,
    packageTotal: args.packageTotal,
    currency,
    artifacts,
  });

  // Generate next-month package (best-effort; if profile not configured we
  // store a null next_package and surface it to the operator).
  let nextPackage: FundingPackage | null = null;
  let nextPackageError: string | null = null;
  try {
    nextPackage = await buildFundingPackage(args.sponsorUserId);
  } catch (err) {
    nextPackageError = err instanceof Error ? err.message : "next package generation failed";
    console.error("Flywheel: next package failed", err);
  }

  // Resolve the autonomy level for the flywheel module (falls back to
  // 'matching' if no flywheel module is configured).
  const autonomyLevel = await resolveAutonomy("flywheel", "matching");
  const autoSend = autonomyLevel >= 3;
  const status: "sent" | "pending_review" | "draft" = autoSend
    ? "sent"
    : autonomyLevel >= 2
      ? "pending_review"
      : "draft";

  // Upsert the impact report. Never downgrade a previously-sent report.
  const { data: existing } = await supabaseAdmin
    .from("impact_reports")
    .select("id, status, sent_at")
    .eq("sponsor_user_id", args.sponsorUserId)
    .eq("package_signature", args.packageSignature)
    .maybeSingle();

  const finalStatus = existing?.status === "sent" ? "sent" : status;
  const finalSentAt = existing?.sent_at ?? (autoSend ? new Date().toISOString() : null);

  const payload = {
    sponsor_user_id: args.sponsorUserId,
    sponsor_id: sponsorRow?.id ?? null,
    package_signature: args.packageSignature,
    package_total: args.packageTotal,
    currency,
    status: finalStatus,
    summary,
    artifacts: JSON.parse(JSON.stringify(artifacts)),
    next_package: nextPackage
      ? JSON.parse(JSON.stringify({ ...nextPackage, _generation_error: null }))
      : { _generation_error: nextPackageError },
    autonomy_level: autonomyLevel,
    sent_at: finalSentAt,
  };

  const { data: upserted, error: upsertErr } = await supabaseAdmin
    .from("impact_reports")
    .upsert(payload, { onConflict: "sponsor_user_id,package_signature" })
    .select("id")
    .single();

  if (upsertErr || !upserted) {
    throw new Error(`Failed to persist impact report: ${upsertErr?.message ?? "unknown"}`);
  }

  // Audit log + (stubbed) email send.
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: null,
    action: autoSend ? "flywheel.auto_send" : "flywheel.draft",
    entity_type: "impact_report",
    entity_id: upserted.id,
    metadata: {
      sponsor_user_id: args.sponsorUserId,
      autonomy_level: autonomyLevel,
      next_package_total: nextPackage?.total ?? 0,
      next_package_error: nextPackageError,
    },
  });

  if (autoSend) {
    // Production wiring: enqueue via Lovable Emails. Stubbed for now so the
    // flywheel can complete end-to-end without an email domain configured.
    console.log("[flywheel] auto-sent impact report", {
      report_id: upserted.id,
      sponsor_user_id: args.sponsorUserId,
      next_package_total: nextPackage?.total ?? 0,
    });
  }

  return {
    ok: true,
    report_id: upserted.id,
    status: finalStatus,
    autonomy_level: autonomyLevel,
    auto_sent: autoSend,
    next_package_total: nextPackage?.total ?? 0,
    currency,
  };
}

// --------------------------------------------------------------------------
// Artifact aggregation
// --------------------------------------------------------------------------

async function aggregateArtifacts(
  sponsorUserId: string,
  sponsorshipIds: string[],
): Promise<FlywheelArtifacts> {
  const artifacts: FlywheelArtifacts = {
    delivery_events: [],
    verified_photos: [],
    receipts: [],
    totals: { delivered_count: 0, photo_count: 0, receipt_total: 0 },
  };

  if (sponsorshipIds.length > 0) {
    const { data: events } = await supabaseAdmin
      .from("fulfillment_events")
      .select("id, event_type, status, provider, cost, currency, created_at, sponsorship_id")
      .in("sponsorship_id", sponsorshipIds)
      .order("created_at", { ascending: false })
      .limit(200);
    artifacts.delivery_events = (events ?? []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      status: e.status,
      provider: e.provider,
      cost: e.cost == null ? null : Number(e.cost),
      currency: e.currency,
      created_at: e.created_at,
    }));
    artifacts.totals.delivered_count = artifacts.delivery_events.filter(
      (e) => e.status === "delivered" || e.event_type === "delivered",
    ).length;
  }

  // Verified photos from the moderation log.
  const { data: photos } = await supabaseAdmin
    .from("image_moderation_log")
    .select("id, bucket, path, confidence, created_at, verdict")
    .eq("verdict", "approved")
    .eq("actor_user_id", sponsorUserId)
    .order("created_at", { ascending: false })
    .limit(50);
  artifacts.verified_photos = (photos ?? []).map((p) => ({
    id: p.id,
    bucket: p.bucket,
    path: p.path,
    confidence: p.confidence == null ? null : Number(p.confidence),
    created_at: p.created_at,
  }));
  artifacts.totals.photo_count = artifacts.verified_photos.length;

  // Receipts (invoices) for this sponsor.
  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("invoice_number, gross_amount, currency, issued_at")
    .eq("sponsor_user_id", sponsorUserId)
    .order("issued_at", { ascending: false })
    .limit(50);
  artifacts.receipts = (invoices ?? []).map((i) => ({
    invoice_number: i.invoice_number,
    gross_amount: Number(i.gross_amount ?? 0),
    currency: i.currency,
    issued_at: i.issued_at,
  }));
  artifacts.totals.receipt_total = artifacts.receipts.reduce((s, r) => s + r.gross_amount, 0);

  return artifacts;
}

function composeSummary(args: {
  sponsorUserId: string;
  packageTotal: number;
  currency: string;
  artifacts: FlywheelArtifacts;
}): string {
  const t = args.artifacts.totals;
  const lines = [
    `Funding cycle complete â€” ${args.currency} ${args.packageTotal.toFixed(2)} deployed.`,
    "",
    `â€¢ ${t.delivered_count} verified delivery event${t.delivered_count === 1 ? "" : "s"}`,
    `â€¢ ${t.photo_count} approved proof-of-impact photo${t.photo_count === 1 ? "" : "s"}`,
    `â€¢ ${args.artifacts.receipts.length} receipt${args.artifacts.receipts.length === 1 ? "" : "s"} totaling ${args.currency} ${t.receipt_total.toFixed(2)}`,
    "",
    "A new Funding Package for next month has been generated based on your ESG goals,",
    "industry priorities, geography focus, and the latest PETRI scorecards.",
  ];
  return lines.join("\n");
}

// --------------------------------------------------------------------------
// Autonomy resolution
// --------------------------------------------------------------------------

async function resolveAutonomy(primaryKey: string, fallbackKey: string): Promise<number> {
  const { data: rows } = await supabaseAdmin
    .from("system_modules")
    .select("module_key, enabled, autonomy_level, country_code")
    .in("module_key", [primaryKey, fallbackKey])
    .is("country_code", null);
  const byKey = new Map((rows ?? []).map((r) => [r.module_key, r]));
  const chosen = byKey.get(primaryKey) ?? byKey.get(fallbackKey);
  if (!chosen) return 0;
  if (!chosen.enabled) return 0;
  const lvl = Number(chosen.autonomy_level ?? 0);
  return Math.max(0, Math.min(3, lvl));
}

// --------------------------------------------------------------------------
// Operator helpers (used by God View)
// --------------------------------------------------------------------------

export async function approveAndSendReport(reportId: string, approverId: string | null): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("impact_reports")
    .update({
      status: "sent",
      approved_by: approverId,
      sent_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .in("status", ["draft", "pending_review", "approved"])
    .select("id, sponsor_user_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Report not in an approvable state.");
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: approverId,
    action: "flywheel.operator_send",
    entity_type: "impact_report",
    entity_id: reportId,
    metadata: { sponsor_user_id: data.sponsor_user_id },
  });
  console.log("[flywheel] operator-approved send", { report_id: reportId });
}

