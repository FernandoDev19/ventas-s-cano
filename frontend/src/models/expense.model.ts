export interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: Date; // Viene como string del backend (ISO format)
  notes?: string;
  createdAt?: Date; // Viene como Date del backend
  updatedAt?: Date; // Viene como Date del backend
}

export type ExpenseCategory = 
  | 'pollo'
  | 'combos'
  | 'acompanantes'
  | 'salsas'
  | 'cerdo'
  | 'pasteles'
  | 'bebidas'
  | 'adicionales'
  | 'insumos'
  | 'delivery'
  | 'otros';

export const categoryLabels: { [key in ExpenseCategory]: string } = {
  pollo: 'Pollo Asado / Al Carbón',
  combos: 'Combos',
  acompanantes: 'Acompañantes (Papa, Yuca, Arroz)',
  salsas: 'Salsas (Ajo, BBQ, Piña, Tártara)',
  cerdo: 'Cerdo Asado',
  pasteles: 'Pasteles (Arroz, Pollo, Cerdo)',
  bebidas: 'Bebidas',
  adicionales: 'Adicionales / Extras',
  insumos: 'Insumos de Cocina',
  delivery: 'Domicilios',
  otros: 'Otros'
};