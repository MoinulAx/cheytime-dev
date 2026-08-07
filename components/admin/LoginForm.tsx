"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const FIELD =
  "w-full border-0 border-b border-bone-100/20 bg-transparent px-0 py-2.5 font-sans text-base lg:text-sm text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-bone-100";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const db = createClient();
    const { data, error: signInError } = await db.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setBusy(false);
      setError(signInError?.message ?? "Sign in failed.");
      return;
    }

    // Being signed in is not the same as being an admin. Check the role before
    // sending them on, so a non-admin gets a clear message instead of a blank
    // panel whose every action fails an RLS policy.
    const { data: roles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await db.auth.signOut();
      setBusy(false);
      setError("That account is not an admin.");
      return;
    }

    // refresh() so the server layout re-runs with the new session cookie.
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="eyebrow mb-1 block">
          email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="eyebrow mb-1 block">
          password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="font-sans text-[11px] text-cosmic-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-editorial disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}
