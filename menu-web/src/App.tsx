import { useEffect, useState, useRef } from "react"; // 1. Importamos useRef
import { MenuService, type MenuExtendedItem } from "./services/menu.service";
import Cart from "./components/cart/Cart";
import CardContainer from "./components/card-container/CardContainer";
import CartConfirmation from "./components/cart/cart-confirmation/CartConfirmation";
import Header from "./components/Header";
import { useCartStore } from "./store/cart.store";
import CheckoutModal from "./components/checkout-modal/CheckoutModal";

export default function App() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuItems, setMenuItems] = useState<MenuExtendedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para el buscador
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Estado para saber si el local está abierto internamente
  const [isOpenNow, setIsOpenNow] = useState(true);

  // 2. Extraemos de Zustand de forma reactiva y consistente
  const {
    isCartOpen,
    closeCart,
    openCart,
    isConfirmationOpen,
    items,
    isCheckoutOpen,
  } = useCartStore();

  // 3. Referencia para controlar el elemento HTML dialog
  const dialogRef = useRef<HTMLDialogElement>(null);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      // Abierto desde las 15:00 (3 PM) hasta las 23:59 (Cierra a las 12 AM)
      setIsOpenNow(hour >= 15 && hour < 24);
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Revisa cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    MenuService.getCategories().then((res) => {
      setCategories(res);
    });
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);

    const fetchMenu =
      selectedCategory === "all"
        ? MenuService.getMenu()
        : MenuService.getMenuByCategory(selectedCategory);

    fetchMenu
      .then((items) => {
        setMenuItems(items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  // 4. Efecto para abrir/cerrar el dialog usando los métodos nativos del navegador
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isCartOpen) {
      dialog.showModal();
      // Opcional: Bloquea el scroll del body de fondo mientras el carrito esté abierto
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }
  }, [isCartOpen]);

  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const distance = endY - startY.current;

    if (distance > 100) {
      closeCart();
    }
  };

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <main className="min-h-screen bg-cream/20 text-charcoal max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
      <Header />

      <div className="bg-white border border-gold/15 rounded-xl p-3 mb-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
              isOpenNow
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {isOpenNow ? "● Abierto" : "○ Cerrado"}
          </span>
          <span className="text-muted font-medium">
            3:00 p. m. - 12:00 a. m.
          </span>
        </div>
        <div className="text-muted sm:text-right font-medium flex items-center gap-1">
          📍{" "}
          <span className="hover:text-crimson transition-colors">
            Calle 69 # 18-16, Soledad
          </span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-4 relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
          🔍
        </span>
        <input
          type="text"
          placeholder="¿Qué te provoca hoy? Buscar plato..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 pl-10 rounded-xl border border-gold/20 focus:border-gold focus:outline-none bg-white text-sm shadow-xs transition-all placeholder:text-muted/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-charcoal text-xs cursor-pointer"
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
              : "bg-white text-muted border border-gold/15 hover:bg-cream"
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
                : "bg-white text-muted border border-gold/15 hover:bg-cream"
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

        <div className="hidden lg:block shrink-0">
          <Cart />
        </div>
      </div>

      {/* BOTÓN FLOTANTE */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-4 left-0 right-0 px-4 z-40">
          <button
            onClick={openCart} // Usa la función reactiva extraída arriba
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

      {/* MODAL DEL CARRITO EN MÓVIL (Corregido con ref y clases de Backdrop nativas) */}
      {isCartOpen && (
        <dialog
          ref={dialogRef}
          onClose={closeCart}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="lg:hidden fixed bottom-0 left-0 w-full h-screen bg-black/60 flex items-end z-50 backdrop-blur-xs open:flex backdrop:bg-transparent border-0 p-0 m-0 max-w-full max-h-full"
        >
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto flex flex-col relative animate-in slide-in-from-bottom duration-200">
            {/* Barra superior decorativa para cerrar */}
            <div
              className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4 cursor-pointer"
              onClick={closeCart}
            />
            <Cart />
          </div>
        </dialog>
      )}

      {isConfirmationOpen && <CartConfirmation />}
      {isCheckoutOpen && <CheckoutModal />}
    </main>
  );
}
