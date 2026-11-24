import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nwColorScheme } from "nativewind";
import { C, palettes, Scheme, setCurrentScheme } from "./palette";

export type ThemeMode = "system" | "light" | "dark";
const KEY = "@theme_mode";

type Ctx = {
  c: typeof C;
  scheme: Scheme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  ready: boolean;
};

const ThemeCtx = createContext<Ctx>({
  c: C,
  scheme: "dark",
  mode: "system",
  setMode: () => {},
  ready: false,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setModeState(v);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const scheme: Scheme = mode === "system" ? (system === "light" ? "light" : "dark") : mode;

  // Se fija durante el render para que los hijos ya lean la paleta correcta.
  setCurrentScheme(scheme);

  useEffect(() => {
    // NativeWind (variantes dark:) y el sistema nativo (teclado, alertas, barras)
    try { nwColorScheme.set(scheme); } catch {}
    try { Appearance.setColorScheme(mode === "system" ? null : mode); } catch {}
    if (typeof document !== "undefined") {
      if (scheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [mode, scheme]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const value = useMemo(() => ({ c: C, scheme, mode, setMode, ready }), [scheme, mode, setMode, ready]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
export { C, palettes };
export const makeStyles = <T,>(factory: (c: typeof C) => T) => {
  let cache: { scheme: Scheme; v: T } | null = null;
  return (scheme: Scheme): T => {
    if (!cache || cache.scheme !== scheme) cache = { scheme, v: factory(C) };
    return cache.v;
  };
};
