export type SaleType = {
  id?: number;
  total: number;
  note?: string;
  is_debt?: boolean;
  debt_amount?: number | null;
  debt_date?: string | null;
  payment_method?: string;
  created_at?: Date | string | null;
};
