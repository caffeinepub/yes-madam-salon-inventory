import type {
  AttendanceRecord,
  AttendanceStatus,
  CashEntry,
  EquipmentCheckout,
  EquipmentItem,
  HomeServiceSettlement,
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
  RACK_NUMBERS: "ym_rack_numbers",
  EQUIPMENT_ITEMS: "ym_equipment_items",
  EQUIPMENT_CHECKOUTS: "ym_equipment_checkouts",
  ATTENDANCE: "ym_attendance",
  CASH_ENTRIES: "ym_cash_entries",
  HOME_SERVICE_SETTLEMENTS: "ym_home_service_settlements",
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

export function addStaff(name: string, role: string, mobile?: string): Staff {
  const staff = getStaff();
  const next: Staff = {
    id: staff.length > 0 ? Math.max(...staff.map((s) => s.id)) + 1 : 1,
    name,
    role,
    mobile,
  };
  saveStaff([...staff, next]);
  return next;
}

export function updateStaff(
  id: number,
  name: string,
  role: string,
  mobile?: string,
): void {
  const staff = getStaff().map((s) =>
    s.id === id ? { ...s, name, role, mobile } : s,
  );
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
    rackNumber?: string;
  },
): void {
  const edits = getProductEdits();
  edits[productId] = edit;
  safeSet(KEYS.PRODUCT_EDITS, edits);
}

// ── Rack Numbers ──────────────────────────────────────────────────────────────

export function getRackNumbers(): Record<number, string> {
  return safeGet<Record<number, string>>(KEYS.RACK_NUMBERS, {});
}

export function setRackNumber(productId: number, rack: string): void {
  const rackNumbers = getRackNumbers();
  rackNumbers[productId] = rack;
  safeSet(KEYS.RACK_NUMBERS, rackNumbers);
}

export function deleteProductEdit(productId: number): void {
  const edits = getProductEdits();
  delete edits[productId];
  safeSet(KEYS.PRODUCT_EDITS, edits);
}

// ── Equipment Items ───────────────────────────────────────────────────────────

export function getEquipmentItems(): EquipmentItem[] {
  return safeGet<EquipmentItem[]>(KEYS.EQUIPMENT_ITEMS, []);
}

export function saveEquipmentItems(items: EquipmentItem[]): void {
  safeSet(KEYS.EQUIPMENT_ITEMS, items);
}

export function addEquipmentItem(name: string): EquipmentItem {
  const items = getEquipmentItems();
  const next: EquipmentItem = {
    id: items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,
    name,
  };
  saveEquipmentItems([...items, next]);
  return next;
}

export function deleteEquipmentItem(id: number): void {
  saveEquipmentItems(getEquipmentItems().filter((i) => i.id !== id));
}

// ── Equipment Checkouts ───────────────────────────────────────────────────────

export function getEquipmentCheckouts(): EquipmentCheckout[] {
  return safeGet<EquipmentCheckout[]>(KEYS.EQUIPMENT_CHECKOUTS, []);
}

export function saveEquipmentCheckouts(records: EquipmentCheckout[]): void {
  safeSet(KEYS.EQUIPMENT_CHECKOUTS, records);
}

export function addEquipmentCheckout(
  staffId: number,
  equipmentId: number,
): EquipmentCheckout {
  const records = getEquipmentCheckouts();
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const takenAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const next: EquipmentCheckout = {
    id: records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1,
    staffId,
    equipmentId,
    date,
    takenAt,
  };
  saveEquipmentCheckouts([...records, next]);
  // Auto-mark staff as present when they check out equipment
  const attendance = getAttendanceRecord();
  if (!attendance[date]) attendance[date] = {};
  if (!attendance[date][staffId]) {
    attendance[date][staffId] = "present";
    safeSet(KEYS.ATTENDANCE, attendance);
  }
  return next;
}

