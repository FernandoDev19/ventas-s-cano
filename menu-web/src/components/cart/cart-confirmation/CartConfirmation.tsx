import CartButton from "../CartButton";
import CartTotal from "../CartTotal";
import CartConfirmationItem from "./CartConfirmationItem";
import { useCartStore } from "../../../store/cart.store";

type Props = {
  onNewOrder: () => void;
}

export default function CartConfirmation({ onNewOrder }: Props) {
  const { isConfirmationOpen, closeConfirmation, resetCart } = useCartStore();
  const items = useCartStore((state) => state.items);

  const handleClose = () => {
    closeConfirmation();
    resetCart();
    onNewOrder();
  };

  return (
    <dialog 
      {...(isConfirmationOpen ? { open: true } : { hidden: true })} 
      className="fixed top-0 left-0 w-full h-screen bg-black/60 flex items-end md:items-center justify-center z-50 backdrop-blur-xs transition-all"
    >
      <div className="bg-white p-6 md:p-8 rounded-t-2xl md:rounded-2xl h-max w-full max-w-[450px] shadow-2xl border border-gold/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center md:text-left">
          <div className="text-4xl mb-3 inline-block bg-emerald-100 text-emerald-800 p-3 rounded-full">
            ✓
          </div>
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-charcoal mt-2">
            ¡Pedido Confirmado!
          </h2>
          <p className="text-xs text-muted mt-1 mb-6">
            Ya estamos listos en la cocina. ¡Que lo disfrutes!
          </p>
        </div>

        <div className="bg-cream/40 rounded-xl p-3 border border-gold/10 mb-6">
          <div className="max-h-[260px] overflow-y-auto pr-1 flex flex-col gap-1">
            {items.map((item) => (
              <CartConfirmationItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
          <CartTotal />
        </div>

        <CartButton text="Iniciar Nuevo Pedido" onClick={handleClose} />
      </div>
    </dialog>
  );
}