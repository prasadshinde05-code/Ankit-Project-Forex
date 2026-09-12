import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computePerformance, fmtMoney, fmtDate } from "@/lib/performance";
import { Card, Badge, ProgressBar } from "@/components/ui";
import SignOutButton from "./sign-out-button";
import { ShieldCheck, Image as ImageIcon } from "lucide-react";

export default async function InvestorPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // The layout above also guards this route, but Next can begin rendering a
  // page before a parent layout's redirect takes effect — never assume a
  // parent has already verified auth. Check again here, defensively.
  if (!user) redirect("/login?as=investor");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // RLS on `investments` restricts this to rows where client_id = auth.uid() —
  // there is no way for this query to return another investor's data.
  const { data: investment } = await supabase
    .from("investments")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!investment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <p className="text-muted text-sm">No investment is linked to your account yet. Please contact your account manager.</p>
        </Card>
      </div>
    );
  }

  const perf = computePerformance(investment);

  // The investor_transactions VIEW has no `amount` column at all — it is not
  // just hidden by this UI, the data is architecturally unreachable here.
  const { data: transactions } = await supabase
    .from("investor_transactions")
    .select("*")
    .eq("investment_id", investment.id)
    .order("date", { ascending: false });

  const withUrls = await Promise.all(
    (transactions || []).map(async (t) => {
      const { data } = await supabase.storage.from("transaction-proofs").createSignedUrl(t.image_path, 3600);
      return { ...t, signedUrl: data?.signedUrl || null };
    })
  );

  return (
    <>
      <div className="bg-navy px-6 py-4 flex justify-between items-center">
        <div>
          <div className="text-gold text-xs font-bold tracking-widest">INVESTOR PORTAL</div>
          <div className="text-white font-bold">{profile?.full_name}</div>
        </div>
        <SignOutButton />
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        <Card className="mb-4">
          <div className="text-sm text-muted mb-1">Current balance</div>
          <div className="text-4xl font-bold text-navy">{fmtMoney(perf.balance)}</div>
          <div className="text-sm text-muted mb-4">
            Principal {fmtMoney(investment.principal)} + accrued interest {fmtMoney(perf.accrued)} at{" "}
            {investment.monthly_rate}%/month, simple (non-compounding)
          </div>
          <ProgressBar progress={perf.progress} />
          <div className="flex justify-between text-sm text-muted mt-2">
            <span>Started {fmtDate(investment.start_date)}</span>
            <span className={`font-bold ${perf.matured ? "text-emerald-700" : "text-ink"}`}>
              {perf.matured ? "Term complete" : `Matures ${fmtDate(perf.maturityDate)}`}
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-ink mb-1">Transaction history</h3>
          <p className="text-xs text-muted mb-4">Shown as verified screenshots from your account manager.</p>
          {withUrls.length === 0 ? (
            <p className="text-sm text-muted">No transactions recorded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {withUrls.map((t) => (
                <div key={t.id} className="border border-line rounded-lg overflow-hidden">
                  {t.signedUrl ? (
                    <img src={t.signedUrl} alt={t.type} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-offwhite flex items-center justify-center">
                      <ImageIcon size={20} className="text-muted" />
                    </div>
                  )}
                  <div className="p-2 flex justify-between items-center">
                    <Badge tone={t.type === "payout" ? "success" : t.type === "deposit" ? "gold" : "muted"}>{t.type}</Badge>
                    <span className="text-xs text-muted">{fmtDate(t.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-2 mt-4 text-xs text-muted">
          <ShieldCheck size={15} /> Transaction amounts are confirmed directly with your account manager; this view shows visual proof only.
        </div>
      </div>
    </>
  );
}
