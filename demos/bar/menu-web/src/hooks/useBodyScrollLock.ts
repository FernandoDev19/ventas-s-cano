import { useEffect } from "react";

// Contador compartido: varios modales pueden bloquear el scroll a la vez y
// solo se restaura cuando el último se cierra (evita quedar "trabado").
let locks = 0;
let previousOverflow = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (locks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    locks += 1;

    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
