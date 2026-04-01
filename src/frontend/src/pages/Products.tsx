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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Download,
  Loader2,
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

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

// ── Paste from Excel types ────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  rawCategory: string;
  unit: string;
  openingStock: number;
  rackNumber: string;
  matchedCategoryId: number | null;
  matchedCategoryName: string | null;
  overrideCategoryId: string;
}

const HEADER_KEYWORDS = [
  "name",
  "product",
  "category",
  "unit",
  "stock",
  "rack",
];

function detectHeader(firstRow: string[]): boolean {
  const lower = firstRow.map((c) => c.toLowerCase());
  return HEADER_KEYWORDS.some((kw) => lower.some((cell) => cell.includes(kw)));
}

function parseExcelPaste(
  raw: string,
  categories: { id: number; name: string }[],
): ParsedRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const splitLine = (line: string) =>
    line.includes("\t") ? line.split("\t") : line.split(",");

  const firstRow = splitLine(lines[0]).map((c) => c.trim());
  const hasHeader = detectHeader(firstRow);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cols = splitLine(line).map((c) => c.trim());
      const name = cols[0] ?? "";
      const rawCategory = cols[1] ?? "";
      const unit = cols[2] ?? "pcs";
      const openingStock = Number(cols[3]) || 0;
      const rackNumber = cols[4] ?? "";

      if (!name) return null;

      const lower = rawCategory.toLowerCase();
      const matched = categories.find(
        (c) =>
          c.name.toLowerCase() === lower ||
          c.name.toLowerCase().includes(lower) ||
          lower.includes(c.name.toLowerCase()),
      );

      return {
        name,
        rawCategory,
        unit,
        openingStock,
        rackNumber,
        matchedCategoryId: matched?.id ?? null,
        matchedCategoryName: matched?.name ?? null,
        overrideCategoryId: matched ? String(matched.id) : "",
      } satisfies ParsedRow;
    })
    .filter((r): r is ParsedRow => r !== null);
}

// ── PasteImportDialog ─────────────────────────────────────────────────────────

interface PasteImportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: { id: number; name: string }[];
  onImportDone: () => void;
}

