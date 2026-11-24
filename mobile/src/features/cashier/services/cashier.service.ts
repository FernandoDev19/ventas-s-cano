import DATABASE from "@/src/core/config/db";
import { SyncService } from "@/src/shared/services/sync.service";
import { v4 as uuidv4 } from "uuid";
import {
  CashierShiftStatusType,
  CashierShiftType,
  CashMovement,
} from "../types/shift.type";

// ─── Helpers de fecha en hora LOCAL (no UTC) ───────────────
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Convierte fecha + hora ("16:30", "4:30 p. m.", "16:30:12") a Date local.
// Devuelve null si no se puede interpretar (nunca lanza error).
const parseLocal = (
  date?: string | null,
  time?: string | null,
): Date | null => {
  if (!date) return null;
  const [y, mo, da] = String(date).slice(0, 10).split("-").map(Number);
  if (!y || !mo || !da) return null;

  const t = String(time ?? "00:00");
  const m = t.match(/(\d{1,2}):(\d{2})/);
  let h = m ? Number(m[1]) : 0;
  const min = m ? Number(m[2]) : 0;
  if (/p\.?\s?m/i.test(t) && h < 12) h += 12;
  if (/a\.?\s?m/i.test(t) && h === 12) h = 0;

  const result = new Date(y, mo - 1, da, h % 24, min, 0);
  return isNaN(result.getTime()) ? null : result;
};

export const shiftStartISO = (
  s: Pick<CashierShiftType, "opening_date" | "opening_time">,
) => {
  const d = parseLocal(s.opening_date, s.opening_time);
  return (d ?? new Date(0)).toISOString(); // si falla, cuenta desde el inicio
};

export const shiftEndISO = (s: CashierShiftType) => {
  if (s.status !== "closed") return new Date().toISOString();

  const d = parseLocal(s.closing_date, s.closing_time);
  if (d) return new Date(d.getTime() + 59_000).toISOString();

  // Turno viejo con formato raro: usa la fecha en que se actualizó (el cierre)
  const fallback = s.updated_at ? new Date(s.updated_at) : null;
  return fallback && !isNaN(fallback.getTime())
    ? fallback.toISOString()
    : new Date().toISOString();
};

// ─── Fragmentos SQL ────────────────────────────────────────
const CASH = `LOWER(COALESCE(payment_method,'cash')) IN ('cash','efectivo')`;
// Lo realmente cobrado: total menos lo que quedó fiado
const PAID_PART = `(total - CASE WHEN is_debt = 1 THEN COALESCE(debt_amount,0) ELSE 0 END)`;

export type ShiftTotals = {
  openingBalance: number;
  salesTotal: number; // ventas en EFECTIVO
  otherSales: number; // Nequi / tarjeta / transferencia (informativo)
  expensesTotal: number;
  movementsNet: number; // entradas - salidas
  expectedTotal: number; // base + efectivo + movimientos - gastos
  movements: CashMovement[];
};

