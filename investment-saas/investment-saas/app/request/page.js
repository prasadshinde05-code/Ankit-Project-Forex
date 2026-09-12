"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Card, Btn, Field, inputCls } from "@/components/ui";
import { submitRequest } from "./actions";

export default function RequestPage() {
  const [sent, setSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    setFirstName(String(formData.get("name") || "").split(" ")[0]);
    const result = await submitRequest(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md text-center">
          <CheckCircle2 size={40} className="text-emerald-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-ink mb-1">Request received</h2>
          <p className="text-sm text-muted">
            Thanks, {firstName}. A member of our team will reach out shortly to discuss your proposal.
          </p>
          <Link href="/">
            <Btn className="mt-4">Back to home</Btn>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 flex justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/" className="bg-white border border-line rounded-lg p-2">
            <ChevronLeft size={18} className="text-ink" />
          </Link>
          <h2 className="text-lg font-semibold text-ink">Request an investment proposal</h2>
        </div>
        <Card>
          <form onSubmit={onSubmit}>
            <Field label="Full name">
              <input name="name" className={inputCls} required />
            </Field>
            <Field label="Email">
              <input name="email" type="email" className={inputCls} required />
            </Field>
            <Field label="Phone">
              <input name="phone" className={inputCls} />
            </Field>
            <Field label="Approximate amount you're considering">
              <input name="amount" placeholder="e.g. $25,000" className={inputCls} />
            </Field>
            <Field label="Anything you'd like us to know">
              <textarea name="message" rows={3} className={inputCls} />
            </Field>
            {error && <p className="text-danger text-sm mb-3">{error}</p>}
            <Btn type="submit" disabled={pending} className="w-full">
              {pending ? "Submitting…" : "Submit request"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
