export type ExpenseKind = "operativo" | "inversion" | "nomina";

export type ExpenseItemType = {
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_cost: number;
  add_to_stock?: boolean;
};

export type ExpenseType = {
  id: string;
  description: string;
  category_id?: string | null;
  amount: number;
  date: Date;
  notes: string;
  kind?: ExpenseKind;
  supplier_id?: string | null;
  payment_method?: string | null;
  invoice_number?: string | null;
  is_paid?: 0 | 1;
  due_date?: string | null;
  items?: ExpenseItemType[];
  sincronizado?: 0 | 1;
  updated_at?: string;
};