export const CashierService = {
  // Abrir nuevo turno de caja
  openShift: async (openingBalance: number, notes?: string) => {
    const shiftId = uuidv4();
    const now = new Date();
    const dateStr = localDate(now);
    const timeStr = localTime(now);

    await DATABASE.db.runAsync(
      `INSERT INTO cashier_shifts 
        (id, opening_date, opening_time, opening_balance, status, sincronizado, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shiftId, dateStr, timeStr, openingBalance, "open", 0, now.toISOString()],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando turno abierto:", err),
    );

    return {
      id: shiftId,
      opening_date: dateStr,
      opening_time: timeStr,
      opening_balance: openingBalance,
      status: "open" as CashierShiftStatusType,
      notes,
    };
  },

  getCurrentShift: async (): Promise<CashierShiftType | null> => {
    const shift: any = await DATABASE.db.getFirstAsync(
      `SELECT * FROM cashier_shifts 
       WHERE status = 'open' AND deleted_at IS NULL
       ORDER BY opening_date DESC, opening_time DESC LIMIT 1`,
    );
    return shift ? (shift as CashierShiftType) : null;
  },

  addMovement: async (
    shiftId: string,
    type: "entry" | "exit",
    description: string,
    amount: number,
    notes?: string,
  ): Promise<CashMovement> => {
    const movementId = uuidv4();
    const now = new Date().toISOString();

    await DATABASE.db.runAsync(
      `INSERT INTO cash_movements (id, shift_id, type, description, amount, created_at, notes, sincronizado, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        shiftId,
        type,
        description,
        amount,
        now,
        notes || "",
        0,
        now,
      ],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando movimiento:", err),
    );

    return {
      id: movementId,
      shift_id: shiftId,
      type,
      description,
      amount,
      created_at: now,
      notes,
    };
  },

  // ANTES filtraba sincronizado = 1 y ocultaba los movimientos nuevos
  getShiftMovements: async (shiftId: string): Promise<CashMovement[]> => {
    const movements = await DATABASE.db.getAllAsync(
      `SELECT * FROM cash_movements 
       WHERE shift_id = ? AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [shiftId],
    );
    return movements as CashMovement[];
  },

  /** Calcula totales del turno (arqueo) */
  calculateShiftTotals: async (shiftId: string): Promise<ShiftTotals> => {
    const shift = (await DATABASE.db.getFirstAsync(
      `SELECT * FROM cashier_shifts WHERE id = ?`,
      [shiftId],
    )) as CashierShiftType | null;

    if (!shift) throw new Error("Turno no encontrado");

    const startISO = shiftStartISO(shift);
    const endISO = shiftEndISO(shift);

    // Ventas del turno, separadas efectivo / otros medios
    const sales: any = await DATABASE.db.getFirstAsync(
      `SELECT
         COALESCE(SUM(CASE WHEN ${CASH} THEN ${PAID_PART} ELSE 0 END), 0) AS cash_total,
         COALESCE(SUM(CASE WHEN NOT (${CASH}) 
                           AND LOWER(COALESCE(payment_method,'')) != 'deuda'
                      THEN ${PAID_PART} ELSE 0 END), 0) AS other_total
       FROM sales
       WHERE (status IS NULL OR status != 'cancelled')
         AND deleted_at IS NULL
         AND created_at >= ? AND created_at <= ?`,
      [startISO, endISO],
    );

    // Gastos registrados durante el turno
    const exp: any = await DATABASE.db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
    WHERE deleted_at IS NULL AND is_paid = 1
      AND LOWER(COALESCE(payment_method,'efectivo')) IN ('efectivo','cash')
      AND updated_at >= ? AND updated_at <= ?`,
      [startISO, endISO],
    );

    const movements: any[] = await DATABASE.db.getAllAsync(
      `SELECT * FROM cash_movements 
       WHERE shift_id = ? AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [shiftId],
    );

    const movementsNet = movements.reduce(
      (sum, m) => sum + (m.type === "entry" ? m.amount : -m.amount),
      0,
    );

    const salesTotal = sales?.cash_total ?? 0;
    const otherSales = sales?.other_total ?? 0;
    const expensesTotal = exp?.total ?? 0;

    return {
      openingBalance: shift.opening_balance,
      salesTotal,
      otherSales,
      expensesTotal,
      movementsNet,
      expectedTotal:
        shift.opening_balance + salesTotal + movementsNet - expensesTotal,
      movements,
    };
  },

  closeShift: async (
    shiftId: string,
    actualTotal: number,
    notes?: string,
  ): Promise<CashierShiftType> => {
    const now = new Date();
    const dateStr = localDate(now);
    const timeStr = localTime(now);

    const shift = (await DATABASE.db.getFirstAsync(
      `SELECT * FROM cashier_shifts WHERE id = ?`,
      [shiftId],
    )) as CashierShiftType;

    const { expectedTotal } =
      await CashierService.calculateShiftTotals(shiftId);
    const difference = actualTotal - expectedTotal;

    await DATABASE.db.runAsync(
      `UPDATE cashier_shifts 
       SET status = 'closed', closing_date = ?, closing_time = ?, 
           expected_total = ?, actual_total = ?, difference = ?, 
           notes = ?, sincronizado = 0, updated_at = ?
       WHERE id = ?`,
      [
        dateStr,
        timeStr,
        expectedTotal,
        actualTotal,
        difference,
        notes || "",
        now.toISOString(),
        shiftId,
      ],
    );

    SyncService.run().catch((err) =>
      console.error("Error sincronizando cierre:", err),
    );

    return {
      ...shift,
      closing_date: dateStr,
      closing_time: timeStr,
      expected_total: expectedTotal,
      actual_total: actualTotal,
      difference,
      status: "closed",
      notes,
    };
  },

  /** Cuándo empieza lo que debe verse en "Ventas" (turno abierto, o último cierre) */
  getSalesCutoff: async (): Promise<string | null> => {
    try {
      const open = await CashierService.getCurrentShift();
      if (open) return shiftStartISO(open);

      const last: any = await DATABASE.db.getFirstAsync(
        `SELECT * FROM cashier_shifts 
       WHERE status = 'closed' AND closing_date IS NOT NULL AND deleted_at IS NULL
       ORDER BY closing_date DESC, closing_time DESC LIMIT 1`,
      );
      return last ? shiftEndISO(last as CashierShiftType) : null;
    } catch (err) {
      console.error("Error calculando corte de ventas:", err);
      return null; // si falla, Ventas muestra todo en vez de romperse
    }
  },

  /** Histórico de turnos */
  getShiftHistory: async (limit: number = 10): Promise<CashierShiftType[]> => {
    const shifts = await DATABASE.db.getAllAsync(
      `SELECT * FROM cashier_shifts 
       WHERE deleted_at IS NULL
       ORDER BY opening_date DESC, opening_time DESC LIMIT ?`,
      [limit],
    );
    return shifts as CashierShiftType[];
  },
};
