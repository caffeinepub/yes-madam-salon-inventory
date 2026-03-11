/**
 * dataService.ts — Backend-backed data service.
 * Replaces localStorage.ts. All functions are async and call the backend canister.
 * Exported function signatures mirror localStorage.ts so pages need minimal changes.
 */
import type { backendInterface } from "@/backend";
import { createActorWithConfig } from "@/config";

let _actorPromise: Promise<backendInterface> | null = null;

function getActor(): Promise<backendInterface> {
  if (!_actorPromise) {
    _actorPromise = createActorWithConfig();
  }
  return _actorPromise;
}

// Allow actor to be refreshed (e.g., after auth change)
export function resetActor() {
  _actorPromise = null;
}
import type {
  AttendanceRecord,
  AttendanceStatus,
  CashEntry,
  CashEntryType,
  Category,
  EquipmentCheckout,
  EquipmentItem,
  HomeServiceSettlement,
  Product,
  Staff,
  UsageRecord,
} from "../types";

// ── Converters ────────────────────────────────────────────────────────────────

function toCategory(b: { id: bigint; name: string }): Category {
  return { id: Number(b.id), name: b.name };
}

function toProduct(b: {
  id: bigint;
  name: string;
  brand: string;
  categoryId: bigint;
  openingStock: bigint;
  currentStock: bigint;
  unit: string;
  lowStockThreshold: bigint;
  rackNumber: string;
}): Product {
  return {
    id: Number(b.id),
    name: b.name,
    brand: b.brand || "Yes Madam",
    categoryId: Number(b.categoryId),
    openingStock: Number(b.openingStock),
    currentStock: Number(b.currentStock),
    unit: b.unit,
    lowStockThreshold: Number(b.lowStockThreshold),
    rackNumber: b.rackNumber || undefined,
  };
}

function toStaff(b: {
  id: bigint;
  name: string;
  role: string;
  mobile: string;
}): Staff {
  return {
    id: Number(b.id),
    name: b.name,
    role: b.role,
    mobile: b.mobile || undefined,
  };
}

function toUsageRecord(b: {
  id: bigint;
  date: string;
  productId: bigint;
  categoryId: bigint;
  staffId: bigint;
  quantity: bigint;
  time: string;
  clientName: string;
}): UsageRecord {
  return {
    id: Number(b.id),
    date: b.date,
    productId: Number(b.productId),
    categoryId: Number(b.categoryId),
    staffId: Number(b.staffId),
    quantity: Number(b.quantity),
    time: b.time,
    clientName: b.clientName || undefined,
  };
}

function toEquipmentItem(b: { id: bigint; name: string }): EquipmentItem {
  return { id: Number(b.id), name: b.name };
}

function toEquipmentCheckout(b: {
  id: bigint;
  staffId: bigint;
  equipmentId: bigint;
  date: string;
  takenAt: string;
  returnedAt: string;
}): EquipmentCheckout {
  return {
    id: Number(b.id),
    staffId: Number(b.staffId),
    equipmentId: Number(b.equipmentId),
    date: b.date,
    takenAt: b.takenAt,
    returnedAt: b.returnedAt || undefined,
  };
}

function toCashEntry(b: {
  id: bigint;
  date: string;
  entryType: string;
  amount: bigint;
  description: string;
  recipientStaffId: bigint;
  notes: string;
}): CashEntry {
  return {
    id: Number(b.id),
    date: b.date,
    type: b.entryType as CashEntryType,
    amount: Number(b.amount),
    description: b.description,
    recipientStaffId:
      b.recipientStaffId !== 0n ? Number(b.recipientStaffId) : undefined,
    notes: b.notes || undefined,
  };
}

function toHomeServiceSettlement(b: {
  id: bigint;
  date: string;
  staffId: bigint;
  clientName: string;
  serviceAmount: bigint;
  clientPaid: bigint;
  travelExpense: bigint;
  notes: string;
}): HomeServiceSettlement {
  return {
    id: Number(b.id),
    date: b.date,
    staffId: Number(b.staffId),
    clientName: b.clientName,
    serviceAmount: Number(b.serviceAmount),
    clientPaid: Number(b.clientPaid),
    travelExpense: Number(b.travelExpense),
    notes: b.notes || undefined,
  };
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const actor = await getActor();
  const result = await actor.getCategories();
  return result.map(toCategory);
}

