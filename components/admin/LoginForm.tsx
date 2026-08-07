"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { isAdmin } from "@/app/admin/actions";

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

    // This form's only job is to establish the session. Whether the account is
    // an admin is decided on the server by the `admin-auth` edge function, and
    // a non-admin simply gets redirected straight back here. Repeating the
    // role check in the browser would be a second, weaker source of truth.
    const admin = await isAdmin();
    if (!admin) {
      await db.auth.signOut();
      setBusy(false);
      setError("That account is not an admin.");
      return;
    }

    // refresh() so the guarded layout re-runs with the new session cookie.
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
