import { Link } from "react-router-dom";
import { buttonClasses } from "../components/ui/buttonClasses";

export default function NotFoundPage() {
  return (
    <section className="w-full px-6 py-24 md:py-32 flex flex-col items-center text-center gap-6">
      <p className="text-gold font-bold tracking-[0.3em] uppercase text-sm">Error 404</p>
      <h1 className="text-5xl md:text-7xl font-extrabold uppercase text-charcoal">
        Esta página no existe
      </h1>
      <p className="max-w-md text-charcoal/70">
        Puede que el enlace esté mal escrito o que la página se haya movido. Vuelve al inicio o
        mira la carta.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className={buttonClasses("dark")}>
          Ir al inicio
        </Link>
        <Link to="/menu" className={buttonClasses("light")}>
          Ver el menú
        </Link>
      </div>
    </section>
  );
}
