export type ExpenseType = {
  id: string;
  description: string;
  category_id: string;
  amount: number;
  date: Date;
  notes: string;
  sincronizado?: 0 | 1;
  updated_at?: string;
};