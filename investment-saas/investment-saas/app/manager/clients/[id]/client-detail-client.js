"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Upload, Image as ImageIcon } from "lucide-react";
import { Card, Btn, Badge, Field, inputCls, ProgressBar } from "@/components/ui";
import { computePerformance, fmtMoney, fmtDate } from "@/lib/performance";
import { addTransaction } from "../../actions";

export default function ClientDetailClient({ investment, profile, transactions }) {
  const [txs, setTxs] = useState(transactions);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const perf = computePerformance(investment);

  async function handleAdd(formData) {
    setPending(true);
    setError("");
    const res = await addTransaction(investment.id, formData);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setShowAdd(false);
    // Optimistic UI: re-fetch would be more correct, but a full reload keeps
    // signed URLs consistent with minimal extra code for this scaffold.
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <Link href="/manager/clients" className="bg-white border border-line rounded-lg p-2">
          <ChevronLeft size={18} className="text-ink" />
        </Link>
        <h2 className="text-xl font-bold text-ink">{profile?.full_name || "Client"}</h2>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <Card style={{ flex: "1 1 280px", minWidth: 280 }}>
          <div className="text-xs text-muted mb-1">Live balance</div>
          <div className="text-3xl font-bold text-navy">{fmtMoney(perf.balance)}</div>
          <div className="text-sm text-muted mb-3">
            Principal {fmtMoney(investment.principal)} + accrued {fmtMoney(perf.accrued)}
          </div>
          <ProgressBar progress={perf.progress} />
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>Day {perf.daysElapsed} of {perf.totalDays}</span>
            <span>{perf.matured ? "Matured" : `Matures ${fmtDate(perf.maturityDate)}`}</span>
          </div>
        </Card>

        <Card style={{ flex: "1 1 280px", minWidth: 280 }}>
          <div className="text-xs text-muted mb-2">Client details</div>
          <div className="text-sm text-ink font-semibold">{profile?.full_name}</div>
          <div className="text-sm text-muted">{profile?.email || "—"} {profile?.phone && `· ${profile.phone}`}</div>
          <div className="text-sm text-muted mt-2">
            {investment.monthly_rate}%/mo · {investment.lock_in_months}-month lock-in · started {fmtDate(investment.start_date)}
          </div>
          <div className="text-xs text-muted mt-3 bg-offwhite rounded-lg px-3 py-2">
            The client signs in directly with their own email + password — no shared codes to manage.
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-ink">Transactions</h3>
          <Btn variant="outline" onClick={() => setShowAdd((s) => !s)}>
            <Plus size={15} /> Add transaction
          </Btn>
        </div>

        {showAdd && <AddTransactionForm onCancel={() => setShowAdd(false)} onSave={handleAdd} pending={pending} error={error} />}

        {txs.length === 0 ? (
          <p className="text-sm text-muted">No transactions recorded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {txs.map((t) => (
              <div key={t.id} className="border border-line rounded-lg overflow-hidden" style={{ flex: "1 1 140px", minWidth: 140, maxWidth: 200 }}>
                {t.signedUrl ? (
                  <img src={t.signedUrl} alt={t.type} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-offwhite flex items-center justify-center">
                    <ImageIcon size={20} className="text-muted" />
                  </div>
                )}
                <div className="p-2">
                  <div className="flex justify-between items-center">
                    <Badge tone={t.type === "payout" ? "success" : t.type === "deposit" ? "gold" : "muted"}>{t.type}</Badge>
                    <span className="text-xs text-muted">{fmtDate(t.date)}</span>
                  </div>
                  <div className="font-bold text-ink text-sm mt-1">{fmtMoney(t.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function AddTransactionForm({ onCancel, onSave, pending, error }) {
  const [fileName, setFileName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <Card className="mb-4 bg-offwhite">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-3">
          <Field label="Type" style={{ flex: "1 1 160px" }}>
            <select name="type" className={inputCls} defaultValue="payout">
              <option value="payout">Payout</option>
              <option value="deposit">Deposit</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </Field>
          <Field label="Amount (USD)" style={{ flex: "1 1 160px" }}>
            <input name="amount" type="number" className={inputCls} required />
          </Field>
        </div>
        <Field label="Date">
          <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
        </Field>
        <Field label="Note (internal)">
          <input name="note" className={inputCls} placeholder="Optional" />
        </Field>
        <Field label="Proof — screenshot or photo">
          <label className={`${inputCls} flex items-center gap-2 cursor-pointer`}>
            <Upload size={15} className="text-muted" />
            <span className={fileName ? "text-ink" : "text-muted"}>{fileName || "Choose an image"}</span>
            <input
              type="file" name="proof" accept="image/*" className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              required
            />
          </label>
        </Field>
        {error && <p className="text-danger text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <Btn type="submit" variant="gold" disabled={pending}>{pending ? "Saving…" : "Save transaction"}</Btn>
          <Btn variant="ghost" type="button" onClick={onCancel}>Cancel</Btn>
        </div>
      </form>
    </Card>
  );
}
