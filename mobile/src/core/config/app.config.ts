/**
 * Punto único para decidir si la app corre en DEMO (sin Supabase) o con Supabase real.
 *
 *  - Sin EXPO_PUBLIC_SUPABASE_URL  → demo automática.
 *  - EXPO_PUBLIC_DEMO_MODE=true    → fuerza demo aunque haya credenciales.
 *  - EXPO_PUBLIC_DEMO_MODE=false   → exige Supabase real.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const flag = process.env.EXPO_PUBLIC_DEMO_MODE;

export const DEMO_MODE = flag === "true" ? true : flag === "false" ? false : !url;