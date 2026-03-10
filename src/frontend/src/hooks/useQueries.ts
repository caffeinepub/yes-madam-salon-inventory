import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getProducts,
  getStaff,
  getUsageRecords,
  addCategory as lsAddCategory,
  addProduct as lsAddProduct,
  addStaff as lsAddStaff,
  addUsageRecord as lsAddUsageRecord,
  deleteCategory as lsDeleteCategory,
  deleteProduct as lsDeleteProduct,
  deleteStaff as lsDeleteStaff,
  deleteUsageRecord as lsDeleteUsageRecord,
  updateProduct as lsUpdateProduct,
  updateStaff as lsUpdateStaff,
} from "../lib/localStorage";
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
      return lsAddCategory(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      lsDeleteCategory(id);
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
      unit: string;
      lowStockThreshold: number;
      rackNumber?: string;
    }) => {
      return lsAddProduct(data);
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
      unit: string;
      lowStockThreshold: number;
      currentStock: number;
      rackNumber?: string;
    }) => {
      lsUpdateProduct(data.id, {
        name: data.name,
        categoryId: data.categoryId,
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
      lsDeleteProduct(id);
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
      return lsAddStaff(data.name, data.role, data.mobile);
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
      lsUpdateStaff(data.id, data.name, data.role, data.mobile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      lsDeleteStaff(id);
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
      return lsAddUsageRecord(record);
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
      lsDeleteUsageRecord(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usage_records"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
