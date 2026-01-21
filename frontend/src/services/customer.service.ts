import api from '../config/api';
import type { Customer } from '../models/customer.model';
import type { Sale } from '../models/sale.model';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await api.get('/customers');
    return response.data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(customer: Omit<Customer, '_id'>): Promise<Customer> {
    const response = await api.post('/customers', customer);
    return response.data;
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, customer);
    return response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async getSalesByCustomerId(customerId: string): Promise<Sale[]> {
    const response = await api.get(`/sales/customer/${customerId}`);
    return response.data;
  }
};

export default customerService;
