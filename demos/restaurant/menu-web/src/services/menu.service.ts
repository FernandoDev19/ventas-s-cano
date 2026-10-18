import { supabase } from "../lib/supabase";
import type { ProductType } from "../types/product.type";

// Definimos el tipo de retorno unificado que espera el CardContainer
export type MenuExtendedItem = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number; // Mapeado de price (product) o selling_price (recipe)
  stock: number;
  category_id: string;
  is_recipe: boolean;
};

export const MenuService = {
  /**
   * Obtiene tanto productos como recetas filtrados por una categoría específica
   * y los unifica en un solo array listo para el CardContainer.
   */
  async getMenuByCategory(categoryId: string): Promise<MenuExtendedItem[]> {
    try {
      // 1. Consultar Productos de la categoría
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, name, image_url, price, stock, category_id")
        .eq("category_id", categoryId)
        .eq("is_visible_menu", true);

      if (prodError) throw prodError;

      // 2. Consultar Recetas (Combos) de la categoría
      const { data: recipes, error: recError } = await supabase
        .from("recipes")
        .select("id, name, description, image_url, selling_price, category_id")
        .eq("category_id", categoryId);

      if (recError) throw recError;

      // 3. Mapear y estampar la bandera 'is_recipe' a los productos
      const mappedProducts: MenuExtendedItem[] = (products || []).map(
        (p: ProductType) => ({
          id: p.id,
          name: p.name,
          description: undefined,
          image_url: p.image_url || undefined,
          price: Number(p.price),
          stock: p.stock ?? 0,
          category_id: p.category_id,
          is_recipe: false,
        }),
      );

      // 4. Mapear y estampar la bandera 'is_recipe' a las recetas
      const mappedRecipes: MenuExtendedItem[] = (recipes || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        image_url: r.image_url || undefined,
        price: Number(r.selling_price),
        stock: 99,
        category_id: r.category_id || categoryId,
        is_recipe: true,
      }));

      // 5. Unimos ambas listas en un solo viaje
      return [...mappedRecipes, ...mappedProducts];
    } catch (error) {
      console.error("Error cargando el menú desde Supabase:", error);
      return [];
    }
  },

  async getMenu() {
    try {
      // 1. Consultar Productos
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, name, image_url, price, stock, category_id")
        .eq("is_visible_menu", true);

      if (prodError) throw prodError;

      // 2. Consultar Recetas (Combos)
      const { data: recipes, error: recError } = await supabase
        .from("recipes")
        .select("id, name, description, image_url, selling_price, category_id");

      if (recError) throw recError;

      // 3. Mapear y estampar la bandera 'is_recipe' a los productos
      const mappedProducts: MenuExtendedItem[] = (products || []).map(
        (p: ProductType) => ({
          id: p.id,
          name: p.name,
          description: undefined,
          image_url: p.image_url || undefined,
          price: Number(p.price),
          stock: p.stock ?? 0,
          category_id: p.category_id,
          is_recipe: false,
        }),
      );

      // 4. Mapear y estampar la bandera 'is_recipe' a las recetas
      const mappedRecipes: MenuExtendedItem[] = (recipes || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        image_url: r.image_url || undefined,
        price: Number(r.selling_price),
        stock: 99,
        category_id: r.category_id,
        is_recipe: true,
      }));

      // 5. Unimos ambas listas en un solo viaje
      return [...mappedRecipes, ...mappedProducts];
    } catch (error) {
      console.error("Error cargando el menú desde Supabase:", error);
      return [];
    }
  },

  /**
   * Carga todas las categorías disponibles para armar la barra de pestañas o filtros
   */
  async getCategories() {
    try {
      const { data: categories, error } = await supabase
        .from("categories")
        .select(
          `
        id, 
        name,
        products(id, is_visible_menu),
        recipes(id)
      `,
        )
        .order("name", { ascending: true });

      if (error) throw error;

      const categoriasActivas = (categories || []).filter((cat) => {
        // Verifica si tiene al menos un producto visible
        const tieneProductosVisibles = cat.products?.some(
          (p) => p.is_visible_menu === true,
        );
        // Verifica si tiene al menos una receta (como no tiene bandera, si hay registro, cuenta)
        const tieneRecetas = cat.recipes && cat.recipes.length > 0;

        return tieneProductosVisibles || tieneRecetas;
      });

      return categoriasActivas.map((cat) => ({
        id: cat.id,
        name: cat.name,
      }));
    } catch (error) {
      console.error("Error obteniendo categorías activas:", error);
      return [];
    }
  },
};
