export type ContactType = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: "cliente" | "proveedor";
  notes?: string;
  sincronizado?: 0 | 1;
  updated_at?: string;
  created_at?: string;
  deleted_at?: string;
};