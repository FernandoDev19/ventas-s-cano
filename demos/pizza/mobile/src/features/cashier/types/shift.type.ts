export type CashierShiftStatusType = "open" | "closed";

export type CashierShiftType = {
  id: string;
  opening_date: string;
  opening_time: string;
  opening_balance: number;
  closing_time?: string;
  closing_date?: string;
  expected_total?: number;
  actual_total?: number;
  difference?: number;
  status: CashierShiftStatusType;
  notes?: string;
  sincronizado?: 0 | 1;
  updated_at?: string;
};

export type CashMovement = {
  id: string;
  shift_id: string;
  type: "entry" | "exit";
  description: string;
  amount: number;
  created_at: string;
  notes?: string;
  sincronizado?: 0 | 1;
  updated_at?: string;
};