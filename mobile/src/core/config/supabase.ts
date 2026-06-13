import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  Constants.expoConfig?.extra?.supabaseServiceKey ||
  "clave-de-respaldo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
