import { createClient } from "@supabase/supabase-js";
import { createMockSupabase } from "./mock-supabase";
import { buildDemoCloudSeed, DEMO_USERS } from "./demo-data";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const flag = import.meta.env.VITE_DEMO_MODE as string | undefined;

// Sin credenciales → demo automática. VITE_DEMO_MODE=true/false para forzar.
export const DEMO_MODE = flag === "true" ? true : flag === "false" ? false : !URL_ || !KEY;

const ls = {
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => localStorage.setItem(k, v),
  removeItem: (k: string) => localStorage.removeItem(k),
};

export const supabase: ReturnType<typeof createClient> = DEMO_MODE
  ? (createMockSupabase({ seed: buildDemoCloudSeed(), users: DEMO_USERS, storage: ls, key: "demo-cloud-web-v1" }) as unknown as ReturnType<typeof createClient>)
  : createClient(URL_!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } });