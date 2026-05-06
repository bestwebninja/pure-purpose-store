import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/server/profile.functions";

export const Route = createFileRoute("/me/profile")({
  head: () => ({ meta: [{ title: "My Profile — MyBlessings" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const get = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const { profile } = await get();
        if (cancelled) return;
        setEmail(profile.email ?? "");
        setDisplayName(profile.display_name ?? "");
        setPhone(profile.phone ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [get, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: { display_name: displayName, phone } });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-16 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-display text-3xl font-semibold">My Profile</h1>
      <Card className="mt-6 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dn">Full name</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </form>
      </Card>
    </div>
  );
}