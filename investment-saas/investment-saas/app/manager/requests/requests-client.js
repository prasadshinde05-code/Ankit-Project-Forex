"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, Btn, Badge, Field, inputCls } from "@/components/ui";
import { fmtDate } from "@/lib/performance";
import { declineRequest, onboardRequest } from "../actions";

export default function RequestsClient({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [onboarding, setOnboarding] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");

  async function handleDecline(id) {
    setPending(true);
    const res = await declineRequest(id);
    setPending(false);
    if (res?.error) setError(res.error);
    else setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: "declined" } : r)));
  }

  async function handleOnboard(formData) {
    setPending(true);
    setError("");
    const res = await onboardRequest(onboarding.id, formData);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setRequests((rs) => rs.map((r) => (r.id === onboarding.id ? { ...r, status: "onboarded" } : r)));
    setOnboarding(null);
    setToast("Client onboarded — they'll receive an email invite to set their password.");
    setTimeout(() => setToast(""), 4000);
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");

  if (onboarding) {
    return (
      <OnboardForm
        request={onboarding}
        pending={pending}
        error={error}
        onCancel={() => { setOnboarding(null); setError(""); }}
        onSubmit={handleOnboard}
      />
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold text-ink mb-5">Proposal requests</h2>
      {toast && (
        <div className="bg-emerald-50 text-emerald-800 text-sm px-4 py-2.5 rounded-lg mb-4">{toast}</div>
      )}
      {requests.length === 0 && (
        <p className="text-sm text-muted flex items-center gap-2">
          <AlertCircle size={16} /> No requests yet. Share your <code>/request</code> link with prospects.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {[...pendingRequests, ...otherRequests].map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-ink">{r.name}</div>
                <div className="text-sm text-muted">{r.email} {r.phone && `· ${r.phone}`}</div>
                {r.amount_text && (
                  <div className="text-sm text-muted mt-1">
                    Interested amount: <strong className="text-ink">{r.amount_text}</strong>
                  </div>
                )}
                {r.message && <div className="text-sm text-ink mt-2 italic">"{r.message}"</div>}
                <div className="text-xs text-muted mt-2">Received {fmtDate(r.created_at)}</div>
              </div>
              <Badge tone={r.status === "pending" ? "gold" : r.status === "declined" ? "danger" : "success"}>
                {r.status}
              </Badge>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Btn variant="gold" disabled={pending} onClick={() => setOnboarding(r)}>
                  <CheckCircle2 size={15} /> Accept & onboard
                </Btn>
                <Btn variant="danger" disabled={pending} onClick={() => handleDecline(r.id)}>
                  <XCircle size={15} /> Decline
                </Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function OnboardForm({ request, onCancel, onSubmit, pending, error }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  }

  return (
    <>
      <h2 className="text-xl font-bold text-ink mb-5">Onboard {request.name}</h2>
      <Card className="max-w-md">
        <form onSubmit={handleSubmit}>
          <Field label="Client name">
            <input name="name" defaultValue={request.name} className={inputCls} required />
          </Field>
          <Field label="Email">
            <input name="email" defaultValue={request.email} className={inputCls} required />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={request.phone || ""} className={inputCls} />
          </Field>
          <Field label="Principal invested (USD)">
            <input name="principal" type="number" className={inputCls} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fixed monthly rate (%)">
              <input name="monthlyRate" type="number" step="0.1" defaultValue="4.5" className={inputCls} />
            </Field>
            <Field label="Lock-in term">
              <select name="lockInMonths" defaultValue="6" className={inputCls}>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </Field>
          </div>
          <Field label="Start date">
            <input name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
          </Field>
          {error && <p className="text-danger text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <Btn type="submit" variant="gold" disabled={pending}>
              {pending ? "Creating…" : "Create client & send invite email"}
            </Btn>
            <Btn variant="ghost" type="button" onClick={onCancel}>Cancel</Btn>
          </div>
        </form>
      </Card>
    </>
  );
}
