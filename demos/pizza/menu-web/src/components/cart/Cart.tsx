import CartButton from "./CartButton";
import CartItem from "./CartItem";
import CartTotal from "./CartTotal";
import { useCartStore } from "../../store/cart.store";
import { useEffect, useRef } from "react";

export default function Cart() {
  const { closeCart, openCheckout, isCartOpen } = useCartStore();
  const items = useCartStore((state) => state.items);
  const dialogRef = useRef<HTMLDialogElement>(null);

 useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isCartOpen) {
      dialog.showModal(); 
      document.body.style.overflow = "hidden";
    } else {
      dialog.close();
      document.body.style.overflow = "";
    }

    const handleNativeClose = () => {
      document.body.style.overflow = "";
      if (isCartOpen) {
        closeCart();
      }
    };

    dialog.addEventListener("close", handleNativeClose);
    dialog.addEventListener("cancel", handleNativeClose);
    return () => {
      dialog.removeEventListener("close", handleNativeClose);
      dialog.removeEventListener("cancel", handleNativeClose);
    };
  }, [isCartOpen, closeCart]);

  const handleConfirm = () => {
    closeCart();
    openCheckout();
  };

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

  const CartContent = (
    <div className="lg:w-[400px] bg-[#181818] p-6 rounded-xl h-max md:sticky md:top-4 border border-gold/15 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
      <h2 className="font-playfair text-xl font-bold mb-6 text-gold border-b border-gold/15 pb-3">
        Tu Pedido <span className="text-gold">({items.length})</span>
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="text-5xl animate-bounce">🛒</div>
          <p className="text-muted text-center text-sm font-medium">
            ¿Ajá, y qué vas a pedir? <br />
            Tu carrito está vacío.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[calc(100vh-24rem)] overflow-y-auto pr-1 flex flex-col gap-1">
            {items.map((item) => (
              <CartItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>

          <CartTotal />

          <div className="mt-4">
            <CartButton text="Confirmar Pedido" onClick={handleConfirm} />
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {CartContent}
      
      {/* 3. EN MÓVIL: Envolvemos el mismo contenido dentro del modal nativo deslizante */}
      <dialog
        ref={dialogRef}
        onClose={closeCart}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="lg:hidden fixed bottom-0 left-0 w-full h-screen bg-black/60 flex items-end z-50 backdrop-blur-xs open:flex backdrop:bg-transparent border-0 p-0 m-0 max-w-full max-h-full"
      >
        <div className="bg-background w-full rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto flex flex-col relative animate-in slide-in-from-bottom duration-200">
          <div
            className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4 cursor-pointer"
            onClick={closeCart}
          />
          {CartContent}
        </div>
      </dialog>
    </>
  );
}
