import { BAR, SCHEDULE } from "../../config/bar";
import { FacebookIcon, InstagramIcon } from "../../components/ui/icons";

const linkClasses = "text-charcoal/80 font-extralight hover:text-gold transition-colors";

export default function Footer() {
  return (
    <footer id="footer" className="px-6 md:px-30 py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 text-center">
        <div className="flex flex-col gap-4 items-center">
          <h2 className="uppercase text-3xl text-gold font-extrabold">Contacto</h2>
          <div className="flex flex-col">
            <a href={`mailto:${BAR.email}`} className={`${linkClasses} underline`}>
              {BAR.email}
            </a>
            <a href={`tel:+${BAR.phoneRaw}`} className={linkClasses}>
              {BAR.phone}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <h2 className="uppercase text-3xl text-gold font-extrabold">Horario</h2>
          <div className="flex flex-col">
            {SCHEDULE.map((s) => (
              <p key={s.label} className="text-charcoal/80 font-extralight">
                {s.label}: {s.hours}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <h2 className="uppercase text-3xl text-gold font-extrabold">Ubicación</h2>
          <a href={BAR.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${linkClasses} flex flex-col`}>
            <span>{BAR.address}</span>
            <span>{BAR.city}</span>
          </a>
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <img src="/logo-l-black.svg" alt={`Logo ${BAR.name}`} className="h-16 w-auto" />
      </div>

      <div className="flex justify-center gap-6 mb-10">
        {[
          { label: "Instagram", href: BAR.instagram, Icon: InstagramIcon },
          { label: "Facebook", href: BAR.facebook, Icon: FacebookIcon },
        ].map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="h-11 w-11 flex items-center justify-center bg-gold text-charcoal hover:scale-110 transition-transform duration-300"
          >
            <Icon className="h-6 w-6" />
          </a>
        ))}
      </div>

      <p className="text-charcoal text-center font-extralight">
        FernandoDev19 © {new Date().getFullYear()} Todos los derechos reservados.
      </p>
    </footer>
  );
}
