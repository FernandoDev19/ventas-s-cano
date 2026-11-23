import DATABASE from "@/src/core/config/db";
import { SyncService } from "@/src/shared/services/sync.service";
import { v4 as uuidv4 } from "uuid";
import { EmployeeForm, EmployeeType } from "../types/employee.type";

const sync = () => SyncService.run().catch((e) => console.error("Error sincronizando empleado:", e));

export const EmployeesService = {
  getAll: async (): Promise<EmployeeType[]> =>
    (await DATABASE.db.getAllAsync(
      "SELECT * FROM employees WHERE deleted_at IS NULL ORDER BY is_active DESC, name ASC",
    )) as EmployeeType[],

  create: async (e: EmployeeForm): Promise<void> => {
    await DATABASE.db.runAsync(
      `INSERT INTO employees (id, name, phone, role, pay_type, base_salary, hire_date, is_active, notes, sincronizado, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,0,?)`,
      [uuidv4(), e.name, e.phone || "", e.role || "", e.pay_type, e.base_salary,
       e.hire_date || null, e.is_active, e.notes || "", new Date().toISOString()],
    );
    sync();
  },

  update: async (id: string, e: EmployeeForm): Promise<void> => {
    await DATABASE.db.runAsync(
      `UPDATE employees SET name=?, phone=?, role=?, pay_type=?, base_salary=?, hire_date=?,
         is_active=?, notes=?, sincronizado=0, updated_at=? WHERE id=?`,
      [e.name, e.phone || "", e.role || "", e.pay_type, e.base_salary,
       e.hire_date || null, e.is_active, e.notes || "", new Date().toISOString(), id],
    );
    sync();
  },

  hasPayments: async (id: string): Promise<boolean> => {
    const r: any = await DATABASE.db.getFirstAsync(
      "SELECT COUNT(*) AS c FROM payroll_payments WHERE employee_id = ? AND deleted_at IS NULL",
      [id],
    );
    return (r?.c ?? 0) > 0;
  },

  delete: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await DATABASE.db.runAsync(
      "UPDATE employees SET sincronizado=0, updated_at=?, deleted_at=? WHERE id=?",
      [now, now, id],
    );
    sync();
  },
};