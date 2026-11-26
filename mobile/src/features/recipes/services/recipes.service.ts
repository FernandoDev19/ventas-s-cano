import DATABASE from "@/src/core/config/db";
import { RecipeIngredientType, RecipeType } from "../types/recipe.type";
import { v4 as uuidv4 } from "uuid";
import { SyncService } from "@/src/shared/services/sync.service";
import { SupabaseStorageService } from "@/src/shared/services/supabase-storage.service";

export const RecipesService = {
  getAll: async (): Promise<RecipeType[]> => {
    const recipes: any[] = await DATABASE.db.getAllAsync(
      "SELECT * FROM recipes WHERE deleted_at IS NULL ORDER BY name ASC",
    );

    const result: RecipeType[] = [];
    for (const recipe of recipes) {
      const ingredients = await RecipesService.getIngredients(recipe.id);
      const canPrepare = ingredients.every((ing) => {
        const prod = ing as any;
        return prod.product_stock >= ing.quantity;
      });
      const maxUnits = ingredients.length
        ? Math.min(
            ...ingredients.map((i) =>
              Math.floor(((i as any).product_stock ?? 0) / i.quantity),
            ),
          )
        : Infinity;
      const cost = ingredients.reduce(
        (s, ing) => s + ing.quantity * ((ing as any).product_cost ?? 0),
        0,
      );
      result.push({ ...recipe, ingredients, canPrepare, cost, maxUnits });
    }
    return result;
  },

  getById: async (id: string): Promise<RecipeType | null> => {
    const recipe: any = await DATABASE.db.getFirstAsync(
      "SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!recipe) return null;
    const ingredients = await RecipesService.getIngredients(id);
    return { ...recipe, ingredients };
  },

  getIngredients: async (recipeId: string): Promise<RecipeIngredientType[]> => {
    const rows: any[] = await DATABASE.db.getAllAsync(
      `SELECT ri.*, p.name as product_name, p.image_url as product_image, p.stock as product_stock, p.cost as product_cost
       FROM recipe_ingredients ri
       JOIN products p ON ri.product_id = p.id
       WHERE ri.recipe_id = ? AND ri.deleted_at IS NULL AND p.deleted_at IS NULL`,
      [recipeId],
    );
    return rows as RecipeIngredientType[];
  },

  create: async (
    recipe: Omit<RecipeType, "id">,
    ingredients: { product_id: string; quantity: number }[],
  ): Promise<RecipeType> => {
    const recipeId = uuidv4();
    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync(
        "INSERT INTO recipes (id, name, description, image_url, selling_price, category_id, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          recipeId,
          recipe.name,
          recipe.description || "",
          recipe.image_url || "",
          recipe.selling_price,
          recipe.category_id || null,
          0,
          new Date().toISOString(),
        ],
      );

      for (const ing of ingredients) {
        let ingredientId = uuidv4();
        await DATABASE.db.runAsync(
          "INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            ingredientId,
            recipeId,
            ing.product_id,
            ing.quantity,
            0,
            new Date().toISOString(),
          ],
        );
      }
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al crear receta:", err),
    );

    return { ...recipe, id: recipeId };
  },

  update: async (
    id: string,
    recipe: Partial<RecipeType>,
    ingredients?: { product_id: string; quantity: number }[],
  ): Promise<void> => {
    // Si está actualizando la imagen y es una URI local, eliminar la anterior de Supabase
    if (recipe.image_url && !recipe.image_url.startsWith("http")) {
      const oldRecipe: any = await DATABASE.db.getFirstAsync(
        "SELECT image_url FROM recipes WHERE id = ?",
        [id],
      );
      if (oldRecipe?.image_url && oldRecipe.image_url !== recipe.image_url) {
        const oldFileName = SupabaseStorageService.extractFileNameFromUrl(
          oldRecipe.image_url,
        );
        if (oldFileName) {
          await SupabaseStorageService.deleteProductImage(oldFileName).catch(
            (err) => console.error("Error eliminando imagen anterior:", err),
          );
        }
      }
    }

    await DATABASE.db.withTransactionAsync(async () => {
      const fields: string[] = [];
      const values: any[] = [];

      if (recipe.name !== undefined) {
        fields.push("name = ?");
        values.push(recipe.name);
      }
      if (recipe.description !== undefined) {
        fields.push("description = ?");
        values.push(recipe.description);
      }
      if (recipe.image_url !== undefined) {
        fields.push("image_url = ?");
        values.push(recipe.image_url);
      }
      if (recipe.selling_price !== undefined) {
        fields.push("selling_price = ?");
        values.push(recipe.selling_price);
      }
      if (recipe.category_id !== undefined) {
        fields.push("category_id = ?");
        values.push(recipe.category_id);
      }

      if (fields.length > 0) {
        values.push(new Date().toISOString());
        values.push(id);
        await DATABASE.db.runAsync(
          `UPDATE recipes SET ${fields.join(", ")}, sincronizado = 0, updated_at = ? WHERE id = ?`,
          values,
        );
      }

      if (ingredients) {
        const now = new Date().toISOString();
        const current: any[] = await DATABASE.db.getAllAsync(
          "SELECT id, product_id, quantity FROM recipe_ingredients WHERE recipe_id = ? AND deleted_at IS NULL",
          [id],
        );

        const wanted = new Map<string, number>();
        for (const ing of ingredients) wanted.set(ing.product_id, ing.quantity);

        const kept = new Set<string>();
        for (const row of current) {
          const qty = wanted.get(row.product_id);
          if (qty === undefined || kept.has(row.product_id)) {
            // quitado del formulario (o fila repetida): borrado lógico, se propaga a la nube
            await DATABASE.db.runAsync(
              "UPDATE recipe_ingredients SET deleted_at = ?, sincronizado = 0, updated_at = ? WHERE id = ?",
              [now, now, row.id],
            );
          } else {
            kept.add(row.product_id);
            if (row.quantity !== qty) {
              await DATABASE.db.runAsync(
                "UPDATE recipe_ingredients SET quantity = ?, sincronizado = 0, updated_at = ? WHERE id = ?",
                [qty, now, row.id],
              );
            }
          }
        }

        for (const [product_id, qty] of wanted) {
          if (kept.has(product_id)) continue;
          await DATABASE.db.runAsync(
            "INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            [uuidv4(), id, product_id, qty, 0, now],
          );
        }
      }
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al actualizar receta:", err),
    );
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();

    // Obtener la receta para eliminar su imagen de Supabase
    const recipe: any = await DATABASE.db.getFirstAsync(
      "SELECT image_url FROM recipes WHERE id = ?",
      [id],
    );

    if (recipe?.image_url) {
      const fileName = SupabaseStorageService.extractFileNameFromUrl(
        recipe.image_url,
      );
      if (fileName) {
        await SupabaseStorageService.deleteProductImage(fileName).catch((err) =>
          console.error("Error eliminando imagen de Supabase:", err),
        );
      }
    }

    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync(
        "UPDATE recipe_ingredients SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE recipe_id = ?",
        [now, now, id],
      );
      await DATABASE.db.runAsync(
        "UPDATE recipes SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?",
        [now, now, id],
      );
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al borrar receta:", err),
    );
  },

  /** Deduct ingredient stock when a recipe is sold (called per unit sold) */
  deductStock: async (recipeId: string, units: number = 1): Promise<void> => {
    const ingredients = await RecipesService.getIngredients(recipeId);
    await DATABASE.db.withTransactionAsync(async () => {
      for (const ing of ingredients) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock - ?, sincronizado = 0, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
          [ing.quantity * units, new Date().toISOString(), ing.product_id],
        );
      }
    });

    SyncService.run().catch((err) =>
      console.error("Error sincronizando al deducir stock de receta:", err),
    );
  },

  /** Returns low stock products after a recipe sale */
  checkLowStock: async (
    recipeId: string,
  ): Promise<{ name: string; stock: number }[]> => {
    const ingredients = await RecipesService.getIngredients(recipeId);
    const low: { name: string; stock: number }[] = [];
    for (const ing of ingredients) {
      const prod: any = await DATABASE.db.getFirstAsync(
        "SELECT name, stock FROM products WHERE id = ? AND deleted_at IS NULL",
        [ing.product_id],
      );
      if (prod && prod.stock <= 10) {
        low.push({ name: prod.name, stock: prod.stock });
      }
    }
    return low;
  },
};
