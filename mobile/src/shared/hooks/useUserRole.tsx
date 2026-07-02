import { supabase } from "@/src/core/config/supabase";
import { useEffect, useState } from "react";

export function useUserRole() {
  const [role, setRole] = useState<"admin" | "cashier" | "kitchen" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role || "cashier");
      }
      setLoading(false);
    }
    getRole();
  }, []);

  return { role, loading };
}