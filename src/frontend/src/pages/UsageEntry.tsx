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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ChevronsUpDown,
  ClipboardList,
  Mic,
  MicOff,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAddUsageRecord,
  useCategories,
  useDeleteUsageRecord,
  useProducts,
  useStaff,
  useUsageRecords,
} from "../hooks/useQueries";
import { setAttendanceStatus } from "../lib/dataService";

const staffCode = (id: bigint) => `S${Number(id).toString().padStart(3, "0")}`;
const productCode = (id: bigint) =>
  `P${Number(id).toString().padStart(3, "0")}`;

const LAST_PRODUCT_KEY = "lastUsedProductId";
const LAST_STAFF_KEY = "lastUsedStaffId";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

interface ProductRow {
  uid: string;
  productId: string;
  quantity: string;
  productPopoverOpen: boolean;
  productSearch: string;
}

function emptyRow(): ProductRow {
  return {
    uid: `row-${Date.now()}-${Math.random()}`,
    productId: "",
    quantity: "",
    productPopoverOpen: false,
    productSearch: "",
  };
}

interface VoiceState {
  listening: boolean;
  transcript: string;
  matchedProduct: string;
  matchedStaff: string;
  error: string;
  supported: boolean;
}

export function UsageEntry() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: staffList = [] } = useStaff();
  const { data: usageRecords = [] } = useUsageRecords();
  const addMutation = useAddUsageRecord();
  const deleteMutation = useDeleteUsageRecord();

  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getCurrentTime());
  const [staffId, setStaffId] = useState(
    () => localStorage.getItem(LAST_STAFF_KEY) ?? "",
  );
  const [clientName, setClientName] = useState("");
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");

  const [productRows, setProductRows] = useState<ProductRow[]>(() => {
    const lastProductId = localStorage.getItem(LAST_PRODUCT_KEY) ?? "";
    return [
      {
        uid: "row-init",
        productId: lastProductId,
        quantity: "",
        productPopoverOpen: false,
        productSearch: "",
      },
    ];
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Voice
  const [voice, setVoice] = useState<VoiceState>({
    listening: false,
    transcript: "",
    matchedProduct: "",
    matchedStaff: "",
    error: "",
    supported:
      typeof window !== "undefined" &&
      !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      ),
  });
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    if (!voice.supported) {
      setVoice((v) => ({
        ...v,
        error: "Voice supported nahi hai is browser mein",
      }));
      return;
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () =>
      setVoice((v) => ({
        ...v,
        listening: true,
        transcript: "",
        matchedProduct: "",
        matchedStaff: "",
        error: "",
      }));

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Match product
      const matchedProduct = products.find((p) =>
        transcript.toLowerCase().includes(p.name.toLowerCase()),
      );
      // Match staff
      const matchedStaff = staffList.find((s) =>
        transcript.toLowerCase().includes(s.name.toLowerCase()),
      );

      if (matchedProduct) {
        setProductRows((rows) => {
          const next = [...rows];
          next[0] = { ...next[0], productId: String(matchedProduct.id) };
          return next;
        });
      }
      if (matchedStaff) {
        setStaffId(String(matchedStaff.id));
      }

      setVoice((v) => ({
        ...v,
        listening: false,
        transcript,
        matchedProduct: matchedProduct?.name ?? "",
        matchedStaff: matchedStaff?.name ?? "",
        error: "",
      }));
    };

    recognition.onerror = (event: any) => {
      setVoice((v) => ({
        ...v,
        listening: false,
        error: `Error: ${event.error}`,
      }));
    };

    recognition.onend = () => {
      setVoice((v) => ({ ...v, listening: false }));
    };

    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setVoice((v) => ({ ...v, listening: false }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const activeProducts = products;

  const selectedStaff = useMemo(
    () => staffList.find((s) => String(s.id) === staffId),
    [staffList, staffId],
  );

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffList;
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staffCode(BigInt(s.id))
          .toLowerCase()
          .includes(staffSearch.toLowerCase()),
    );
  }, [staffList, staffSearch]);

  const lastProductId = localStorage.getItem(LAST_PRODUCT_KEY) ?? "";
  const lastProduct = useMemo(
    () => activeProducts.find((p) => String(p.id) === lastProductId),
    [activeProducts, lastProductId],
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

  const recentUsage = useMemo(() => {
    const sorted = [...usageRecords].sort((a, b) => {
      const da = new Date(`${a.date}T${a.time}`).getTime();
      const db = new Date(`${b.date}T${b.time}`).getTime();
      return db - da;
    });
    if (!searchQuery.trim()) return sorted.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return sorted.filter((r) => {
      const productName = (productMap[r.productId] ?? "").toLowerCase();
      const staffName = (staffMap[r.staffId] ?? "").toLowerCase();
      const clientNameVal = (r.clientName ?? "").toLowerCase();
      const categoryName = (categoryMap[r.categoryId] ?? "").toLowerCase();
      return (
        productName.includes(q) ||
        staffName.includes(q) ||
        clientNameVal.includes(q) ||
        categoryName.includes(q) ||
        r.date.includes(q)
      );
    });
  }, [usageRecords, searchQuery, productMap, staffMap, categoryMap]);

  const updateRow = (idx: number, update: Partial<ProductRow>) => {
    setProductRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...update };
      return next;
    });
  };

  const addRow = () => setProductRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) =>
    setProductRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!staffId) {
      toast.error("Please select a staff member");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    const validRows = productRows.filter((r) => r.productId && r.quantity);
    if (validRows.length === 0) {
      toast.error("Kam se kam ek product aur quantity select karo");
      return;
    }

    for (const row of validRows) {
      const qty = Number.parseFloat(row.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        toast.error("Valid quantity daalo");
        return;
      }
    }

    let lastProductIdUsed = "";
    let failed = 0;
    for (const row of validRows) {
      const product = activeProducts.find(
        (p) => String(p.id) === row.productId,
      );
      if (!product) continue;
      const qty = Number.parseFloat(row.quantity);
      try {
        await addMutation.mutateAsync({
          date,
          time,
          productId: Number(row.productId),
          categoryId: product.categoryId,
          staffId: Number(staffId),
          quantity: qty,
          clientName: clientName.trim() || undefined,
        });
        lastProductIdUsed = row.productId;
      } catch {
        failed++;
      }
    }

    if (lastProductIdUsed) {
      localStorage.setItem(LAST_PRODUCT_KEY, lastProductIdUsed);
    }
    localStorage.setItem(LAST_STAFF_KEY, staffId);

    if (failed > 0) {
      toast.error(`${failed} entries fail ho gayi`);
    } else {
      toast.success(
        `${validRows.length} usage entr${validRows.length === 1 ? "y" : "ies"} recorded!`,
      );
      // Auto-mark attendance as present when product is taken
      try {
        await setAttendanceStatus(Number(staffId), date, "present");
      } catch {
        // Silently ignore attendance errors
      }
    }

    // Reset product rows but keep staff
    setProductRows([emptyRow()]);
    setClientName("");
    setTime(getCurrentTime());
  };

  const handleDeleteEntry = async (id: number, index: number) => {
    const confirmed = window.confirm(
      "Kya aap yeh entry delete karna chahte hain?",
    );
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Entry #${index} delete ho gayi`);
    } catch {
      toast.error("Entry delete karne mein problem aai");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Usage Entry
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Record product usage for services
          </p>
        </div>
        {/* Voice command button */}
        <div className="flex flex-col items-end gap-1">
          <Button
            data-ocid="usage.voice.button"
            variant={voice.listening ? "destructive" : "outline"}
            size="sm"
            onClick={voice.listening ? stopVoice : startVoice}
            disabled={!voice.supported}
            title={
              voice.supported ? "Voice se entry karo" : "Voice supported nahi"
            }
            className={`gap-2 ${
              voice.listening
                ? "animate-pulse bg-red-500 hover:bg-red-600 text-white border-red-500"
                : "border-pink-500 text-pink-500 hover:bg-pink-500/10"
            }`}
          >
            {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
            {voice.listening ? "Bol raha hoon... 🎤" : "Voice Entry"}
          </Button>
          {!voice.supported && (
            <span className="text-xs text-muted-foreground">
              Voice supported nahi hai is browser mein
            </span>
          )}
          {voice.transcript && (
            <div className="text-right text-xs space-y-0.5">
              <p className="text-muted-foreground">
                Suna: "{voice.transcript}"
              </p>
              {voice.matchedProduct && (
                <p className="text-green-500">
                  ✅ Product: {voice.matchedProduct}
                </p>
              )}
              {voice.matchedStaff && (
                <p className="text-green-500">✅ Staff: {voice.matchedStaff}</p>
              )}
              {!voice.matchedProduct && !voice.matchedStaff && (
                <p className="text-yellow-500">⚠️ Kuch match nahi hua</p>
              )}
            </div>
          )}
          {voice.error && (
            <p className="text-xs text-destructive">{voice.error}</p>
          )}
        </div>
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="u-date">Date</Label>
                <Input
                  id="u-date"
                  data-ocid="usage.date.input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <Label htmlFor="u-time">Time</Label>
                <Input
                  id="u-time"
                  data-ocid="usage.time.input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              {/* Staff */}
              <div className="space-y-1.5 col-span-2">
                <Label>Staff Member</Label>
                <Popover
                  open={staffPopoverOpen}
                  onOpenChange={setStaffPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      data-ocid="usage.staff.select"
                      variant="outline"
                      aria-expanded={staffPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedStaff ? (
                        <span>
                          {selectedStaff.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            — {selectedStaff.role}
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
                        data-ocid="usage.staff_search.input"
                      />
                      <CommandList>
                        <CommandEmpty>No staff found</CommandEmpty>
                        <CommandGroup>
                          {filteredStaff.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={String(s.id)}
                              onSelect={(val) => {
                                setStaffId(val);
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
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>

            {/* Multi-product rows */}
            <div className="space-y-2 mb-3">
              <Label>Products</Label>
              {lastProduct &&
                productRows[0]?.productId === String(lastProduct.id) && (
                  <div className="text-xs text-pink-500 flex items-center gap-1 mb-1">
                    <span>⭐</span>
                    <span>Recently used: {lastProduct.name}</span>
                  </div>
                )}
              {productRows.map((row, idx) => (
                <ProductRowItem
                  key={row.uid}
                  row={row}
                  idx={idx}
                  products={activeProducts}
                  lastProduct={lastProduct}
                  onUpdate={(update) => updateRow(idx, update)}
                  onRemove={
                    productRows.length > 1 ? () => removeRow(idx) : undefined
                  }
                />
              ))}
            </div>

            <Button
              data-ocid="usage.add_product_row.button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="w-full border-dashed mb-4 text-pink-500 border-pink-500/50 hover:bg-pink-500/5"
            >
              <Plus size={14} className="mr-1.5" />
              Aur Product Add Karo
            </Button>

            <Button
              data-ocid="usage.submit_button"
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? (
                "Recording..."
              ) : (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  Record Usage (
                  {productRows.filter((r) => r.productId && r.quantity)
                    .length || 0}{" "}
                  product
                  {productRows.filter((r) => r.productId && r.quantity)
                    .length !== 1
                    ? "s"
                    : ""}
                  )
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Usage */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="font-display text-lg">
              Recent Entries
            </CardTitle>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="usage_entry.search_input"
                placeholder="Search by product, staff, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsage.length === 0 ? (
              <div
                data-ocid="usage_entry.empty_state"
                className="text-center py-8 text-muted-foreground text-sm px-4"
              >
                <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
                {searchQuery.trim()
                  ? "No matching entries found"
                  : "No entries yet"}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentUsage.map((r, idx) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {r.quantity}
                        </span>
                        <button
                          type="button"
                          data-ocid={`usage_entry.delete_button.${idx + 1}`}
                          onClick={() => handleDeleteEntry(r.id, idx + 1)}
                          disabled={deleteMutation.isPending}
                          title="Delete this entry"
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

// Sub-component for each product row
interface ProductRowItemProps {
  row: ProductRow;
  idx: number;
  products: Array<{
    id: number;
    name: string;
    currentStock: number;
    unit: string;
    categoryId: number;
  }>;
  lastProduct: { id: number; name: string } | undefined;
  onUpdate: (update: Partial<ProductRow>) => void;
  onRemove?: () => void;
}

function ProductRowItem({
  row,
  idx,
  products,
  lastProduct,
  onUpdate,
  onRemove,
}: ProductRowItemProps) {
  const filteredProducts = useMemo(() => {
    if (!row.productSearch.trim()) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(row.productSearch.toLowerCase()) ||
        productCode(BigInt(p.id))
          .toLowerCase()
          .includes(row.productSearch.toLowerCase()),
    );
  }, [products, row.productSearch]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === row.productId),
    [products, row.productId],
  );

  // Build list with recently used at top
  const displayProducts = useMemo(() => {
    if (!row.productSearch.trim() && lastProduct) {
      const rest = filteredProducts.filter(
        (p) => String(p.id) !== String(lastProduct.id),
      );
      const recent = filteredProducts.find(
        (p) => String(p.id) === String(lastProduct.id),
      );
      return recent ? [recent, ...rest] : filteredProducts;
    }
    return filteredProducts;
  }, [filteredProducts, lastProduct, row.productSearch]);

  return (
    <div
      className="flex gap-2 items-start"
      data-ocid={`usage.product_row.${idx + 1}`}
    >
      <div className="flex-1">
        <Popover
          open={row.productPopoverOpen}
          onOpenChange={(open) => onUpdate({ productPopoverOpen: open })}
        >
          <PopoverTrigger asChild>
            <Button
              data-ocid={`usage.product.select.${idx + 1}`}
              variant="outline"
              aria-expanded={row.productPopoverOpen}
              className="w-full justify-between font-normal text-sm h-9"
            >
              {selectedProduct ? (
                <span className="truncate">
                  {String(selectedProduct.id) === String(lastProduct?.id) && (
                    <span className="text-pink-500 mr-1">⭐</span>
                  )}
                  {selectedProduct.name}{" "}
                  <span className="text-muted-foreground text-xs">
                    (Stock: {selectedProduct.currentStock}{" "}
                    {selectedProduct.unit})
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Product select karo
                </span>
              )}
              <ChevronsUpDown
                size={13}
                className="ml-2 opacity-50 flex-shrink-0"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search product..."
                value={row.productSearch}
                onValueChange={(v) => onUpdate({ productSearch: v })}
              />
              <CommandList>
                <CommandEmpty>No product found</CommandEmpty>
                <CommandGroup>
                  {displayProducts.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={String(p.id)}
                      onSelect={(val) => {
                        onUpdate({
                          productId: val,
                          productSearch: "",
                          productPopoverOpen: false,
                        });
                      }}
                    >
                      {String(p.id) === String(lastProduct?.id) && (
                        <span className="text-pink-500 mr-1">⭐</span>
                      )}
                      <span className="font-mono text-xs text-pink-500 mr-1">
                        [{productCode(BigInt(p.id))}]
                      </span>
                      <span>{p.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {String(p.id) === String(lastProduct?.id)
                          ? "(Recently Used) "
                          : ""}
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
      <div className="w-24">
        <Input
          data-ocid={`usage.quantity.input.${idx + 1}`}
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Qty"
          value={row.quantity}
          onChange={(e) => onUpdate({ quantity: e.target.value })}
          className="h-9 text-sm"
        />
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0"
          data-ocid={`usage.remove_row.button.${idx + 1}`}
        >
          <X size={14} />
        </Button>
      )}
    </div>
  );
}
