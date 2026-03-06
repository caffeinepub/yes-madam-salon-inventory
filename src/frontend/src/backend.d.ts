import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface Category {
    id: bigint;
    name: string;
}
export interface backendInterface {
    addCategory(name: string): Promise<Category>;
    addProduct(name: string, categoryId: bigint, openingStock: bigint, unit: string, lowStockThreshold: bigint): Promise<Product>;
    deleteCategory(id: bigint): Promise<boolean>;
    getCategories(): Promise<Array<Category>>;
    getProductById(id: bigint): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
}
