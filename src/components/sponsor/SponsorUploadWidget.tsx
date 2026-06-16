import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { updateSponsorAssets, getMySponsorDocUrl } from "@/lib/gateway";
import { moderateImage } from "@/lib/gateway";
import { CheckCircle2, FileText, Image as ImageIcon, Loader2, Upload } from "lucide-react";

const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
    r.onerror = () => reject(r.error ?? new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

type Props = {
  /** Initial values from the sponsor row, if any. */
  initialLogoUrl?: string | null;
  initialDocUrl?: string | null;
  /** Called after a successful save so the parent can re-fetch. */
  onSaved?: (next: { logoUrl: string | null; docUrl: string | null }) => void;
};

export function SponsorUploadWidget({ initialLogoUrl, initialDocUrl, onSaved }: Props) {
  const updateAssetsFn = useServerFn(updateSponsorAssets);
  const getDocUrlFn = useServerFn(getMySponsorDocUrl);
  const moderate = useServerFn(moderateImage);

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [docPath, setDocPath] = useState<string | null>(initialDocUrl ?? null);
  const [docSignedUrl, setDocSignedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"logo" | "doc" | null>(null);

  const logoInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  // Resolve a signed URL for any existing private doc on mount.
  useEffect(() => {
    if (!initialDocUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const { url } = await getDocUrlFn();
        if (!cancelled) setDocSignedUrl(url);
      } catch {
        /* non-fatal — link just won't render */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDocUrl, getDocUrlFn]);

  async function handleUpload(kind: "logo" | "doc", file: File) {
    setBusy(kind);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not signed in");

      // Validate
      if (kind === "logo") {
        if (!ALLOWED_LOGO_TYPES.includes(file.type)) throw new Error("Logo must be PNG, JPG, WebP, or SVG");
        if (file.size > MAX_LOGO_BYTES) throw new Error("Logo must be under 4 MB");
        // Image Trust Layer — gate raster logos through the AI safety check.
        // SVGs are skipped (Gemini vision can't ingest vector content directly).
        if (file.type !== "image/svg+xml") {
          const b64 = await fileToBase64(file);
          const verdict = await moderate({
            data: {
              imageBase64: b64,
              mimeType: file.type,
              kind: "sponsor_logo",
              requireSmilingHuman: false,
            },
          });
          if (!verdict.allow) {
            throw new Error(verdict.reason || "Logo did not pass the image trust check.");
          }
        }
      } else {
        if (file.type !== "application/pdf") throw new Error("Verification doc must be a PDF");
        if (file.size > MAX_DOC_BYTES) throw new Error("PDF must be under 10 MB");
      }

      const bucket = kind === "logo" ? "sponsor-logos" : "sponsor-docs";
      const ext = file.name.split(".").pop()?.toLowerCase() ?? (kind === "logo" ? "png" : "pdf");
      const path = `${userId}/${kind}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw new Error(upErr.message);

      const result = await updateAssetsFn({
        data: kind === "logo" ? { logo: { bucket, path } } : { doc: { bucket, path } },
      });

      if (kind === "logo") {
        setLogoUrl(result.logoUrl);
      } else {
        setDocPath(path);
        setDocSignedUrl(result.docUrl);
      }

      toast.success(kind === "logo" ? "Logo uploaded" : "Verification document uploaded");
      onSaved?.({ logoUrl: result.logoUrl ?? logoUrl, docUrl: kind === "doc" ? path : docPath });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: message });
    } finally {
      setBusy(null);
      if (kind === "logo" && logoInput.current) logoInput.current.value = "";
      if (kind === "doc" && docInput.current) docInput.current.value = "";
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">Profile assets</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your organisation logo and a verification PDF. Logos are public; PDFs stay private.
          </p>
        </div>
        {logoUrl && docPath ? (
          <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</Badge>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Logo */}
        <div className="space-y-3">
          <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
            {logoUrl ? (
              <img src={logoUrl} alt="Sponsor logo" className="max-h-28 object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <input
            ref={logoInput}
            type="file"
            accept={ALLOWED_LOGO_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload("logo", f);
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoInput.current?.click()}
            disabled={busy === "logo"}
          >
            {busy === "logo" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG · up to 4 MB</p>
        </div>

        {/* Doc */}
        <div className="space-y-3">
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
            {docPath ? (
              docSignedUrl ? (
                <a
                  href={docSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary underline underline-offset-2"
                >
                  View current document
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Document on file</span>
              )
            ) : (
              <span className="text-xs text-muted-foreground">No document uploaded</span>
            )}
          </div>
          <input
            ref={docInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload("doc", f);
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => docInput.current?.click()}
            disabled={busy === "doc"}
          >
            {busy === "doc" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {docPath ? "Replace document" : "Upload PDF"}
          </Button>
          <p className="text-[11px] text-muted-foreground">PDF only · up to 10 MB · private</p>
        </div>
      </div>
    </Card>
  );
}


