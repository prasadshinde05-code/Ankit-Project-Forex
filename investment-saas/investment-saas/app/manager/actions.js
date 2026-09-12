"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, logAudit } from "@/lib/supabase/admin";

// Every action re-checks that the caller is actually a manager, server-side.
// Never trust the client — the UI hiding a button is not access control.
async function requireManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "manager") throw new Error("Not authorized.");

  return { supabase, user };
}

export async function declineRequest(requestId) {
  const { supabase, user } = await requireManager();
  const { error } = await supabase.from("requests").update({ status: "declined" }).eq("id", requestId);
  if (error) return { error: error.message };

  const admin = createAdminClient();
  await logAudit(admin, { actorId: user.id, action: "request.declined", entity: "requests", entityId: requestId });

  revalidatePath("/manager/requests");
  return { ok: true };
}

// The core onboarding flow. This is the real replacement for the prototype's
// shared PIN: the investor gets an actual account, created via Supabase's
// admin invite API, and sets their own password from a real emailed link.
export async function onboardRequest(requestId, form) {
  const { supabase, user } = await requireManager();
  const admin = createAdminClient();

  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const phone = String(form.get("phone") || "").trim() || null;
  const principal = Number(form.get("principal"));
  const monthlyRate = Number(form.get("monthlyRate"));
  const lockInMonths = Number(form.get("lockInMonths"));
  const startDate = String(form.get("startDate"));

  if (!name || !email || !principal || !monthlyRate || !lockInMonths || !startDate) {
    return { error: "All fields are required." };
  }

  // 1. Invite the investor — Supabase emails them a real signup link.
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/login?as=investor`;
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo,
  });
  if (inviteError) return { error: `Could not create investor account: ${inviteError.message}` };

  const clientId = invited.user.id;

  // 2. The new-user trigger already created a 'profiles' row with role
  //    'investor' by default — just fill in phone if provided.
  if (phone) {
    await admin.from("profiles").update({ phone }).eq("id", clientId);
  }

  // 3. Create the investment record.
  const { data: investment, error: investError } = await supabase
    .from("investments")
    .insert({
      client_id: clientId,
      principal,
      monthly_rate: monthlyRate,
      lock_in_months: lockInMonths,
      start_date: startDate,
      created_by: user.id,
    })
    .select()
    .single();

  if (investError) return { error: investError.message };

  // 4. Mark the request as onboarded.
  await supabase.from("requests").update({ status: "onboarded" }).eq("id", requestId);

  await logAudit(admin, {
    actorId: user.id,
    action: "client.onboarded",
    entity: "investments",
    entityId: investment.id,
    meta: { email, principal, monthlyRate, lockInMonths },
  });

  revalidatePath("/manager/requests");
  revalidatePath("/manager/clients");
  return { ok: true };
}

export async function addTransaction(investmentId, form) {
  const { supabase, user } = await requireManager();

  const type = String(form.get("type"));
  const amount = Number(form.get("amount"));
  const date = String(form.get("date"));
  const note = String(form.get("note") || "").trim() || null;
  const file = form.get("proof");

  if (!amount || !date || !(file instanceof File) || file.size === 0) {
    return { error: "Amount, date, and a proof image are all required." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${investmentId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("transaction-proofs")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: tx, error: insertError } = await supabase
    .from("transactions")
    .insert({
      investment_id: investmentId,
      type,
      amount,
      date,
      note,
      image_path: path,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  const admin = createAdminClient();
  await logAudit(admin, {
    actorId: user.id,
    action: "transaction.added",
    entity: "transactions",
    entityId: tx.id,
    meta: { investmentId, type, amount, date },
  });

  revalidatePath(`/manager/clients/${investmentId}`);
  return { ok: true };
}
