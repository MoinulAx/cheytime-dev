import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin — Chey Time" };

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/admin");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center">
      <p className="eyebrow mb-3">Chey Time</p>
      <h1 className="font-display text-4xl italic text-bone-50">Admin</h1>
      <div className="rule my-6" />

      {isSupabaseConfigured ? (
        <LoginForm />
      ) : (
        <p className="font-sans text-sm leading-relaxed text-cosmic-400">
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY, then reload.
        </p>
      )}

      <Link
        href="/"
        className="mt-8 font-sans text-[11px] uppercase tracking-wide2 text-bone-500 hover:text-bone-100"
      >
        ← Back to the clock
      </Link>
    </div>
  );
}
