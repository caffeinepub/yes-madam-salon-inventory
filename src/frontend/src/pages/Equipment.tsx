import { Badge } from "@/components/ui/badge";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Download,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useStaff } from "../hooks/useQueries";
import {
  addEquipmentCheckout,
  addEquipmentItem,
  deleteEquipmentItem,
  getEquipmentCheckouts,
  getEquipmentItems,
  returnEquipmentCheckout,
} from "../lib/dataService";

// ── Inline Query Hooks ────────────────────────────────────────────────────────

function useEquipmentItems() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["equipment_items"],
    queryFn: () => getEquipmentItems(),
    enabled: !!actor && !isFetching,
  });
}

function useEquipmentCheckouts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["equipment_checkouts"],
    queryFn: () => getEquipmentCheckouts(),
    enabled: !!actor && !isFetching,
  });
}

// ── CSV Export ──────────────────────────────────────────────────────────────

function exportCheckoutsToCSV(
  rows: {
    date: string;
    equipment: string;
    staff: string;
    takenAt: string;
    returnedAt: string;
    status: string;
  }[],
  filename: string,
) {
  const header = [
    "Date",
    "Equipment",
    "Staff",
    "Taken At",
    "Returned At",
    "Status",
  ];
  const csvContent = [
    header,
    ...rows.map((r) => [
      r.date,
      r.equipment,
      r.staff,
      r.takenAt,
      r.returnedAt,
      r.status,
    ]),
  ]
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

// ── Main Component ─────────────────────────────────────────────────────────────

export function Equipment() {
  const queryClient = useQueryClient();
  const { data: staff = [] } = useStaff();
  const { data: equipmentItems = [] } = useEquipmentItems();
  const { data: checkouts = [] } = useEquipmentCheckouts();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [newItemName, setNewItemName] = useState("");
  const [search, setSearch] = useState("");
  const [equipmentItemSearch, setEquipmentItemSearch] = useState("");

  // Map lookups
  const staffMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff],
  );
  const equipMap = useMemo(
    () => Object.fromEntries(equipmentItems.map((e) => [e.id, e.name])),
    [equipmentItems],
  );

  // Filtered equipment items for the list
  const filteredEquipmentItems = useMemo(() => {
    if (!equipmentItemSearch.trim()) return equipmentItems;
    const q = equipmentItemSearch.toLowerCase();
    return equipmentItems.filter((e) => e.name.toLowerCase().includes(q));
  }, [equipmentItems, equipmentItemSearch]);

  // Currently checked out (no returnedAt)
  const currentlyOut = useMemo(
    () => checkouts.filter((c) => !c.returnedAt),
    [checkouts],
  );

  // Sorted + filtered history
  const filteredCheckouts = useMemo(() => {
    const sorted = [...checkouts].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.takenAt.localeCompare(a.takenAt);
    });
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (c) =>
        (staffMap[c.staffId] ?? "").toLowerCase().includes(q) ||
        (equipMap[c.equipmentId] ?? "").toLowerCase().includes(q),
    );
  }, [checkouts, search, staffMap, equipMap]);

  // Mutations
  const checkoutMutation = useMutation({
    mutationFn: async ({
      staffId,
      equipmentId,
    }: {
      staffId: number;
      equipmentId: number;
    }) => addEquipmentCheckout(staffId, equipmentId),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`Checked out at ${record.takenAt}`);
      setSelectedStaffId("");
      setSelectedEquipmentId("");
    },
    onError: () => toast.error("Checkout failed"),
  });

  const addItemMutation = useMutation({
    mutationFn: async (name: string) => addEquipmentItem(name),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["equipment_items"] });
      toast.success(`"${item.name}" added`);
      setNewItemName("");
    },
    onError: () => toast.error("Failed to add item"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteEquipmentItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_items"] });
      toast.success("Equipment item removed");
    },
    onError: () => toast.error("Failed to remove item"),
  });

  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      await returnEquipmentCheckout(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment_checkouts"] });
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      toast.success(`Returned at ${time}`);
    },
    onError: () => toast.error("Failed to mark as returned"),
  });

  const handleCheckout = () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }
    if (!selectedEquipmentId) {
      toast.error("Please select equipment");
      return;
    }
    checkoutMutation.mutate({
      staffId: Number(selectedStaffId),
      equipmentId: Number(selectedEquipmentId),
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error("Enter equipment name");
      return;
    }
    addItemMutation.mutate(newItemName.trim());
  };

  const handleDownload = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = filteredCheckouts.map((c) => ({
      date: c.date,
      equipment: equipMap[c.equipmentId] ?? "—",
      staff: staffMap[c.staffId] ?? "—",
      takenAt: c.takenAt,
      returnedAt: c.returnedAt ?? "",
      status: c.returnedAt ? "Returned" : "Still Out",
    }));
    exportCheckoutsToCSV(rows, `equipment_checkout_${today}.csv`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
          <Wrench size={28} className="text-primary" />
          Equipment Checkout
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track equipment taken and returned by staff
        </p>
      </div>

      {/* Section 1 — Currently Out */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock size={16} className="text-amber-500" />
          Currently Out
          {currentlyOut.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-body ml-1">
              {currentlyOut.length}
            </Badge>
          )}
        </h2>

        {currentlyOut.length === 0 ? (
          <div
            data-ocid="equipment.empty_state"
            className="rounded-lg border border-dashed border-border bg-card p-8 text-center"
          >
            <CheckCircle2
              size={32}
              className="mx-auto mb-2 text-green-500 opacity-80"
            />
            <p className="text-sm font-medium text-foreground">
              All equipment is in
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No equipment is currently checked out
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentlyOut.map((c, idx) => (
              <div
                key={c.id}
                data-ocid={`equipment.currently_out.card.${idx + 1}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Wrench size={15} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        {equipMap[c.equipmentId] ?? "—"}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {staffMap[c.staffId] ?? "—"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-200 text-amber-800 border-amber-300 text-xs shrink-0">
                    Out
                  </Badge>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-700">
                  <div className="flex items-center gap-3">
                    <span>{c.date}</span>
                    <span>Taken at {c.takenAt}</span>
                  </div>
                  <Button
                    size="sm"
                    data-ocid={`equipment.checkin_button.${idx + 1}`}
                    onClick={() => returnMutation.mutate(c.id)}
                    disabled={returnMutation.isPending}
                    className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 text-white border-0 shrink-0"
                  >
                    <CheckCircle2 size={12} className="mr-1" />
                    Check In
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Section 2 — New Checkout */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Package size={16} className="text-primary" />
              New Checkout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label htmlFor="eq-staff">Staff Member</Label>
                <Select
                  value={selectedStaffId}
                  onValueChange={setSelectedStaffId}
                >
                  <SelectTrigger
                    id="eq-staff"
                    data-ocid="equipment.staff.select"
                  >
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <div className="py-3 text-center text-xs text-muted-foreground">
                        No staff added yet
                      </div>
                    ) : (
                      staff.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                          {s.role ? (
                            <span className="text-muted-foreground ml-1 text-xs">
                              · {s.role}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eq-item">Equipment</Label>
                <Select
                  value={selectedEquipmentId}
                  onValueChange={setSelectedEquipmentId}
                >
                  <SelectTrigger id="eq-item" data-ocid="equipment.item.select">
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentItems.length === 0 ? (
                      <div className="py-3 text-center text-xs text-muted-foreground">
                        No equipment added yet
                      </div>
                    ) : (
                      equipmentItems.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              data-ocid="equipment.checkout_button"
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Wrench size={15} className="mr-1.5" />
              {checkoutMutation.isPending ? "Checking out..." : "Checkout"}
            </Button>
          </CardContent>
        </Card>

        {/* Section 3 — Manage Equipment Items */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Wrench size={16} className="text-primary" />
              Equipment List
              <Badge variant="secondary" className="font-body text-xs ml-1">
                {filteredEquipmentItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input
                data-ocid="equipment.new_item.input"
                placeholder="e.g. Roll-On Heater"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="flex-1 h-9"
              />
              <Button
                data-ocid="equipment.add_item_button"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleAddItem}
                disabled={addItemMutation.isPending}
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Equipment Item Search */}
            <div className="relative mb-3">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                data-ocid="equipment.item_search.input"
                className="pl-8 h-8 text-sm"
                placeholder="Search equipment..."
                value={equipmentItemSearch}
                onChange={(e) => setEquipmentItemSearch(e.target.value)}
              />
            </div>

            {equipmentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No equipment added yet
              </p>
            ) : filteredEquipmentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No equipment matching "{equipmentItemSearch}"
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {filteredEquipmentItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group"
                  >
                    <span className="text-sm text-foreground truncate">
                      {item.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`equipment.delete_button.${idx + 1}`}
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 shrink-0"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4 — Checkout History */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Checkout History
              <Badge variant="secondary" className="font-body text-xs ml-1">
                {filteredCheckouts.length}
              </Badge>
            </CardTitle>
            <Button
              data-ocid="equipment.download_button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download size={14} className="mr-1.5" />
              Download Excel
            </Button>
          </div>
          <div className="relative mt-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="equipment.search_input"
              className="pl-9 h-9"
              placeholder="Search by staff or equipment name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCheckouts.length === 0 ? (
            <div
              data-ocid="equipment.empty_state"
              className="text-center py-12 text-muted-foreground text-sm"
            >
              <Wrench size={36} className="mx-auto mb-3 opacity-25" />
              <p className="font-medium">No checkout records</p>
              <p className="text-xs mt-1">
                {search
                  ? "Try a different search"
                  : "Checkouts will appear here once staff take equipment"}
              </p>
            </div>
          ) : (
            <Table data-ocid="equipment.history.table">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Equipment</TableHead>
                  <TableHead className="text-xs">Staff</TableHead>
                  <TableHead className="text-xs">Taken At</TableHead>
                  <TableHead className="text-xs">Returned At</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheckouts.map((c, idx) => {
                  const ocidIdx = idx + 1;
                  const isReturned = !!c.returnedAt;
                  return (
                    <TableRow key={c.id} data-ocid={`equipment.row.${ocidIdx}`}>
                      <TableCell className="text-sm">{c.date}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {equipMap[c.equipmentId] ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {staffMap[c.staffId] ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.takenAt}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.returnedAt ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isReturned ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-body">
                            Returned
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-body">
                            Still Out
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!isReturned && (
                          <Button
                            variant="outline"
                            size="sm"
                            data-ocid={`equipment.return_button.${ocidIdx}`}
                            onClick={() => returnMutation.mutate(c.id)}
                            disabled={returnMutation.isPending}
                            className="h-7 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 size={12} className="mr-1" />
                            Mark Returned
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
