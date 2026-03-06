export interface Staff {
  id: number;
  name: string;
  role: string;
}

export interface UsageRecord {
  id: number;
  date: string; // ISO date string YYYY-MM-DD
  productId: number;
  categoryId: number;
  staffId: number;
  quantity: number;
  time: string; // HH:MM format
  clientName?: string;
}

export interface ProductEdit {
  name: string;
  categoryId: number;
  unit: string;
  lowStockThreshold: number;
}

export type StockOverrides = Record<number, number>;
export type ProductEdits = Record<number, ProductEdit>;
