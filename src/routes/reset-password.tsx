import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and creates a session.
    // Listen for PASSWORD_RECOVERY, then verify a session exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setHasSession((prev) => (prev === null ? !!data.session : prev));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setDone(true);
      toast.success("Password updated successfully");

      // Sign out the recovery session so the user signs in cleanly with the new password.
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24">
        <h1 className="text-xl font-semibold">Password Updated</h1>
        <p className="text-muted-foreground mt-2">
          Redirecting you to login...
        </p>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Invalid or expired link</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This password reset link is no longer valid. Please request a new one from the login page.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24">
      <h1 className="text-2xl font-semibold">Set New Password</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Choose a secure password for your account.
      </p>

      <Card className="mt-6 w-full p-6 space-y-4">
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </Card>
    </div>
  );
}
