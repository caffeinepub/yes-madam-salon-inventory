import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart2,
  CalendarCheck,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardCheck,
  ClipboardList,
  Crown,
  Package,
  Star,
  TrendingDown,
  UserCheck,
  UserMinus,
  UserX,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  useAddUsageRecord,
  useCategories,
  useProducts,
  useStaff,
  useUsageRecords,
} from "../hooks/useQueries";
import { getAttendanceForDate } from "../lib/localStorage";
import type { AttendanceStatus } from "../types";

const CHART_COLORS = ["#e91e8c", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b"];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function Dashboard() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: staff = [] } = useStaff();
  const { data: usageRecords = [] } = useUsageRecords();
  const { data: categories = [] } = useCategories();

  const today = new Date().toISOString().slice(0, 10);

  // Attendance for today
  const { data: todayAttendanceMap = {} } = useQuery<
    Record<number, AttendanceStatus>
  >({
    queryKey: ["attendance", today],
    queryFn: () => getAttendanceForDate(today),
  });

  const attendanceSummary = useMemo(() => {
    const presentCount = staff.filter(
      (s) => todayAttendanceMap[s.id] === "present",
    ).length;
    const absentCount = staff.filter(
      (s) => todayAttendanceMap[s.id] === "absent",
    ).length;
    const notMarked = staff.length - presentCount - absentCount;
    return { presentCount, absentCount, notMarked };
  }, [staff, todayAttendanceMap]);

  const stats = useMemo(() => {
    const lowStockItems = products.filter(
      (p) => p.currentStock <= p.lowStockThreshold,
    );
    const todayUsage = usageRecords.filter((r) => r.date === today);
    const totalTodayQty = todayUsage.reduce((s, r) => s + r.quantity, 0);

    // Top Product today
    const productQtyMap: Record<string, number> = {};
    for (const r of todayUsage) {
      productQtyMap[r.productId] =
        (productQtyMap[r.productId] ?? 0) + r.quantity;
    }
    const topProductId = Object.entries(productQtyMap).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topProductQty = topProductId ? productQtyMap[topProductId] : 0;

    // Top Staff today
    const staffQtyMap: Record<string, number> = {};
    for (const r of todayUsage) {
      staffQtyMap[r.staffId] = (staffQtyMap[r.staffId] ?? 0) + r.quantity;
    }
    const topStaffId = Object.entries(staffQtyMap).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topStaffQty = topStaffId ? staffQtyMap[topStaffId] : 0;

    return {
      totalProducts: products.length,
      lowStockCount: lowStockItems.length,
      usageToday: totalTodayQty,
      totalStaff: staff.length,
      lowStockItems: lowStockItems.slice(0, 6),
      topProductId: topProductId ?? null,
      topProductQty,
      topStaffId: topStaffId ?? null,
      topStaffQty,
    };
  }, [products, staff, usageRecords, today]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const staffMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff],
  );

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );

  // Quick Usage Entry state
  const addMutation = useAddUsageRecord();
  const [quickForm, setQuickForm] = useState({
    productId: "",
    staffId: "",
    quantity: "",
    clientName: "",
    date: getTodayDate(),
  });
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

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

  const activeProducts = useMemo(
    () => products.filter((p) => !deletedIds.has(p.id)),
    [products, deletedIds],
  );

  const filteredQProducts = useMemo(() => {
    if (!productSearch.trim()) return activeProducts;
    return activeProducts.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [activeProducts, productSearch]);

  const filteredQStaff = useMemo(() => {
    if (!staffSearch.trim()) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.role.toLowerCase().includes(staffSearch.toLowerCase()),
    );
  }, [staff, staffSearch]);

  const selectedQProduct = useMemo(
    () => activeProducts.find((p) => String(p.id) === quickForm.productId),
    [activeProducts, quickForm.productId],
  );

  const selectedQStaff = useMemo(
    () => staff.find((s) => String(s.id) === quickForm.staffId),
    [staff, quickForm.staffId],
  );

  const handleQuickSubmit = async () => {
    if (!quickForm.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!quickForm.staffId) {
      toast.error("Please select a staff member");
      return;
    }
    const qty = Number.parseFloat(quickForm.quantity);
    if (!quickForm.quantity || Number.isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!selectedQProduct) {
      toast.error("Invalid product");
      return;
    }
    try {
      await addMutation.mutateAsync({
        date: quickForm.date,
        time: getCurrentTime(),
        productId: Number(quickForm.productId),
        categoryId: selectedQProduct.categoryId,
        staffId: Number(quickForm.staffId),
        quantity: qty,
        clientName: quickForm.clientName.trim() || undefined,
      });
      toast.success("Usage recorded!");
      setQuickForm({
        productId: "",
        staffId: "",
        quantity: "",
        clientName: "",
        date: getTodayDate(),
      });
      setProductSearch("");
      setStaffSearch("");
    } catch {
      toast.error("Failed to record usage");
    }
  };

  const recentUsage = useMemo(
    () =>
      [...usageRecords]
        .sort((a, b) => {
          const da = new Date(`${a.date}T${a.time}`).getTime();
          const db = new Date(`${b.date}T${b.time}`).getTime();
          return db - da;
        })
        .slice(0, 5),
    [usageRecords],
  );

  // Top 5 products all-time
  const top5Products = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const r of usageRecords) {
      totals[r.productId] = (totals[r.productId] ?? 0) + r.quantity;
    }
    return Object.entries(totals)
      .map(([id, total]) => ({
        name: (productMap[Number(id)] ?? `#${id}`).slice(0, 10),
        value: total,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [usageRecords, productMap]);

  // Top 5 staff all-time
  const top5Staff = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const r of usageRecords) {
      totals[r.staffId] = (totals[r.staffId] ?? 0) + r.quantity;
    }
    return Object.entries(totals)
      .map(([id, total]) => ({
        name: (staffMap[Number(id)] ?? `#${id}`).slice(0, 10),
        value: total,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [usageRecords, staffMap]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <Card data-ocid="dashboard.total_products.card" className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold font-body">
                {productsLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  stats.totalProducts
                )}
              </span>
              <Package className="text-primary/60 mb-1" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="dashboard.low_stock.card"
          className={`shadow-card border ${
            stats.lowStockCount > 0 ? "border-warning/40 bg-amber-50/60" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3">
              <span
                className={`text-3xl font-bold font-body ${
                  stats.lowStockCount > 0 ? "text-warning-foreground" : ""
                }`}
              >
                {productsLoading ? (
                  <Skeleton className="h-9 w-10" />
                ) : (
                  stats.lowStockCount
                )}
              </span>
              <AlertTriangle
                className={`mb-1 ${
                  stats.lowStockCount > 0
                    ? "text-warning"
                    : "text-muted-foreground/40"
                }`}
                size={20}
              />
            </div>
          </CardContent>
        </Card>

        <Card data-ocid="dashboard.usage_today.card" className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Usage Today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold font-body">
                {stats.usageToday}
              </span>
              <ClipboardCheck className="text-primary/60 mb-1" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card data-ocid="dashboard.total_staff.card" className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold font-body">
                {stats.totalStaff}
              </span>
              <Users className="text-primary/60 mb-1" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="dashboard.attendance_today.card"
          className="shadow-card border border-green-200/60"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-1.5">
              <CalendarCheck size={13} className="text-green-600" />
              Aaj ki Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <UserCheck size={14} className="text-green-600" />
                <span className="text-lg font-bold text-green-700 font-body">
                  {attendanceSummary.presentCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserX size={14} className="text-red-500" />
                <span className="text-lg font-bold text-red-600 font-body">
                  {attendanceSummary.absentCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserMinus size={14} className="text-amber-500" />
                <span className="text-lg font-bold text-amber-600 font-body">
                  {attendanceSummary.notMarked}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-body">
              P / A / Not Marked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Usage Entry */}
      <Card data-ocid="dashboard.quick_usage.card" className="shadow-card mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            Quick Usage Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Popover
                open={productPopoverOpen}
                onOpenChange={setProductPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    data-ocid="dashboard.quick_usage.product.select"
                    variant="outline"
                    aria-expanded={productPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedQProduct ? (
                      <span className="truncate">
                        {selectedQProduct.name}{" "}
                        <span className="text-muted-foreground text-xs">
                          (Stock: {selectedQProduct.currentStock}{" "}
                          {selectedQProduct.unit})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select a product
                      </span>
                    )}
                    <ChevronsUpDown
                      size={14}
                      className="ml-2 opacity-50 flex-shrink-0"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search product..."
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No product found</CommandEmpty>
                      <CommandGroup>
                        {filteredQProducts.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={String(p.id)}
                            onSelect={(val) => {
                              setQuickForm((f) => ({ ...f, productId: val }));
                              setProductSearch("");
                              setProductPopoverOpen(false);
                            }}
                          >
                            <span>{p.name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">
                              (Stock: {p.currentStock} {p.unit})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Staff */}
            <div className="space-y-1.5">
              <Label>Staff Member</Label>
              <Popover
                open={staffPopoverOpen}
                onOpenChange={setStaffPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    data-ocid="dashboard.quick_usage.staff.select"
                    variant="outline"
                    aria-expanded={staffPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedQStaff ? (
                      <span className="truncate">
                        {selectedQStaff.name}{" "}
                        <span className="text-muted-foreground text-xs">
                          — {selectedQStaff.role}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Select staff
                      </span>
                    )}
                    <ChevronsUpDown
                      size={14}
                      className="ml-2 opacity-50 flex-shrink-0"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search staff..."
                      value={staffSearch}
                      onValueChange={setStaffSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No staff found</CommandEmpty>
                      <CommandGroup>
                        {filteredQStaff.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={String(s.id)}
                            onSelect={(val) => {
                              setQuickForm((f) => ({ ...f, staffId: val }));
                              setStaffSearch("");
                              setStaffPopoverOpen(false);
                            }}
                          >
                            <span>{s.name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">
                              — {s.role}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="qd-qty">Quantity</Label>
              <Input
                id="qd-qty"
                data-ocid="dashboard.quick_usage.quantity.input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g., 2"
                value={quickForm.quantity}
                onChange={(e) =>
                  setQuickForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <Label htmlFor="qd-client">
                Client Name{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="qd-client"
                placeholder="e.g., Meera Kapoor"
                value={quickForm.clientName}
                onChange={(e) =>
                  setQuickForm((f) => ({ ...f, clientName: e.target.value }))
                }
              />
            </div>
          </div>

          <Button
            data-ocid="dashboard.quick_usage.submit_button"
            onClick={handleQuickSubmit}
            disabled={addMutation.isPending}
            className="w-full mt-4"
          >
            {addMutation.isPending ? (
              "Recording..."
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Record Usage
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Top Product & Top Staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <Card
          data-ocid="dashboard.top_product.card"
          className="shadow-card border border-amber-300/50 bg-amber-50/40"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700 font-body">
              <Star size={16} className="text-amber-500 fill-amber-400" />
              Today's Top Product
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.topProductId ? (
              <div>
                <p className="text-xl font-bold text-foreground font-body leading-tight">
                  {productMap[stats.topProductId] ?? `#${stats.topProductId}`}
                </p>
                <p className="text-xs text-amber-600 mt-1 font-body">
                  {stats.topProductQty} units used today
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">
                No usage today
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          data-ocid="dashboard.top_staff.card"
          className="shadow-card border border-emerald-300/50 bg-emerald-50/40"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700 font-body">
              <Crown size={16} className="text-emerald-500" />
              Today's Top Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.topStaffId ? (
              <div>
                <p className="text-xl font-bold text-foreground font-body leading-tight">
                  {staffMap[stats.topStaffId] ?? `#${stats.topStaffId}`}
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-body">
                  {stats.topStaffQty} units used today
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">
                No usage today
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics Mini Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <BarChart2 size={16} className="text-primary" />
              Top 5 Products (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top5Products.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={top5Products}
                  margin={{ top: 8, right: 8, left: -20, bottom: 24 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    formatter={(v) => [`${v} units`, "Usage"]}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {top5Products.map((entry, i) => (
                      <Cell
                        key={`pc-${entry.name}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <BarChart2 size={16} className="text-emerald-500" />
              Top 5 Staff (All Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top5Staff.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No usage data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={top5Staff}
                  margin={{ top: 8, right: 8, left: -20, bottom: 24 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    formatter={(v) => [`${v} units`, "Usage"]}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {top5Staff.map((entry, i) => (
                      <Cell
                        key={`sc-${entry.name}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <TrendingDown size={18} className="text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                All products are well-stocked
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-amber-50/60 border border-warning/20"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryMap[product.categoryId] ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-warning-foreground">
                        {product.currentStock} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        threshold: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Usage */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Recent Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm px-4">
                <ClipboardCheck size={32} className="mx-auto mb-2 opacity-30" />
                No usage records yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Staff</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsage.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.date}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {productMap[record.productId] ?? `#${record.productId}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {staffMap[record.staffId] ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {record.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