export async function addCategory(name: string): Promise<Category> {
  const actor = await getActor();
  const result = await actor.addCategory(name);
  return toCategory(result);
}

export async function deleteCategory(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteCategory(BigInt(id));
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const actor = await getActor();
  const result = await actor.getProducts();
  return result.map(toProduct);
}

export async function addProduct(
  data: Omit<Product, "id" | "brand" | "currentStock">,
): Promise<Product> {
  const actor = await getActor();
  const result = await actor.addProduct(
    data.name,
    BigInt(data.categoryId),
    BigInt(data.openingStock),
    data.unit,
    BigInt(data.lowStockThreshold),
    data.rackNumber ?? "",
  );
  return toProduct(result);
}

export async function updateProduct(
  id: number,
  updates: Partial<Omit<Product, "id" | "brand">>,
): Promise<void> {
  // We need all fields for updateProduct; fetch current if partial
  const products = await getProducts();
  const current = products.find((p) => p.id === id);
  if (!current) return;
  const merged = { ...current, ...updates };
  const actor = await getActor();
  await actor.updateProduct(
    BigInt(id),
    merged.name,
    BigInt(merged.categoryId),
    BigInt(merged.currentStock),
    merged.unit,
    BigInt(merged.lowStockThreshold),
    merged.rackNumber ?? "",
  );
}

export async function deleteProduct(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteProduct(BigInt(id));
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<Staff[]> {
  const actor = await getActor();
  const result = await actor.getStaff();
  return result.map(toStaff);
}

export async function addStaff(
  name: string,
  role: string,
  mobile?: string,
): Promise<Staff> {
  const actor = await getActor();
  const result = await actor.addStaff(name, role, mobile ?? "");
  return toStaff(result);
}

export async function updateStaff(
  id: number,
  name: string,
  role: string,
  mobile?: string,
): Promise<void> {
  const actor = await getActor();
  await actor.updateStaff(BigInt(id), name, role, mobile ?? "");
}

export async function deleteStaff(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteStaff(BigInt(id));
}

// ── Usage Records ─────────────────────────────────────────────────────────────

export async function getUsageRecords(): Promise<UsageRecord[]> {
  const actor = await getActor();
  const result = await actor.getUsageRecords();
  return result.map(toUsageRecord);
}

export async function addUsageRecord(
  record: Omit<UsageRecord, "id">,
): Promise<UsageRecord> {
  const actor = await getActor();
  await actor.addUsageRecord(
    record.date,
    BigInt(record.productId),
    BigInt(record.categoryId),
    BigInt(record.staffId),
    BigInt(record.quantity),
    record.time,
    record.clientName ?? "",
  );
  // Return a stub - the caller doesn't usually need the returned record
  return { id: 0, ...record };
}

export async function deleteUsageRecord(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteUsageRecord(BigInt(id));
}

// ── Equipment Items ───────────────────────────────────────────────────────────

export async function getEquipmentItems(): Promise<EquipmentItem[]> {
  const actor = await getActor();
  const result = await actor.getEquipmentItems();
  return result.map(toEquipmentItem);
}

export async function addEquipmentItem(name: string): Promise<EquipmentItem> {
  const actor = await getActor();
  const result = await actor.addEquipmentItem(name);
  return toEquipmentItem(result);
}

export async function deleteEquipmentItem(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteEquipmentItem(BigInt(id));
}

// ── Equipment Checkouts ───────────────────────────────────────────────────────

export async function getEquipmentCheckouts(): Promise<EquipmentCheckout[]> {
  const actor = await getActor();
  const result = await actor.getEquipmentCheckouts();
  return result.map(toEquipmentCheckout);
}

export async function addEquipmentCheckout(
  staffId: number,
  equipmentId: number,
): Promise<EquipmentCheckout> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const takenAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const actor = await getActor();
  await actor.addEquipmentCheckout(
    BigInt(staffId),
    BigInt(equipmentId),
    date,
    takenAt,
  );
  // Auto-mark attendance as present
  try {
    await actor.setAttendance(date, BigInt(staffId), "present");
  } catch {
    // ignore attendance error
  }
  return {
    id: 0,
    staffId,
    equipmentId,
    date,
    takenAt,
  };
}

