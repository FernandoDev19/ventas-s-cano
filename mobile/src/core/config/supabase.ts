import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  Constants.expoConfig?.extra?.supabaseServiceKey ||
  "clave-de-respaldo";

// Adaptador de almacenamiento compatible con SSR (Node.js en web) y cliente (Web, Android, iOS)
// En Android e iOS usa AsyncStorage nativo intacto.
// En Web evita que el empaquetador de Metro en Node (SSR) truene con 'ReferenceError: window is not defined'.
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: Platform.OS !== "web" || typeof window !== "undefined",
    persistSession: true,
    detectSessionInUrl: false,
  },
});
