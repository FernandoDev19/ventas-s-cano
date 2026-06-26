import { openDatabaseSync } from "expo-sqlite";

const DATABASE = {
  db: openDatabaseSync("sabor_espress.db"),

  initDb: async () => {
    try {
      // Habilitamos llaves foráneas en SQLite
      await DATABASE.db.execAsync("PRAGMA foreign_keys = ON;");

      await DATABASE.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          image_url TEXT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          stock INTEGER DEFAULT 0,
          category_id TEXT NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          type TEXT NOT NULL,
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
          created_at TEXT NOT NULL,
        );

        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          total REAL NOT NULL,
          note TEXT,
          is_debt BOOLEAN NOT NULL,
          debt_amount REAL,
          debt_date DATE,
          payment_method TEXT DEFAULT 'cash',
          created_at TEXT NOT NULL,
          client_id TEXT,
          status TEXT DEFAULT 'active',
          cancel_reason TEXT,
          edit_reason TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        );

        CREATE TABLE IF NOT EXISTS sale_products (
          id TEXT PRIMARY KEY,
          sale_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          category_id TEXT NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          selling_price REAL NOT NULL,
          category_id TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS recipe_ingredients (
          id TEXT PRIMARY KEY,
          recipe_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity REAL NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (recipe_id) REFERENCES recipes (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );

        CREATE TABLE IF NOT EXISTS sale_recipes (
          id TEXT PRIMARY KEY,
          sale_id TEXT NOT NULL,
          recipe_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (recipe_id) REFERENCES recipes (id)
        );

        CREATE TABLE IF NOT EXISTS cashier_shifts (
          id TEXT PRIMARY KEY,
          opening_date TEXT NOT NULL,
          opening_time TEXT NOT NULL,
          opening_balance REAL NOT NULL,
          closing_date TEXT,
          closing_time TEXT,
          expected_total REAL,
          actual_total REAL,
          difference REAL,
          status TEXT DEFAULT 'open',
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS cash_movements (
          id TEXT PRIMARY KEY,
          shift_id TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          created_at TEXT NOT NULL,
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (shift_id) REFERENCES cashier_shifts (id)
        );
      `);

      // Migración automática: aseguramos que la columna deleted_at existe en todas las tablas
      const tables = [
        "categories",
        "products",
        "contacts",
        "sales",
        "sale_products",
        "expenses",
        "recipes",
        "recipe_ingredients",
        "sale_recipes",
        "cashier_shifts",
        "cash_movements"
      ];
      for (const tableName of tables) {
        try {
          const info = (await DATABASE.db.getAllAsync(
            `PRAGMA table_info(${tableName});`,
          )) as any[];
          const hasDeletedAt = info.some((col) => col.name === "deleted_at");
          if (!hasDeletedAt) {
            await DATABASE.db.execAsync(
              `ALTER TABLE ${tableName} ADD COLUMN deleted_at TEXT;`,
            );
            console.log(
              `Columna deleted_at añadida con éxito a la tabla [${tableName}]`,
            );
          }
        } catch (err) {
          console.error(
            `Error al verificar/agregar deleted_at para ${tableName}:`,
            err,
          );
        }
      }

      console.log(
        "Database initialized successfully with UUIDs and Sync support",
      );
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  },
};

export default DATABASE;
