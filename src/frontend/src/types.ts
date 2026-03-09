export interface Staff {
  id: number;
  name: string;
  role: string;
  mobile?: string;
}

export interface UsageRecord {
  id: number;
  date: string; // ISO date string YYYY-MM-DD
  productId: number;
  categoryId: number;
  staffId: number;
  quantity: number;
  time: string; // HH:MM format
  clientName?: string;
}

export interface ProductEdit {
  name: string;
  categoryId: number;
  unit: string;
  lowStockThreshold: number;
  rackNumber?: string;
}

export type StockOverrides = Record<number, number>;
export type ProductEdits = Record<number, ProductEdit>;

export interface EquipmentItem {
  id: number;
  name: string; // e.g. "Roll-On Heater", "Wax Pot"
}

export interface EquipmentCheckout {
  id: number;
  staffId: number;
  equipmentId: number;
  date: string; // YYYY-MM-DD
  takenAt: string; // HH:MM
  returnedAt?: string; // HH:MM, undefined if not yet returned
}

export type AttendanceStatus = "present" | "absent";

// date (YYYY-MM-DD) -> staffId -> status
export type AttendanceRecord = Record<string, Record<number, AttendanceStatus>>;

// ── Cash Ledger ───────────────────────────────────────────────────────────────

export type CashEntryType = "income" | "expense" | "ride";

export interface CashEntry {
  id: number;
  date: string; // YYYY-MM-DD
  type: CashEntryType;
  amount: number;
  description: string; // e.g. "Madam ne diya", "Bike Wala", staff name for rides
  recipientStaffId?: number; // for ride type entries
  notes?: string;
}

// ── Home Service Settlement ───────────────────────────────────────────────────

export interface HomeServiceSettlement {
  id: number;
  date: string; // YYYY-MM-DD
  staffId: number;
  clientName: string;
  serviceAmount: number; // e.g. 2800 (actual service charge)
  clientPaid: number; // e.g. 3000 (what client actually paid)
  travelExpense: number; // e.g. 120 (auto/bike/hotel etc.)
  notes?: string;
  // Computed: extra = clientPaid - serviceAmount (change to return to client or keep)
  // Net to pay staff = extra - travelExpense (negative = office owes staff)
}
