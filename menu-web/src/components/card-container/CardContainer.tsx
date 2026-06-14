import ProductCard from "./product-card/ProductCard";
import type { ProductType } from "../../types/product.type";

interface Props {
  items: (ProductType & {
    is_recipe?: boolean;
    selling_price?: number;
    description?: string;
  })[];
}

export default function CardContainer({ items }: Props) {
  if (!items.length) {
    return (
      <div className="text-center py-16 text-muted">
        <div className="text-4xl mb-3">🍽️</div>
        <p className="font-medium">
          No hay platos disponibles en esta categoría.
        </p>
      </div>
    );
  }

  // Separamos según el indicador que mapeamos desde la base de datos
  const recipesList = items
    .filter((item) => item.is_recipe)
    .sort((a, b) => a.name.localeCompare(b.name));

  const productsList = items
    .filter((item) => !item.is_recipe)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── SECCIÓN DE RECETAS (COMBOS Y ESPECIALES) ── */}
      {recipesList.length > 0 && (
        <div>
          <h3 className="font-playfair text-xl font-bold text-crimson-dark px-4 pt-6 pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-[1px] after:bg-gradient-to-r after:from-gold/25 after:to-transparent">
            ✨ Combos y Especiales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-4 mb-6">
            {recipesList.map((recipe) => (
              <ProductCard key={`recipe-${recipe.id}`} item={recipe} />
            ))}
          </div>
        </div>
      )}

      {/* ── SECCIÓN DE PRODUCTOS INDIVIDUALES ── */}
      {productsList.length > 0 && (
        <div>
          <h3 className="font-playfair text-xl font-bold text-crimson-dark px-4 pt-6 pb-2 flex items-center gap-2 after:content-[''] after:flex-1 after:h-[1px] after:bg-gradient-to-r after:from-gold/25 after:to-transparent">
            🍔 Platos y Complementos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-4 mb-6">
            {productsList.map((product) => (
              <ProductCard key={`product-${product.id}`} item={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
