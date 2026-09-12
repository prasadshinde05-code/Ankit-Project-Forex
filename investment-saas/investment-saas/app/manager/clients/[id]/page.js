import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientDetailClient from "./client-detail-client";

export default async function ClientDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: investment } = await supabase.from("investments").select("*").eq("id", id).single();
  if (!investment) notFound();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", investment.client_id).single();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("investment_id", investment.id)
    .order("date", { ascending: false });

  // Bucket is private — generate short-lived signed URLs for display.
  const withUrls = await Promise.all(
    (transactions || []).map(async (t) => {
      const { data } = await supabase.storage.from("transaction-proofs").createSignedUrl(t.image_path, 3600);
      return { ...t, signedUrl: data?.signedUrl || null };
    })
  );

  return <ClientDetailClient investment={investment} profile={profile} transactions={withUrls} />;
}
