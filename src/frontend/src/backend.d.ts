import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface EquipmentItem {
    id: bigint;
    name: string;
}
export interface HomeServiceSettlement {
    id: bigint;
    staffId: bigint;
    clientName: string;
    clientPaid: bigint;
    date: string;
    serviceAmount: bigint;
    notes: string;
    travelExpense: bigint;
}
export interface CashEntry {
    id: bigint;
    entryType: string;
    date: string;
    description: string;
    recipientStaffId: bigint;
    notes: string;
    amount: bigint;
}
export interface EquipmentCheckout {
    id: bigint;
    staffId: bigint;
    date: string;
    takenAt: string;
    equipmentId: bigint;
    returnedAt: string;
}
export interface UsageRecord {
    id: bigint;
    categoryId: bigint;
    staffId: bigint;
    clientName: string;
    date: string;
    time: string;
    productId: bigint;
    quantity: bigint;
}
export interface Staff {
    id: bigint;
    name: string;
    role: string;
    mobile: string;
}
export interface AttendanceEntry {
    id: bigint;
    status: string;
    staffId: bigint;
    date: string;
}
export interface Category {
    id: bigint;
    name: string;
}
export interface Product {
    id: bigint;
    categoryId: bigint;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    brand: string;
    currentStock: bigint;
    rackNumber: string;
    openingStock: bigint;
}
export interface backendInterface {
    addCashEntry(date: string, entryType: string, amount: bigint, description: string, recipientStaffId: bigint, notes: string): Promise<void>;
    addCategory(name: string): Promise<Category>;
    addEquipmentCheckout(staffId: bigint, equipmentId: bigint, date: string, takenAt: string): Promise<void>;
    addEquipmentItem(name: string): Promise<EquipmentItem>;
    addHomeServiceSettlement(date: string, staffId: bigint, clientName: string, serviceAmount: bigint, clientPaid: bigint, travelExpense: bigint, notes: string): Promise<void>;
    addProduct(name: string, categoryId: bigint, openingStock: bigint, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<Product>;
    addStaff(name: string, role: string, mobile: string): Promise<Staff>;
    addUsageRecord(date: string, productId: bigint, categoryId: bigint, staffId: bigint, quantity: bigint, time: string, clientName: string): Promise<void>;
    clearAttendance(date: string, staffId: bigint): Promise<void>;
    deleteCashEntry(id: bigint): Promise<void>;
    deleteCategory(id: bigint): Promise<void>;
    deleteEquipmentItem(id: bigint): Promise<void>;
    deleteHomeServiceSettlement(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    deleteStaff(id: bigint): Promise<void>;
    deleteUsageRecord(id: bigint): Promise<void>;
    getAttendanceEntries(): Promise<Array<AttendanceEntry>>;
    getCashEntries(): Promise<Array<CashEntry>>;
    getCategories(): Promise<Array<Category>>;
    getEquipmentCheckouts(): Promise<Array<EquipmentCheckout>>;
    getEquipmentItems(): Promise<Array<EquipmentItem>>;
    getHomeServiceSettlements(): Promise<Array<HomeServiceSettlement>>;
    getProducts(): Promise<Array<Product>>;
    getStaff(): Promise<Array<Staff>>;
    getUsageRecords(): Promise<Array<UsageRecord>>;
    markAllPresent(date: string, staffIds: Array<bigint>): Promise<void>;
    returnEquipmentCheckout(id: bigint, returnedAt: string): Promise<void>;
    setAttendance(date: string, staffId: bigint, status: string): Promise<void>;
    updateProduct(id: bigint, name: string, categoryId: bigint, currentStock: bigint, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<void>;
    updateStaff(id: bigint, name: string, role: string, mobile: string): Promise<void>;
}
