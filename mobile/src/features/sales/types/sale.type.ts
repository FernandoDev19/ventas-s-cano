export type SaleType = {
  id?: string;
  total: number;
  note?: string;
  is_debt?: boolean;
  debt_amount?: number | null;
  debt_date?: string | null;
  payment_method?: string;
  client_id?: string | null;
  created_at?: Date | string | null;
  client?: { id: string; name: string } | null;
  status?: "active" | "cancelled";
  cancel_reason?: string | null;
  edit_reason?: string | null;
  sincronizado?: 0 | 1;
  updated_at?: string;
};
