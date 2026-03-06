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
import { CheckCircle2, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddUsageRecord,
  useCategories,
  useProducts,
  useStaff,
  useUsageRecords,
} from "../hooks/useQueries";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function UsageEntry() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: staffList = [] } = useStaff();
  const { data: usageRecords = [] } = useUsageRecords();
  const addMutation = useAddUsageRecord();

  const [form, setForm] = useState({
    date: getTodayDate(),
    time: getCurrentTime(),
    productId: "",
    staffId: "",
    quantity: "",
    clientName: "",
  });

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

  const selectedProduct = useMemo(
    () => activeProducts.find((p) => String(p.id) === form.productId),
    [activeProducts, form.productId],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const staffMap = useMemo(
    () => Object.fromEntries(staffList.map((s) => [s.id, s.name])),
    [staffList],
  );

  const productMap = useMemo(
    () => Object.fromEntries(activeProducts.map((p) => [p.id, p.name])),
    [activeProducts],
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

  const handleSubmit = async () => {
    if (!form.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!form.staffId) {
      toast.error("Please select a staff member");
      return;
    }
    const qty = Number.parseFloat(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!form.date) {
      toast.error("Please select a date");
      return;
    }

    const product = selectedProduct;
    if (!product) {
      toast.error("Invalid product selected");
      return;
    }

    try {
      await addMutation.mutateAsync({
        date: form.date,
        time: form.time,
        productId: Number(form.productId),
        categoryId: product.categoryId,
        staffId: Number(form.staffId),
        quantity: qty,
        clientName: form.clientName.trim() || undefined,
      });
      toast.success("Usage recorded successfully");
      setForm((f) => ({
        ...f,
        productId: "",
        staffId: "",
        quantity: "",
        clientName: "",
        time: getCurrentTime(),
      }));
    } catch {
      toast.error("Failed to record usage");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Usage Entry
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record product usage for services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="lg:col-span-3 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <ClipboardList size={18} className="text-primary" />
              Record Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="u-date">Date</Label>
                <Input
                  id="u-date"
                  data-ocid="usage.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <Label htmlFor="u-time">Time</Label>
                <Input
                  id="u-time"
                  data-ocid="usage.time.input"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                />
              </div>

              {/* Product */}
              <div className="space-y-1.5 col-span-2">
                <Label>Product</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, productId: v }))
                  }
                >
                  <SelectTrigger data-ocid="usage.product.select">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <span>{p.name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          (Stock: {p.currentStock} {p.unit})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-filled Category */}
              <div className="space-y-1.5 col-span-2">
                <Label>Category</Label>
                <Input
                  readOnly
                  value={
                    selectedProduct
                      ? (categoryMap[selectedProduct.categoryId] ?? "—")
                      : ""
                  }
                  placeholder="Auto-filled from product"
                  className="bg-muted/40 cursor-default text-muted-foreground"
                />
              </div>

              {/* Staff */}
              <div className="space-y-1.5">
                <Label>Staff Member</Label>
                <Select
                  value={form.staffId}
                  onValueChange={(v) => setForm((f) => ({ ...f, staffId: v }))}
                >
                  <SelectTrigger data-ocid="usage.staff.select">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} — {s.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="u-qty">Quantity</Label>
                <Input
                  id="u-qty"
                  data-ocid="usage.quantity.input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g., 2.5"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>

              {/* Client Name */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="u-client">
                  Client Name{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="u-client"
                  data-ocid="usage.client_name.input"
                  placeholder="e.g., Meera Kapoor"
                  value={form.clientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                />
              </div>
            </div>

            <Button
              data-ocid="usage.submit_button"
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="w-full mt-5"
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

        {/* Recent Usage */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">
              Recent Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm px-4">
                <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
                No entries yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentUsage.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {productMap[r.productId] ?? `Product #${r.productId}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {staffMap[r.staffId] ?? "—"} · {r.date} {r.time}
                        </p>
                        {r.clientName && (
                          <p className="text-xs text-muted-foreground truncate">
                            Client: {r.clientName}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary flex-shrink-0">
                        {r.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
