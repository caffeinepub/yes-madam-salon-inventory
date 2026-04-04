/**
 * backendService.ts
 * Async wrapper around the ICP backend actor.
 * All IDs are converted bigint <-> number at the boundary.
 */
import { useActor } from "../hooks/useActor";
import type {
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
  Staff,
  UsageRecord,
} from "../types";

// ── Actor singleton access ─────────────────────────────────────────────────
// Pages that call dataService functions directly pass the actor via context.
// useQueries.ts provides the actor from useActor().
// For direct (non-hook) calls we expose a module-level setter so the actor
// can be injected once it's available.

let _actor: import("../backend").backendInterface | null = null;

export function setActor(actor: import("../backend").backendInterface | null) {
  _actor = actor;
}

function getActor(): import("../backend").backendInterface {
  if (!_actor) throw new Error("Backend actor not initialised");
  return _actor;
}

// ── Type converters ────────────────────────────────────────────────────────

function toCategory(b: {
  id: bigint;
  name: string;
}): Category {
  return { id: Number(b.id), name: b.name };
}

function toProduct(b: {
  id: bigint;
  name: string;
  brand: string;
  categoryId: bigint;
  openingStock: bigint;
  openingDate: string;
  currentStock: bigint;
  unit: string;
  lowStockThreshold: bigint;
  rackNumber: string;
}): Product {
  return {
    id: Number(b.id),
    name: b.name,
    brand: b.brand,
    categoryId: Number(b.categoryId),
    openingStock: Number(b.openingStock),
    openingDate: b.openingDate,
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
  pinned: boolean;
}): Staff {
  return {
    id: Number(b.id),
    name: b.name,
    role: b.role,
    mobile: b.mobile || undefined,
    pinned: b.pinned,
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
  entryType: string;
  date: string;
  description: string;
  recipientStaffId: bigint;
  notes: string;
  amount: bigint;
}): CashEntry {
  return {
    id: Number(b.id),
    date: b.date,
    type: b.entryType as CashEntry["type"],
    description: b.description,
    amount: Number(b.amount),
    notes: b.notes || undefined,
    recipientStaffId:
      Number(b.recipientStaffId) !== 0 ? Number(b.recipientStaffId) : undefined,
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

function toPackItem(b: { id: bigint; name: string; unit: string }): PackItem {
  return { id: Number(b.id), name: b.name, unit: b.unit };
}

function toPackArrival(b: {
  id: bigint;
  packItemId: bigint;
  quantity: bigint;
  date: string;
  notes: string;
}): PackArrival {
  return {
    id: Number(b.id),
    packItemId: Number(b.packItemId),
    quantity: Number(b.quantity),
    date: b.date,
    notes: b.notes || undefined,
  };
}

function toPackDistribution(b: {
  id: bigint;
  packItemId: bigint;
  staffId: bigint;
  quantity: bigint;
  date: string;
  time: string;
  notes: string;
}): PackDistribution {
  return {
    id: Number(b.id),
    packItemId: Number(b.packItemId),
    staffId: Number(b.staffId),
    quantity: Number(b.quantity),
    date: b.date,
    time: b.time,
    notes: b.notes || undefined,
  };
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const result = await getActor().getCategories();
  return result.map(toCategory);
}

export async function addCategory(name: string): Promise<Category> {
  const result = await getActor().addCategory(name);
  return toCategory(result);
}

export async function deleteCategory(id: number): Promise<void> {
  await getActor().deleteCategory(BigInt(id));
}

// ── Products ───────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const result = await getActor().getProducts();
  return result.map(toProduct);
}

export async function addProduct(
  data: Omit<Product, "id" | "brand" | "currentStock">,
): Promise<Product> {
  const result = await getActor().addProduct(
    data.name,
    BigInt(data.categoryId),
    BigInt(data.openingStock),
    data.openingDate,
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
  // We need to fetch the current product to fill in missing fields
  const products = await getProducts();
  const existing = products.find((p) => p.id === id);
  if (!existing) throw new Error(`Product ${id} not found`);
  await getActor().updateProduct(
    BigInt(id),
    updates.name ?? existing.name,
    BigInt(updates.categoryId ?? existing.categoryId),
    BigInt(updates.openingStock ?? existing.openingStock),
    updates.openingDate ?? existing.openingDate,
    BigInt(updates.currentStock ?? existing.currentStock),
    updates.unit ?? existing.unit,
    BigInt(updates.lowStockThreshold ?? existing.lowStockThreshold),
    updates.rackNumber ?? existing.rackNumber ?? "",
  );
}

export async function deleteProduct(id: number): Promise<void> {
  await getActor().deleteProduct(BigInt(id));
}

export async function deleteAllProducts(): Promise<void> {
  await getActor().deleteAllProducts();
}

// ── Staff ──────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<Staff[]> {
  const result = await getActor().getStaff();
  return result.map(toStaff);
}

export async function addStaff(
  name: string,
  role: string,
  mobile?: string,
): Promise<Staff> {
  const result = await getActor().addStaff(name, role, mobile ?? "");
  return toStaff(result);
}

export async function updateStaff(
  id: number,
  name: string,
  role: string,
  mobile?: string,
): Promise<void> {
  await getActor().updateStaff(BigInt(id), name, role, mobile ?? "");
}

export async function updateStaffPin(
  id: number,
  pinned: boolean,
): Promise<void> {
  await getActor().updateStaffPin(BigInt(id), pinned);
}

export async function bulkAddStaff(
  names: string[],
  role: string,
): Promise<Staff[]> {
  const result = await getActor().bulkAddStaff(names, role);
  return result.map(toStaff);
}

export async function deleteStaff(id: number): Promise<void> {
  await getActor().deleteStaff(BigInt(id));
}

export async function deleteAllStaff(): Promise<void> {
  await getActor().deleteAllStaff();
}

// ── Usage Records ──────────────────────────────────────────────────────────

export async function getUsageRecords(): Promise<UsageRecord[]> {
  const result = await getActor().getUsageRecords();
  return result.map(toUsageRecord);
}

export async function addUsageRecord(
  record: Omit<UsageRecord, "id">,
): Promise<UsageRecord> {
  const result = await getActor().addUsageRecord(
    record.date,
    BigInt(record.productId),
    BigInt(record.categoryId),
    BigInt(record.staffId),
    BigInt(record.quantity),
    record.time,
    record.clientName ?? "",
  );
  return toUsageRecord(result);
}

export async function deleteUsageRecord(id: number): Promise<void> {
  await getActor().deleteUsageRecord(BigInt(id));
}

// ── Equipment Items ────────────────────────────────────────────────────────

export async function getEquipmentItems(): Promise<EquipmentItem[]> {
  const result = await getActor().getEquipmentItems();
  return result.map(toEquipmentItem);
}

export async function addEquipmentItem(name: string): Promise<EquipmentItem> {
  const result = await getActor().addEquipmentItem(name);
  return toEquipmentItem(result);
}

export async function deleteEquipmentItem(id: number): Promise<void> {
  await getActor().deleteEquipmentItem(BigInt(id));
}

// ── Equipment Checkouts ────────────────────────────────────────────────────

export async function getEquipmentCheckouts(): Promise<EquipmentCheckout[]> {
  const result = await getActor().getEquipmentCheckouts();
  return result.map(toEquipmentCheckout);
}

export async function addEquipmentCheckout(
  staffId: number,
  equipmentId: number,
): Promise<EquipmentCheckout> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const takenAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const result = await getActor().addEquipmentCheckout(
    BigInt(staffId),
    BigInt(equipmentId),
    date,
    takenAt,
  );
  // Auto-mark staff attendance
  try {
    await getActor().setAttendance(date, BigInt(staffId), "present");
  } catch {
    // Silently ignore attendance errors
  }
  return toEquipmentCheckout(result);
}

