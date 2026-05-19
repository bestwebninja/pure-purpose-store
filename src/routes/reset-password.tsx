import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  async function handleUpdate() {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return <div>Password updated. You can now log in.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Set New Password</h1>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleUpdate}>
        Update Password
      </button>
    </div>
  );
}
