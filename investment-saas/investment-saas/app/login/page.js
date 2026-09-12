"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Card, Btn, Field, inputCls } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const as = params.get("as") === "manager" ? "manager" : "investor";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setPending(false);
      setError("Incorrect email or password.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setPending(false);

    if (profile?.role === "manager") router.push("/manager");
    else router.push("/portal");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/" className="bg-white border border-line rounded-lg p-2">
            <ChevronLeft size={18} className="text-ink" />
          </Link>
          <h2 className="text-lg font-semibold text-ink">
            {as === "manager" ? "Manager sign in" : "Investor portal sign in"}
          </h2>
        </div>
        <Card>
          <form onSubmit={onSubmit}>
            <Field label="Email">
              <input
                type="email" className={inputCls} value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={show ? "text" : "password"} className={inputCls} value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                />
                <button
                  type="button" onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-2.5 text-muted"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            {error && <p className="text-danger text-sm mb-3">{error}</p>}
            <Btn type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Btn>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              {as === "investor"
                ? "Your login was set up when your account manager onboarded you — check your email for the invite."
                : "Manager accounts are created directly in Supabase. See the README for first-time setup."}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
