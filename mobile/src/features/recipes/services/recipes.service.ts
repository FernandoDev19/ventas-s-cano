import DATABASE from "@/src/core/config/db";
import { RecipeIngredientType, RecipeType } from "../types/recipe.type";

export const RecipesService = {
  getAll: async (): Promise<RecipeType[]> => {
    const recipes: any[] = await DATABASE.db.getAllAsync(
      "SELECT * FROM recipes ORDER BY name ASC"
    );

    const result: RecipeType[] = [];
    for (const recipe of recipes) {
      const ingredients = await RecipesService.getIngredients(recipe.id);
      const canPrepare = ingredients.every((ing) => {
        const prod = ing as any;
        return prod.product_stock >= ing.quantity;
      });
      result.push({ ...recipe, ingredients, canPrepare });
    }
    return result;
  },

  getById: async (id: number): Promise<RecipeType | null> => {
    const recipe: any = await DATABASE.db.getFirstAsync(
      "SELECT * FROM recipes WHERE id = ?",
      [id]
    );
    if (!recipe) return null;
    const ingredients = await RecipesService.getIngredients(id);
    return { ...recipe, ingredients };
  },

  getIngredients: async (recipeId: number): Promise<RecipeIngredientType[]> => {
    const rows: any[] = await DATABASE.db.getAllAsync(
      `SELECT ri.*, p.name as product_name, p.image_url as product_image, p.stock as product_stock
       FROM recipe_ingredients ri
       JOIN products p ON ri.product_id = p.id
       WHERE ri.recipe_id = ?`,
      [recipeId]
    );
    return rows as RecipeIngredientType[];
  },

  create: async (
    recipe: Omit<RecipeType, "id">,
    ingredients: { product_id: number; quantity: number }[]
  ): Promise<RecipeType> => {
    let recipeId = 0;
    await DATABASE.db.withTransactionAsync(async () => {
      const result = await DATABASE.db.runAsync(
        "INSERT INTO recipes (name, description, image_url, selling_price, category_id) VALUES (?, ?, ?, ?, ?)",
        [
          recipe.name,
          recipe.description || "",
          recipe.image_url || "",
          recipe.selling_price,
          recipe.category_id || null,
        ]
      );
      recipeId = result.lastInsertRowId;

      for (const ing of ingredients) {
        await DATABASE.db.runAsync(
          "INSERT INTO recipe_ingredients (recipe_id, product_id, quantity) VALUES (?, ?, ?)",
          [recipeId, ing.product_id, ing.quantity]
        );
      }
    });

    return { ...recipe, id: recipeId };
  },

  update: async (
    id: number,
    recipe: Partial<RecipeType>,
    ingredients?: { product_id: number; quantity: number }[]
  ): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      const fields: string[] = [];
      const values: any[] = [];

      if (recipe.name !== undefined) { fields.push("name = ?"); values.push(recipe.name); }
      if (recipe.description !== undefined) { fields.push("description = ?"); values.push(recipe.description); }
      if (recipe.image_url !== undefined) { fields.push("image_url = ?"); values.push(recipe.image_url); }
      if (recipe.selling_price !== undefined) { fields.push("selling_price = ?"); values.push(recipe.selling_price); }
      if (recipe.category_id !== undefined) { fields.push("category_id = ?"); values.push(recipe.category_id); }

      if (fields.length > 0) {
        values.push(id);
        await DATABASE.db.runAsync(
          `UPDATE recipes SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }

      if (ingredients) {
        await DATABASE.db.runAsync(
          "DELETE FROM recipe_ingredients WHERE recipe_id = ?",
          [id]
        );
        for (const ing of ingredients) {
          await DATABASE.db.runAsync(
            "INSERT INTO recipe_ingredients (recipe_id, product_id, quantity) VALUES (?, ?, ?)",
            [id, ing.product_id, ing.quantity]
          );
        }
      }
    });
  },

  delete: async (id: number): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync(
        "DELETE FROM recipe_ingredients WHERE recipe_id = ?",
        [id]
      );
      await DATABASE.db.runAsync(
        "DELETE FROM recipes WHERE id = ?",
        [id]
      );
    });
  },

  /** Deduct ingredient stock when a recipe is sold (called per unit sold) */
  deductStock: async (recipeId: number, units: number = 1): Promise<void> => {
    const ingredients = await RecipesService.getIngredients(recipeId);
    await DATABASE.db.withTransactionAsync(async () => {
      for (const ing of ingredients) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [ing.quantity * units, ing.product_id]
        );
      }
    });
  },

  /** Returns low stock products after a recipe sale */
  checkLowStock: async (recipeId: number): Promise<{ name: string; stock: number }[]> => {
    const ingredients = await RecipesService.getIngredients(recipeId);
    const low: { name: string; stock: number }[] = [];
    for (const ing of ingredients) {
      const prod: any = await DATABASE.db.getFirstAsync(
        "SELECT name, stock FROM products WHERE id = ?",
        [ing.product_id]
      );
      if (prod && prod.stock <= 10) {
        low.push({ name: prod.name, stock: prod.stock });
      }
    }
    return low;
  },
};
