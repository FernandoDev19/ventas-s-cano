export type ExpenseType = {
  id: number;
  description: string;
  category_id: number;
  amount: number;
  date: Date;
  notes: string;
};