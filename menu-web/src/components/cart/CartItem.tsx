import { useCartStore } from "../../store/cart.store";

interface Props {
  item: {
    id: string | number;
    type: "product" | "recipe";
    name: string;
    price: number;
    quantity: number;
  };
}

export default function CartItem({ item }: Props) {
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="w-full border-b border-gold/10 py-3.5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-charcoal text-sm truncate">{item.name}</h4>
        <div className="flex gap-2 items-center mt-1">
          <span className="text-crimson font-bold text-xs bg-crimson/10 px-2 py-0.5 rounded-full">
            {item.quantity}x
          </span>
          <span className="text-muted text-xs">
            @ ${item.price.toLocaleString("es-CO")}
          </span>
          <strong className="text-charcoal font-medium text-xs ml-auto">
            ${(item.price * item.quantity).toLocaleString("es-CO")}
          </strong>
        </div>
      </div>
      
      <button
        onClick={() => removeItem(item.id, item.type)}
        type="button"
        className="text-muted hover:text-crimson p-1.5 rounded-full cursor-pointer transition-colors border border-transparent hover:border-crimson/20"
        title="Eliminar artículo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}