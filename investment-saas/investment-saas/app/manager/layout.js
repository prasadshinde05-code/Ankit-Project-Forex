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
    <div className="min-h-screen flex flex-col sm:flex-row">
      <div className="w-full sm:w-56 bg-navy p-4 sm:p-5 flex flex-col">
        <div className="text-gold font-bold text-sm tracking-widest mb-3 sm:mb-8 pl-1 sm:pl-2">MANAGER</div>
        <nav className="flex flex-row sm:flex-col gap-1 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          <NavLink href="/manager" icon={<LayoutDashboard size={16} />}>Dashboard</NavLink>
          <NavLink href="/manager/requests" icon={<Inbox size={16} />}>Requests</NavLink>
          <NavLink href="/manager/clients" icon={<Users size={16} />}>Clients</NavLink>
          <div className="sm:hidden ml-auto flex items-center">
            <SignOutButton />
          </div>
        </nav>
        <div className="flex-1 hidden sm:block" />
        <div className="hidden sm:block">
          <SignOutButton />
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-8 max-w-5xl min-w-0">{children}</div>
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
