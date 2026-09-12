import Link from "next/link";
import { TrendingUp, Users, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computePerformance, fmtMoney } from "@/lib/performance";
import { Card, Badge } from "@/components/ui";

export default async function ManagerDashboard() {
  const supabase = await createClient();

  const [{ data: investments }, { data: requests }, { data: profiles }] = await Promise.all([
    supabase.from("investments").select("*").order("created_at", { ascending: false }),
    supabase.from("requests").select("*").eq("status", "pending"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const nameById = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
  const list = investments || [];
  const totalAUM = list.reduce((sum, inv) => sum + computePerformance(inv).balance, 0);
  const activeCount = list.filter((inv) => !computePerformance(inv).matured).length;

  return (
    <>
      <h2 className="text-xl font-bold text-ink mb-5">Dashboard</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Assets under management" value={fmtMoney(totalAUM)} icon={<TrendingUp size={18} className="text-gold" />} />
        <StatCard label="Active clients" value={activeCount} icon={<Users size={18} className="text-gold" />} />
        <StatCard label="Pending requests" value={requests?.length || 0} icon={<Inbox size={18} className="text-gold" />} />
      </div>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-3">Recent clients</h3>
        {list.length === 0 && <p className="text-sm text-muted py-2">No clients yet. Onboard your first client from Requests.</p>}
        {list.slice(0, 6).map((inv) => {
          const perf = computePerformance(inv);
          return (
            <Link
              key={inv.id}
              href={`/manager/clients/${inv.id}`}
              className="flex justify-between items-center py-3 border-b border-line last:border-0"
            >
              <div>
                <div className="font-bold text-ink text-sm">{nameById[inv.client_id] || "Unnamed client"}</div>
                <div className="text-xs text-muted">{inv.monthly_rate}%/mo · {inv.lock_in_months}mo lock-in</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-navy">{fmtMoney(perf.balance)}</div>
                <Badge tone={perf.matured ? "muted" : "success"}>{perf.matured ? "Matured" : "Active"}</Badge>
              </div>
            </Link>
          );
        })}
      </Card>
    </>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <Card style={{ flex: "1 1 200px", minWidth: 200 }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-muted mb-1">{label}</div>
          <div className="text-2xl font-bold text-navy">{value}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">{icon}</div>
      </div>
    </Card>
  );
}
