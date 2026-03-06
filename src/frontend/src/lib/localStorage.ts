import type {
  ProductEdits,
  Staff,
  StockOverrides,
  UsageRecord,
} from "../types";

const KEYS = {
  STAFF: "ym_staff",
  USAGE_RECORDS: "ym_usage_records",
  STOCK_OVERRIDES: "ym_stock_overrides",
  PRODUCT_EDITS: "ym_product_edits",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export function getStaff(): Staff[] {
  return safeGet<Staff[]>(KEYS.STAFF, []);
}

export function saveStaff(staff: Staff[]): void {
  safeSet(KEYS.STAFF, staff);
}

export function addStaff(name: string, role: string): Staff {
  const staff = getStaff();
  const next: Staff = {
    id: staff.length > 0 ? Math.max(...staff.map((s) => s.id)) + 1 : 1,
    name,
    role,
  };
  saveStaff([...staff, next]);
  return next;
}

export function updateStaff(id: number, name: string, role: string): void {
  const staff = getStaff().map((s) => (s.id === id ? { ...s, name, role } : s));
  saveStaff(staff);
}

export function deleteStaff(id: number): void {
  saveStaff(getStaff().filter((s) => s.id !== id));
}

// ── Usage Records ─────────────────────────────────────────────────────────────

export function getUsageRecords(): UsageRecord[] {
  return safeGet<UsageRecord[]>(KEYS.USAGE_RECORDS, []);
}

export function saveUsageRecords(records: UsageRecord[]): void {
  safeSet(KEYS.USAGE_RECORDS, records);
}

export function addUsageRecord(record: Omit<UsageRecord, "id">): UsageRecord {
  const records = getUsageRecords();
  const next: UsageRecord = {
    id: records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1,
    ...record,
  };
  saveUsageRecords([...records, next]);
  // deduct stock
  const overrides = getStockOverrides();
  const current =
    overrides[record.productId] !== undefined
      ? overrides[record.productId]
      : null;
  if (current !== null) {
    setStockOverride(record.productId, Math.max(0, current - record.quantity));
  }
  return next;
}

// ── Stock Overrides ───────────────────────────────────────────────────────────

export function getStockOverrides(): StockOverrides {
  return safeGet<StockOverrides>(KEYS.STOCK_OVERRIDES, {});
}

export function setStockOverride(productId: number, stock: number): void {
  const overrides = getStockOverrides();
  overrides[productId] = stock;
  safeSet(KEYS.STOCK_OVERRIDES, overrides);
}

export function initStockOverride(productId: number, stock: number): void {
  const overrides = getStockOverrides();
  if (overrides[productId] === undefined) {
    overrides[productId] = stock;
    safeSet(KEYS.STOCK_OVERRIDES, overrides);
  }
}

// ── Product Edits ─────────────────────────────────────────────────────────────

export function getProductEdits(): ProductEdits {
  return safeGet<ProductEdits>(KEYS.PRODUCT_EDITS, {});
}

export function setProductEdit(
  productId: number,
  edit: {
    name: string;
    categoryId: number;
    unit: string;
    lowStockThreshold: number;
  },
): void {
  const edits = getProductEdits();
  edits[productId] = edit;
  safeSet(KEYS.PRODUCT_EDITS, edits);
}

export function deleteProductEdit(productId: number): void {
  const edits = getProductEdits();
  delete edits[productId];
  safeSet(KEYS.PRODUCT_EDITS, edits);
}
