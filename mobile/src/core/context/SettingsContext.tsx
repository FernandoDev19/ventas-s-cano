import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "@allow_no_stock";

type Ctx = { allowNoStock: boolean; setAllowNoStock: (v: boolean) => void };
const SettingsCtx = createContext<Ctx>({
  allowNoStock: false,
  setAllowNoStock: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [allowNoStock, setState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setState(v === "1"))
      .catch(() => {});
  }, []);

  const setAllowNoStock = useCallback((v: boolean) => {
    setState(v);
    AsyncStorage.setItem(KEY, v ? "1" : "0").catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ allowNoStock, setAllowNoStock }),
    [allowNoStock, setAllowNoStock],
  );
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
