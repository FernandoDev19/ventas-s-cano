import { Link } from "react-router-dom";
import { useMenu } from "../../../hooks/useMenu";
import CardContainer from "../../card-container/CardContainer";
import { buttonClasses } from "../../ui/buttonClasses";

const PREVIEW_COUNT = 6;

export default function MenuPreview() {
  const { loading, filteredItems } = useMenu();

  return (
    <section id="menu" className="w-full px-6 md:px-30 py-16 md:py-20">
      <div className="text-center mb-10">
        <p className="uppercase text-charcoal font-bold tracking-widest text-sm">
          Explora nuestra selección
        </p>
        <h2 className="text-5xl md:text-6xl uppercase text-gold font-extrabold leading-none">
          Menú destacado
        </h2>
      </div>

      {loading ? (
        <p className="text-center py-12 font-medium text-muted animate-pulse text-lg uppercase tracking-widest">
          Preparando el menú...
        </p>
      ) : (
        <>
          <CardContainer items={filteredItems.slice(0, PREVIEW_COUNT)} />
          <div className="flex justify-center mt-10">
            <Link to="/menu" className={buttonClasses("dark")}>
              Ver menú completo
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
