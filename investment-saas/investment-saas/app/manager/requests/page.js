import { createClient } from "@/lib/supabase/server";
import RequestsClient from "./requests-client";

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  return <RequestsClient initialRequests={requests || []} />;
}
