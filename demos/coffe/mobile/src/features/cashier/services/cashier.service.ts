import DATABASE from "@/src/core/config/db";
import { SyncService } from "@/src/shared/services/sync.service";
import { v4 as uuidv4 } from "uuid";
import {
  CashierShiftStatusType,
  CashierShiftType,
  CashMovement,
} from "../types/shift.type";

export const CashierService = {
  // Abrir nuevo turno de caja
  openShift: async (openingBalance: number, notes?: string) => {
    const shiftId = uuidv4();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
      `SELECT * FROM cashier_shifts WHERE status = 'open' ORDER BY opening_date DESC LIMIT 1`,
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

  getShiftMovements: async (shiftId: string): Promise<CashMovement[]> => {
    const movements = await DATABASE.db.getAllAsync(
      `SELECT * FROM cash_movements WHERE shift_id = ? AND sincronizado = 1 ORDER BY created_at ASC`,
      [shiftId],
    );
    return movements as CashMovement[];
  },

  /**
   * Calcula totales del turno (para arqueo)
   */
  calculateShiftTotals: async (
    shiftId: string,
  ): Promise<{
    openingBalance: number;
    salesTotal: number;
    movementsNet: number; // entries - exits
    expectedTotal: number; // opening + sales + movements
    movements: CashMovement[];
  }> => {
    const shift: any = await DATABASE.db.getFirstAsync(
      `SELECT opening_balance FROM cashier_shifts WHERE id = ?`,
      [shiftId],
    );

    if (!shift) throw new Error("Turno no encontrado");

    // Ventas del día (no fiadas, solo contado)
    const salesResult: any = await DATABASE.db.getFirstAsync(
      `SELECT SUM(total) as total FROM sales 
       WHERE is_debt = 0 AND status IS NULL OR status != 'cancelled' 
       AND DATE(created_at) = (SELECT DATE(opening_date) FROM cashier_shifts WHERE id = ?)`,
      [shiftId],
    );

    // Movimientos
    const movements: any[] = await DATABASE.db.getAllAsync(
      `SELECT * FROM cash_movements WHERE shift_id = ? ORDER BY created_at ASC`,
      [shiftId],
    );

    const entriesTotal = movements
      .filter((m) => m.type === "entry")
      .reduce((sum, m) => sum + m.amount, 0);

    const exitsTotal = movements
      .filter((m) => m.type === "exit")
      .reduce((sum, m) => sum + m.amount, 0);

    const salesTotal = salesResult?.total || 0;
    const movementsNet = entriesTotal - exitsTotal;
    const expectedTotal = shift.opening_balance + salesTotal + movementsNet;

    return {
      openingBalance: shift.opening_balance,
      salesTotal,
      movementsNet,
      expectedTotal,
      movements,
    };
  },

  closeShift: async (
    shiftId: string,
    actualTotal: number,
    notes?: string,
  ): Promise<CashierShiftType> => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
      id: shiftId,
      opening_date: dateStr,
      opening_time: timeStr,
      opening_balance: 0,
      closing_date: dateStr,
      closing_time: timeStr,
      expected_total: expectedTotal,
      actual_total: actualTotal,
      difference,
      status: "closed",
      notes,
    };
  },

  /**
   * Obtiene histórico de turnos
   */
  getShiftHistory: async (limit: number = 10): Promise<CashierShiftType[]> => {
    const shifts = await DATABASE.db.getAllAsync(
      `SELECT * FROM cashier_shifts ORDER BY opening_date DESC LIMIT ?`,
      [limit],
    );
    return shifts as CashierShiftType[];
  },
};
