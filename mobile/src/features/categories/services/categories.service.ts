import DATABASE from "@/src/core/config/db";
import { CategoryType } from "../types/category.type";

export const CategoriesService = {
  getAll: async () => {
    const categories: CategoryType[] = await DATABASE.db.getAllAsync(
      "SELECT * FROM categories",
    );
    return categories;
  },
  create: async (name: string): Promise<CategoryType> => {
    const result = await DATABASE.db.runAsync(
      "INSERT INTO categories (name) VALUES (?)",
      [name],
    );
    return {
      id: result.lastInsertRowId,
      name,
    };
  },
  createMany: async (categories: CategoryType[]) => {
    const categoriesCount: { count: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM categories",
    );

    console.log(categoriesCount?.count, typeof categoriesCount);

    if (categoriesCount?.count === 0) {
      await DATABASE.db.withTransactionAsync(async () => {
        for (const category of categories) {
          await DATABASE.db.runAsync(
            "INSERT INTO categories (id, name) VALUES (?, ?)",
            [category.id, category.name],
          );
        }
      });
    }
  },
  update: async (id: number, name: string): Promise<void> => {
    await DATABASE.db.runAsync(
      "UPDATE categories SET name = ? WHERE id = ?",
      [name, id],
    );
  },
  delete: async (id: number): Promise<void> => {
    await DATABASE.db.runAsync(
      "DELETE FROM categories WHERE id = ?",
      [id],
    );
  },

  reset: async () => {
    await DATABASE.db.execAsync("DELETE FROM categories");
  },
};
