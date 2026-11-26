import { useEffect, useRef } from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import { supabase } from "@/src/core/config/supabase";
import { SyncService } from "../services/sync.service";

export const DATA_CHANGED = "DATA_CHANGED";
const TABLES = ["sales","sale_products","sale_recipes","products","recipes",
  "recipe_ingredients","clients","categories","expenses","expense_items",
  "cashier_shifts","cash_movements"];

export function useRealtimeSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const changed = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      DeviceEventEmitter.emit(DATA_CHANGED, [...changed]);
      changed.clear(); timer = null;
    };

    const channel = supabase.channel("data-sync");
    TABLES.forEach((table) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        SyncService.applyRealtime(table, payload);
        changed.add(table);
        if (!timer) timer = setTimeout(flush, 400);   // agrupa ráfagas
      }),
    );
    // al (re)conectar: ponerse al día con lo que se perdió
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED")
        SyncService.run().then(() => DeviceEventEmitter.emit(DATA_CHANGED, ["*"]));
    });
    const app = AppState.addEventListener("change", (s) => {
      if (s === "active")
        SyncService.run().then(() => DeviceEventEmitter.emit(DATA_CHANGED, ["*"]));
    });

    return () => {
      app.remove();
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}

export function useOnDataChanged(tables: string[], cb: () => void) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; });
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(DATA_CHANGED, (changed: string[]) => {
      if (changed.includes("*") || changed.some((t) => tables.includes(t))) ref.current();
    });
    return () => sub.remove();
  }, [tables.join(",")]); // eslint-disable-line
}