export function returnEquipmentCheckout(id: number): void {
  const now = new Date();
  const returnedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const records = getEquipmentCheckouts().map((r) =>
    r.id === id ? { ...r, returnedAt } : r,
  );
  saveEquipmentCheckouts(records);
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function getAttendanceRecord(): AttendanceRecord {
  return safeGet<AttendanceRecord>(KEYS.ATTENDANCE, {});
}

export function getAttendanceForDate(
  date: string,
): Record<number, AttendanceStatus> {
  const record = getAttendanceRecord();
  return record[date] ?? {};
}

export function setAttendanceStatus(
  staffId: number,
  date: string,
  status: AttendanceStatus,
): void {
  const record = getAttendanceRecord();
  if (!record[date]) record[date] = {};
  record[date][staffId] = status;
  safeSet(KEYS.ATTENDANCE, record);
}

export function clearAttendanceStatus(staffId: number, date: string): void {
  const record = getAttendanceRecord();
  if (record[date]) {
    delete record[date][staffId];
    safeSet(KEYS.ATTENDANCE, record);
  }
}

export function markAllPresentForDate(staffIds: number[], date: string): void {
  const record = getAttendanceRecord();
  if (!record[date]) record[date] = {};
  for (const id of staffIds) {
    if (!record[date][id]) {
      record[date][id] = "present";
    }
  }
  safeSet(KEYS.ATTENDANCE, record);
}

// ── Cash Ledger ───────────────────────────────────────────────────────────────

export function getCashEntries(): CashEntry[] {
  return safeGet<CashEntry[]>(KEYS.CASH_ENTRIES, []);
}

export function saveCashEntries(entries: CashEntry[]): void {
  safeSet(KEYS.CASH_ENTRIES, entries);
}

export function addCashEntry(entry: Omit<CashEntry, "id">): CashEntry {
  const entries = getCashEntries();
  const next: CashEntry = {
    id: entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1,
    ...entry,
  };
  saveCashEntries([...entries, next]);
  return next;
}

export function deleteCashEntry(id: number): void {
  saveCashEntries(getCashEntries().filter((e) => e.id !== id));
}

export function getCashEntriesForDate(date: string): CashEntry[] {
  return getCashEntries().filter((e) => e.date === date);
}

// Returns per-staff cumulative ride balance across all dates
// balance = total amount that a staff gave (ride entries) - we track all rides per staff
export function getRideBalanceByStaff(): Record<
  number,
  { totalAmount: number; entries: CashEntry[] }
> {
  const entries = getCashEntries().filter((e) => e.type === "ride");
  const result: Record<number, { totalAmount: number; entries: CashEntry[] }> =
    {};
  for (const entry of entries) {
    if (entry.recipientStaffId == null) continue;
    const sid = entry.recipientStaffId;
    if (!result[sid]) result[sid] = { totalAmount: 0, entries: [] };
    result[sid].totalAmount += entry.amount;
    result[sid].entries.push(entry);
  }
  return result;
}

// ── Home Service Settlements ──────────────────────────────────────────────────

export function getHomeServiceSettlements(): HomeServiceSettlement[] {
  return safeGet<HomeServiceSettlement[]>(KEYS.HOME_SERVICE_SETTLEMENTS, []);
}

export function saveHomeServiceSettlements(
  settlements: HomeServiceSettlement[],
): void {
  safeSet(KEYS.HOME_SERVICE_SETTLEMENTS, settlements);
}

export function addHomeServiceSettlement(
  s: Omit<HomeServiceSettlement, "id">,
): HomeServiceSettlement {
  const all = getHomeServiceSettlements();
  const next: HomeServiceSettlement = {
    id: all.length > 0 ? Math.max(...all.map((x) => x.id)) + 1 : 1,
    ...s,
  };
  saveHomeServiceSettlements([...all, next]);
  return next;
}

export function deleteHomeServiceSettlement(id: number): void {
  saveHomeServiceSettlements(
    getHomeServiceSettlements().filter((s) => s.id !== id),
  );
}

export function getHomeServiceSettlementsForDate(
  date: string,
): HomeServiceSettlement[] {
  return getHomeServiceSettlements().filter((s) => s.date === date);
}
