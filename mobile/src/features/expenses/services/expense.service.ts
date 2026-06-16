import DATABASE from "@/src/core/config/db";
import { ExpenseType } from "../types/expense.type";
import { v4 as uuidv4 } from 'uuid';
import { SyncService } from "@/src/shared/services/sync.service";

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
  }> => {
    const end = `${endDate}T23:59:59`;
    const [rowTotal, expenses, byCategory] = await Promise.all([
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
    ]);
    return {
      total: (rowTotal as any)?.total || 0,
      expenses: (expenses || []).map((e: any) => ({
        ...e,
        date: new Date(e.date),
      })) as ExpenseType[],
      byCategory: (byCategory || []) as any[],
    };
  },

  createExpense: async (
    expense: Omit<ExpenseType, "id">,
  ): Promise<ExpenseType> => {
    const id = uuidv4();
    const dateStr = new Date(expense.date).toISOString().split("T")[0];
    await DATABASE.db.runAsync(
      "INSERT INTO expenses (id, description, category_id, amount, date, notes, sincronizado, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        expense.description,
        expense.category_id,
        expense.amount,
        dateStr,
        expense.notes || "",
        0,
        new Date().toISOString()
      ],
    );

    SyncService.run().catch(err => console.error("Error sincronizando gasto:", err));
    return {
      id,
      ...expense,
    };
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
      values.push(new Date(expense.date).toISOString().split("T")[0]);
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

  deleteExpense: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.runAsync("UPDATE expenses SET sincronizado = 0, updated_at = ?, deleted_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);

    SyncService.run().catch(err => console.error("Error sincronizando gasto:", err));
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
};

export default ExpensesService;
