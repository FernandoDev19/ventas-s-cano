import { CategoriesService } from "@/src/features/categories/services/categories.service";
import { CategoryType } from "@/src/features/categories/types/category.type";
import { ProductsService } from "@/src/features/inventory/services/products.service";
import { ProductType } from "@/src/features/inventory/types/product.type";
import DATABASE from "@/src/core/config/db";
import { v4 as uuidv4 } from "uuid";

export const seeders = {
  run: async () => {
    const polloCategoryId = uuidv4();
    // const cerdoCategoryId = uuidv4();
    // const embutidosCategoryId = uuidv4();
    const bebidasCategoryId = uuidv4();
    const cervezasCategoryId = uuidv4();

    async function categoriesTable() {
      const categories: CategoryType[] = [
        {
          id: polloCategoryId,
          name: "Pollos",
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: bebidasCategoryId,
          name: "Bebidas",
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: cervezasCategoryId,
          name: "Cervezas / Alcohol",
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
      ];

      await CategoriesService.createMany(categories);

      console.log("Categories seeded successfully");
    }

    const polloEnteroId = uuidv4();
    const polloMedioId = uuidv4();
    const polloCuartoId = uuidv4();

    async function productsTable() {
      const products: ProductType[] = [
        {
          id: polloEnteroId,
          image_url:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCEtO9WMcZgk-71M_kTgWGeuUz_iM1kbRNYJj087knKaByAz-kamliPbaq&s=10",
          name: "Pollo Entero",
          price: 10000,
          stock: 10,
          category_id: polloCategoryId,
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: polloMedioId,
          image_url:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuUNyLEohdkV7FGcgXnhLsHwT6_M4pBGSfUg&s",
          name: "Pollo 1/2",
          price: 15000,
          stock: 5,
          category_id: polloCategoryId,
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: polloCuartoId,
          image_url:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTanbtbVwjTpn5PXGYKnecLVQ52OgBib8Ndvg&s",
          name: "Pollo 1/4",
          price: 8000,
          stock: 15,
          category_id: polloCategoryId,
          sincronizado: 0,
          updated_at: new Date().toISOString(),
        },
      ];

      await ProductsService.createMany(products);

      console.log("Products seeded successfully");
    }

    async function salesTable() {
      const salesCount: { count: number } | null =
        await DATABASE.db.getFirstAsync("SELECT COUNT(*) as count FROM sales");

      if (salesCount?.count === 0) {
        await DATABASE.db.withTransactionAsync(async () => {
          // Sale 1: completed sale
          const sale_1_id = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              sale_1_id,
              35000,
              "Venta de almuerzo familiar",
              0,
              0,
              null,
              1,
              new Date().toISOString(),
              "2026-05-28",
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_1_id,
              polloEnteroId,
              2,
              10000,
              1,
              new Date().toISOString(),
            ], // 2x Pollo Entero
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_1_id,
              polloMedioId,
              1,
              15000,
              1,
              new Date().toISOString(),
            ], // 1x Pollo 1/2
          );

          // Sale 2: completed sale
          const sale_2_id = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              sale_2_id,
              16000,
              "Cliente habitual picada",
              0,
              0,
              null,
              1,
              new Date().toISOString(),
              "2026-05-29",
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_2_id,
              polloCuartoId,
              2,
              8000,
              1,
              new Date().toISOString(),
            ], // 2x Pollo 1/4
          );

          // Sale 3: debt sale (unpaid)
          const sale_3_id = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              sale_3_id,
              20000,
              "Fiado a Don Carlos - Paga el viernes",
              1,
              20000,
              "2026-06-05",
              1,
              new Date().toISOString(),
              "2026-05-30",
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_3_id,
              polloEnteroId,
              2,
              10000,
              1,
              new Date().toISOString(),
            ], // 2x Pollo Entero
          );

          // Sale 4: partially paid debt
          const sale_4_id = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO sales (id, total, note, is_debt, debt_amount, debt_date, sincronizado, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              sale_4_id,
              31000,
              "Abonó 15000, debe 16000",
              1,
              16000,
              "2026-06-02",
              1,
              new Date().toISOString(),
              "2026-05-30",
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_4_id,
              polloMedioId,
              1,
              15000,
              1,
              new Date().toISOString(),
            ], // 1x Pollo 1/2
          );
          await DATABASE.db.runAsync(
            "INSERT INTO sale_products (id, sale_id, product_id, quantity, price, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              sale_4_id,
              polloCuartoId,
              2,
              8000,
              1,
              new Date().toISOString(),
            ], // 2x Pollo 1/4
          );
        });

        console.log("Sales & sale products seeded successfully");
      }
    }

    async function expensesTable() {
      const expensesCount: { count: number } | null =
        await DATABASE.db.getFirstAsync(
          "SELECT COUNT(*) as count FROM expenses",
        );

      if (expensesCount?.count === 0) {
        await DATABASE.db.withTransactionAsync(async () => {
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (id, description, category_id, amount, date, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              "Compra de pollos crudos (proveedor)",
              polloCategoryId,
              45000,
              "2026-05-28",
              "Se compraron 10 pollos al por mayor",
              1,
              new Date().toISOString(),
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (id, description, category_id, amount, date, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              "Bebidas y refrescos Coca-Cola",
              bebidasCategoryId,
              15000,
              "2026-05-29",
              "Surtido de botellas de 1.5L",
              1,
              new Date().toISOString(),
            ],
          );
          await DATABASE.db.runAsync(
            "INSERT INTO expenses (id, description, category_id, amount, date, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              "Gas para asadores",
              polloCategoryId,
              25000,
              "2026-05-30",
              "Recarga de cilindro de 40 lbs",
              1,
              new Date().toISOString(),
            ],
          );
        });

        console.log("Expenses seeded successfully");
      }
    }

    async function recipesTable() {
      const recipesCount: { count: number } | null =
        await DATABASE.db.getFirstAsync(
          "SELECT COUNT(*) as count FROM recipes",
        );

      if (recipesCount?.count === 0) {
        await DATABASE.db.withTransactionAsync(async () => {
          // Recipe 1: Combo Familiar
          const recipe_1_id = uuidv4();
          await DATABASE.db.runAsync(
            "INSERT INTO recipes (id, name, description, image_url, selling_price, category_id, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              recipe_1_id,
              "Combo Familiar",
              "1 Pollo Entero + 2 Gaseosas de 1.5L",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkK108d_a0kSjD7f60s9D5f6H2G8zJ9i6wYg&s",
              15000,
              polloCategoryId,
              0,
              new Date().toISOString(),
            ],
          );
          // ingredients: 1x Pollo Entero (id=1), let's assume we don't have gaseosas in products seeded yet so we just put Pollo Entero for demo
          await DATABASE.db.runAsync(
            "INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            [
              uuidv4(),
              recipe_1_id,
              polloEnteroId,
              1,
              1,
              new Date().toISOString(),
            ],
          );

          // Recipe 2: Picada Sencilla
          // const recipe_2_id = uuidv4();
          // await DATABASE.db.runAsync(
          //   "INSERT INTO recipes (id, name, description, image_url, selling_price, category_id, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          //   [
          //     recipe_2_id,
          //     "Picada Sencilla",
          //     "1/2 Pollo + 1/4 Pollo",
          //     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVbQ7yB7sA7nL-Gv8S1vG7gG_s7G6yE0K7bA&s",
          //     20000,
          //     cerdoCategoryId,
          //     1,
          //     new Date().toISOString(),
          //   ],
          // );
          // await DATABASE.db.runAsync(
          //   "INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          //   [uuidv4(), recipe_2_id, polloMedioId, 1, 1, new Date().toISOString()], // 1x Pollo 1/2
          // );
          // await DATABASE.db.runAsync(
          //   "INSERT INTO recipe_ingredients (id, recipe_id, product_id, quantity, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          //   [uuidv4(), recipe_2_id, polloCuartoId, 1, 1, new Date().toISOString()], // 1x Pollo 1/4
          // );
        });

        console.log("Recipes seeded successfully");
      }
    }

    if (__DEV__) {
      await seeders.reset();

      await categoriesTable();
      await productsTable();
      await recipesTable();
      await salesTable();
      await expensesTable();
    } else {
      await categoriesTable();
    }
  },

  reset: async () => {
    if (__DEV__) {
      await DATABASE.db.execAsync("DELETE FROM recipe_ingredients");
      await DATABASE.db.execAsync("DELETE FROM recipes");
      await DATABASE.db.execAsync("DELETE FROM sale_products");
      await DATABASE.db.execAsync("DELETE FROM sales");
      await DATABASE.db.execAsync("DELETE FROM expenses");
      await DATABASE.db.execAsync("DELETE FROM products");
      await DATABASE.db.execAsync("DELETE FROM clients");
      await DATABASE.db.execAsync("DELETE FROM categories");
    }
  },
};
