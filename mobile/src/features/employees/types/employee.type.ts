export type PayType = "mensual" | "quincenal" | "diario";

export type EmployeeType = {
  id: string;
  name: string;
  phone?: string | null;
  role?: string | null;
  pay_type: PayType;
  base_salary: number;
  hire_date?: string | null;
  is_active: 0 | 1;
  notes?: string | null;
  sincronizado?: 0 | 1;
  updated_at?: string;
};
export type EmployeeForm = Omit<EmployeeType, "id" | "sincronizado" | "updated_at">;

export type PayrollPaymentType = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  period_start: string;
  period_end: string;
  base_amount: number;
  bonuses: number;
  deductions: number;
  net_amount: number;
  paid_at: string;
  notes?: string | null;
  expense_id?: string | null;
};

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  mensual: "mes", quincenal: "quincena", diario: "día",
};