export async function returnEquipmentCheckout(id: number): Promise<void> {
  const now = new Date();
  const returnedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  await getActor().returnEquipmentCheckout(BigInt(id), returnedAt);
}

// ── Attendance ─────────────────────────────────────────────────────────────

export async function getAttendanceForDate(
  date: string,
): Promise<Record<number, AttendanceStatus>> {
  const entries = await getActor().getAttendanceEntries();
  const result: Record<number, AttendanceStatus> = {};
  for (const entry of entries) {
    if (entry.date === date) {
      result[Number(entry.staffId)] = entry.status as AttendanceStatus;
    }
  }
  return result;
}

export async function setAttendanceStatus(
  staffId: number,
  date: string,
  status: AttendanceStatus,
): Promise<void> {
  await getActor().setAttendance(date, BigInt(staffId), status);
}

export async function clearAttendanceStatus(
  staffId: number,
  date: string,
): Promise<void> {
  await getActor().clearAttendance(date, BigInt(staffId));
}

export async function markAllPresentForDate(
  staffIds: number[],
  date: string,
): Promise<void> {
  await getActor().markAllPresent(
    date,
    staffIds.map((id) => BigInt(id)),
  );
}

// ── Cash Ledger ────────────────────────────────────────────────────────────

export async function getCashEntries(): Promise<CashEntry[]> {
  const result = await getActor().getCashEntries();
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
  const result = await getActor().addCashEntry(
    entry.date,
    entry.type,
    BigInt(Math.round(entry.amount)),
    entry.description,
    BigInt(entry.recipientStaffId ?? 0),
    entry.notes ?? "",
  );
  return toCashEntry(result);
}

