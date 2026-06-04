import DATABASE from "@/src/core/config/db";
import { ExpenseType } from "../types/expense.type";

export const ExpensesService = {
  getAllExpenses: async (): Promise<ExpenseType[]> => {
    const expenses = await DATABASE.db.getAllAsync(
      "SELECT * FROM expenses ORDER BY date DESC",
    );
    return expenses.map((exp: any) => ({
      ...exp,
      date: new Date(exp.date),
    })) as ExpenseType[];
  },

  getExpenseById: async (id: number): Promise<ExpenseType | null> => {
    const exp: any = await DATABASE.db.getFirstAsync(
      "SELECT * FROM expenses WHERE id = ?",
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
        "SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ?",
        [startDate, end],
      ),
      DATABASE.db.getAllAsync(
        "SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC",
        [startDate, end],
      ),
      DATABASE.db.getAllAsync(
        `SELECT c.name as category, SUM(e.amount) as total 
       FROM expenses e JOIN categories c ON e.category_id = c.id
       WHERE e.date BETWEEN ? AND ?
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
    const dateStr = new Date(expense.date).toISOString().split("T")[0];
    const result = await DATABASE.db.runAsync(
      "INSERT INTO expenses (description, category_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)",
      [
        expense.description,
        expense.category_id,
        expense.amount,
        dateStr,
        expense.notes || "",
      ],
    );
    return {
      id: result.lastInsertRowId,
      ...expense,
    };
  },

  updateExpense: async (
    id: number,
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

    values.push(id);
    await DATABASE.db.runAsync(
      `UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  deleteExpense: async (id: number): Promise<void> => {
    await DATABASE.db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
  },

  getTodayExpenses: async (): Promise<ExpenseType[]> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const expenses = await DATABASE.db.getAllAsync(
      "SELECT * FROM expenses WHERE date = ?",
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
      "SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC",
      [startDate, endDate],
    );
    return expenses.map((exp: any) => ({
      ...exp,
      date: new Date(exp.date),
    })) as ExpenseType[];
  },

  getTotalExpenses: async (): Promise<number> => {
    const result: { total: number } | null = await DATABASE.db.getFirstAsync(
      "SELECT SUM(amount) as total FROM expenses",
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
       GROUP BY e.category_id`,
    );
    return stats as { category: string; total: number }[];
  },
};

export default ExpensesService;
