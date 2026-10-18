import { BAR } from "../../../config/bar";
import { FacebookIcon, InstagramIcon } from "../../ui/icons";

const TEAM = ["Juan Garzón", "Santiago Cano", "Luis Eduardo"];

const socialClasses =
  "h-11 w-11 flex items-center justify-center bg-white text-charcoal hover:bg-gold transition-all duration-300 hover:scale-105";

export default function MeetTheTeam() {
  return (
    <section className="px-6 md:px-30 py-16 md:py-24 flex flex-col gap-12">
      <div className="text-center">
        <p className="uppercase text-charcoal text-lg font-bold">Conoce a nuestro equipo</p>
        <h1 className="text-gold uppercase font-extrabold text-5xl md:text-7xl">Bartenders</h1>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {TEAM.map((name) => (
          <div key={name} className="flex flex-col w-full max-w-[320px]">
            <div className="relative block w-full group">
              <div className="z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex gap-4 absolute inset-0 bg-gold/40 items-center justify-center transition-opacity duration-500">
                <a href={BAR.facebook} target="_blank" rel="noopener noreferrer" aria-label={`Facebook de ${name}`} className={socialClasses}>
                  <FacebookIcon className="h-6 w-6" />
                </a>
                <a href={BAR.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram de ${name}`} className={socialClasses}>
                  <InstagramIcon className="h-6 w-6" />
                </a>
              </div>
              <img
                src={`https://placehold.co/740x856/181818/C9A84C?text=${encodeURIComponent(name)}`}
                alt={`Bartender ${name}`}
                className="w-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center mt-6">
              <p className="text-2xl font-bold text-charcoal">{name}</p>
              <p className="text-charcoal/80">Bartender</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
