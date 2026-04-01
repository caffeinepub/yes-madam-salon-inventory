export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  categoryId: number;
  openingStock: number;
  openingDate: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  rackNumber?: string;
}

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

export interface EquipmentItem {
  id: number;
  name: string;
}

export interface EquipmentCheckout {
  id: number;
  staffId: number;
  equipmentId: number;
  date: string;
  takenAt: string;
  returnedAt?: string;
}

export type AttendanceStatus = "present" | "absent" | "half-day";

// date -> staffId -> status
export type AttendanceRecord = Record<number, Record<number, AttendanceStatus>>;

export type CashEntryType = "income" | "expense" | "ride";

export interface CashEntry {
  id: number;
  date: string;
  type: CashEntryType;
  description: string;
  amount: number;
  notes?: string;
  recipientStaffId?: number;
}

export interface HomeServiceSettlement {
  id: number;
  date: string;
  staffId: number;
  clientName: string;
  serviceAmount: number;
  clientPaid: number;
  travelExpense: number;
  notes?: string;
}

export interface ProductEdit {
  name: string;
  categoryId: number;
  unit: string;
  lowStockThreshold: number;
  rackNumber?: string;
}

export type ProductEdits = Record<number, ProductEdit>;
export type StockOverrides = Record<number, number>;

// ── Pack Tracker ──────────────────────────────────────────────────────────────────────────────

export interface PackItem {
  id: number;
  name: string; // e.g. "Wax Roll", "Bleach Powder"
  unit: string; // e.g. "pcs", "ml", "gm"
}

export interface PackArrival {
  id: number;
  packItemId: number;
  quantity: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface PackDistribution {
  id: number;
  packItemId: number;
  staffId: number;
  quantity: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
}
