interface Props {
  item: {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
  };
}

export default function CartConfirmationItem({ item }: Props) {
  return (
    <div className="w-full border-b border-gold/5 py-2.5 flex items-center justify-between gap-3">
      <div className="flex gap-3 items-center min-w-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F0E8D8] shrink-0 border border-gold/10">
          {item.image_url ? (
            <img
              className="w-full h-full object-cover"
              src={item.image_url}
              alt={item.name}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              🍽️
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-charcoal text-xs truncate">{item.name}</h3>
          <div className="flex gap-2 items-center mt-0.5">
            <span className="text-crimson font-bold text-xs">
              {item.quantity}x
            </span>
            <span className="text-muted text-[11px]">
              @ ${item.price.toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      </div>
      <strong className="text-charcoal text-xs font-semibold shrink-0">
        ${(item.price * item.quantity).toLocaleString("es-CO")}
      </strong>
    </div>
  );
}