import { runSupplierVerificationCycle } from "@/server/openclaw/supplierVerificationWorker";

let isRunning = false;

export function startSupplierVerificationCron() {
  runCycle();

  setInterval(() => {
    runCycle();
  }, 30 * 60 * 1000); // 30 min
}

async function runCycle() {
  if (isRunning) return;

  try {
    isRunning = true;

    console.log("[Cron] Supplier verification started");

    await runSupplierVerificationCycle();

    console.log("[Cron] Supplier verification complete");
  } catch (err) {
    console.error("[Cron] Error:", err);
  } finally {
    isRunning = false;
  }
}