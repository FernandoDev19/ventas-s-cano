import Button from "../../ui/Button";
import { whatsappLink } from "../../../config/bar";

export default function Reservations() {
  return (
    <section
      id="reservaciones"
      className="w-full relative isolate py-20 md:py-32 flex items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-fixed bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-charcoal/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-charcoal opacity-90" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <span className="text-gold font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
          Asegura tu lugar
        </span>
        <h2 className="font-playfair text-4xl md:text-7xl text-white font-extrabold mb-6 leading-tight">
          Reserva tu mesa para una experiencia inolvidable
        </h2>
        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          Ya sea para una cena romántica, una celebración especial o una noche de tragos con
          amigos. Contáctanos y nos encargaremos del resto.
        </p>
        <Button
          color="light"
          href={whatsappLink("Hola! Me gustaría realizar una reservación")}
          className="px-10 py-4 hover:scale-105 shadow-[0_0_20px_rgba(201,168,76,0.3)]"
        >
          Reservar por WhatsApp
        </Button>
      </div>
    </section>
  );
}
