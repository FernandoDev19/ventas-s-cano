import { useCartStore } from "../../../store/cart.store";

interface Props {
  item: {
    id: string | number;
    name: string;
    description?: string;
    price?: number;
    selling_price?: number; // Por si viene de la tabla recipes
    stock: number;
    image_url?: string;
    is_recipe?: boolean;
  };
}

export default function ProductCard({ item }: Props) {
  const itemsInCart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  // Unificamos el precio dependiendo de qué tipo de fila sea
  const finalPrice = item.is_recipe ? (item.price || 0) : (item.price || 0);
  const itemType = item.is_recipe ? "recipe" : "product";

  // Buscamos si este elemento específico ya está en nuestro estado de Zustand
  const cartItem = itemsInCart.find((i) => i.id === item.id && i.type === itemType);
  const quantity = cartItem?.quantity || 0;

  const isAvailable = item.stock > 0;

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: item.id,
      type: itemType,
      name: item.name,
      price: finalPrice,
      stock: item.stock,
      image_url: item.image_url,
    });
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(item.id, itemType);
  };

  return (
    <article 
      className={`bg-white rounded-xl overflow-hidden border border-gold/15 flex flex-col transition-all duration-200 shadow-sm relative group ${
        isAvailable ? "hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(139,26,26,0.1),0_2px_8px_rgba(0,0,0,0.06)]" : "opacity-65 grayscale-80 pointer-events-none"
      }`}
    >
      {/* WRAPPER DE IMAGEN */}
      <div className="relative overflow-hidden h-40 bg-[#F0E8D8]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-104"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F0E8D8] to-[#E8D8C0] text-3xl">
            🍽️
          </div>
        )}

        {/* BADGE DE STOCK */}
        <span 
          className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
            isAvailable ? "bg-emerald-800/85 text-emerald-200" : "bg-red-900/80 text-red-200"
          }`}
        >
          {isAvailable ? "Disponible" : "Agotado"}
        </span>

        {/* MARCA EN CASO DE AGOTADO */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-extrabold text-sm tracking-widest">
            AGOTADO
          </div>
        )}
      </div>

      {/* CUERPO DE LA TARJETA */}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3 className="font-playfair font-bold text-charcoal text-base leading-snug">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-muted text-xs psychology-desc line-clamp-3 leading-relaxed flex-1">
            {item.description}
          </p>
        )}

        {/* PIE DE TARJETA E INTERACCIÓN DEL CARRITO */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold/15">
          <div>
            <span className="text-[10px] text-muted block tracking-wider uppercase">Precio</span>
            <span className="font-playfair font-bold text-crimson text-lg">
              ${finalPrice.toLocaleString("es-CO")}
            </span>
          </div>

          {/* CONTROLADORES DEL CARRITO */}
          {isAvailable && (
            <div className="flex items-center">
              {quantity === 0 ? (
                <button
                  onClick={handleIncrement}
                  className="bg-white hover:bg-cream border border-gold/40 text-charcoal text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>+</span> Añadir
                </button>
              ) : (
                <div className="bg-crimson text-white rounded-full flex items-center shadow-sm overflow-hidden border border-crimson-dark">
                  <button
                    onClick={handleDecrement}
                    className="px-2.5 py-1 hover:bg-crimson-dark transition-colors font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-bold min-w-[16px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= item.stock}
                    className="px-2.5 py-1 hover:bg-crimson-dark transition-colors font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EFECTO CARD ACCENT DEL INDEX.HTML */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-crimson to-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </article>
  );
}