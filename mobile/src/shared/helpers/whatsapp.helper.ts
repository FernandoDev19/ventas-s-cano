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

export function getOrderPaymentPreference(
  comments?: string | null,
): "nequi" | null {
  const paymentTag = comments?.match(/\[PAGO:\s*([^\]]+)\]/i)?.[1];
  return paymentTag?.toLowerCase().includes("nequi") ? "nequi" : null;
}

export function buildOrderAcceptedMessage(params: {
  customerName: string;
  orderId: string;
  total: number;
  nequiPaymentInfo?: string;
}): string {
  const { customerName, orderId, total, nequiPaymentInfo } = params;
  const lines = [
    `¡Hola ${customerName}! Tu pedido #${orderId.slice(0, 6).toUpperCase()} fue aceptado por Sabor Express.`,
    `Total: $${total.toLocaleString("es-CO")}`,
  ];

  if (nequiPaymentInfo) {
    const instructions = /^https?:\/\//i.test(nequiPaymentInfo)
      ? `Puedes pagar por Nequi usando este enlace al QR: ${nequiPaymentInfo}`
      : `Puedes pagar por Nequi/Bre-B usando la llave: ${nequiPaymentInfo}`;
    lines.push(instructions);
  }

  lines.push("¡Gracias por tu pedido!");
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
  let url = "";
  if (phone && phone.trim() !== "") {
    const normalized = normalizePhone(phone.trim());
    url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  } else {
    // Abrir WhatsApp sin número específico para que el usuario elija destinatario
    url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      // Fallback a wa.me en caso de que whatsapp:// no esté registrado
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
      if (canOpenFallback) {
        await Linking.openURL(fallbackUrl);
        return true;
      }
      Alert.alert("WhatsApp no disponible", "No se pudo abrir WhatsApp en este dispositivo.");
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    // Fallback directo
    try {
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      await Linking.openURL(fallbackUrl);
      return true;
    } catch {
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
      return false;
    }
  }
}
