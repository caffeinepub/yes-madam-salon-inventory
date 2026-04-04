import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  addCategory as dsAddCategory,
  addPackArrival as dsAddPackArrival,
  addPackDistribution as dsAddPackDistribution,
  addPackItem as dsAddPackItem,
  addProduct as dsAddProduct,
  addStaff as dsAddStaff,
  addUsageRecord as dsAddUsageRecord,
  deleteAllProducts as dsDeleteAllProducts,
  deleteAllStaff as dsDeleteAllStaff,
  deleteCategory as dsDeleteCategory,
  deletePackArrival as dsDeletePackArrival,
  deletePackDistribution as dsDeletePackDistribution,
  deletePackItem as dsDeletePackItem,
  deleteProduct as dsDeleteProduct,
  deleteStaff as dsDeleteStaff,
  deleteUsageRecord as dsDeleteUsageRecord,
  updateProduct as dsUpdateProduct,
  updateStaff as dsUpdateStaff,
  updateStaffPin as dsUpdateStaffPin,
  getCategories,
  getPackArrivals,
  getPackDistributions,
  getPackItems,
  getProducts,
  getStaff,
  getUsageRecords,
  setActor,
} from "../lib/dataService";
import type {
  PackArrival,
  PackDistribution,
  PackItem,
  UsageRecord,
} from "../types";
import { useActor } from "./useActor";

// ── Actor injection ───────────────────────────────────────────────────────────
// This hook wires the actor into backendService so direct calls work.
export function useActorInjector() {
  const { actor } = useActor();
  useEffect(() => {
    setActor(actor);
  }, [actor]);
}

// ── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!actor && !isFetching,
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
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
    enabled: !!actor && !isFetching,
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

export function useDeleteAllProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await dsDeleteAllProducts();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export function useStaff() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff(),
    enabled: !!actor && !isFetching,
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

export function useUpdateStaffPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; pinned: boolean }) => {
      await dsUpdateStaffPin(data.id, data.pinned);
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

export function useDeleteAllStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await dsDeleteAllStaff();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

// ── Usage Records ─────────────────────────────────────────────────────────────

export function useUsageRecords() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["usage_records"],
    queryFn: () => getUsageRecords(),
    enabled: !!actor && !isFetching,
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

// ── Pack Tracker ──────────────────────────────────────────────────────────────

export function usePackItems() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pack_items"],
    queryFn: () => getPackItems(),
    enabled: !!actor && !isFetching,
  });
}

export function usePackArrivals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pack_arrivals"],
    queryFn: () => getPackArrivals(),
    enabled: !!actor && !isFetching,
  });
}

export function usePackDistributions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pack_distributions"],
    queryFn: () => getPackDistributions(),
    enabled: !!actor && !isFetching,
  });
}

export function useAddPackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Pick<PackItem, "name" | "unit">) => {
      return dsAddPackItem(data.name, data.unit);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack_items"] }),
  });
}

export function useDeletePackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeletePackItem(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pack_items"] });
      qc.invalidateQueries({ queryKey: ["pack_arrivals"] });
      qc.invalidateQueries({ queryKey: ["pack_distributions"] });
    },
  });
}

export function useAddPackArrival() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PackArrival, "id">) => {
      return dsAddPackArrival(
        data.packItemId,
        data.quantity,
        data.date,
        data.notes,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack_arrivals"] }),
  });
}

export function useDeletePackArrival() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeletePackArrival(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack_arrivals"] }),
  });
}

export function useAddPackDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PackDistribution, "id">) => {
      return dsAddPackDistribution(
        data.packItemId,
        data.staffId,
        data.quantity,
        data.date,
        data.time,
        data.notes,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack_distributions"] }),
  });
}

export function useDeletePackDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await dsDeletePackDistribution(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pack_distributions"] }),
  });
}
