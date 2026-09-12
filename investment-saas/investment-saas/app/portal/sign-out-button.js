"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
      }}
      className="flex items-center gap-2 text-slate-300 hover:text-white text-sm"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}
