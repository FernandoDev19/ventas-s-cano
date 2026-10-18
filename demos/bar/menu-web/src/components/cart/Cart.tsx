import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBagIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useCartStore } from "../../store/cart.store";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { formatCOP } from "../../utils/format";
import Button from "../ui/Button";
import QtyControl from "../ui/QtyControl";

function CartBody({ onClose, inline }: { onClose?: () => void; inline?: boolean }) {
  const { items, addItem, removeItem, resetCart, closeCart, openCheckout } =
    useCartStore();

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const count = items.reduce((acc, i) => acc + i.quantity, 0);

  const goToCheckout = () => {
    closeCart();
    openCheckout();
  };

  return (
    <div
      className={`flex flex-col bg-ink text-white border border-gold/40 ${
        inline ? "w-[360px] max-h-[calc(100vh-5rem)]" : "h-full"
      }`}
    >
      <div className="flex items-start justify-between p-5 border-b border-gold/30">
        <div>
          <p className="text-gold text-xs font-bold uppercase tracking-widest">
            {count > 0 ? `${count} ${count === 1 ? "producto" : "productos"}` : "Carrito"}
          </p>
          <h2 className="text-3xl font-extrabold uppercase">Mi pedido</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="p-1 text-white/70 hover:text-gold transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <ShoppingBagIcon className="h-12 w-12 text-gold/60" />
          <p className="font-bold uppercase tracking-wide">Tu pedido está vacío</p>
          <p className="text-sm text-white/60">
            Elige algo de la carta y aparecerá aquí.
          </p>
          {!inline && (
            <Link
              to="/menu"
              onClick={closeCart}
              className="text-gold underline underline-offset-4 text-sm font-bold uppercase tracking-widest"
            >
              Ir a la carta
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-5 min-h-24">
          {items.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="flex gap-3 py-4 border-b border-white/10"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt=""
                  className="h-16 w-16 shrink-0 object-cover border border-white/20"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold uppercase text-sm tracking-wide truncate">
                  {item.name}
                </p>
                <p className="text-xs text-white/50">{formatCOP(item.price)} c/u</p>
                <div className="mt-2">
                  <QtyControl
                    tone="dark"
                    quantity={item.quantity}
                    canAdd={item.quantity < item.stock}
                    onRemove={() => removeItem(item.id, item.type)}
                    onAdd={() =>
                      addItem({
                        type: item.type,
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        stock: item.stock,
                        image_url: item.image_url,
                      })
                    }
                  />
                </div>
              </div>
              <p className="font-playfair font-bold text-sm text-gold whitespace-nowrap">
                {formatCOP(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="p-5 border-t border-gold/30 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-widest text-white/70">Total</span>
            <span className="font-playfair text-2xl font-bold text-gold">
              {formatCOP(total)}
            </span>
          </div>
          <Button color="gold" onClick={goToCheckout} className="w-full">
            Hacer pedido
          </Button>
          <button
            type="button"
            onClick={resetCart}
            className="w-full text-xs uppercase tracking-widest text-white/50 hover:text-gold transition-colors cursor-pointer"
          >
            Vaciar pedido
          </button>
        </div>
      )}
    </div>
  );
}

function CartModal() {
  const closeCart = useCartStore((s) => s.closeCart);
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  return (
    <div
      className="fixed inset-0 z-[20000] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Mi pedido"
    >
      <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={closeCart} />
      <div className="relative h-full w-full max-w-md animate-slide-in">
        <CartBody onClose={closeCart} />
      </div>
    </div>
  );
}

export default function Cart({ inline = false }: { inline?: boolean }) {
  if (inline) return <CartBody inline />;
  return <CartModal />;
}
