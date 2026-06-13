import DATABASE from "@/src/core/config/db";
import { CategoryType } from "../types/category.type";
import { v4 as uuidv4 } from 'uuid';
import { SyncService } from "@/src/shared/services/sync.service";

export const CategoriesService = {
  getAll: async () => {
    const categories: CategoryType[] = await DATABASE.db.getAllAsync(
      "SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC",
    );
    return categories;
  },

  create: async (name: string): Promise<CategoryType> => {
    const id = uuidv4();
    const now = new Date().toISOString();

    await DATABASE.db.runAsync(
      "INSERT INTO categories (id, name, sincronizado, updated_at) VALUES (?, ?, ?, ?)",
      [id, name, 0, now],
    );

    await SyncService.run().catch(err => console.error("Error sincronizando categoría:", err));

    return {
      id,
      name,
      sincronizado: 0,
      updated_at: now,
    };
  },

  createMany: async (categories: CategoryType[]) => {
    const categoriesCount: { count: number } | null =
      await DATABASE.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM categories",
      );

    console.log(categoriesCount?.count, typeof categoriesCount);

    if (categoriesCount?.count === 0) {
      await DATABASE.db.withTransactionAsync(async () => {
        for (const category of categories) {
          await DATABASE.db.runAsync(
            "INSERT INTO categories (id, name, sincronizado, updated_at) VALUES (?, ?, ?, ?)",
            [category.id, category.name, category.sincronizado || 0, category.updated_at || new Date().toISOString()],
          );
        }
      });
    }
  },

  update: async (id: string, name: string): Promise<void> => {
    await DATABASE.db.runAsync("UPDATE categories SET sincronizado = 0, name = ?, updated_at = ? WHERE id = ?", [
      name,
      new Date().toISOString(),
      id,
    ]);

    await SyncService.run().catch(err => console.error("Error sincronizando categoría:", err));
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    
    await DATABASE.db.withTransactionAsync(async () => {
      // Products
      await DATABASE.db.runAsync("UPDATE products SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE category_id = ?", [
        now,
        now,
        id,
      ]);
      
      // Expenses
      await DATABASE.db.runAsync("UPDATE expenses SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE category_id = ?", [
        now,
        now,
        id,
      ]);

      // Recipes
      await DATABASE.db.runAsync("UPDATE recipes SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE category_id = ?", [
        now,
        now,
        id,
      ]);

      // Categories
      await DATABASE.db.runAsync("UPDATE categories SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?", [
        now,
        now,
        id,
      ]);
    });

    SyncService.run().catch(err => console.error("Error sincronizando categoría:", err));
  },
};
