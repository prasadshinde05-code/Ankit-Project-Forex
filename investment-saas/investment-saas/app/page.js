import Link from "next/link";
import { Inbox, TrendingUp, Lock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center mb-10">
        <div className="text-gold text-xs font-bold tracking-widest mb-2">FX CAPITAL PARTNERS</div>
        <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Investment Client Portal
        </h1>
        <p className="text-slate-300 text-sm mt-2">
          Request a proposal, sign in to manage clients, or check your live investment.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 w-full max-w-3xl justify-center">
        <LandingCard
          href="/request"
          icon={<Inbox size={22} className="text-white" />}
          title="Request a proposal"
          desc="New investor? Tell us about your goals."
        />
        <LandingCard
          href="/login?as=investor"
          icon={<TrendingUp size={22} className="text-navy" />}
          title="Investor portal"
          desc="Track your live investment performance."
          highlight
        />
        <LandingCard
          href="/login?as=manager"
          icon={<Lock size={22} className="text-white" />}
          title="Manager sign in"
          desc="Manage requests, clients & transactions."
        />
      </div>
    </div>
  );
}

function LandingCard({ href, icon, title, desc, highlight }) {
  return (
    <Link
      href={href}
      style={{ flex: "1 1 220px", maxWidth: 320 }}
      className={`rounded-2xl p-6 flex flex-col gap-3 hover:brightness-95 transition ${
        highlight ? "bg-gold" : "bg-steel"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          highlight ? "bg-navy/15" : "bg-white/10"
        }`}
      >
        {icon}
      </div>
      <div className={`font-bold ${highlight ? "text-navy" : "text-white"}`}>{title}</div>
      <div className={`text-sm ${highlight ? "text-navy/70" : "text-slate-300"}`}>{desc}</div>
      <div className={`flex items-center gap-1 text-sm font-semibold ${highlight ? "text-navy" : "text-gold"}`}>
        Continue <ArrowRight size={14} />
      </div>
    </Link>
  );
}
