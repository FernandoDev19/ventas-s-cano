import type { Sale } from './sale.model';
import type { Customer } from './customer.model';

export interface Debt {
  _id?: string;
  sale: string | Sale;
  customer: string | Customer;
  amount: number;
  status: DebtStatus;
  paidAt?: string;
  createdAt: string;
}

export type DebtStatus = 'pending' | 'paid' | 'overdue';