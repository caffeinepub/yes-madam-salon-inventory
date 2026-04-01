export interface Category {
    id: bigint;
    name: string;
}
export interface Product {
    id: bigint;
    name: string;
    brand: string;
    categoryId: bigint;
    lowStockThreshold: bigint;
    unit: string;
    currentStock: bigint;
    rackNumber: string;
    openingStock: bigint;
    openingDate: string;
}
export interface backendInterface {
    addCashEntry(date: string, entryType: string, amount: bigint, description: string, recipientStaffId: bigint, notes: string): Promise<void>;
    addCategory(name: string): Promise<Category>;
    addEquipmentCheckout(staffId: bigint, equipmentId: bigint, date: string, takenAt: string): Promise<void>;
    addEquipmentItem(name: string): Promise<EquipmentItem>;
    addHomeServiceSettlement(date: string, staffId: bigint, clientName: string, serviceAmount: bigint, clientPaid: bigint, travelExpense: bigint, notes: string): Promise<void>;
    addProduct(name: string, categoryId: bigint, openingStock: bigint, openingDate: string, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<Product>;
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
    updateProduct(id: bigint, name: string, categoryId: bigint, openingStock: bigint, openingDate: string, currentStock: bigint, unit: string, lowStockThreshold: bigint, rackNumber: string): Promise<void>;
    updateStaff(id: bigint, name: string, role: string, mobile: string): Promise<void>;
}
export interface Staff {
    id: bigint;
    name: string;
    role: string;
    mobile: string;
}
export interface UsageRecord {
    id: bigint;
    date: string;
    productId: bigint;
    categoryId: bigint;
    staffId: bigint;
    quantity: bigint;
    time: string;
    clientName: string;
}
export interface EquipmentItem {
    id: bigint;
    name: string;
}
export interface EquipmentCheckout {
    id: bigint;
    staffId: bigint;
    equipmentId: bigint;
    date: string;
    takenAt: string;
    returnedAt: string;
}
export interface AttendanceEntry {
    id: bigint;
    date: string;
    staffId: bigint;
    status: string;
}
export interface CashEntry {
    id: bigint;
    date: string;
    entryType: string;
    amount: bigint;
    description: string;
    recipientStaffId: bigint;
    notes: string;
}
export interface HomeServiceSettlement {
    id: bigint;
    date: string;
    staffId: bigint;
    clientName: string;
    serviceAmount: bigint;
    clientPaid: bigint;
    travelExpense: bigint;
    notes: string;
}
