import { CategoriesService } from "@/src/features/categories/services/categories.service";
import { CategoryType } from "@/src/features/categories/types/category.type";
import { ProductsService } from "@/src/features/products/services/products.service";
import { ProductType } from "@/src/features/products/types/product.type";
import { ENVIRONMENTS } from "../constants/environments";
import DATABASE from "@/src/core/config/db";

const env = ENVIRONMENTS.NODE_ENV;

export const seeders = {
  run: async () => {
    let count = 0;

    async function categoriesTable() {
      const categories: CategoryType[] = [
        { id: 1, name: "Pollos" },
        { id: 2, name: "Cerdo & Picadas" },
        { id: 3, name: "Embutidos (Buti/Chorizo)" },
        { id: 4, name: "Bebidas" },
        { id: 5, name: "Cervezas / Alcohol" },
      ];

      await CategoriesService.createMany(categories);

      console.log("Categories seeded successfully");
    }

    async function productsTable() {
      const products: ProductType[] = [
        {
          id: 1,
          image_url: "data:image/jpeg;base64,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",
          name: "Pollo Entero",
          price: 10000,
          stock: 10,
          category_id: 1,
        },
        {
          id: 2,
          image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuUNyLEohdkV7FGcgXnhLsHwT6_M4pBGSfUg&s",
          name: "Pollo 1/2",
          price: 15000,
          stock: 5,
          category_id: 1,
        },
        {
          id: 3,
          image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTanbtbVwjTpn5PXGYKnecLVQ52OgBib8Ndvg&s",
          name: "Pollo 1/4",
          price: 8000,
          stock: 15,
          category_id: 1,
        },
      ];

      await ProductsService.createMany(products);

      console.log("Products seeded successfully");
    }

    async function salesTable() {
      const salesCount: { count: number } | null = await DATABASE.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM sales"
      );

      if (salesCount?.count === 0) {
        await DATABASE.db.withTransactionAsync(async () => {
          // Sale 1: completed sale
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [1, 35000, "Venta de almuerzo familiar", 0, 0, null, "2026-05-28"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [1, 1, 2, 10000] // 2x Pollo Entero
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [1, 2, 1, 15000] // 1x Pollo 1/2
          );

          // Sale 2: completed sale
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [2, 16000, "Cliente habitual picada", 0, 0, null, "2026-05-29"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [2, 3, 2, 8000] // 2x Pollo 1/4
          );

          // Sale 3: debt sale (unpaid)
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [3, 20000, "Fiado a Don Carlos - Paga el viernes", 1, 20000, "2026-06-05", "2026-05-30"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [3, 1, 2, 10000] // 2x Pollo Entero
          );

          // Sale 4: partially paid debt
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [4, 31000, "Abonó 15000, debe 16000", 1, 16000, "2026-06-02", "2026-05-30"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [4, 2, 1, 15000] // 1x Pollo 1/2
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [4, 3, 2, 8000] // 2x Pollo 1/4
          );
        });

        console.log("Sales & sale products seeded successfully");
      }
    }

    async function expensesTable() {
      const expensesCount: { count: number } | null = await DATABASE.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM expenses"
      );

      if (expensesCount?.count === 0) {
        await DATABASE.db.withTransactionAsync(async () => {
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (description, category_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)",
            ["Compra de pollos crudos (proveedor)", 1, 45000, "2026-05-28", "Se compraron 10 pollos al por mayor"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (description, category_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)",
            ["Bebidas y refrescos Coca-Cola", 4, 15000, "2026-05-29", "Surtido de botellas de 1.5L"]
          );
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (description, category_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)",
            ["Gas para asadores", 1, 25000, "2026-05-30", "Recarga de cilindro de 40 lbs"]
          );
        });

        console.log("Expenses seeded successfully");
      }
    }

    
    if (env === "development" && count === 0) {
      await seeders.reset();
      await productsTable();
      await salesTable();
      await expensesTable();
      count += 1;
    }
    await categoriesTable();
  },

  reset: async () => {
    if (env === "development") {
      await CategoriesService.reset();
      await ProductsService.reset();
      await DATABASE.db.execAsync("DELETE FROM sale_products");
      await DATABASE.db.execAsync("DELETE FROM sales");
      await DATABASE.db.execAsync("DELETE FROM expenses");
      await DATABASE.db.execAsync("DELETE FROM sqlite_sequence");
    }
  },
};
