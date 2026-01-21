import type { Sale } from "../models/sale.model";
import api from "../config/api";

export const saleService = {
  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const response = await api.post('/sales', sale);
    return response.data;
  },

  async getSales(): Promise<Sale[]> {
    const response = await api.get('/sales');
    return response.data;
  },

  async getSaleById(id: string): Promise<Sale> {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
    const response = await api.patch(`/sales/${id}`, sale);
    return response.data;
  },

  async deleteSale(id: string): Promise<void> {
    await api.delete(`/sales/${id}`);
  },

  async getTodaySales(): Promise<Sale[]> {
    const response = await api.get('/sales/today');
    return response.data;
  },

  async getDebtSales(): Promise<Sale[]> {
    const response = await api.get('/sales/debts');
    return response.data;
  },

  async markSaleAsPaid(saleId: string): Promise<Sale> {
    const response = await api.patch(`/sales/${saleId}`, { isDebt: false });
    return response.data;
  }
};

export default saleService;