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
const NEQUI_PAYMENT_INFO_KEY = "@nequi_payment_info";

type Ctx = {
  allowNoStock: boolean;
  setAllowNoStock: (v: boolean) => void;
  nequiPaymentInfo: string;
  setNequiPaymentInfo: (value: string) => Promise<void>;
};
const SettingsCtx = createContext<Ctx>({
  allowNoStock: false,
  setAllowNoStock: () => {},
  nequiPaymentInfo: "",
  setNequiPaymentInfo: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [allowNoStock, setState] = useState(false);
  const [nequiPaymentInfo, setNequiPaymentInfoState] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setState(v === "1"))
      .catch(() => {});
    AsyncStorage.getItem(NEQUI_PAYMENT_INFO_KEY)
      .then((value) => setNequiPaymentInfoState(value ?? ""))
      .catch((error) =>
        console.error("Error cargando los datos de pago Nequi:", error),
      );
  }, []);

  const setAllowNoStock = useCallback((v: boolean) => {
    setState(v);
    AsyncStorage.setItem(KEY, v ? "1" : "0").catch(() => {});
  }, []);

  const setNequiPaymentInfo = useCallback(async (value: string) => {
    const trimmedValue = value.trim();
    await AsyncStorage.setItem(NEQUI_PAYMENT_INFO_KEY, trimmedValue);
    setNequiPaymentInfoState(trimmedValue);
  }, []);

  const value = useMemo(
    () => ({
      allowNoStock,
      setAllowNoStock,
      nequiPaymentInfo,
      setNequiPaymentInfo,
    }),
    [allowNoStock, setAllowNoStock, nequiPaymentInfo, setNequiPaymentInfo],
  );
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
