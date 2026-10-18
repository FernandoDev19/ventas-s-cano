import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { whatsappLink } from "../../../config/bar";
import Button from "../../ui/Button";

export type BarEvent = {
  day: string;
  month: string;
  title: string;
  time: string;
  description: string;
};

export default function EventModal({ event, onClose }: { event: BarEvent; onClose: () => void }) {
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={event.title}>
      <div className="absolute inset-0 bg-black/80 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-ink text-white border border-gold/40 animate-rise">
        <div className="flex items-start justify-between p-5 border-b border-gold/30">
          <div>
            <p className="text-gold text-xs font-bold uppercase tracking-widest">
              {event.day} {event.month} · {event.time}
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1 text-white/70 hover:text-gold transition-colors cursor-pointer">
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          <p className="text-white/80 leading-relaxed">{event.description}</p>
          <Button
            color="gold"
            href={whatsappLink(`Hola! Quiero reservar para el evento "${event.title}" del ${event.day} de ${event.month}`)}
            className="w-full"
          >
            Reservar para este evento
          </Button>
        </div>
      </div>
    </div>
  );
}
