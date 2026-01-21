import api from "../config/api";
import type { Expense } from "../models";

class ExpenseService {
  async getAllExpenses(): Promise<Expense[]> {
    const response = await api.get('/expenses');  
    return response.data;
  }

  async getExpenseById(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  }

  async createExpense(expense: Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const response = await api.post('/expenses', expense);
    return response.data;
  }

  async updateExpense(id: string, expense: Partial<Omit<Expense, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}`, expense);
    return response.data;
  }

  async deleteExpense(id: string): Promise<Expense> {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  }

  async getTodayExpenses(): Promise<Expense[]> {
    const response = await api.get('/expenses/today/list');
    return response.data;
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const response = await api.get('/expenses/range/list', {
      params: {
        startDate: startDate.toISOString().split('T')[0], // Enviar solo YYYY-MM-DD
        endDate: endDate.toISOString().split('T')[0]       // Enviar solo YYYY-MM-DD
      }
    });
    return response.data;
  }

  async getTotalExpenses(): Promise<number> {
    const response = await api.get('/expenses/stats/total');
    return response.data.total || 0;
  }

  async getTotalByCategory(): Promise<{ category: string; total: number }[]> {
    const response = await api.get('/expenses/stats/by-category');
    return response.data;
  }
}

const expenseService = new ExpenseService();
export default expenseService;
