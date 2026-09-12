import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// DANGER: this client uses the service-role key and bypasses Row Level
// Security entirely. It must never be imported into a Client Component or
// exposed to the browser in any way. Use it only for two things:
//   1. Creating investor auth accounts (Supabase Admin API) during onboarding
//   2. Writing to audit_log (which regular users have no insert policy for)
// The `server-only` import above makes Next.js throw a build error if this
// file is ever accidentally pulled into client-side code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function logAudit(adminClient, { actorId, action, entity, entityId, meta }) {
  await adminClient.from("audit_log").insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId ?? null,
    meta: meta ?? {},
  });
}
