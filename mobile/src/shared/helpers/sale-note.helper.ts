import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

export type OrderKind = "mesa" | "comer_aqui" | "domicilio" | "para_llevar";

export type ParsedNote = {
  kind: OrderKind | null;
  kindLabel: string | null;
  address: string | null;
  paid: string | null;
  change: string | null;
  userNote: string;
};

export const KIND_INFO: Record<
  OrderKind,
  { label: string; icon: IconName; color: string }
> = {
  mesa: { label: "Mesa", icon: "restaurant-outline", color: "#3b82f6" },
  comer_aqui: { label: "Comer aquí", icon: "restaurant-outline", color: "#3b82f6" },
  domicilio: { label: "Domicilio", icon: "bicycle-outline", color: "#a855f7" },
  para_llevar: { label: "Para llevar", icon: "bag-handle-outline", color: "#14b8a6" },
};

// Quita emojis/símbolos del inicio ("🍽️ Mesa 3" -> "Mesa 3")
const clean = (s: string) =>
  s.replace(/^[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ(]+/, "").trim();

export function parseSaleNote(note?: string | null): ParsedNote {
  const result: ParsedNote = {
    kind: null,
    kindLabel: null,
    address: null,
    paid: null,
    change: null,
    userNote: "",
  };
  if (!note) return result;

  const parts = note.split(" | ").map((p) => p.trim()).filter(Boolean);
  const rest: string[] = [];

  parts.forEach((raw, idx) => {
    const p = clean(raw);

    if (idx === 0) {
      const domi = p.match(/^Domi: (.*)$/);
      const mesa = p.match(/^Mesa (.+)$/);
      if (domi) {
        result.kind = "domicilio";
        result.kindLabel = "Domicilio";
        result.address = domi[1] === "Sin dirección" ? null : domi[1];
        return;
      }
      if (mesa) {
        result.kind = "mesa";
        result.kindLabel = `Mesa ${mesa[1]}`;
        return;
      }
      if (p === "Comer aquí") {
        result.kind = "comer_aqui";
        result.kindLabel = "Comer aquí";
        return;
      }
      if (p === "Para llevar") {
        result.kind = "para_llevar";
        result.kindLabel = "Para llevar";
        return;
      }
    }

    const cash = p.match(/^\(Paga: (.+) - Cambio: (.+)\)$/);
    if (cash) {
      result.paid = cash[1];
      result.change = cash[2];
      return;
    }

    rest.push(raw);
  });

  result.userNote = rest.join(" · ");
  return result;
}

export function getPaymentInfo(
  method?: string | null,
): { label: string; icon: IconName } | null {
  switch ((method || "").toLowerCase()) {
    case "cash":
    case "efectivo":
      return { label: "Efectivo", icon: "cash-outline" };
    case "card":
      return { label: "Tarjeta", icon: "card-outline" };
    case "nequi":
      return { label: "Nequi", icon: "phone-portrait-outline" };
    case "transferencia":
      return { label: "Transferencia", icon: "swap-horizontal-outline" };
    case "deuda":
      return { label: "Fiado", icon: "book-outline" };
    default:
      return method ? { label: method, icon: "wallet-outline" } : null;
  }
}