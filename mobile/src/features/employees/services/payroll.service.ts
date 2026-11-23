import DATABASE from "@/src/core/config/db";
import { toLocalDateStr } from "@/src/shared/helpers/date.helper";
import { SyncService } from "@/src/shared/services/sync.service";
import { v4 as uuidv4 } from "uuid";
import { PayType, PayrollPaymentType } from "../types/employee.type";

export type PayForm = {
  period_start: string;
  period_end: string;
  base: number;
  bonuses: number;
  deductions: number;
  notes?: string;
};

export const PayrollService = {
  /** Periodo sugerido según el tipo de pago */
  suggestPeriod: (payType: PayType, ref: Date = new Date()) => {
    const y = ref.getFullYear(), m = ref.getMonth(), d = ref.getDate();
    if (payType === "diario") return { start: toLocalDateStr(ref), end: toLocalDateStr(ref) };
    if (payType === "quincenal") {
      return d <= 15
        ? { start: toLocalDateStr(new Date(y, m, 1)), end: toLocalDateStr(new Date(y, m, 15)) }
        : { start: toLocalDateStr(new Date(y, m, 16)), end: toLocalDateStr(new Date(y, m + 1, 0)) };
    }
    return { start: toLocalDateStr(new Date(y, m, 1)), end: toLocalDateStr(new Date(y, m + 1, 0)) };
  },

  getHistory: async (limit = 100): Promise<PayrollPaymentType[]> =>
    (await DATABASE.db.getAllAsync(
      `SELECT pp.*, e.name AS employee_name
         FROM payroll_payments pp
         LEFT JOIN employees e ON e.id = pp.employee_id
        WHERE pp.deleted_at IS NULL
        ORDER BY pp.paid_at DESC LIMIT ?`,
      [limit],
    )) as PayrollPaymentType[],

  /** ¿Ya hay un pago que se cruce con este periodo? */
  findOverlap: async (employeeId: string, start: string, end: string): Promise<boolean> => {
    const r = await DATABASE.db.getFirstAsync(
      `SELECT id FROM payroll_payments
        WHERE employee_id = ? AND deleted_at IS NULL AND period_start <= ? AND period_end >= ? LIMIT 1`,
      [employeeId, end, start],
    );
    return !!r;
  },

  pay: async (employeeId: string, employeeName: string, f: PayForm): Promise<void> => {
    const net = f.base + f.bonuses - f.deductions;
    const now = new Date().toISOString();
    const expenseId = uuidv4();

    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync(
        `INSERT INTO expenses (id, description, category_id, amount, date, notes, kind, is_paid, sincronizado, updated_at)
         VALUES (?,?,?,?,?,?,?,?,0,?)`,
        [expenseId, `Nómina ${employeeName} (${f.period_start} a ${f.period_end})`, null,
         net, toLocalDateStr(), f.notes || "", "nomina", 1, now],
      );
      await DATABASE.db.runAsync(
        `INSERT INTO payroll_payments (id, employee_id, period_start, period_end, base_amount, bonuses,
           deductions, net_amount, paid_at, notes, expense_id, sincronizado, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`,
        [uuidv4(), employeeId, f.period_start, f.period_end, f.base, f.bonuses,
         f.deductions, net, now, f.notes || "", expenseId, now],
      );
    });
    SyncService.run().catch((e) => console.error("Error sincronizando nómina:", e));
  },

  /** Anula el pago y su gasto asociado */
  cancelPayment: async (payment: PayrollPaymentType): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.withTransactionAsync(async () => {
      await DATABASE.db.runAsync(
        "UPDATE payroll_payments SET sincronizado=0, updated_at=?, deleted_at=? WHERE id=?",
        [now, now, payment.id],
      );
      if (payment.expense_id) {
        await DATABASE.db.runAsync(
          "UPDATE expenses SET sincronizado=0, updated_at=?, deleted_at=? WHERE id=?",
          [now, now, payment.expense_id],
        );
      }
    });
    SyncService.run().catch((e) => console.error("Error sincronizando anulación:", e));
  },
};