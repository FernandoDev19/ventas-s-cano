import CartButton from "./CartButton";
import CartItem from "./CartItem";
import CartTotal from "./CartTotal";
import { useCartStore } from "../../store/cart.store";

export default function Cart() {
  const { closeCart, openCheckout } = useCartStore();
  const items = useCartStore((state) => state.items);

  const handleConfirm = () => {
    closeCart();
    openCheckout();
  };

  return (
    <div className="lg:w-[400px] bg-white p-6 rounded-xl h-max md:sticky md:top-4 border border-gold/15 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <h2 className="font-playfair text-xl font-bold mb-6 text-charcoal border-b border-gold/15 pb-3">
        Tu Pedido <span className="text-crimson">({items.length})</span>
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
}
