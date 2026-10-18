import { useState } from "react";
import { useCartStore, type CartItem } from "../../../store/cart.store";
import type { MenuExtendedItem } from "../../../types/menu.type";
import { formatCOP } from "../../../utils/format";
import Button from "../../ui/Button";
import QtyControl from "../../ui/QtyControl";

export default function ProductCard({ item }: { item: MenuExtendedItem }) {
  const { items, addItem, removeItem } = useCartStore();
  const [imgFailed, setImgFailed] = useState(false);

  const type: CartItem["type"] = item.is_recipe ? "recipe" : "product";
  const quantity =
    items.find((i) => i.id === item.id && i.type === type)?.quantity ?? 0;

  const soldOut = item.stock <= 0;
  const lowStock = !item.is_recipe && item.stock > 0 && item.stock <= 5;

  const add = () =>
    addItem({
      type,
      id: item.id,
      name: item.name,
      price: item.price,
      stock: item.stock,
      image_url: item.image_url,
    });

  return (
    <article className="group flex flex-col bg-white shadow-md border-b-4 border-gold overflow-hidden">
      <div className="relative h-52 overflow-hidden bg-charcoal">
        {item.image_url && !imgFailed ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl">🍸</div>
        )}
        {(lowStock || soldOut) && (
          <span className="absolute top-3 left-3 bg-charcoal text-gold text-[11px] font-bold uppercase tracking-wider px-2.5 py-1">
            {soldOut ? "Agotado" : `Quedan ${item.stock}`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-charcoal leading-tight">{item.name}</h3>
          <p className="font-playfair font-bold text-gold whitespace-nowrap">
            {formatCOP(item.price)}
          </p>
        </div>

        {item.description && (
          <p className="text-sm text-text-main/70 leading-relaxed">{item.description}</p>
        )}

        <div className="mt-auto pt-4">
          {quantity === 0 ? (
            <Button color="dark" onClick={add} disabled={soldOut} className="w-full py-2.5">
              {soldOut ? "Agotado" : "Agregar"}
            </Button>
          ) : (
            <div className="flex items-center justify-between">
              <QtyControl
                quantity={quantity}
                onAdd={add}
                onRemove={() => removeItem(item.id, type)}
                canAdd={quantity < item.stock}
              />
              <p className="text-sm font-bold text-charcoal">{formatCOP(item.price * quantity)}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
