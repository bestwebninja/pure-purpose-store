import { createServerFn } from "@tanstack/react-start";
import { gateway } from "@/server/api/gateway";

export const testGateway = createServerFn({ method: "GET" })
  .handler(async () => {
    console.log("🧪 Running Gateway OS test...");
    return await gateway.sponsor.listSponsors();
  });