function PasteImportDialog({
  open,
  onOpenChange,
  categories,
  onImportDone,
}: PasteImportDialogProps) {
  const addMutation = useAddProduct();
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleParse = () => {
    if (!pasteText.trim()) {
      toast.error("Pehle data paste karo");
      return;
    }
    const result = parseExcelPaste(pasteText, categories);
    if (result.length === 0) {
      toast.error("Koi valid row nahi mili. Format check karo.");
      return;
    }
    setRows(result);
    setParsed(true);
  };

  const readyRows = rows.filter(
    (r) => r.matchedCategoryId !== null || r.overrideCategoryId !== "",
  );
  const notReadyRows = rows.filter(
    (r) => r.matchedCategoryId === null && r.overrideCategoryId === "",
  );

  const handleImport = async (onlyReady: boolean) => {
    const toImport = onlyReady ? readyRows : rows;
    const importable = toImport.filter(
      (r) => r.matchedCategoryId !== null || r.overrideCategoryId !== "",
    );

    if (importable.length === 0) {
      toast.error("Import karne ke liye koi ready row nahi hai");
      return;
    }

    setImporting(true);
    toast.loading(`${importable.length} products import ho rahe hain...`, {
      id: "bulk-import",
    });

    let successCount = 0;
    let failCount = 0;
    const today = todayDate();

    for (const row of importable) {
      const catId = row.matchedCategoryId ?? Number(row.overrideCategoryId);
      if (!catId) {
        failCount++;
        continue;
      }
      try {
        await addMutation.mutateAsync({
          name: row.name,
          categoryId: catId,
          openingStock: row.openingStock,
          openingDate: today,
          unit: row.unit || "pcs",
          lowStockThreshold: 0,
          rackNumber: row.rackNumber || undefined,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    toast.dismiss("bulk-import");
    if (successCount > 0) {
      toast.success(`${successCount} products successfully add ho gaye!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} products add nahi ho sake`);
    }

    setImporting(false);
    setPasteText("");
    setRows([]);
    setParsed(false);
    onOpenChange(false);
    onImportDone();
  };

  const handleClose = () => {
    setPasteText("");
    setRows([]);
    setParsed(false);
    onOpenChange(false);
  };

  const updateOverride = (idx: number, catId: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, overrideCategoryId: catId } : r)),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!importing) {
          if (!o) handleClose();
          else onOpenChange(true);
        }
      }}
    >
      <DialogContent
        data-ocid="products.paste_import.dialog"
        className="sm:max-w-3xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ClipboardPaste size={20} className="text-primary" />
            Bulk Import from Excel
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Excel se data copy karke neeche paste karo.{" "}
            <span className="font-medium text-foreground">
              Columns: Name, Category, Unit, Opening Stock, Rack No (optional)
            </span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          {!parsed ? (
            <div className="space-y-3">
              <Textarea
                data-ocid="products.paste_import.textarea"
                placeholder={
                  "Example format:\nProduct Name\tCategory\tUnit\tOpening Stock\tRack No\nKerastase Shampoo\tHair Spa\tml\t10\tA1\nWax Strip\tWax\tpcs\t50\tB2\nFacial Cream\tFacial\tg\t20\t"
                }
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="min-h-[200px] font-mono text-sm resize-y"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                💡 Excel mein cells select karke Ctrl+C karo, phir yahan Ctrl+V
                se paste karo. Tab-separated ya comma-separated dono format
                chalenge.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {rows.length} rows found
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
                  >
                    {readyRows.length} ready
                  </Badge>
                  {notReadyRows.length > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-destructive/10 text-destructive border-destructive/30"
                    >
                      {notReadyRows.length} category not found
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setParsed(false);
                    setRows([]);
                  }}
                >
                  ← Edit Paste
                </Button>
              </div>

              <ScrollArea className="flex-1 max-h-[340px] rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs w-8">#</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs text-right">
                        Opening Stock
                      </TableHead>
                      <TableHead className="text-xs">Rack No</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => {
                      const isReady =
                        row.matchedCategoryId !== null ||
                        row.overrideCategoryId !== "";
                      const rowKey = `${row.name}-${row.rawCategory}-${idx}`;
                      return (
                        <TableRow
                          key={rowKey}
                          className={!isReady ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium max-w-[150px] truncate">
                            {row.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.matchedCategoryId !== null ? (
                              <span className="text-green-700 dark:text-green-400 font-medium">
                                {row.matchedCategoryName}
                              </span>
                            ) : (
                              <Select
                                value={row.overrideCategoryId}
                                onValueChange={(v) => updateOverride(idx, v)}
                              >
                                <SelectTrigger className="h-7 text-xs w-36 border-destructive/50">
                                  <SelectValue placeholder="Select…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem
                                      key={c.id}
                                      value={String(c.id)}
                                      className="text-xs"
                                    >
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.unit || "pcs"}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {row.openingStock}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.rackNumber || "—"}
                          </TableCell>
                          <TableCell>
                            {isReady ? (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
                              >
                                Ready
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30"
                              >
                                Pick category
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          <Button
            data-ocid="products.paste_import.cancel_button"
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            Cancel
          </Button>

          {!parsed ? (
            <Button
              data-ocid="products.paste_import.parse_button"
              onClick={handleParse}
              disabled={!pasteText.trim()}
            >
              Parse &amp; Preview
            </Button>
          ) : (
            <>
              {notReadyRows.length > 0 && readyRows.length > 0 && (
                <Button
                  data-ocid="products.paste_import.import_button"
                  variant="outline"
                  onClick={() => handleImport(true)}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : null}
                  Import {readyRows.length} Ready
                </Button>
              )}
              <Button
                data-ocid="products.paste_import.import_all_button"
                onClick={() => handleImport(false)}
                disabled={
                  importing ||
                  rows.every(
                    (r) =>
                      r.matchedCategoryId === null &&
                      r.overrideCategoryId === "",
                  )
                }
              >
                {importing ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : null}
                Import All (
                {
                  rows.filter(
                    (r) =>
                      r.matchedCategoryId !== null ||
                      r.overrideCategoryId !== "",
                  ).length
                }
                )
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProductFormData {
  name: string;
  categoryId: string;
  openingStock: string;
  openingDate: string;
  unit: string;
  lowStockThreshold: string;
  currentStock: string;
  rackNumber: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  categoryId: "",
  openingStock: "",
  openingDate: "",
  unit: "",
  lowStockThreshold: "",
  currentStock: "",
  rackNumber: "",
};

function exportProductsToExcel(
  data: {
    id: number;
    name: string;
    categoryName: string;
    brand: string;
    openingStock: number;
    openingDate: string;
    currentStock: number;
    unit: string;
    lowStockThreshold: number;
    rackNumber?: string;
  }[],
  filename: string,
) {
  const header = [
    "ID",
    "Name",
    "Category",
    "Brand",
    "Opening Stock",
    "Opening Date",
    "Current Stock (Bachaa)",
    "Unit",
    "Low Stock Threshold",
    "Rack No",
  ];
  const rows = data.map((p) => [
    p.id,
    p.name,
    p.categoryName,
    p.brand,
    p.openingStock,
    p.openingDate ? formatDate(p.openingDate) : "",
    p.currentStock,
    p.unit,
    p.lowStockThreshold,
    p.rackNumber ?? "",
  ]);
  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [form, setForm] = useState<ProductFormData>({
    ...EMPTY_FORM,
    openingDate: todayDate(),
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [pasteImportOpen, setPasteImportOpen] = useState(false);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = search
        ? p.name.toLowerCase().includes(q) ||
          (p.rackNumber ?? "").toLowerCase().includes(q)
        : true;
      const matchCat =
        filterCategory === "all"
          ? true
          : p.categoryId === Number(filterCategory);
      return matchSearch && matchCat;
    });
  }, [products, search, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, openingDate: todayDate() });
    setDialogOpen(true);
  };

  const openEdit = (p: (typeof products)[0]) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: String(p.categoryId),
      openingStock: String(p.openingStock),
      openingDate: p.openingDate ?? "",
      unit: p.unit,
      lowStockThreshold: String(p.lowStockThreshold),
      currentStock: String(p.currentStock),
      rackNumber: p.rackNumber ?? "",
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
          openingStock: Number(form.openingStock) || 0,
          openingDate: form.openingDate || todayDate(),
          unit: form.unit.trim(),
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
          currentStock: Number(form.currentStock) || 0,
          rackNumber: form.rackNumber.trim(),
        });
        toast.success("Product updated");
      } else {
        await addMutation.mutateAsync({
          name: form.name.trim(),
          categoryId: Number(form.categoryId),
          openingStock: Number(form.openingStock) || 0,
          openingDate: form.openingDate || todayDate(),
          unit: form.unit.trim(),
          lowStockThreshold: Number(form.lowStockThreshold) || 0,
          rackNumber: form.rackNumber.trim(),
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
          data-ocid="products.download_button"
          variant="outline"
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            const exportData = filtered.map((p) => ({
              id: p.id,
              name: p.name,
              categoryName: categoryMap[p.categoryId] ?? "",
              brand: p.brand,
              openingStock: p.openingStock,
              openingDate: p.openingDate ?? "",
              currentStock: p.currentStock,
              unit: p.unit,
              lowStockThreshold: p.lowStockThreshold,
              rackNumber: p.rackNumber ?? "",
            }));
            exportProductsToExcel(exportData, `products_${today}.csv`);
          }}
        >
          <Download size={15} className="mr-1.5" />
          Download Excel
        </Button>
        <Button
          data-ocid="products.paste_import_button"
          variant="outline"
          onClick={() => setPasteImportOpen(true)}
        >
          <ClipboardPaste size={15} className="mr-1.5" />
          Paste from Excel
        </Button>
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
              <TableHead className="text-xs">Rack No</TableHead>
              <TableHead className="text-xs text-right">
                Opening Stock
              </TableHead>
              <TableHead className="text-xs">Opening Date</TableHead>
              <TableHead className="text-xs text-right">
                Current (Bachaa)
              </TableHead>
              <TableHead className="text-xs">Unit</TableHead>
              <TableHead className="text-xs text-right">Min</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["r1", "r2", "r3", "r4", "r5"].map((rowKey) => (
                <TableRow key={rowKey}>
                  {[
                    "c1",
                    "c2",
                    "c3",
                    "c4",
                    "c5",
                    "c6",
                    "c7",
                    "c8",
                    "c9",
                    "c10",
                  ].map((colKey) => (
                    <TableCell key={colKey}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
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
                    <TableCell className="text-sm">
                      {product.rackNumber ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
                          {product.rackNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {product.openingStock}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.openingDate
                        ? formatDate(product.openingDate)
                        : "—"}
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
        <DialogContent data-ocid="products.dialog" className="sm:max-w-lg">
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

            {editingId === null ? (
              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <Label htmlFor="p-opening-date">
                    Opening Date{" "}
                    <span className="text-muted-foreground text-xs">
                      (गिनती की तारीख)
                    </span>
                  </Label>
                  <Input
                    id="p-opening-date"
                    data-ocid="products.opening_date.input"
                    type="date"
                    value={form.openingDate || todayDate()}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openingDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-opening-edit">Opening Stock</Label>
                  <Input
                    id="p-opening-edit"
                    data-ocid="products.opening_stock_edit.input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.openingStock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openingStock: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-opening-date-edit">
                    Opening Date{" "}
                    <span className="text-muted-foreground text-xs">
                      (गिनती की तारीख)
                    </span>
                  </Label>
                  <Input
                    id="p-opening-date-edit"
                    data-ocid="products.opening_date_edit.input"
                    type="date"
                    value={form.openingDate || todayDate()}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, openingDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
            {editingId !== null && (
              <div className="space-y-1.5">
                <Label htmlFor="p-current">Current Stock (Bachaa)</Label>
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

            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label htmlFor="p-threshold">Min Stock Alert</Label>
                <Input
                  id="p-threshold"
                  data-ocid="products.threshold.input"
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-rack">
                Rack Number{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="p-rack"
                data-ocid="products.rack_number.input"
                placeholder="e.g., A1, B3, Shelf-2"
                value={form.rackNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rackNumber: e.target.value }))
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

      {/* Paste from Excel Dialog */}
      <PasteImportDialog
        open={pasteImportOpen}
        onOpenChange={setPasteImportOpen}
        categories={categories}
        onImportDone={() => {}}
      />

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
