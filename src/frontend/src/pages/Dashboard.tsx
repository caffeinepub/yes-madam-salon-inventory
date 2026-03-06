import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ClipboardCheck,
  Package,
  TrendingDown,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useProducts } from "../hooks/useQueries";
import { useStaff } from "../hooks/useQueries";
import { useUsageRecords } from "../hooks/useQueries";
import { useCategories } from "../hooks/useQueries";

export function Dashboard() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: staff = [] } = useStaff();
  const { data: usageRecords = [] } = useUsageRecords();
  const { data: categories = [] } = useCategories();

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const lowStockItems = products.filter(
      (p) => p.currentStock <= p.lowStockThreshold,
    );
    const todayUsage = usageRecords.filter((r) => r.date === today);
    const totalTodayQty = todayUsage.reduce((s, r) => s + r.quantity, 0);

    return {
      totalProducts: products.length,
      lowStockCount: lowStockItems.length,
      usageToday: totalTodayQty,
      totalStaff: staff.length,
      lowStockItems: lowStockItems.slice(0, 6),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
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
