import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActorWithConfig } from "../config";
import {
  deleteProductEdit,
  getProductEdits,
  getStaff,
  getStockOverrides,
  getUsageRecords,
  initStockOverride,
  addStaff as lsAddStaff,
  addUsageRecord as lsAddUsageRecord,
  deleteStaff as lsDeleteStaff,
  updateStaff as lsUpdateStaff,
  setProductEdit,
  setStockOverride,
} from "../lib/localStorage";
import type { UsageRecord } from "../types";
import { useActor } from "./useActor";

// ── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      const cats = await actor.getCategories();
      return cats.map((c) => ({ id: Number(c.id), name: c.name }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const actor = await createActorWithConfig();
      const cat = await actor.addCategory(name);
      return { id: Number(cat.id), name: cat.name };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const actor = await createActorWithConfig();
      return actor.deleteCategory(BigInt(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      const products = await actor.getProducts();
      const overrides = getStockOverrides();
      const edits = getProductEdits();
      const deleted = new Set<number>(
        JSON.parse(localStorage.getItem("ym_deleted_products") || "[]"),
      );
      return products
        .filter((p) => !deleted.has(Number(p.id)))
        .map((p) => {
          const id = Number(p.id);
          const edit = edits[id];
          return {
            id,
            name: edit?.name ?? p.name,
            brand: p.brand,
            categoryId: edit?.categoryId ?? Number(p.categoryId),
            openingStock: Number(p.openingStock),
            currentStock:
              overrides[id] !== undefined
                ? overrides[id]
                : Number(p.currentStock),
            unit: edit?.unit ?? p.unit,
            lowStockThreshold:
              edit?.lowStockThreshold ?? Number(p.lowStockThreshold),
          };
        });
    },
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
      unit: string;
      lowStockThreshold: number;
    }) => {
      const actor = await createActorWithConfig();
      const p = await actor.addProduct(
        data.name,
        BigInt(data.categoryId),
        BigInt(data.openingStock),
        data.unit,
        BigInt(data.lowStockThreshold),
      );
      const id = Number(p.id);
      initStockOverride(id, Number(p.openingStock));
      return p;
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
    }) => {
      setProductEdit(data.id, {
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        lowStockThreshold: data.lowStockThreshold,
      });
      setStockOverride(data.id, data.currentStock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      deleteProductEdit(id);
      const deleted = JSON.parse(
        localStorage.getItem("ym_deleted_products") || "[]",
      ) as number[];
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem("ym_deleted_products", JSON.stringify(deleted));
      }
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
    mutationFn: async (data: { name: string; role: string }) => {
      return lsAddStaff(data.name, data.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; name: string; role: string }) => {
      lsUpdateStaff(data.id, data.name, data.role);
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
