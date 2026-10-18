export type ButtonColor = "dark" | "light" | "white" | "gold";

const colors: Record<ButtonColor, string> = {
  dark: "bg-charcoal border-charcoal text-white hover:border-gold hover:bg-transparent hover:text-gold",
  light: "bg-transparent border-gold text-gold hover:bg-gold hover:text-charcoal",
  white: "bg-white border-white text-charcoal hover:bg-charcoal hover:text-white",
  gold: "bg-gold border-gold text-charcoal hover:bg-transparent hover:text-gold",
};

export const buttonClasses = (color: ButtonColor = "light", extra = "") =>
  `inline-flex items-center justify-center border ${colors[color]} px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-gold/20 active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none ${extra}`;
