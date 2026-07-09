import { supabase } from "@/src/core/config/supabase";

export type UserRole = "admin" | "cashier" | "kitchen";

const DEFAULT_ROLE: UserRole = "cashier";

export const ProfileService = {
  getCurrentUserRole: async (): Promise<{
    role: UserRole | null;
    error: boolean;
  }> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { role: null, error: false };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error obteniendo perfil/rol:", error.message);
        // Fallback consistente: cashier, pero marcamos que hubo error
        return { role: DEFAULT_ROLE, error: true };
      }

      return { role: (data?.role as UserRole) || DEFAULT_ROLE, error: false };
    } catch (err) {
      console.error("Error crítico obteniendo rol:", err);
      return { role: DEFAULT_ROLE, error: true };
    }
  },
};