export async function deleteCashEntry(id: number): Promise<void> {
  await getActor().deleteCashEntry(BigInt(id));
}

export async function getRideBalanceByStaff(): Promise<
  Record<number, { totalAmount: number; entries: CashEntry[] }>
> {
  const entries = await getCashEntries();
  const rideEntries = entries.filter((e) => e.type === "ride");
  const result: Record<number, { totalAmount: number; entries: CashEntry[] }> =
    {};
  for (const entry of rideEntries) {
    if (entry.recipientStaffId == null) continue;
    const sid = entry.recipientStaffId;
    if (!result[sid]) result[sid] = { totalAmount: 0, entries: [] };
    result[sid].totalAmount += entry.amount;
    result[sid].entries.push(entry);
  }
  return result;
}

// ── Home Service Settlements ───────────────────────────────────────────────

export async function getHomeServiceSettlements(): Promise<
  HomeServiceSettlement[]
> {
  const result = await getActor().getHomeServiceSettlements();
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
  const result = await getActor().addHomeServiceSettlement(
    s.date,
    BigInt(s.staffId),
    s.clientName,
    BigInt(Math.round(s.serviceAmount)),
    BigInt(Math.round(s.clientPaid)),
    BigInt(Math.round(s.travelExpense)),
    s.notes ?? "",
  );
  return toHomeServiceSettlement(result);
}

export async function deleteHomeServiceSettlement(id: number): Promise<void> {
  await getActor().deleteHomeServiceSettlement(BigInt(id));
}

// ── Pack Tracker Items ─────────────────────────────────────────────────────

export async function getPackItems(): Promise<PackItem[]> {
  const result = await getActor().getPackItems();
  return result.map(toPackItem);
}

export async function addPackItem(
  name: string,
  unit: string,
): Promise<PackItem> {
  const result = await getActor().addPackItem(name, unit);
  return toPackItem(result);
}

export async function deletePackItem(id: number): Promise<void> {
  await getActor().deletePackItem(BigInt(id));
}

// ── Pack Arrivals ──────────────────────────────────────────────────────────

export async function getPackArrivals(): Promise<PackArrival[]> {
  const result = await getActor().getPackArrivals();
  return result.map(toPackArrival);
}

export async function addPackArrival(
  packItemId: number,
  quantity: number,
  date: string,
  notes?: string,
): Promise<PackArrival> {
  const result = await getActor().addPackArrival(
    BigInt(packItemId),
    date,
    BigInt(quantity),
    notes ?? "",
  );
  return toPackArrival(result);
}

export async function deletePackArrival(id: number): Promise<void> {
  await getActor().deletePackArrival(BigInt(id));
}

// ── Pack Distributions ─────────────────────────────────────────────────────

export async function getPackDistributions(): Promise<PackDistribution[]> {
  const result = await getActor().getPackDistributions();
  return result.map(toPackDistribution);
}

export async function addPackDistribution(
  packItemId: number,
  staffId: number,
  quantity: number,
  date: string,
  time: string,
  notes?: string,
): Promise<PackDistribution> {
  const result = await getActor().addPackDistribution(
    BigInt(packItemId),
    date,
    time,
    BigInt(staffId),
    BigInt(quantity),
    notes ?? "",
  );
  return toPackDistribution(result);
}

export async function deletePackDistribution(id: number): Promise<void> {
  await getActor().deletePackDistribution(BigInt(id));
}

// ── Legacy stubs (kept for compat; no-ops since backend handles stock) ──────

export function saveProducts(_products: unknown): void {}
export function saveEquipmentItems(_items: unknown): void {}
export function saveEquipmentCheckouts(_records: unknown): void {}
export function saveCashEntries(_entries: unknown): void {}
export function saveHomeServiceSettlements(_settlements: unknown): void {}
export function savePackItems(_items: unknown): void {}
export function savePackArrivals(_arrivals: unknown): void {}
export function savePackDistributions(_distributions: unknown): void {}

// These helpers no longer needed (product data is all in backend)
export function getStockOverrides(): Record<number, number> {
  return {};
}
export function setStockOverride(_productId: number, _stock: number): void {}
export function initStockOverride(_productId: number, _stock: number): void {}
export function getProductEdits(): Record<number, unknown> {
  return {};
}
export function setProductEdit(_productId: number, _edit: unknown): void {}
export function deleteProductEdit(_productId: number): void {}
export function getRackNumbers(): Record<number, string> {
  return {};
}
export function setRackNumber(_productId: number, _rack: string): void {}
