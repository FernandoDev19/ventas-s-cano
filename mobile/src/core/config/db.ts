import { openDatabaseSync } from "expo-sqlite";

const DATABASE = {
  db: openDatabaseSync("fastpos.db"),

  initDb: async () => {
    try {
      await DATABASE.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_url TEXT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          stock INTEGER DEFAULT 0,
          category_id INTEGER NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total REAL NOT NULL,
          note TEXT,
          is_debt BOOLEAN NOT NULL,
          debt_amount REAL,
          debt_date DATE,
          payment_method TEXT DEFAULT 'cash',
          created_at TEXT NOT NULL,
          client_id INTEGER,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        );

        CREATE TABLE IF NOT EXISTS sale_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          date DATE NOT NULL,
          notes TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
      `);

      console.log("Database initialized successfully");
      console.log(
        "Database tables:",
        DATABASE.db.getAllSync(
          "SELECT name FROM sqlite_master WHERE type='table';",
        ),
      );
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  },
};

export default DATABASE;
