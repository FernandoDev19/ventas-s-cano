import api from '../config/api';
import type { Product } from '../models/product.model';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(product: Omit<Product, '_id'>): Promise<Product> {
    const response = await api.post('/products', product);
    return response.data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await api.patch(`/products/${id}`, product);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
};

export default productService;
