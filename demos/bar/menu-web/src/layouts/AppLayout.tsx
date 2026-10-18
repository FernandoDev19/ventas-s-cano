import { useState, useEffect } from "react";
import { Outlet, matchPath, useLocation } from "react-router-dom";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import { SidebarWithBurgerMenu } from "./header/sidebar/Sidebar";
import { useOpenStatus } from "../hooks/useOpenStatus";
import { useCartStore } from "../store/cart.store";
import { formatCOP } from "../utils/format";
import Cart from "../components/cart/Cart";
import CartConfirmation from "../components/cart/cart-confirmation/CartConfirmation";
import CheckoutModal from "../components/checkout-modal/CheckoutModal";

export default function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isOpenNow = useOpenStatus();
  const { pathname, hash } = useLocation();
  const {
    items,
    tableId,
    setTableId,
    isCartOpen,
    isConfirmationOpen,
    isCheckoutOpen,
    openCart,
    closeConfirmation,
  } = useCartStore();

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // Recordar la mesa (QR) aunque la persona navegue a otras páginas
  useEffect(() => {
    const match = matchPath("/mesa/:tableId", pathname);
    const id = match?.params.tableId;
    if (id && /^[A-Za-z0-9-]{1,10}$/.test(id)) setTableId(id);
  }, [pathname, setTableId]);

  // Scroll al ancla o al inicio al cambiar de página
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const timer = setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    return () => clearTimeout(timer);
  }, [hash, pathname]);

  const showHero = pathname === "/" || pathname.startsWith("/mesa/");
  const anyModalOpen = isCartOpen || isCheckoutOpen || isConfirmationOpen;

  return (
    <>
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        isDrawerOpen={isDrawerOpen}
        showHero={showHero}
        isOpenNow={isOpenNow}
        tableId={tableId}
      />
      <SidebarWithBurgerMenu
        isDrawerOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <Outlet />
      <Footer />

      {/* Botón flotante del carrito (global) */}
      {totalItems > 0 && !anyModalOpen && (
        <div
          className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-24 md:w-80 z-40 ${
            pathname === "/menu" ? "lg:hidden" : ""
          }`}
        >
          <button
            type="button"
            onClick={openCart}
            className="w-full bg-ink text-white flex items-center justify-between p-4 shadow-xl border border-gold/60 hover:border-gold active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="bg-gold text-charcoal px-2.5 py-0.5 rounded-full text-xs font-black">
                {totalItems}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">Ver mi pedido</span>
            </div>
            <span className="font-playfair font-bold text-sm text-gold">
              {formatCOP(totalPrice)}
            </span>
          </button>
        </div>
      )}

      {isCartOpen && <Cart />}
      {isCheckoutOpen && <CheckoutModal tableId={tableId} />}
      {isConfirmationOpen && <CartConfirmation onNewOrder={closeConfirmation} />}
    </>
  );
}
