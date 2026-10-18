import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import CardContainer from "../components/card-container/CardContainer";
import Cart from "../components/cart/Cart";
import { useMenu } from "../hooks/useMenu";

export default function Menu() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    loading,
    filteredItems,
  } = useMenu();

  const tabs = [{ id: "all", name: "Todo" }, ...categories];

  return (
    <section className="w-full min-h-max px-6 md:px-30 py-10 md:py-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 xl:gap-16 mb-10">
        <div>
          <p className="uppercase text-charcoal font-bold tracking-widest text-sm">
            Explora nuestra selección
          </p>
          <h1 className="text-6xl md:text-7xl uppercase text-gold font-extrabold leading-none">Menú</h1>
        </div>

        <ul className="flex flex-nowrap overflow-x-auto max-w-full pb-1" role="tablist">
          {tabs.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <li key={cat.id} className="relative flex flex-col items-center shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery("");
                  }}
                  className={`uppercase px-4 py-3 font-extrabold text-lg md:text-xl transition-all duration-300 whitespace-nowrap cursor-pointer ${
                    active ? "bg-gold text-white" : "text-charcoal hover:bg-gold hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
                {active && <span className="text-gold text-xs leading-none select-none">▼</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mb-8 relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gold">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </span>
        <input
          type="text"
          aria-label="Buscar en el menú"
          placeholder="Buscar en el menú..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-12 border-4 border-gold focus:outline-none bg-transparent text-sm transition-all text-charcoal placeholder:text-muted rounded-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-charcoal hover:text-gold text-xs cursor-pointer transition-colors"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
          {loading ? (
            <p className="text-center py-12 font-medium text-muted animate-pulse text-lg uppercase tracking-widest">
              Preparando el menú...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <span className="text-4xl block mb-3">🍸</span>
              <p className="font-extrabold uppercase text-xl text-charcoal">Nada por aquí</p>
              <p className="text-sm text-muted/70 mt-1">
                Intenta con otra palabra clave o limpia el buscador.
              </p>
            </div>
          ) : (
            <CardContainer items={filteredItems} />
          )}
        </div>

        <div className="hidden lg:block shrink-0 sticky top-6">
          <Cart inline />
        </div>
      </div>
    </section>
  );
}
