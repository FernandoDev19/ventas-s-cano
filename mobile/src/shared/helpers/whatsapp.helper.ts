import { Linking, Alert } from "react-native";

/**
 * Genera un mensaje de factura resumida para enviarlo por WhatsApp.
 */
export function buildInvoiceMessage(params: {
  storeName?: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod?: string;
  note?: string;
}): string {
  const { storeName = "Sabor Express", customerName, items, total, paymentMethod, note } = params;

  const payLabel: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    deuda: "Fiado",
    cash: "Efectivo",
    card: "Tarjeta",
    nequi: "Nequi",
  };

  const lines: string[] = [];
  lines.push(`🧾 *SABOR EXPRESS – Factura*`);
  lines.push(`Cliente: *${customerName}*`);
  lines.push("─────────────────");

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    lines.push(`• ${item.quantity}x ${item.name} — $${itemTotal.toLocaleString("es-CO")}`);
  });

  lines.push("─────────────────");
  lines.push(`💰 *TOTAL: $${total.toLocaleString("es-CO")}*`);

  if (paymentMethod) {
    lines.push(`Forma de pago: ${payLabel[paymentMethod] ?? paymentMethod}`);
  }

  if (note) {
    lines.push(`📝 ${note}`);
  }

  lines.push("");
  lines.push(`¡Gracias por tu compra en ${storeName}! 🙏`);

  return lines.join("\n");
}

/**
 * Normaliza un número colombiano eliminando prefijos y dejando solo 10 dígitos.
 * Si el número no está en Colombia, agrega +57 automáticamente.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

/**
 * Abre WhatsApp con un mensaje de factura.
 * Retorna false si no hay teléfono o falla la apertura.
 */
export async function sendInvoiceViaWhatsApp(
  phone: string | null | undefined,
  message: string,
): Promise<boolean> {
  if (!phone || phone.trim() === "") return false;

  const normalized = normalizePhone(phone.trim());
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("WhatsApp no disponible", "No se pudo abrir WhatsApp en este dispositivo.");
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert("Error", "No se pudo abrir WhatsApp.");
    return false;
  }
}
