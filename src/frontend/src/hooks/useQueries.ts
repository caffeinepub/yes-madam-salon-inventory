import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCategory as dsAddCategory,
  addProduct as dsAddProduct,
  addStaff as dsAddStaff,
  addUsageRecord as dsAddUsageRecord,
  deleteCategory as dsDeleteCategory,
  deleteProduct as dsDeleteProduct,
  deleteStaff as dsDeleteStaff,
  deleteUsageRecord as dsDeleteUsageRecord,
  updateProduct as dsUpdateProduct,
  updateStaff as dsUpdateStaff,
  getCategories,
  getProducts,
  getStaff,
  getUsageRecords,
} from "../lib/dataService";
import type { UsageRecord } from "../types";

// ── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      return dsAddCategory(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeleteCategory(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      categoryId: number;
      openingStock: number;
      openingDate: string;
      unit: string;
      lowStockThreshold: number;
      rackNumber?: string;
    }) => {
      return dsAddProduct({
        name: data.name,
        categoryId: data.categoryId,
        openingStock: data.openingStock,
        openingDate: data.openingDate,
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
        rackNumber: data.rackNumber,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      name: string;
      categoryId: number;
      openingStock: number;
      openingDate: string;
      unit: string;
      lowStockThreshold: number;
      currentStock: number;
      rackNumber?: string;
    }) => {
      await dsUpdateProduct(data.id, {
        name: data.name,
        categoryId: data.categoryId,
        openingStock: data.openingStock,
        openingDate: data.openingDate,
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
        currentStock: data.currentStock,
        rackNumber: data.rackNumber,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff(),
  });
}

export function useAddStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      role: string;
      mobile?: string;
    }) => {
      return dsAddStaff(data.name, data.role, data.mobile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      name: string;
      role: string;
      mobile?: string;
    }) => {
      await dsUpdateStaff(data.id, data.name, data.role, data.mobile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeleteStaff(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

// ── Usage Records ─────────────────────────────────────────────────────────────

export function useUsageRecords() {
  return useQuery({
    queryKey: ["usage_records"],
    queryFn: () => getUsageRecords(),
  });
}

export function useAddUsageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<UsageRecord, "id">) => {
      return dsAddUsageRecord(record);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usage_records"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteUsageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeleteUsageRecord(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usage_records"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
