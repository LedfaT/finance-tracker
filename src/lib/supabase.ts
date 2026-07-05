import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("replace-with") &&
  !supabaseAnonKey.includes("replace-with")
);

let client: SupabaseClient | undefined;

export const getSupabaseClient = () => {
  if (!hasSupabaseConfig) {
    throw new Error("supabase_config_missing");
  }

  client ??= createClient(supabaseUrl, supabaseAnonKey);

  return client;
};
