import { useCartStore } from "../../store/cart.store";

export default function CartTotal() {
  const items = useCartStore((state) => state.items);
  const total = items.reduce((acc, item) => acc + item.price * (item.quantity || 0), 0);

  return (
    <div className="flex items-center justify-between my-5 pt-4 border-t border-gold/20 px-1 text-charcoal">
      <p className="font-medium text-sm tracking-wide uppercase text-muted">Total del Pedido</p>
      <p className="font-playfair text-2xl font-bold text-crimson">
        ${total.toLocaleString("es-CO")}
      </p>
    </div>
  );
}