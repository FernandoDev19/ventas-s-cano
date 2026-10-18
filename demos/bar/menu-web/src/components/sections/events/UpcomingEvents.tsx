import { useState } from "react";
import Button from "../../ui/Button";
import SectionBackground from "../../ui/SectionBackground";
import EventModal, { type BarEvent } from "./EventModal";

const EVENTS: BarEvent[] = [
  {
    day: "07",
    month: "NOV",
    title: "Noche de jazz en vivo",
    time: "8:00 PM",
    description:
      "Un cuarteto local toca clásicos del jazz mientras la barra sirve una carta especial de cócteles de autor. Entrada libre; recomendamos reservar mesa.",
  },
  {
    day: "14",
    month: "NOV",
    title: "Cata de whisky y bourbon",
    time: "7:00 PM",
    description:
      "Probamos cuatro etiquetas guiados por nuestros bartenders, con tapas para acompañar cada una. Cupos limitados.",
  },
  {
    day: "21",
    month: "NOV",
    title: "Noche de vinilos y cócteles",
    time: "9:00 PM",
    description:
      "DJ set con vinilos de funk, soul y salsa clásica. Cócteles de la casa a precio especial toda la noche.",
  },
];

export default function UpcomingEvents() {
  const [selected, setSelected] = useState<BarEvent | null>(null);

  return (
    <section
      id="eventos"
      className="w-full relative isolate px-6 md:px-30 py-16 md:py-24 flex flex-col items-center justify-center gap-4"
    >
      <SectionBackground
        src="https://images.unsplash.com/photo-1575444758702-4a6b9222336e?q=80&w=1470&auto=format&fit=crop"
        brightness={0.3}
        grain={0.8}
      />

      <div className="flex flex-col items-center mb-8 md:mb-12 text-center">
        <p className="uppercase font-extrabold text-gold text-lg">¡Participa!</p>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase">Eventos próximos</h1>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6 md:gap-10">
        {EVENTS.map((event) => (
          <div
            key={event.title}
            className="w-full border-4 md:border-5 border-white flex flex-col md:flex-row md:items-center"
          >
            <div className="flex md:flex-col items-center justify-center gap-2 md:gap-0 py-2 px-6">
              <h2 className="text-4xl font-black text-white uppercase">{event.day}</h2>
              <p className="font-black text-white uppercase">{event.month}</p>
            </div>

            <span className="hidden md:block h-[80%] border-l border-white" />

            <div className="flex-1 px-6 py-2">
              <button
                type="button"
                onClick={() => setSelected(event)}
                className="text-left text-white hover:text-gold transition-colors duration-300 cursor-pointer"
              >
                <h3 className="font-bold text-xl md:text-2xl">{event.title}</h3>
              </button>
            </div>

            <span className="hidden md:block h-[80%] border-l border-white" />

            <div className="px-6 py-3 flex gap-6 items-center justify-between md:justify-start">
              <p className="text-white font-extralight">{event.time}</p>
              <Button color="gold" onClick={() => setSelected(event)}>
                Detalles
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
