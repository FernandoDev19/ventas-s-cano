import { useEffect, useState } from "react";
import { supabase } from "@/src/core/config/supabase";
import { ProfileService, UserRole } from "@/src/features/sales/services/profile.service";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
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
