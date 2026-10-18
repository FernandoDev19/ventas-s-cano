import type { MenuExtendedItem } from "../../types/menu.type";
import ProductCard from "./product-card/ProductCard";

export default function CardContainer({ items }: { items: MenuExtendedItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <ProductCard
          key={`${item.is_recipe ? "recipe" : "product"}-${item.id}`}
          item={item}
        />
      ))}
    </div>
  );
}
