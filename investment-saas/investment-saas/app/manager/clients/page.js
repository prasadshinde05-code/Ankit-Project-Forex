import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computePerformance, fmtMoney } from "@/lib/performance";
import { Card, Badge } from "@/components/ui";

export default async function ClientsPage() {
  const supabase = await createClient();
  const [{ data: investments }, { data: profiles }] = await Promise.all([
    supabase.from("investments").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, phone"),
  ]);

  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return (
    <>
      <h2 className="text-xl font-bold text-ink mb-5">Clients</h2>
      {(!investments || investments.length === 0) && (
        <p className="text-sm text-muted">No clients yet. Onboard one from the Requests tab.</p>
      )}
      <div className="flex flex-col gap-2">
        {(investments || []).map((inv) => {
          const perf = computePerformance(inv);
          const profile = byId[inv.client_id];
          return (
            <Link
              key={inv.id}
              href={`/manager/clients/${inv.id}`}
              className="flex justify-between items-center py-3 px-1 border-b border-line last:border-0"
            >
              <div>
                <div className="font-bold text-ink text-sm">{profile?.full_name || "Unnamed client"}</div>
                <div className="text-xs text-muted">{inv.monthly_rate}%/mo · {inv.lock_in_months}mo lock-in</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-navy">{fmtMoney(perf.balance)}</div>
                <Badge tone={perf.matured ? "muted" : "success"}>{perf.matured ? "Matured" : "Active"}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
