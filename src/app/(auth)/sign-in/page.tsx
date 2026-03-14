"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const redirectTo = searchParams.get("next") || "/registration";

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[auth-debug] Sign-in succeeded but failed to resolve user.", {
        error: userError?.message ?? "Unknown user error",
      });
    } else {
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1);

      if (profileError) {
        console.error("[auth-debug] Failed to fetch signed-in user profile.", {
          userId: user.id,
          error: profileError.message,
        });
      } else {
        console.info("[auth-debug] Supabase database query successful for signed-in user.", {
          userId: user.id,
          profile: profiles?.[0] ?? null,
        });
      }

      const { data: organizations, error: organizationsError } = await supabase
        .from("organizations")
        .select("id,name,npi,created_at")
        .order("created_at", { ascending: false });

      if (organizationsError) {
        console.error("[auth-debug] Failed to fetch organizations.", {
          userId: user.id,
          error: organizationsError.message,
        });
      } else {
        console.info("[auth-debug] Organizations query success.", {
          userId: user.id,
          total: organizations?.length ?? 0,
          organizations: organizations ?? [],
        });
      }
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <main className="app-shell min-h-screen grid place-items-center">
      <section className="surface-card grid w-full max-w-4xl overflow-hidden md:grid-cols-[1.05fr_1fr]">
        <div className="hidden bg-[linear-gradient(140deg,#0f766e,#0f4c81)] p-8 text-white md:block">
          <p className="chip border-white/20 bg-white/10 text-white">Care Operations</p>
          <h1 className="mt-5 text-3xl font-bold leading-tight">Healthland Centriq</h1>
          <p className="mt-3 text-sm text-white/90">
            Unified intake and bed management for clinical teams in critical access hospitals.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-white/95">
            <li>Fast patient registration</li>
            <li>Live bed availability and ADT actions</li>
            <li>Audit-ready care timeline</li>
          </ul>
        </div>

        <form action={handleSubmit} className="grid gap-5 p-6 sm:p-8">
          <div>
            <p className="chip w-fit">Secure Access</p>
            <h2 className="mt-3 text-2xl font-semibold">Sign in to continue</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Use your hospital-issued credentials.
            </p>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <input type="email" name="email" required className="app-input" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Password</span>
            <input type="password" name="password" required className="app-input" />
          </label>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
