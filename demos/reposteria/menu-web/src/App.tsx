import Cart from "./components/cart/Cart";
import CardContainer from "./components/card-container/CardContainer";
import CartConfirmation from "./components/cart/cart-confirmation/CartConfirmation";
import Header from "./components/Header";
import CheckoutModal from "./components/checkout-modal/CheckoutModal";
import { useMenu } from "./hooks/useMenu";

export default function App() {
  const {
    isOpenNow,
    tableId,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    loading,
    filteredItems,
    totalItems,
    isCartOpen,
    isConfirmationOpen,
    isCheckoutOpen,
    openCart,
    totalPrice,
    fetchMenu,
  } = useMenu();

  return (
    <main className="min-h-screen bg-background text-charcoal max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
      <Header />

      <div className="bg-[#181818] border border-gold/30 rounded-b-xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
              isOpenNow
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {isOpenNow ? "● Abierto" : "○ Cerrado"}
          </span>

          {tableId !== "caja" && (
            <span className="bg-gold text-charcoal font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px]">
              Mesa # {tableId}
            </span>
          )}

          <span className="text-gold font-medium">
            3:00 p. m. - 12:00 a. m.
          </span>
        </div>

        <div className="text-gold sm:text-right font-medium flex items-center gap-1">
          📍{" "}
          <a
            href="https://maps.app.goo.gl/UeqV9Yaj9bW9UkZSA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-crimson transition-colors"
          >
            Calle 69 # 18-16, Soledad
          </a>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-4 relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gold">
          🔍
        </span>
        <input
          type="text"
          placeholder="Buscar pollo asado, picadas, chorizo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-10 rounded-xl border border-gold/30 focus:border-gold focus:outline-none bg-[#181818] text-sm shadow-xs transition-all text-white placeholder:text-muted"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white hover:text-charcoal text-xs cursor-pointer"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Barra de Categorías */}
      <nav className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-gold/15 scrollbar-none">
        <button
          onClick={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-gold text-charcoal font-bold"
              : "bg-[#181818] text-muted border border-gold/15 hover:bg-gold/15"
          }`}
        >
          Todo el menú
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-gold text-charcoal font-bold"
                : "bg-[#181818] text-muted border border-gold/15 hover:bg-gold/15"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Grid Responsivo */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
          {loading ? (
            <p className="text-center py-12 font-medium text-muted animate-pulse">
              Buscando la sazón...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <span className="text-3xl block mb-2">🍽️</span>
              <p className="font-medium">
                No encontramos nada que coincida con "{searchQuery}"
              </p>
              <p className="text-xs text-muted/70 mt-1">
                Intenta con otra palabra clave o limpia el buscador.
              </p>
            </div>
          ) : (
            <CardContainer items={filteredItems} />
          )}
        </div>

        <div className="hidden lg:block shrink-0 sticky top-26">
          <Cart />
        </div>
      </div>

      {/* BOTÓN FLOTANTE */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-4 left-0 right-0 px-4 z-40">
          <button
            onClick={openCart}
            className="w-full bg-crimson-dark text-cream flex items-center justify-between p-4 rounded-xl shadow-xl border border-crimson/30 active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {totalItems}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Ver mi pedido
              </span>
            </div>
            <span className="font-playfair font-bold text-sm">
              ${totalPrice.toLocaleString("es-CO")}
            </span>
          </button>
        </div>
      )}

      {isCartOpen && <Cart />}
      {isConfirmationOpen && <CartConfirmation onNewOrder={fetchMenu} />}
      {isCheckoutOpen && <CheckoutModal tableId={tableId} />}

      <a href="https://api.whatsapp.com/send/?phone=573013878360&text=Hola%21+Me+gustar%C3%ADa+realizar+un+pedido&type=phone_number&app_absent=0">
        <button className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-green-500 text-white p-4 rounded-full shadow-xl border border-green-500/30 active:scale-98 transition-transform cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            fill="#fff"
            viewBox="0 0 24 24"
            aria-label="Realiza tu pedido por WhatsApp"
          >
            <path d="M8.016 12.271A4.818 4.818 0 0 1 7 9.709a2.777 2.777 0 0 1 .867-2.066.91.91 0 0 1 .661-.31c.165 0 .33 0 .475.009.145.009.356-.058.557.425.201.483.7 1.715.764 1.839a.451.451 0 0 1 .02.433c-.062.15-.145.289-.247.414-.124.144-.261.323-.372.433-.111.11-.253.258-.109.506.374.637.84 1.215 1.384 1.715a6.777 6.777 0 0 0 1.992 1.229c.248.124.393.1.537-.062.144-.162.619-.723.784-.971.165-.248.331-.206.558-.124.227.082 1.445.682 1.692.806.247.124.413.186.475.289.068.398.018.808-.144 1.178a2.552 2.552 0 0 1-1.672 1.177 3.388 3.388 0 0 1-1.561-.1c-.48-.149-.95-.323-1.412-.521a11.043 11.043 0 0 1-4.233-3.737ZM2.045 22l1.406-5.136a9.914 9.914 0 1 1 8.591 4.964A9.918 9.918 0 0 1 7.3 20.622L2.045 22ZM3.8 11.91a8.217 8.217 0 0 0 1.259 4.384l.2.312-.832 3.04 3.119-.818.3.178A8.24 8.24 0 1 0 3.8 11.91Z"></path>
          </svg>
        </button>
      </a>
    </main>
  );
}
