import DATABASE from "@/src/core/config/db";
import { ProductType } from "../types/product.type";

export const ProductsService = {
  getAll: async (options?: { category_id?: string }): Promise<ProductType[]> => {
    if (options?.category_id) {
      const products = await DATABASE.db.getAllAsync(
        "SELECT * FROM products WHERE category_id = ?",
        [options.category_id],
      );
      return products as ProductType[];
    }
    const products = await DATABASE.db.getAllAsync("SELECT * FROM products");
    return products as ProductType[];
  },

  getCount: async (options?: { category_id?: string }): Promise<number> => {
    const count: { count: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
      [options?.category_id || ''],
    );
    
    return count?.count || 0;
  },

  getOne: async (id: string): Promise<ProductType | null> => {
    const product = await DATABASE.db.getFirstAsync(
      "SELECT * FROM products WHERE id = ?",
      [id],
    );
    return product as ProductType | null;
  },

  getProducts: async (): Promise<ProductType[]> => {
    const products = await DATABASE.db.getAllAsync("SELECT * FROM products");
    return products as ProductType[];
  },

  getProductById: async (id: number): Promise<ProductType | null> => {
    const product = await DATABASE.db.getFirstAsync(
      "SELECT * FROM products WHERE id = ?",
      [id],
    );
    return product as ProductType | null;
  },

  createProduct: async (product: Omit<ProductType, 'id'>): Promise<ProductType> => {
    const result = await DATABASE.db.runAsync(
      "INSERT INTO products (image_url, name, price, stock, category_id) VALUES (?, ?, ?, ?, ?)",
      [
        product.image_url || '',
        product.name,
        product.price,
        product.stock || 0,
        product.category_id,
      ],
    );
    return {
      id: result.lastInsertRowId,
      ...product,
    };
  },

  updateProduct: async (id: number, product: Partial<ProductType>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (product.image_url !== undefined) { fields.push("image_url = ?"); values.push(product.image_url); }
    if (product.name !== undefined) { fields.push("name = ?"); values.push(product.name); }
    if (product.price !== undefined) { fields.push("price = ?"); values.push(product.price); }
    if (product.stock !== undefined) { fields.push("stock = ?"); values.push(product.stock); }
    if (product.category_id !== undefined) { fields.push("category_id = ?"); values.push(product.category_id); }

    if (fields.length === 0) return;

    values.push(id);
    await DATABASE.db.runAsync(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  deleteProduct: async (id: number): Promise<void> => {
    await DATABASE.db.runAsync("DELETE FROM products WHERE id = ?", [id]);
  },

  createMany: async (products: ProductType[]) => {
    const productsCount: { count: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM products",
    );

    if (productsCount?.count === 0) {
      await DATABASE.db.withTransactionAsync(async () => {
        for (const product of products) {
          await DATABASE.db.runAsync(
            "INSERT INTO products (id, image_url, name, price, stock, category_id) VALUES (?, ?, ?, ?, ?, ?)",
            [
              product.id,
              product.image_url || '',
              product.name,
              product.price,
              product.stock || 0,
              product.category_id,
            ],
          );
        }
      });
    }
  },

  reset: async () => {
    await DATABASE.db.execAsync("DELETE FROM products");
  },
};
