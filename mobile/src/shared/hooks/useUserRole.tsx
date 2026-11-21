import { useEffect, useState } from "react";
import { supabase } from "@/src/core/config/supabase";
import { ProfileService, UserRole } from "@/src/features/sales/services/profile.service";

// BYPASS_AUTH: Cambiar a false cuando desees reactivar el flujo de autenticación normal
export const BYPASS_AUTH = true;

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(BYPASS_AUTH ? "admin" : null);
  const [loading, setLoading] = useState(BYPASS_AUTH ? false : true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (BYPASS_AUTH) {
      setRole("admin");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function getRole() {
      const result = await ProfileService.getCurrentUserRole();
      if (!mounted) return;
      setRole(result.role);
      setError(result.error);
      setLoading(false);
    }

    getRole();

    // Re-resolver el rol si cambia la sesión (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      getRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, error };
}
