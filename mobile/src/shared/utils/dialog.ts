import { Alert, AlertButton, Platform } from "react-native";

/**
 * Reemplazo de Alert.alert que SÍ funciona en web.
 * En web, Alert.alert no hace nada; aquí usamos window.confirm / window.alert.
 * Uso: import { alert } from "@/src/shared/utils/dialog"; alert("Título", "Mensaje", [botones])
 */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  // Sin botones o un solo botón: alert simple
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Dos o más botones: confirm. OK => botón de acción; Cancelar => botón "cancel"
  const cancel = buttons.find((b) => b.style === "cancel");
  const actions = buttons.filter((b) => b.style !== "cancel");
  const main = actions[actions.length - 1] ?? buttons[buttons.length - 1];

  if (window.confirm(`${text}\n\n[Aceptar: ${main.text}]`)) {
    main.onPress?.();
  } else {
    cancel?.onPress?.();
  }
}

/** Confirmación con promesa, útil para "¿Enviar a cocina?" sin tantos toques. */
export function confirm(title: string, message?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      resolve(window.confirm(message ? `${title}\n\n${message}` : title));
      return;
    }
    Alert.alert(title, message, [
      { text: "No", style: "cancel", onPress: () => resolve(false) },
      { text: "Sí", onPress: () => resolve(true) },
    ]);
  });
}