import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { TablesService, TableType } from "../services/tables.service";
import { supabase } from "@/src/core/config/supabase";

export const useTables = () => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTables = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await TablesService.getAll();
      setTables(data);
    } catch (err) {
      console.error("Error cargando mesas:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Recargar cuando el screen enfoca
  useFocusEffect(
    useCallback(() => {
      loadTables();
    }, [loadTables])
  );

  // ─── SUSCRIPCIÓN REALTIME ──────────────────────────
  useEffect(() => {
    console.log("🔌 Conectando Realtime para mesas...");

    const channel = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        (payload) => {
          console.log("📊 Mesa cambió:", payload.new);
          // Actualizar solo la mesa que cambió
          if (payload.new) {
            setTables((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 Desconectando Realtime de mesas");
      supabase.removeChannel(channel);
    };
  }, []);

  // ─── ACCIONES ──────────────────────────────────────
  const occupy = useCallback(
    async (id: number) => {
      try {
        await TablesService.occupy(id);
        loadTables(true);
      } catch (err) {
        console.error("Error ocupando mesa:", err);
      }
    },
    [loadTables]
  );

  const release = useCallback(
    async (id: number) => {
      try {
        await TablesService.release(id);
        loadTables(true);
      } catch (err) {
        console.error("Error liberando mesa:", err);
      }
    },
    [loadTables]
  );

  return {
    tables,
    isLoading,
    loadTables,
    occupy,
    release,
  };
};