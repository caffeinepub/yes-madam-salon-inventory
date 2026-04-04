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
export interface Category {
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
export interface PackDistribution {
    id: bigint;
    staffId: bigint;
    date: string;
    time: string;
    notes: string;
    quantity: bigint;
    packItemId: bigint;
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
export interface PackArrival {
    id: bigint;
    date: string;
    notes: string;
    quantity: bigint;
    packItemId: bigint;
}
export interface Staff {
    id: bigint;
    name: string;
    role: string;
    pinned: boolean;
    mobile: string;
}
export interface EquipmentCheckout {
    id: bigint;
    staffId: bigint;
    date: string;
    takenAt: string;
    equipmentId: bigint;
    returnedAt: string;
}
export interface AttendanceEntry {
    id: bigint;
    status: string;
    staffId: bigint;
    date: string;
}
export interface PackItem {
    id: bigint;
    name: string;
    unit: string;
}
export interface Product {
    id: bigint;
    categoryId: bigint;
    lowStockThreshold: bigint;
    name: string;
    unit: string;
    openingDate: string;
    brand: string;
    currentStock: bigint;
    rackNumber: string;
    openingStock: bigint;
}
export interface backendInterface {
    addCashEntry(date: string, entryType: string, amount: bigint, description: string, recipientStaffId: bigint, notes: string): Promise<CashEntry>;
    addCategory(name: string): Promise<Category>;
    addEquipmentCheckout(staffId: bigint, equipmentId: bigint, date: string, takenAt: string): Promise<EquipmentCheckout>;
    addEquipmentItem(name: string): Promise<EquipmentItem>;
    addHomeServiceSettlement(date: string, staffId: bigint, clientName: string, serviceAmount: bigint, clientPaid: bigint, travelExpense: bigint, notes: string): Promise<HomeServiceSettlement>;
    addPackArrival(packItemId: bigint, date: string, quantity: bigint, notes: string): Promise<PackArrival>;
    addPackDistribution(packItemId: bigint, date: string, time: string, staffId: bigint, quantity: bigint, notes: string): Promise<PackDistribution>;
    addPackItem(name: string, unit: string): Promise<PackItem>;
    addProduct(name: string, categoryId: bigint, openingStock: bigint, openingDate: string, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<Product>;
    addStaff(name: string, role: string, mobile: string): Promise<Staff>;
    addUsageRecord(date: string, productId: bigint, categoryId: bigint, staffId: bigint, quantity: bigint, time: string, clientName: string): Promise<UsageRecord>;
    bulkAddStaff(names: Array<string>, role: string): Promise<Array<Staff>>;
    clearAttendance(date: string, staffId: bigint): Promise<void>;
    deleteAllProducts(): Promise<void>;
    deleteAllStaff(): Promise<void>;
    deleteCashEntry(id: bigint): Promise<void>;
    deleteCategory(id: bigint): Promise<void>;
    deleteEquipmentItem(id: bigint): Promise<void>;
    deleteHomeServiceSettlement(id: bigint): Promise<void>;
    deletePackArrival(id: bigint): Promise<void>;
    deletePackDistribution(id: bigint): Promise<void>;
    deletePackItem(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    deleteStaff(id: bigint): Promise<void>;
    deleteUsageRecord(id: bigint): Promise<void>;
    getAttendanceEntries(): Promise<Array<AttendanceEntry>>;
    getCashEntries(): Promise<Array<CashEntry>>;
    getCategories(): Promise<Array<Category>>;
    getEquipmentCheckouts(): Promise<Array<EquipmentCheckout>>;
    getEquipmentItems(): Promise<Array<EquipmentItem>>;
    getHomeServiceSettlements(): Promise<Array<HomeServiceSettlement>>;
    getPackArrivals(): Promise<Array<PackArrival>>;
    getPackDistributions(): Promise<Array<PackDistribution>>;
    getPackItems(): Promise<Array<PackItem>>;
    getProducts(): Promise<Array<Product>>;
    getStaff(): Promise<Array<Staff>>;
    getUsageRecords(): Promise<Array<UsageRecord>>;
    markAllPresent(date: string, staffIds: Array<bigint>): Promise<void>;
    returnEquipmentCheckout(id: bigint, returnedAt: string): Promise<void>;
    setAttendance(date: string, staffId: bigint, status: string): Promise<AttendanceEntry>;
    updateProduct(id: bigint, name: string, categoryId: bigint, openingStock: bigint, openingDate: string, currentStock: bigint, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<void>;
    updateStaff(id: bigint, name: string, role: string, mobile: string): Promise<void>;
    updateStaffPin(id: bigint, pinned: boolean): Promise<void>;
}
