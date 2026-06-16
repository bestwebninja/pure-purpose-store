import { createServerFn } from "@tanstack/react-start";
import { getTelemetryFeed } from "@/lib/telemetry/gateway.telemetry";

export const getGatewayTelemetry = createServerFn().handler(async () => {
  return getTelemetryFeed(200);
});
