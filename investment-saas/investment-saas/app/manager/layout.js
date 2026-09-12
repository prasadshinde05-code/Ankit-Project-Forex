import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Inbox, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function ManagerLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?as=manager");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "manager") redirect("/portal");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-navy px-4 py-3 flex items-center gap-2">
        <div className="text-gold font-bold text-sm tracking-widest mr-4">MANAGER</div>
        <nav className="flex flex-row gap-1 overflow-x-auto flex-1">
          <NavLink href="/manager" icon={<LayoutDashboard size={16} />}>Dashboard</NavLink>
          <NavLink href="/manager/requests" icon={<Inbox size={16} />}>Requests</NavLink>
          <NavLink href="/manager/clients" icon={<Users size={16} />}>Clients</NavLink>
        </nav>
        <SignOutButton />
      </div>
      <div className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto">{children}</div>
    </div>
  );
}

function NavLink({ href, icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white text-sm font-semibold whitespace-nowrap"
    >
      {icon} {children}
    </Link>
  );
}
