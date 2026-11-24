/**
 * Paleta de la app. Los nombres son semánticos: la pantalla pide "card" o "muted"
 * y el tema decide el color real.
 *
 * Los acentos (#ff5722, rojo, verde, ámbar) no cambian entre modos.
 */
export type Scheme = "light" | "dark";

export const palettes = {
  dark: {
    bg: "#0f0f0f", // fondo de pantalla (y campos anidados)
    sheet: "#141414", // modales / hojas inferiores
    card: "#1a1a1a", // tarjetas y campos
    line: "#2a2a2a", // bordes, separadores, botones neutros
    line2: "#333333", // bordes más marcados
    text: "#ffffff", // texto principal
    soft: "#a3a3a3", // texto secundario
    muted: "#737373", // texto atenuado
    faint: "#555555", // placeholders, iconos vacíos
    onAccent: "#ffffff", // texto sobre botones de color

    dangerBg: "#2a0a0a",
    dangerLine: "#5a1a1a",
    warnBg: "#2b1c17",
    warnLine: "#7c2d12",
    dangerText: "#f87171",
    warnText: "#fbbf24",
    okText: "#34d399",
  },
  light: {
    bg: "#f2f2f4",
    sheet: "#ffffff",
    card: "#ffffff",
    line: "#e2e2e6",
    line2: "#d4d4d8",
    text: "#111113",
    soft: "#52525b",
    muted: "#71717a",
    faint: "#a1a1aa",
    onAccent: "#ffffff",

    dangerBg: "#fee2e2",
    dangerLine: "#fca5a5",
    warnBg: "#ffedd5",
    warnLine: "#fdba74",
    dangerText: "#b91c1c",
    warnText: "#b45309",
    okText: "#047857",
  },
} as const;

export type PaletteKey = keyof (typeof palettes)["dark"];

let current: Scheme = "dark";

/** Lo llama el ThemeProvider en cada render, antes de pintar a los hijos. */
export const setCurrentScheme = (s: Scheme) => {
  current = s;
};
export const getCurrentScheme = () => current;

/**
 * `C.card`, `C.text`, ... devuelve el color del tema activo.
 * Se lee en cada render, así que sirve dentro de cualquier estilo en línea.
 */
export const C = new Proxy({} as Record<PaletteKey, string>, {
  get: (_t, key: string) => palettes[current][key as PaletteKey],
});

/**
 * Para objetos a nivel de módulo (StyleSheet.create({...}), constantes con colores).
 * Se recalculan cuando cambia el tema, así no quedan "congelados" con el color viejo.
 */
export const lazy = <T extends object>(factory: () => T): T => {
  let scheme: Scheme | null = null;
  let value: any;
  const get = () => {
    if (scheme !== current) { value = factory(); scheme = current; }
    return value;
  };
  return new Proxy({} as T, {
    get: (_t, k) => get()[k],
    has: (_t, k) => k in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_t, k) => ({ enumerable: true, configurable: true, value: get()[k] }),
  });
};
