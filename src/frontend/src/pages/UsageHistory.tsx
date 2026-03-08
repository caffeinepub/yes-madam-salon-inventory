import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FilterX,
  History,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useCategories,
  useProducts,
  useStaff,
  useUsageRecords,
} from "../hooks/useQueries";

const PAGE_SIZE = 10;

export function UsageHistory() {
  const { data: usageRecords = [] } = useUsageRecords();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: staffList = [] } = useStaff();

  const [page, setPage] = useState(1);
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

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
  }, []);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );

  const staffMap = useMemo(
    () => Object.fromEntries(staffList.map((s) => [s.id, s.name])),
    [staffList],
  );

  const activeProducts = useMemo(
    () => products.filter((p) => !deletedIds.has(p.id)),
    [products, deletedIds],
  );

  const filtered = useMemo(() => {
    return [...usageRecords]
      .filter((r) => {
        if (filterProduct !== "all" && r.productId !== Number(filterProduct))
          return false;
        if (filterStaff !== "all" && r.staffId !== Number(filterStaff))
          return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const productName = (productMap[r.productId] ?? "").toLowerCase();
          const staffName = (staffMap[r.staffId] ?? "").toLowerCase();
          const client = (r.clientName ?? "").toLowerCase();
          if (
            !productName.includes(q) &&
            !staffName.includes(q) &&
            !client.includes(q) &&
            !r.date.includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`).getTime();
        const db = new Date(`${b.date}T${b.time}`).getTime();
        return db - da;
      });
  }, [
    usageRecords,
    filterProduct,
    filterStaff,
    dateFrom,
    dateTo,
    search,
    productMap,
    staffMap,
  ]);

  function exportUsageToExcel() {
    const today = new Date().toISOString().slice(0, 10);
    const header = [
      "Date",
      "Time",
      "Product",
      "Category",
      "Staff",
      "Qty",
      "Client",
    ];
    const rows = filtered.map((r) => [
      r.date,
      r.time,
      productMap[r.productId] ?? `#${r.productId}`,
      categoryMap[r.categoryId] ?? "",
      staffMap[r.staffId] ?? "",
      r.quantity,
      r.clientName ?? "",
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage_history_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setFilterProduct("all");
    setFilterStaff("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const hasFilters =
    filterProduct !== "all" ||
    filterStaff !== "all" ||
    dateFrom ||
    dateTo ||
    search.trim();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Usage History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete log of all product usage records
          </p>
        </div>
        <Button
          data-ocid="usage_history.download_button"
          variant="outline"
          onClick={exportUsageToExcel}
        >
          <Download size={15} className="mr-1.5" />
          Download Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card mb-5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  data-ocid="usage_history.search_input"
                  className="pl-9 h-9"
                  placeholder="Product, staff, client..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Product</Label>
              <Select
                value={filterProduct}
                onValueChange={(v) => {
                  setFilterProduct(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  data-ocid="usage_history.product.select"
                  className="h-9"
                >
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Staff</Label>
              <Select
                value={filterStaff}
                onValueChange={(v) => {
                  setFilterStaff(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  data-ocid="usage_history.staff.select"
                  className="h-9"
                >
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                data-ocid="usage_history.date_from.input"
                className="h-9 w-36"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                data-ocid="usage_history.date_to.input"
                className="h-9 w-36"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-muted-foreground hover:text-foreground self-end"
              >
                <FilterX size={15} className="mr-1.5" />
                Clear Filters
              </Button>
            )}

            <div className="ml-auto self-end">
              <p className="text-sm text-muted-foreground">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Product</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Staff</TableHead>
              <TableHead className="text-xs text-right">Qty</TableHead>
              <TableHead className="text-xs">Client</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div
                    data-ocid="usage_history.empty_state"
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    <History size={32} className="mx-auto mb-2 opacity-30" />
                    No usage records found
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((record, idx) => {
                const ocidIdx = (page - 1) * PAGE_SIZE + idx + 1;
                return (
                  <TableRow
                    key={record.id}
                    data-ocid={`usage_history.item.${ocidIdx}`}
                  >
                    <TableCell className="text-sm text-muted-foreground">
                      {record.date}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.time}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {productMap[record.productId] ?? `#${record.productId}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {categoryMap[record.categoryId] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {staffMap[record.staffId] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-right">
                      {record.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.clientName ?? "—"}
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
              data-ocid="usage_history.pagination_prev"
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
              data-ocid="usage_history.pagination_next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
