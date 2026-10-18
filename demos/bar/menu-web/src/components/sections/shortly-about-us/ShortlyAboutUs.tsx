import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import { SCHEDULE } from "../../../config/bar";

const fade =
  "linear-gradient(to right, transparent, black 10%, black 90%, transparent), linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)";

export default function ShortlyAboutUs() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-6 md:px-30 py-16 md:py-20 flex justify-center items-center">
      <div className="flex flex-col md:flex-row gap-10 md:gap-4 w-full justify-between">
        <div className="md:w-1/3">
          <p className="uppercase text-sm mb-4 font-bold">Un poco sobre nosotros</p>
          <h1 className="uppercase text-5xl text-gold font-extrabold mb-8 md:mb-12">Bienvenido</h1>
          <div className="space-y-4">
            <p className="font-bold text-2xl md:text-3xl">
              Nuestra carta de cócteles está inspirada en recetas clásicas y contemporáneas.
            </p>
            <p>
              Situado en Barranquilla e inspirado en el carácter de cada manzana de la ciudad, el
              bar encarna la energía de Barranquilla junto con el ambiente relajado de una sala de
              estar. Su diseño refleja un enfoque distendido hacia la buena comida y la bebida.
            </p>
            <Button color="dark" onClick={() => navigate("/about-us")}>
              Saber más
            </Button>
          </div>
        </div>

        <div className="hidden md:block md:w-1/3">
          <img
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=900&auto=format&fit=crop"
            alt="Cóctel clásico"
            className="w-full h-full object-cover"
            style={{
              WebkitMaskImage: fade,
              WebkitMaskComposite: "source-in",
              maskImage: fade,
              maskComposite: "intersect",
            }}
          />
        </div>

        <div className="md:w-1/3">
          <div className="w-full flex flex-col h-max">
            <img
              src="https://images.unsplash.com/photo-1597290282695-edc43d0e7129?q=80&w=875&auto=format&fit=crop"
              alt="Barra del bar"
              className="w-full h-56 md:h-auto object-cover"
            />
            <div className="bg-gold p-6">
              <div className="border-6 border-white p-4 flex flex-col gap-4 items-center">
                <h2 className="uppercase text-4xl font-extrabold text-white">Horario</h2>
                {SCHEDULE.map((s) => (
                  <div key={s.label} className="w-full flex flex-col gap-1 border-t border-white pt-4">
                    <p className="font-extralight text-sm text-white uppercase">{s.label}:</p>
                    <p className="font-extralight text-sm text-white uppercase">{s.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