export async function returnEquipmentCheckout(id: number): Promise<void> {
  const now = new Date();
  const returnedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const actor = await getActor();
  await actor.returnEquipmentCheckout(BigInt(id), returnedAt);
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendanceRecord(): Promise<AttendanceRecord> {
  const actor = await getActor();
  const entries = await actor.getAttendanceEntries();
  const record: AttendanceRecord = {};
  for (const e of entries) {
    if (!record[e.date]) record[e.date] = {};
    record[e.date][Number(e.staffId)] = e.status as AttendanceStatus;
  }
  return record;
}

export async function getAttendanceForDate(
  date: string,
): Promise<Record<number, AttendanceStatus>> {
  const record = await getAttendanceRecord();
  return record[date] ?? {};
}

export async function setAttendanceStatus(
  staffId: number,
  date: string,
  status: AttendanceStatus,
): Promise<void> {
  const actor = await getActor();
  await actor.setAttendance(date, BigInt(staffId), status);
}

export async function clearAttendanceStatus(
  staffId: number,
  date: string,
): Promise<void> {
  const actor = await getActor();
  await actor.clearAttendance(date, BigInt(staffId));
}

export async function markAllPresentForDate(
  staffIds: number[],
  date: string,
): Promise<void> {
  const actor = await getActor();
  await actor.markAllPresent(
    date,
    staffIds.map((id) => BigInt(id)),
  );
}

// ── Cash Entries ──────────────────────────────────────────────────────────────

export async function getCashEntries(): Promise<CashEntry[]> {
  const actor = await getActor();
  const result = await actor.getCashEntries();
  return result.map(toCashEntry);
}

export async function getCashEntriesForDate(
  date: string,
): Promise<CashEntry[]> {
  const all = await getCashEntries();
  return all.filter((e) => e.date === date);
}

export async function addCashEntry(
  entry: Omit<CashEntry, "id">,
): Promise<CashEntry> {
  const actor = await getActor();
  await actor.addCashEntry(
    entry.date,
    entry.type,
    BigInt(Math.round(entry.amount)),
    entry.description,
    BigInt(entry.recipientStaffId ?? 0),
    entry.notes ?? "",
  );
  return { id: 0, ...entry };
}

export async function deleteCashEntry(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteCashEntry(BigInt(id));
}

export async function getRideBalanceByStaff(): Promise<
  Record<number, { totalAmount: number; entries: CashEntry[] }>
> {
  const allEntries = await getCashEntries();
  const entries = allEntries.filter((e) => e.type === "ride");
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

export async function getHomeServiceSettlements(): Promise<
  HomeServiceSettlement[]
> {
  const actor = await getActor();
  const result = await actor.getHomeServiceSettlements();
  return result.map(toHomeServiceSettlement);
}

export async function getHomeServiceSettlementsForDate(
  date: string,
): Promise<HomeServiceSettlement[]> {
  const all = await getHomeServiceSettlements();
  return all.filter((s) => s.date === date);
}

export async function addHomeServiceSettlement(
  s: Omit<HomeServiceSettlement, "id">,
): Promise<HomeServiceSettlement> {
  const actor = await getActor();
  await actor.addHomeServiceSettlement(
    s.date,
    BigInt(s.staffId),
    s.clientName,
    BigInt(Math.round(s.serviceAmount)),
    BigInt(Math.round(s.clientPaid)),
    BigInt(Math.round(s.travelExpense)),
    s.notes ?? "",
  );
  return { id: 0, ...s };
}

export async function deleteHomeServiceSettlement(id: number): Promise<void> {
  const actor = await getActor();
  await actor.deleteHomeServiceSettlement(BigInt(id));
}
