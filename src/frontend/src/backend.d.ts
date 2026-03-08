import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    openingStock: bigint;
}
export interface Staff {
    id: bigint;
    name: string;
    role: string;
}
export interface backendInterface {
    addCategory(name: string): Promise<Category>;
    addProduct(name: string, categoryId: bigint, openingStock: bigint, unit: string, lowStockThreshold: bigint): Promise<Product>;
    addStaff(name: string, role: string): Promise<Staff>;
    addUsageRecord(date: string, productId: bigint, categoryId: bigint, staffId: bigint, quantity: bigint, time: string, clientName: string): Promise<UsageRecord>;
    deleteCategory(id: bigint): Promise<boolean>;
    deleteProduct(id: bigint): Promise<boolean>;
    deleteStaff(id: bigint): Promise<boolean>;
    getCategories(): Promise<Array<Category>>;
    getProductById(id: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getStaff(): Promise<Array<Staff>>;
    getUsageRecords(): Promise<Array<UsageRecord>>;
    getUsageStats(): Promise<{
        totalUsageAllTime: bigint;
        totalUsageToday: bigint;
    }>;
    updateProduct(id: bigint, name: string, categoryId: bigint, currentStock: bigint, unit: string, lowStockThreshold: bigint): Promise<Product | null>;
    updateStaff(id: bigint, name: string, role: string): Promise<Staff | null>;
}
