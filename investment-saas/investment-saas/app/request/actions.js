"use server";

import { createClient } from "@/lib/supabase/server";

// Anonymous visitors can call this. It only ever performs an INSERT — the
// `requests: public insert` RLS policy is the only thing allowing it through,
// and that policy grants insert only, never select/update/delete.
export async function submitRequest(formData) {
  const supabase = await createClient();

  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    amount_text: String(formData.get("amount") || "").trim() || null,
    message: String(formData.get("message") || "").trim() || null,
  };

  if (!payload.name || !payload.email) {
    return { error: "Name and email are required." };
  }

  const { error } = await supabase.from("requests").insert(payload);
  if (error) return { error: error.message };
  return { ok: true };
}
