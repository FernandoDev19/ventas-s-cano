export type SupplierType = {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  products_supplied?: string | null;
  payment_terms_days?: number;
  notes?: string | null;
  sincronizado?: 0 | 1;
  updated_at?: string;
};
export type SupplierForm = Omit<SupplierType, "id" | "sincronizado" | "updated_at">;