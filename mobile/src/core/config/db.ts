import { openDatabaseSync, SQLiteDatabase } from "expo-sqlite";

let _dbInstance: SQLiteDatabase | null = null;

function getDatabase(): SQLiteDatabase {
  if (!_dbInstance) {
    _dbInstance = openDatabaseSync("sabor_espress.db");
  }
  return _dbInstance;
}

const DATABASE = {
  get db(): SQLiteDatabase {
    return getDatabase();
  },

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
          is_visible_menu BOOLEAN DEFAULT 1,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          notes TEXT,
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
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
          source_order_id TEXT,
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
          category_id TEXT,
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

        CREATE TABLE IF NOT EXISTS tables (
          id TEXT PRIMARY KEY,
          number_mesa INT NOT NULL UNIQUE,
          status TEXT DEFAULT 'libre',
          sincronizado INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_name TEXT, phone TEXT,
          products_supplied TEXT, payment_terms_days INTEGER DEFAULT 0, notes TEXT,
          sincronizado INTEGER DEFAULT 0, updated_at TEXT NOT NULL, deleted_at TEXT
        );
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, role TEXT,
          pay_type TEXT DEFAULT 'mensual',      -- mensual | quincenal | diario
          base_salary REAL NOT NULL DEFAULT 0, hire_date TEXT,
          is_active INTEGER DEFAULT 1, notes TEXT,
          sincronizado INTEGER DEFAULT 0, updated_at TEXT NOT NULL, deleted_at TEXT
        );
        CREATE TABLE IF NOT EXISTS payroll_payments (
          id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, period_start TEXT, period_end TEXT,
          base_amount REAL NOT NULL, bonuses REAL DEFAULT 0, deductions REAL DEFAULT 0,
          net_amount REAL NOT NULL, paid_at TEXT NOT NULL, notes TEXT, expense_id TEXT,
          sincronizado INTEGER DEFAULT 0, updated_at TEXT NOT NULL, deleted_at TEXT,
          FOREIGN KEY (employee_id) REFERENCES employees (id)
        );
        CREATE TABLE IF NOT EXISTS expense_items (
          id TEXT PRIMARY KEY, expense_id TEXT NOT NULL, product_id TEXT, name TEXT NOT NULL,
          quantity REAL NOT NULL, unit_cost REAL NOT NULL, add_to_stock INTEGER DEFAULT 0,
          sincronizado INTEGER DEFAULT 0, updated_at TEXT NOT NULL, deleted_at TEXT,
          FOREIGN KEY (expense_id) REFERENCES expenses (id)
        );
      `);

      const addCol = async (table: string, col: string, def: string) => {
  const info = (await DATABASE.db.getAllAsync(`PRAGMA table_info(${table});`)) as any[];
  if (!info.some((c) => c.name === col))
    await DATABASE.db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
};
await addCol("expenses", "kind", "TEXT DEFAULT 'operativo'");   // operativo | inversion | nomina
await addCol("expenses", "supplier_id", "TEXT");
await addCol("expenses", "payment_method", "TEXT");
await addCol("expenses", "invoice_number", "TEXT");
await addCol("expenses", "is_paid", "INTEGER DEFAULT 1");
await addCol("expenses", "due_date", "TEXT");

      // Migración automática: aseguramos que la columna deleted_at existe en todas las tablas
      const tables = [
        "categories",
        "products",
        "clients",
        "sales",
        "sale_products",
        "expenses",
        "recipes",
        "recipe_ingredients",
        "sale_recipes",
        "cashier_shifts",
        "cash_movements",
        "tables",
        "suppliers",
        "employees",
        "payroll_payments",
        "expense_items"
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

      try {
        const bad: { id: string }[] = await DATABASE.db.getAllAsync(`
        SELECT s.id FROM sales s
        WHERE ABS(
          (SELECT COALESCE(SUM(price),0) FROM sale_products WHERE sale_id=s.id) +
          (SELECT COALESCE(SUM(price),0) FROM sale_recipes  WHERE sale_id=s.id) - s.total) < 1
        AND ABS(
          (SELECT COALESCE(SUM(price*quantity),0) FROM sale_products WHERE sale_id=s.id) +
          (SELECT COALESCE(SUM(price*quantity),0) FROM sale_recipes  WHERE sale_id=s.id) - s.total) >= 1
      `);
        const now = new Date().toISOString();
        for (const { id } of bad) {
          for (const t of ["sale_products", "sale_recipes"]) {
            await DATABASE.db.runAsync(
              `UPDATE ${t} SET price = price / quantity, sincronizado = 0, updated_at = ? WHERE sale_id = ? AND quantity > 0`,
              [now, id],
            );
          }
        }
      } catch (e) {
        console.error("Migración precios:", e);
      }

      try {
        const info = (await DATABASE.db.getAllAsync(
          `PRAGMA table_info(sales);`,
        )) as any[];
        const hasSourceOrderId = info.some(
          (col) => col.name === "source_order_id",
        );
        if (!hasSourceOrderId) {
          await DATABASE.db.execAsync(
            `ALTER TABLE sales ADD COLUMN source_order_id TEXT;`,
          );
          console.log(
            "Columna source_order_id añadida con éxito a la tabla [sales]",
          );
        }
      } catch (err) {
        console.error(
          "Error al verificar/agregar source_order_id en sales:",
          err,
        );
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
