import DATABASE from "@/src/core/config/db";
import { CategoryType } from "../types/category.type";
import { v4 as uuidv4 } from 'uuid';

export const CategoriesService = {
  getAll: async () => {
    const categories: CategoryType[] = await DATABASE.db.getAllAsync(
      "SELECT * FROM categories",
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
  },

  delete: async (id: string): Promise<void> => {
    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync("DELETE FROM products WHERE category_id = ?", [
        id,
      ]);
      await DATABASE.db.runAsync("DELETE FROM expenses WHERE category_id = ?", [
        id,
      ]);
      await DATABASE.db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    });
  },
};
