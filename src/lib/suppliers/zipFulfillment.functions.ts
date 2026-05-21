import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  isZipFulfillable,
  getActiveSuppliersByZip,
} from "@/server/api/gateway";

const zipSchema = z.object({
  zip: z.string().min(1).max(16).regex(/^[A-Za-z0-9 \-]+$/),
});

export const checkZipFulfillment = createServerFn({ method: "POST" })
  .inputValidator((input) => zipSchema.parse(input))
  .handler(async ({ data }) => {
    return isZipFulfillable(data.zip);
  });

export const listActiveSuppliersByZip = createServerFn({ method: "POST" })
  .inputValidator((input) => zipSchema.parse(input))
  .handler(async ({ data }) => {
    return getActiveSuppliersByZip(data.zip);
  });
