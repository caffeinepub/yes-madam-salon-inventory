import type {
  AttendanceRecord,
  AttendanceStatus,
  CashEntry,
  Category,
  EquipmentCheckout,
  EquipmentItem,
  HomeServiceSettlement,
  PackArrival,
  PackDistribution,
  PackItem,
  Product,
  ProductEdits,
  Staff,
  StockOverrides,
  UsageRecord,
} from "../types";

const KEYS = {
  CATEGORIES: "ym_categories",
  PRODUCTS: "ym_products",
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
  PACK_ITEMS: "ym_pack_items",
  PACK_ARRIVALS: "ym_pack_arrivals",
  PACK_DISTRIBUTIONS: "ym_pack_distributions",
} as const;

// ── Categories ────────────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Category[] = [];

export function getCategories(): Category[] {
  const stored = safeGet<Category[] | null>(KEYS.CATEGORIES, null);
  if (stored === null) {
    return DEFAULT_CATEGORIES;
  }
  return stored;
}

export function saveCategories(cats: Category[]): void {
  safeSet(KEYS.CATEGORIES, cats);
}

export function addCategory(name: string): Category {
  const cats = getCategories();
  const next: Category = {
    id: cats.length > 0 ? Math.max(...cats.map((c) => c.id)) + 1 : 1,
    name,
  };
  saveCategories([...cats, next]);
  return next;
}

export function deleteCategory(id: number): void {
  saveCategories(getCategories().filter((c) => c.id !== id));
}

// ── Products ───────────────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  return safeGet<Product[]>(KEYS.PRODUCTS, []);
}

export function saveProducts(products: Product[]): void {
  safeSet(KEYS.PRODUCTS, products);
}

export function addProduct(
  data: Omit<Product, "id" | "brand" | "currentStock">,
): Product {
  const products = getProducts();
  const next: Product = {
    id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
    brand: "Yes Madam",
    currentStock: data.openingStock,
    ...data,
  };
  saveProducts([...products, next]);
  return next;
}

export function updateProduct(
  id: number,
  updates: Partial<Omit<Product, "id" | "brand">>,
): void {
  saveProducts(
    getProducts().map((p) => (p.id === id ? { ...p, ...updates } : p)),
  );
}

export function deleteProduct(id: number): void {
  saveProducts(getProducts().filter((p) => p.id !== id));
}

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

// ── Staff ───────────────────────────────────────────────────────────────────────────────

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
  // Directly decrement product currentStock
  saveProducts(
    getProducts().map((p) =>
      p.id === record.productId
        ? { ...p, currentStock: Math.max(0, p.currentStock - record.quantity) }
        : p,
    ),
  );
  return next;
}

// ── Stock Overrides ──────────────────────────────────────────────────────────────────

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

// ── Product Edits ─────────────────────────────────────────────────────────────────────

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

// ── Rack Numbers ───────────────────────────────────────────────────────────────────────

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

// ── Equipment Items ──────────────────────────────────────────────────────────────────

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

// ── Equipment Checkouts ──────────────────────────────────────────────────────────────

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

// ── Attendance ──────────────────────────────────────────────────────────────────────────

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

// ── Cash Ledger ───────────────────────────────────────────────────────────────────────

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

// ── Home Service Settlements ──────────────────────────────────────────────────────────

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

export function deleteUsageRecord(id: number): void {
  const records = getUsageRecords();
  const deleted = records.find((r) => r.id === id);
  if (deleted) {
    // Restore product stock
    saveProducts(
      getProducts().map((p) =>
        p.id === deleted.productId
          ? { ...p, currentStock: p.currentStock + deleted.quantity }
          : p,
      ),
    );
  }
  saveUsageRecords(records.filter((r) => r.id !== id));
}

// ── Pack Items ────────────────────────────────────────────────────────────────────────────

export function getPackItems(): PackItem[] {
  return safeGet<PackItem[]>(KEYS.PACK_ITEMS, []);
}

export function savePackItems(items: PackItem[]): void {
  safeSet(KEYS.PACK_ITEMS, items);
}

export function addPackItem(name: string, unit: string): PackItem {
  const items = getPackItems();
  const next: PackItem = {
    id: items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,
    name,
    unit,
  };
  savePackItems([...items, next]);
  return next;
}

export function deletePackItem(id: number): void {
  savePackItems(getPackItems().filter((i) => i.id !== id));
}

// ── Pack Arrivals ──────────────────────────────────────────────────────────────────────

export function getPackArrivals(): PackArrival[] {
  return safeGet<PackArrival[]>(KEYS.PACK_ARRIVALS, []);
}

export function savePackArrivals(arrivals: PackArrival[]): void {
  safeSet(KEYS.PACK_ARRIVALS, arrivals);
}

export function addPackArrival(
  packItemId: number,
  quantity: number,
  date: string,
  notes?: string,
): PackArrival {
  const arrivals = getPackArrivals();
  const next: PackArrival = {
    id: arrivals.length > 0 ? Math.max(...arrivals.map((a) => a.id)) + 1 : 1,
    packItemId,
    quantity,
    date,
    notes,
  };
  savePackArrivals([...arrivals, next]);
  return next;
}

export function deletePackArrival(id: number): void {
  savePackArrivals(getPackArrivals().filter((a) => a.id !== id));
}

// ── Pack Distributions ─────────────────────────────────────────────────────────────

export function getPackDistributions(): PackDistribution[] {
  return safeGet<PackDistribution[]>(KEYS.PACK_DISTRIBUTIONS, []);
}

export function savePackDistributions(distributions: PackDistribution[]): void {
  safeSet(KEYS.PACK_DISTRIBUTIONS, distributions);
}

export function addPackDistribution(
  packItemId: number,
  staffId: number,
  quantity: number,
  date: string,
  time: string,
  notes?: string,
): PackDistribution {
  const distributions = getPackDistributions();
  const next: PackDistribution = {
    id:
      distributions.length > 0
        ? Math.max(...distributions.map((d) => d.id)) + 1
        : 1,
    packItemId,
    staffId,
    quantity,
    date,
    time,
    notes,
  };
  savePackDistributions([...distributions, next]);
  return next;
}

export function deletePackDistribution(id: number): void {
  savePackDistributions(getPackDistributions().filter((d) => d.id !== id));
}
