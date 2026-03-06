import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddProduct,
  useCategories,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";

const PAGE_SIZE = 10;

interface ProductFormData {
  name: string;
  categoryId: string;
  openingStock: string;
  unit: string;
  lowStockThreshold: string;
  currentStock: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  categoryId: "",
  openingStock: "",
  unit: "",
  lowStockThreshold: "",
  currentStock: "",
};

export function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const addMutation = useAddProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Filter out deleted products
  // biome-ignore lint/correctness/useExhaustiveDependencies: depends on products to refresh
  const deletedIds = useMemo(() => {
    try {
      return new Set(
        JSON.parse(
          localStorage.getItem("ym_deleted_products") || "[]",
        ) as number[],
      );
    } catch {
      return new Set<number>();
    }
  }, [products]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (deletedIds.has(p.id)) return false;
      const matchSearch = search
        ? p.name.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchCat =
        filterCategory === "all"
          ? true
          : p.categoryId === Number(filterCategory);
      return matchSearch && matchCat;
    });
  }, [products, search, filterCategory, deletedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: (typeof products)[0]) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: String(p.categoryId),
      openingStock: String(p.openingStock),
      unit: p.unit,
      lowStockThreshold: String(p.lowStockThreshold),
      currentStock: String(p.currentStock),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!form.unit.trim()) {
      toast.error("Unit is required");
      return;
    }

    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          unit: form.unit.trim(),
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
          currentStock: Number(form.currentStock) || 0,
        });
        toast.success("Product updated");
      } else {
        await addMutation.mutateAsync({
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          openingStock: Number(form.openingStock) || 0,
          unit: form.unit.trim(),
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
        });
        toast.success("Product added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" removed`);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Products
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your product inventory with stock tracking
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-ocid="products.search_input"
            className="pl-9"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(v) => {
            setFilterCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          data-ocid="products.add_button"
          onClick={openAdd}
          className="ml-auto"
        >
          <Plus size={16} className="mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Brand</TableHead>
              <TableHead className="text-xs text-right">
                Opening Stock
              </TableHead>
              <TableHead className="text-xs text-right">
                Current Stock
              </TableHead>
              <TableHead className="text-xs">Unit</TableHead>
              <TableHead className="text-xs text-right">Threshold</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["r1", "r2", "r3", "r4", "r5"].map((rowKey) => (
                <TableRow key={rowKey}>
                  {["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map(
                    (colKey) => (
                      <TableCell key={colKey}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div
                    data-ocid="products.empty_state"
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No products found
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((product, idx) => {
                const isLow = product.currentStock <= product.lowStockThreshold;
                const ocidIdx = (page - 1) * PAGE_SIZE + idx + 1;
                return (
                  <TableRow
                    key={product.id}
                    data-ocid={`products.item.${ocidIdx}`}
                    className={isLow ? "low-stock-row" : ""}
                  >
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {product.name}
                        {isLow && (
                          <AlertTriangle
                            size={14}
                            className="text-warning flex-shrink-0"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {categoryMap[product.categoryId] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.brand}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {product.openingStock}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      <span
                        className={`font-semibold ${
                          isLow ? "text-warning-foreground" : ""
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.unit}
                    </TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {product.lowStockThreshold}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`products.edit_button.${ocidIdx}`}
                          onClick={() => openEdit(product)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`products.delete_button.${ocidIdx}`}
                          onClick={() =>
                            setDeleteTarget({
                              id: product.id,
                              name: product.name,
                            })
                          }
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              data-ocid="products.pagination_prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              data-ocid="products.pagination_next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="products.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingId !== null ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Product Name</Label>
              <Input
                id="p-name"
                data-ocid="products.name.input"
                placeholder="e.g., Kerastase Shampoo"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger id="p-cat" data-ocid="products.category.select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {editingId === null ? (
                <div className="space-y-1.5">
                  <Label htmlFor="p-opening">Opening Stock</Label>
                  <Input
                    id="p-opening"
                    data-ocid="products.opening_stock.input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.openingStock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openingStock: e.target.value }))
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="p-current">Current Stock</Label>
                  <Input
                    id="p-current"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.currentStock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currentStock: e.target.value }))
                    }
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="p-unit">Unit</Label>
                <Input
                  id="p-unit"
                  data-ocid="products.unit.input"
                  placeholder="ml, g, pcs"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-threshold">Low Stock Threshold</Label>
              <Input
                id="p-threshold"
                data-ocid="products.threshold.input"
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="products.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="products.submit_button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>"{deleteTarget?.name}"</strong> from inventory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
