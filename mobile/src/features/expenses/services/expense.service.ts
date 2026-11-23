import DATABASE from "@/src/core/config/db";
import { ExpenseType } from "../types/expense.type";
import { v4 as uuidv4 } from 'uuid';
import { SyncService } from "@/src/shared/services/sync.service";
import { toLocalDateStr } from "@/src/shared/helpers/date.helper";

const ExpensesService = {
  getAllExpenses: async (): Promise<ExpenseType[]> => {
    const expenses = await DATABASE.db.getAllAsync(
      "SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY date DESC",
    );
    return expenses.map((exp: any) => ({
      ...exp,
      date: new Date(exp.date),
    })) as ExpenseType[];
  },

  getExpenseById: async (id: string): Promise<ExpenseType | null> => {
    const exp: any = await DATABASE.db.getFirstAsync(
      "SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!exp) return null;
    return {
      ...exp,
      date: new Date(exp.date),
    } as ExpenseType;
  },

  getExpensesByRange: async (
    startDate: string,
    endDate: string,
  ): Promise<{
    total: number;
    expenses: ExpenseType[];
    byCategory: { category: string; total: number }[];
    byKind: { kind: string; total: number }[];
  }> => {
    const end = `${endDate}T23:59:59`;
    const [rowTotal, expenses, byCategory, byKind] = await Promise.all([
      DATABASE.db.getFirstAsync(
        "SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ? AND deleted_at IS NULL",
        [startDate, end],
      ),
      DATABASE.db.getAllAsync(
        "SELECT * FROM expenses WHERE date BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY date DESC",
        [startDate, end],
      ),
      DATABASE.db.getAllAsync(
        `SELECT c.name as category, SUM(e.amount) as total 
       FROM expenses e JOIN categories c ON e.category_id = c.id
       WHERE e.date BETWEEN ? AND ? AND e.deleted_at IS NULL AND c.deleted_at IS NULL
       GROUP BY e.category_id ORDER BY total DESC`,
        [startDate, end],
      ),
      DATABASE.db.getAllAsync(
  `SELECT COALESCE(kind,'operativo') AS kind, SUM(amount) AS total FROM expenses
    WHERE date BETWEEN ? AND ? AND deleted_at IS NULL GROUP BY COALESCE(kind,'operativo')`,
  [startDate, end],
),
    ]);
    return {
      total: (rowTotal as any)?.total || 0,
      expenses: (expenses || []).map((e: any) => ({
        ...e,
        date: new Date(e.date),
      })) as ExpenseType[],
      byCategory: (byCategory || []) as any[],
      byKind: (byKind || []) as { kind: string; total: number }[],
    };
  },

createExpense: async (expense: Omit<ExpenseType, "id">): Promise<ExpenseType> => {
  const id = uuidv4();
  const now = new Date().toISOString();

  await DATABASE.db.withTransactionAsync(async () => {
    await DATABASE.db.runAsync(
      `INSERT INTO expenses (id, description, category_id, amount, date, notes, kind, supplier_id,
         payment_method, invoice_number, is_paid, due_date, sincronizado, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?)`,
      [
        id, expense.description, expense.category_id || null, expense.amount,
        toLocalDateStr(expense.date), expense.notes || "", expense.kind ?? "operativo",
        expense.supplier_id || null, expense.payment_method || null,
        expense.invoice_number || null, expense.is_paid ?? 1, expense.due_date || null, now,
      ],
    );

    for (const it of expense.items ?? []) {
      await DATABASE.db.runAsync(
        `INSERT INTO expense_items (id, expense_id, product_id, name, quantity, unit_cost, add_to_stock, sincronizado, updated_at)
         VALUES (?,?,?,?,?,?,?,0,?)`,
        [uuidv4(), id, it.product_id ?? null, it.name, it.quantity, it.unit_cost, it.add_to_stock ? 1 : 0, now],
      );
      if (it.add_to_stock && it.product_id) {
        await DATABASE.db.runAsync(
          "UPDATE products SET stock = stock + ?, sincronizado = 0, updated_at = ? WHERE id = ?",
          [it.quantity, now, it.product_id],
        );
      }
    }
  });

  SyncService.run().catch((err) => console.error("Error sincronizando gasto:", err));
  return { id, ...expense };
},

  updateExpense: async (
    id: string,
    expense: Partial<Omit<ExpenseType, "id">>,
  ): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (expense.description !== undefined) {
      fields.push("description = ?");
      values.push(expense.description);
    }
    if (expense.category_id !== undefined) {
      fields.push("category_id = ?");
      values.push(expense.category_id);
    }
    if (expense.amount !== undefined) {
      fields.push("amount = ?");
      values.push(expense.amount);
    }
    if (expense.date !== undefined) {
      fields.push("date = ?");
      values.push(toLocalDateStr(expense.date));
    }
    if (expense.notes !== undefined) {
      fields.push("notes = ?");
      values.push(expense.notes);
    }

    if (fields.length === 0) return;

    values.push(new Date().toISOString());
    values.push(id);
    await DATABASE.db.runAsync(
      `UPDATE expenses SET ${fields.join(", ")}, sincronizado = 0, updated_at = ? WHERE id = ?`,
      values,
    );
  },

  getItems: async (expenseId: string) =>
  (await DATABASE.db.getAllAsync(
    "SELECT * FROM expense_items WHERE expense_id = ? AND deleted_at IS NULL",
    [expenseId],
  )) as any[],


deleteExpense: async (id: string): Promise<void> => {
  const row: any = await DATABASE.db.getFirstAsync("SELECT kind FROM expenses WHERE id = ?", [id]);
  if (row?.kind === "nomina") {
    throw new Error("Este gasto viene de nómina. Anúlalo desde Empleados › Nómina.");
  }
  const now = new Date().toISOString();
  await DATABASE.db.withTransactionAsync(async () => {
    await DATABASE.db.runAsync(
      "UPDATE expenses SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?", [now, now, id]);
    await DATABASE.db.runAsync(
      "UPDATE expense_items SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE expense_id = ?", [now, now, id]);
  });
  SyncService.run().catch((err) => console.error("Error sincronizando gasto:", err));
},

  getTodayExpenses: async (): Promise<ExpenseType[]> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const expenses = await DATABASE.db.getAllAsync(
      "SELECT * FROM expenses WHERE date = ? AND deleted_at IS NULL",
      [todayStr],
    );
    return expenses.map((exp: any) => ({
      ...exp,
      date: new Date(exp.date),
    })) as ExpenseType[];
  },

  getExpensesByDateRange: async (
    startDate: string,
    endDate: string,
  ): Promise<ExpenseType[]> => {
    const expenses = await DATABASE.db.getAllAsync(
      "SELECT * FROM expenses WHERE date BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY date DESC",
      [startDate, endDate],
    );
    return expenses.map((exp: any) => ({
      ...exp,
      date: new Date(exp.date),
    })) as ExpenseType[];
  },

  getTotalExpenses: async (): Promise<number> => {
    const result: { total: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT SUM(amount) as total FROM expenses WHERE deleted_at IS NULL",
    );
    return result?.total || 0;
  },

  getTotalByCategory: async (): Promise<
    { category: string; total: number }[]
  > => {
    const stats: any[] = await DATABASE.db.getAllAsync(
      `SELECT c.name as category, SUM(e.amount) as total 
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.deleted_at IS NULL AND c.deleted_at IS NULL
       GROUP BY e.category_id`,
    );
    return stats as { category: string; total: number }[];
  },

  /** Marca como pagado. Se actualiza updated_at: el arqueo cuenta la salida al momento de pagar. */
markAsPaid: async (id: string, method: string = "efectivo"): Promise<void> => {
  await DATABASE.db.runAsync(
    "UPDATE expenses SET is_paid = 1, payment_method = ?, sincronizado = 0, updated_at = ? WHERE id = ?",
    [method, new Date().toISOString(), id],
  );
  SyncService.run().catch((err) => console.error("Error sincronizando gasto:", err));
},
};

export default ExpensesService;
