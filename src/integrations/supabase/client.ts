import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Client-side Supabase credentials come from Vite env variables.
// Copy .env.example to .env and fill in the values from your own Supabase project
// (Project Settings -> API): the Project URL and the anon/public key.
export const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] ?? "";
export const SUPABASE_ANON_KEY =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ??
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function supabaseConfigError(): string {
  return "Supabase is not configured yet. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project (Settings -> API), then restart the app.";
}

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Fail with a clear, actionable message the first time the client is used
    // instead of crashing the whole app at import time.
    throw new Error(supabaseConfigError());
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
