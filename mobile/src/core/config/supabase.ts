import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { DEMO_MODE } from "./app.config";
import { createMockSupabase } from "./mock-supabase";
import { buildDemoCloudSeed, DEMO_USERS } from "./demo-data";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://supabase.co";
// ⚠️ Ver nota: una service_role key NO debería ir dentro de la app. Usa la anon key + RLS.
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  Constants.expoConfig?.extra?.supabaseServiceKey ||
  "clave-de-respaldo";

export const supabase: ReturnType<typeof createClient> = DEMO_MODE
  ? (createMockSupabase({
      seed: buildDemoCloudSeed(),
      users: DEMO_USERS,
      storage: AsyncStorage,
      key: "demo-cloud-v1",
    }) as unknown as ReturnType<typeof createClient>)
  : createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });