import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to every table that drives the blessing lifecycle and
 * fires `onChange` whenever a relevant row changes. Consumer is
 * responsible for refetching aggregated counts.
 */
export function useLifecycleRealtime(onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("lifecycle:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "petri_matches" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "fulfillment_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

