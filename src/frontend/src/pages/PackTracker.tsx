import { Button } from "@/components/ui/button";
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
import type { PackArrival, PackDistribution, PackItem } from "@/types";
import {
  BoxesIcon,
  Download,
  Loader2,
  Package,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddPackArrival,
  useAddPackDistribution,
  useAddPackItem,
  useDeletePackArrival,
  useDeletePackDistribution,
  useDeletePackItem,
  usePackArrivals,
  usePackDistributions,
  usePackItems,
  useStaff,
} from "../hooks/useQueries";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function downloadCSV(
  rows: Record<string, string | number>[],
  filename: string,
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PackTracker() {
  // ── Data hooks ──────────────────────────────────────────────────────────
  const { data: packItems = [], isLoading: itemsLoading } = usePackItems();
  const { data: arrivals = [], isLoading: arrivalsLoading } = usePackArrivals();
  const { data: distributions = [], isLoading: distLoading } =
    usePackDistributions();
  const { data: staffList = [] } = useStaff();

  const addItemMutation = useAddPackItem();
  const deleteItemMutation = useDeletePackItem();
  const addArrivalMutation = useAddPackArrival();
  const deleteArrivalMutation = useDeletePackArrival();
  const addDistMutation = useAddPackDistribution();
  const deleteDistMutation = useDeletePackDistribution();

  const isLoading = itemsLoading || arrivalsLoading || distLoading;

  // Add item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");

  // Arrival form
  const [arrItemId, setArrItemId] = useState("");
  const [arrQty, setArrQty] = useState("");
  const [arrDate, setArrDate] = useState(todayDate());
  const [arrNotes, setArrNotes] = useState("");
  const [arrSearch, setArrSearch] = useState("");

  // Distribution form
  const [distItemId, setDistItemId] = useState("");
  const [distStaffId, setDistStaffId] = useState("");
  const [distQty, setDistQty] = useState("");
  const [distDate, setDistDate] = useState(todayDate());
  const [distTime, setDistTime] = useState(nowTime());
  const [distNotes, setDistNotes] = useState("");
  const [distSearch, setDistSearch] = useState("");

  const itemMap = useMemo(
    () =>
      Object.fromEntries(packItems.map((i) => [i.id, i])) as Record<
        number,
        PackItem
      >,
    [packItems],
  );
  const staffMap = useMemo(
    () => Object.fromEntries(staffList.map((s) => [s.id, s.name])),
    [staffList],
  );

  // Summary: total arrived vs total given per item
  const summary = useMemo(() => {
    return packItems.map((item) => {
      const totalArrived = arrivals
        .filter((a) => a.packItemId === item.id)
        .reduce((sum, a) => sum + a.quantity, 0);
      const totalGiven = distributions
        .filter((d) => d.packItemId === item.id)
        .reduce((sum, d) => sum + d.quantity, 0);
      return {
        item,
        totalArrived,
        totalGiven,
        remaining: totalArrived - totalGiven,
      };
    });
  }, [packItems, arrivals, distributions]);

  const filteredArrivals = useMemo(() => {
    if (!arrSearch) return arrivals;
    const q = arrSearch.toLowerCase();
    return arrivals.filter(
      (a: PackArrival) =>
        (itemMap[a.packItemId]?.name ?? "").toLowerCase().includes(q) ||
        (a.notes ?? "").toLowerCase().includes(q) ||
        a.date.includes(q),
    );
  }, [arrivals, arrSearch, itemMap]);

  const filteredDistributions = useMemo(() => {
    if (!distSearch) return distributions;
    const q = distSearch.toLowerCase();
    return distributions.filter(
      (d: PackDistribution) =>
        (itemMap[d.packItemId]?.name ?? "").toLowerCase().includes(q) ||
        (staffMap[d.staffId] ?? "").toLowerCase().includes(q) ||
        (d.notes ?? "").toLowerCase().includes(q) ||
        d.date.includes(q),
    );
  }, [distributions, distSearch, itemMap, staffMap]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Item ka naam daalein");
      return;
    }
    if (!newItemUnit.trim()) {
      toast.error("Unit daalein (jaise pcs, ml, gm)");
      return;
    }
    try {
      await addItemMutation.mutateAsync({
        name: newItemName.trim(),
        unit: newItemUnit.trim(),
      });
      setNewItemName("");
      setNewItemUnit("");
      toast.success("Item add ho gaya");
    } catch {
      toast.error("Item add karne mein problem aai");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItemMutation.mutateAsync(id);
      toast.success("Item delete ho gaya");
    } catch {
      toast.error("Delete karne mein problem aai");
    }
  };

  const handleAddArrival = async () => {
    if (!arrItemId) {
      toast.error("Item chunein");
      return;
    }
    const qty = Number(arrQty);
    if (!qty || qty <= 0) {
      toast.error("Sahi quantity daalein");
      return;
    }
    if (!arrDate) {
      toast.error("Date daalein");
      return;
    }
    try {
      await addArrivalMutation.mutateAsync({
        packItemId: Number(arrItemId),
        quantity: qty,
        date: arrDate,
        notes: arrNotes.trim() || undefined,
      });
      setArrQty("");
      setArrNotes("");
      toast.success("Maal darj ho gaya");
    } catch {
      toast.error("Maal darj karne mein problem aai");
    }
  };

  const handleDeleteArrival = async (id: number) => {
    try {
      await deleteArrivalMutation.mutateAsync(id);
      toast.success("Entry delete ho gayi");
    } catch {
      toast.error("Delete karne mein problem aai");
    }
  };

  const handleAddDistribution = async () => {
    if (!distItemId) {
      toast.error("Item chunein");
      return;
    }
    if (!distStaffId) {
      toast.error("Staff member chunein");
      return;
    }
    const qty = Number(distQty);
    if (!qty || qty <= 0) {
      toast.error("Sahi quantity daalein");
      return;
    }
    if (!distDate) {
      toast.error("Date daalein");
      return;
    }
    if (!distTime) {
      toast.error("Time daalein");
      return;
    }
    try {
      await addDistMutation.mutateAsync({
        packItemId: Number(distItemId),
        staffId: Number(distStaffId),
        quantity: qty,
        date: distDate,
        time: distTime,
        notes: distNotes.trim() || undefined,
      });
      setDistQty("");
      setDistNotes("");
      setDistTime(nowTime());
      toast.success("Distribution darj ho gaya");
    } catch {
      toast.error("Distribution darj karne mein problem aai");
    }
  };

  const handleDeleteDistribution = async (id: number) => {
    try {
      await deleteDistMutation.mutateAsync(id);
      toast.success("Entry delete ho gayi");
    } catch {
      toast.error("Delete karne mein problem aai");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin text-primary" />
        <span>Data load ho raha hai...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Pack Tracker
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Maal aana aur staff ko dena -- poora hisaab
        </p>
      </div>

      {/* Summary Cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {summary.map(({ item, totalArrived, totalGiven, remaining }) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {item.name}
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-green-400">
                  Aaya: <strong>{totalArrived}</strong>
                </span>
                <span className="text-pink-400">
                  Diya: <strong>{totalGiven}</strong>
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Bacha: <strong className="text-foreground">{remaining}</strong>{" "}
                {item.unit}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section A: Pack Items Management */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <BoxesIcon size={18} className="text-primary" />
          <h2 className="text-lg font-semibold">Items Manage Karo</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-5">
          <Input
            data-ocid="pack.item_name.input"
            placeholder="Item ka naam (e.g. Wax Roll)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-52"
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          />
          <Input
            data-ocid="pack.item_unit.input"
            placeholder="Unit (pcs, ml, gm)"
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            className="w-40"
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          />
          <Button
            data-ocid="pack.add_item.button"
            onClick={handleAddItem}
            disabled={addItemMutation.isPending}
          >
            {addItemMutation.isPending ? (
              <Loader2 size={15} className="mr-1.5 animate-spin" />
            ) : (
              <Plus size={15} className="mr-1.5" />
            )}
            Add Item
          </Button>
        </div>
        {packItems.length === 0 ? (
          <div
            data-ocid="pack.items.empty_state"
            className="text-center py-6 text-muted-foreground text-sm"
          >
            Koi item nahi hai. Upar se add karo.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {packItems.map((item, idx) => (
              <div
                key={item.id}
                data-ocid={`pack.item.${idx + 1}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({item.unit})
                </span>
                <button
                  type="button"
                  data-ocid={`pack.delete_button.${idx + 1}`}
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={deleteItemMutation.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B: Maal Aaya */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Package size={18} className="text-green-400" />
          <h2 className="text-lg font-semibold">Maal Aaya</h2>
          <span className="text-xs text-muted-foreground">(Stock Arrival)</span>
        </div>

        {/* Arrival Form */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <div className="space-y-1">
            <Label className="text-xs">Item</Label>
            <Select value={arrItemId} onValueChange={setArrItemId}>
              <SelectTrigger data-ocid="pack.arrival_item.select">
                <SelectValue placeholder="Item chunein" />
              </SelectTrigger>
              <SelectContent>
                {packItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantity</Label>
            <Input
              data-ocid="pack.arrival_qty.input"
              type="number"
              min="1"
              placeholder="Kitna aaya"
              value={arrQty}
              onChange={(e) => setArrQty(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              data-ocid="pack.arrival_date.input"
              type="date"
              value={arrDate}
              onChange={(e) => setArrDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              data-ocid="pack.arrival_notes.input"
              placeholder="Koi note..."
              value={arrNotes}
              onChange={(e) => setArrNotes(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              data-ocid="pack.arrival_submit.button"
              onClick={handleAddArrival}
              disabled={addArrivalMutation.isPending}
              className="w-full"
            >
              {addArrivalMutation.isPending ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : null}
              Aaya Darj Karo
            </Button>
          </div>
        </div>

        {/* Arrival Table */}
        <div className="flex items-center gap-3 mb-3">
          <Input
            data-ocid="pack.arrival_search.input"
            placeholder="Search arrivals..."
            value={arrSearch}
            onChange={(e) => setArrSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            data-ocid="pack.arrival_download.button"
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCSV(
                filteredArrivals.map((a) => ({
                  Date: formatDate(a.date),
                  Item: itemMap[a.packItemId]?.name ?? "",
                  Unit: itemMap[a.packItemId]?.unit ?? "",
                  Quantity: a.quantity,
                  Notes: a.notes ?? "",
                })),
                `maal_aaya_${todayDate()}.csv`,
              );
            }}
          >
            <Download size={14} className="mr-1.5" />
            Download
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Item</TableHead>
                <TableHead className="text-xs text-right">Quantity</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArrivals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div
                      data-ocid="pack.arrivals.empty_state"
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Koi maal darj nahi hai
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredArrivals].reverse().map((a, idx) => (
                  <TableRow
                    key={a.id}
                    data-ocid={`pack.arrival.row.${idx + 1}`}
                  >
                    <TableCell className="text-sm">
                      {formatDate(a.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {itemMap[a.packItemId]?.name ?? "—"}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({itemMap[a.packItemId]?.unit ?? ""})
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-right font-bold text-green-400">
                      {a.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`pack.arrival.delete_button.${idx + 1}`}
                        onClick={() => handleDeleteArrival(a.id)}
                        disabled={deleteArrivalMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section C: Kisne Kitna Liya */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-pink-400" />
          <h2 className="text-lg font-semibold">Kisne Kitna Liya</h2>
          <span className="text-xs text-muted-foreground">(Distribution)</span>
        </div>

        {/* Distribution Form */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <div className="space-y-1">
            <Label className="text-xs">Item</Label>
            <Select value={distItemId} onValueChange={setDistItemId}>
              <SelectTrigger data-ocid="pack.dist_item.select">
                <SelectValue placeholder="Item chunein" />
              </SelectTrigger>
              <SelectContent>
                {packItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Staff</Label>
            <Select value={distStaffId} onValueChange={setDistStaffId}>
              <SelectTrigger data-ocid="pack.dist_staff.select">
                <SelectValue placeholder="Staff chunein" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantity</Label>
            <Input
              data-ocid="pack.dist_qty.input"
              type="number"
              min="1"
              placeholder="Kitna diya"
              value={distQty}
              onChange={(e) => setDistQty(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              data-ocid="pack.dist_date.input"
              type="date"
              value={distDate}
              onChange={(e) => setDistDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time</Label>
            <Input
              data-ocid="pack.dist_time.input"
              type="time"
              value={distTime}
              onChange={(e) => setDistTime(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              data-ocid="pack.dist_submit.button"
              onClick={handleAddDistribution}
              disabled={addDistMutation.isPending}
              className="w-full"
            >
              {addDistMutation.isPending ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : null}
              Diya Darj Karo
            </Button>
          </div>
        </div>
        <div className="space-y-1 mb-5">
          <Label className="text-xs">Notes (optional)</Label>
          <Input
            data-ocid="pack.dist_notes.input"
            placeholder="Koi note..."
            value={distNotes}
            onChange={(e) => setDistNotes(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Distribution Table */}
        <div className="flex items-center gap-3 mb-3">
          <Input
            data-ocid="pack.dist_search.input"
            placeholder="Search distributions..."
            value={distSearch}
            onChange={(e) => setDistSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            data-ocid="pack.dist_download.button"
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCSV(
                filteredDistributions.map((d) => ({
                  Date: formatDate(d.date),
                  Time: d.time,
                  Item: itemMap[d.packItemId]?.name ?? "",
                  Unit: itemMap[d.packItemId]?.unit ?? "",
                  Staff: staffMap[d.staffId] ?? "",
                  Quantity: d.quantity,
                  Notes: d.notes ?? "",
                })),
                `kisne_liya_${todayDate()}.csv`,
              );
            }}
          >
            <Download size={14} className="mr-1.5" />
            Download
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Item</TableHead>
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs text-right">Quantity</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div
                      data-ocid="pack.distributions.empty_state"
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Koi distribution darj nahi hai
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredDistributions].reverse().map((d, idx) => (
                  <TableRow key={d.id} data-ocid={`pack.dist.row.${idx + 1}`}>
                    <TableCell className="text-sm">
                      {formatDate(d.date)}
                    </TableCell>
                    <TableCell className="text-sm">{d.time}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {itemMap[d.packItemId]?.name ?? "—"}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({itemMap[d.packItemId]?.unit ?? ""})
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {staffMap[d.staffId] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-right font-bold text-pink-400">
                      {d.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`pack.dist.delete_button.${idx + 1}`}
                        onClick={() => handleDeleteDistribution(d.id)}
                        disabled={deleteDistMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
