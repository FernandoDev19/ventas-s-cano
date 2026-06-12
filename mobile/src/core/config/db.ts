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
          updated_at TEXT NOT NULL
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
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL
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
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS recipe_ingredients (
          id TEXT PRIMARY KEY,
          recipe_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity REAL NOT NULL,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (recipe_id) REFERENCES recipes (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );
      `);

      console.log("Database initialized successfully with UUIDs and Sync support");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  },
};

export default DATABASE;
