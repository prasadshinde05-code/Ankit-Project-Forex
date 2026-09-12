"use client";

import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components. Runs with the visitor's own auth session, so it
// is fully subject to Row Level Security — this client can never see more
// than the signed-in user is allowed to.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
