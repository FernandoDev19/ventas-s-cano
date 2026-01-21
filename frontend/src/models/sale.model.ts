import type { Product } from './product.model';
import type { Customer } from './customer.model';

export interface ProductQuantity {
  product: string | Product;
  quantity: number;
}

export interface Sale {
  _id?: string;
  products: ProductQuantity[];
  total: number;
  customer: string | Customer;
  isDebt: boolean;
  debtAmount?: number;
  debtDate?: string;
  createdAt?: string;
}