import { createServerFn } from "@tanstack/react-start";
import { gateway } from "@/lib/gateway";

export const testGateway = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("🧪 Running Gateway OS test...");
    return await (gateway.sponsor as any).listSponsors?.();
  });
