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
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Bike,
  Calculator,
  Download,
  Home,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStaff } from "../hooks/useQueries";
import {
  addCashEntry,
  addHomeServiceSettlement,
  deleteCashEntry,
  deleteHomeServiceSettlement,
  getCashEntriesForDate,
  getHomeServiceSettlementsForDate,
  getRideBalanceByStaff,
} from "../lib/localStorage";
import type { CashEntry, CashEntryType, HomeServiceSettlement } from "../types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatAmount(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function exportLedgerCSV(entries: CashEntry[], date: string) {
  const header = ["Date", "Type", "Description", "Amount", "Notes"];
  const rows = entries.map((e) => [
    e.date,
    e.type === "income" ? "Income" : e.type === "expense" ? "Expense" : "Ride",
    e.description,
    e.amount,
    e.notes ?? "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cash_ledger_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ENTRY_TYPE_LABELS: Record<CashEntryType, string> = {
  income: "Madam se Mila (Income)",
  expense: "Kharcha Diya (Expense)",
  ride: "Girl ne Diya (Ride)",
};

const ENTRY_TYPE_COLORS: Record<
  CashEntryType,
  { bg: string; text: string; border: string }
> = {
  income: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  expense: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
  },
  ride: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
};

const COMMON_EXPENSE_RECIPIENTS = [
  "Bike Wala",
  "Auto Wala",
  "Rickshaw Wala",
  "Kirana",
  "Misc",
];

export function CashLedger() {
  const [date, setDate] = useState<string>(todayStr);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  // Form state
  const [formType, setFormType] = useState<CashEntryType>("income");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStaffId, setFormStaffId] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Home Service Settlement form state
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [hsStaffId, setHsStaffId] = useState("");
  const [hsClientName, setHsClientName] = useState("");
  const [hsServiceAmount, setHsServiceAmount] = useState("");
  const [hsClientPaid, setHsClientPaid] = useState("");
  const [hsTravelExpense, setHsTravelExpense] = useState("");
  const [hsNotes, setHsNotes] = useState("");
  const [hsSubmitting, setHsSubmitting] = useState(false);

  const { data: staff = [] } = useStaff();

  const { data: entries = [] } = useQuery<CashEntry[]>({
    queryKey: ["cash_entries", date],
    queryFn: () => getCashEntriesForDate(date),
  });

  const { data: rideBalances = {} } = useQuery({
    queryKey: ["ride_balances"],
    queryFn: () => getRideBalanceByStaff(),
  });

  const { data: settlements = [] } = useQuery<HomeServiceSettlement[]>({
    queryKey: ["home_service_settlements", date],
    queryFn: () => getHomeServiceSettlementsForDate(date),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["cash_entries"] });
    qc.invalidateQueries({ queryKey: ["ride_balances"] });
    qc.invalidateQueries({ queryKey: ["home_service_settlements"] });
  }

  const staffMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff],
  );

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        (e.notes ?? "").toLowerCase().includes(q) ||
        ENTRY_TYPE_LABELS[e.type].toLowerCase().includes(q),
    );
  }, [entries, search]);

  const summary = useMemo(() => {
    const totalIn = entries
      .filter((e) => e.type === "income" || e.type === "ride")
      .reduce((s, e) => s + e.amount, 0);
    const totalOut = entries
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);
    const madamGave = entries
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const girlsGave = entries
      .filter((e) => e.type === "ride")
      .reduce((s, e) => s + e.amount, 0);
    return { totalIn, totalOut, net: totalIn - totalOut, madamGave, girlsGave };
  }, [entries]);

  // Pending balances: per staff, sum of all ride entries across all dates
  const pendingStaffBalances = useMemo(() => {
    return staff
      .map((s) => ({
        staff: s,
        balance: rideBalances[s.id] ?? { totalAmount: 0, entries: [] },
      }))
      .filter((x) => x.balance.totalAmount > 0);
  }, [staff, rideBalances]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number.parseFloat(formAmount);
    if (!formAmount || Number.isNaN(amount) || amount <= 0) {
      toast.error("Sahi amount daalein");
      return;
    }
    if (!formDesc.trim() && formType !== "ride") {
      toast.error("Description daalein");
      return;
    }
    if (formType === "ride" && !formStaffId) {
      toast.error("Staff member select karein");
      return;
    }

    setSubmitting(true);
    try {
      const staffName =
        formType === "ride" && formStaffId
          ? (staffMap[Number(formStaffId)] ?? formDesc)
          : formDesc;

      addCashEntry({
        date,
        type: formType,
        amount,
        description: formType === "ride" ? staffName : formDesc.trim(),
        recipientStaffId: formType === "ride" ? Number(formStaffId) : undefined,
        notes: formNotes.trim() || undefined,
      });

      invalidate();
      setFormAmount("");
      setFormDesc("");
      setFormStaffId("");
      setFormNotes("");
      toast.success("Entry add ho gayi");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: number) {
    deleteCashEntry(id);
    invalidate();
    toast("Entry delete ho gayi");
  }

  function handleDownload() {
    exportLedgerCSV(entries, date);
    toast.success("CSV download ho rahi hai");
  }

  // Home Service Settlement computed preview
  const hsPreview = useMemo(() => {
    const svc = Number.parseFloat(hsServiceAmount) || 0;
    const paid = Number.parseFloat(hsClientPaid) || 0;
    const travel = Number.parseFloat(hsTravelExpense) || 0;
    if (svc <= 0) return null;
    const extra = paid - svc; // change amount (excess paid by client)
    const netToPayStaff = travel - extra; // how much office needs to pay staff extra
    // netToPayStaff > 0 => office must give this to staff (staff spent more than extra)
    // netToPayStaff <= 0 => staff keeps the extra / gives back to office
    return { svc, paid, extra, travel, netToPayStaff };
  }, [hsServiceAmount, hsClientPaid, hsTravelExpense]);

  async function handleSettlementSubmit(e: React.FormEvent) {
    e.preventDefault();
    const svc = Number.parseFloat(hsServiceAmount);
    const paid = Number.parseFloat(hsClientPaid);
    const travel = Number.parseFloat(hsTravelExpense);
    if (!hsStaffId) {
      toast.error("Staff select karein");
      return;
    }
    if (!hsClientName.trim()) {
      toast.error("Client ka naam daalein");
      return;
    }
    if (!svc || svc <= 0) {
      toast.error("Service amount daalein");
      return;
    }
    if (!paid || paid <= 0) {
      toast.error("Client ne kitna diya daalein");
      return;
    }
    if (Number.isNaN(travel) || travel < 0) {
      toast.error("Travel expense sahi daalein");
      return;
    }
    setHsSubmitting(true);
    try {
      addHomeServiceSettlement({
        date,
        staffId: Number(hsStaffId),
        clientName: hsClientName.trim(),
        serviceAmount: svc,
        clientPaid: paid,
        travelExpense: travel,
        notes: hsNotes.trim() || undefined,
      });
      invalidate();
      setHsStaffId("");
      setHsClientName("");
      setHsServiceAmount("");
      setHsClientPaid("");
      setHsTravelExpense("");
      setHsNotes("");
      setShowSettlementForm(false);
      toast.success("Home service settlement save ho gayi");
    } finally {
      setHsSubmitting(false);
    }
  }

  function handleDeleteSettlement(id: number) {
    deleteHomeServiceSettlement(id);
    invalidate();
    toast("Settlement delete ho gayi");
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
          <Wallet size={28} className="text-primary" />
          Cash Ledger
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Rozana ka paisa hisaab -- madam se mila, kharcha, aur girls ki rides
        </p>
      </div>

      {/* Date selector + Download */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Input
          data-ocid="cashledger.date.input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-44 text-sm"
        />
        <Button
          data-ocid="cashledger.download_button"
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download size={14} />
          Download CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card
          data-ocid="cashledger.madam_gave.card"
          className="shadow-card border-green-200"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <ArrowDownCircle size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-700">
                  {formatAmount(summary.madamGave)}
                </p>
                <p className="text-xs text-muted-foreground">Madam ne Diya</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="cashledger.girls_gave.card"
          className="shadow-card border-blue-200"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-700">
                  {formatAmount(summary.girlsGave)}
                </p>
                <p className="text-xs text-muted-foreground">Girls ne Diya</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="cashledger.total_expense.card"
          className="shadow-card border-red-200"
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(summary.totalOut)}
                </p>
                <p className="text-xs text-muted-foreground">Kharcha Gaya</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          data-ocid="cashledger.net_balance.card"
          className={`shadow-card ${summary.net >= 0 ? "border-emerald-200" : "border-amber-200"}`}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${summary.net >= 0 ? "bg-emerald-100" : "bg-amber-100"}`}
              >
                <IndianRupee
                  size={16}
                  className={
                    summary.net >= 0 ? "text-emerald-600" : "text-amber-500"
                  }
                />
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${summary.net >= 0 ? "text-emerald-700" : "text-amber-600"}`}
                >
                  {formatAmount(Math.abs(summary.net))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.net >= 0 ? "Net Baaki Hai" : "Zyada Gaya"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Add Entry Form */}
        <Card
          data-ocid="cashledger.add_entry.card"
          className="shadow-card xl:col-span-1"
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              Nayi Entry Add Karo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Entry Ka Type</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => {
                    setFormType(v as CashEntryType);
                    setFormDesc("");
                    setFormStaffId("");
                  }}
                >
                  <SelectTrigger
                    data-ocid="cashledger.type.select"
                    className="h-9 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <span className="flex items-center gap-2">
                        <ArrowDownCircle size={14} className="text-green-600" />
                        Madam se Mila (Income)
                      </span>
                    </SelectItem>
                    <SelectItem value="expense">
                      <span className="flex items-center gap-2">
                        <Bike size={14} className="text-red-500" />
                        Kharcha Diya (Expense)
                      </span>
                    </SelectItem>
                    <SelectItem value="ride">
                      <span className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-600" />
                        Girl ne Diya (Ride)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Amount (₹)</Label>
                <Input
                  data-ocid="cashledger.amount.input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Description or Staff for ride */}
              {formType === "ride" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Girl (Staff Member)
                  </Label>
                  <Select value={formStaffId} onValueChange={setFormStaffId}>
                    <SelectTrigger
                      data-ocid="cashledger.staff.select"
                      className="h-9 text-sm"
                    >
                      <SelectValue placeholder="Staff select karo" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} {s.role ? `(${s.role})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {formType === "income" ? "Source / Note" : "Kisko Diya"}
                  </Label>
                  {formType === "expense" && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {COMMON_EXPENSE_RECIPIENTS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormDesc(r)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            formDesc === r
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  <Input
                    data-ocid="cashledger.description.input"
                    placeholder={
                      formType === "income"
                        ? "e.g. Madam ne salary di"
                        : "e.g. Bike Wala, Auto Wala"
                    }
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notes (Optional)</Label>
                <Textarea
                  data-ocid="cashledger.notes.textarea"
                  placeholder="Koi extra note..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>

              <Button
                data-ocid="cashledger.add.submit_button"
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                <Plus size={15} className="mr-1.5" />
                Entry Daalo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Entries Table + Pending Balances */}
        <div className="xl:col-span-2 space-y-5">
          {/* Entries for selected date */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <IndianRupee size={16} className="text-primary" />
                  {date} ki Entries
                </CardTitle>
                <div className="relative w-52">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    data-ocid="cashledger.search_input"
                    className="pl-8 h-8 text-sm"
                    placeholder="Search entries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredEntries.length === 0 ? (
                <div
                  data-ocid="cashledger.entries.empty_state"
                  className="text-center py-10 text-muted-foreground text-sm"
                >
                  <Wallet size={32} className="mx-auto mb-2 opacity-25" />
                  <p className="font-medium">Koi entry nahi is date ke liye</p>
                  <p className="text-xs mt-1">
                    Upar wale form se nayi entry add karo
                  </p>
                </div>
              ) : (
                <Table data-ocid="cashledger.entries.table">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs pl-4">Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs">Notes</TableHead>
                      <TableHead className="text-xs text-right pr-4">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry, idx) => {
                      const colors = ENTRY_TYPE_COLORS[entry.type];
                      return (
                        <TableRow
                          key={entry.id}
                          data-ocid={`cashledger.entry.item.${idx + 1}`}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="pl-4">
                            <Badge
                              className={`${colors.bg} ${colors.text} ${colors.border} border hover:${colors.bg} text-xs font-medium`}
                            >
                              {entry.type === "income"
                                ? "Income"
                                : entry.type === "expense"
                                  ? "Expense"
                                  : "Ride"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {entry.description}
                          </TableCell>
                          <TableCell
                            className={`text-sm font-bold text-right ${
                              entry.type === "expense"
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {entry.type === "expense" ? "-" : "+"}
                            {formatAmount(entry.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                            {entry.notes ?? "—"}
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <Button
                              data-ocid={`cashledger.entry.delete_button.${idx + 1}`}
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(entry.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Ride Balances */}
          <Card
            data-ocid="cashledger.pending_balances.card"
            className="shadow-card border-blue-100"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-600" />
                Girls ki Ride Balance (Sabhi Dates)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Har girl ne total kitne paise aaj tak diye hain rides mein
              </p>
            </CardHeader>
            <CardContent>
              {pendingStaffBalances.length === 0 ? (
                <div
                  data-ocid="cashledger.pending.empty_state"
                  className="text-center py-6 text-muted-foreground text-sm"
                >
                  <Users size={28} className="mx-auto mb-2 opacity-25" />
                  <p>Abhi koi ride balance nahi hai</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingStaffBalances.map(({ staff: s, balance }, idx) => (
                    <div
                      key={s.id}
                      data-ocid={`cashledger.pending.item.${idx + 1}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50/60 border border-blue-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.role} &mdash; {balance.entries.length} ride
                          {balance.entries.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-blue-700">
                          {formatAmount(balance.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Diya
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Home Service Settlement Section ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Home size={20} className="text-primary" />
              Home Service Settlement
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Jab client ke paas change na ho ya travel kharch ho -- sab
              automatically adjust ho jayega
            </p>
          </div>
          <Button
            data-ocid="cashledger.settlement.open_modal_button"
            onClick={() => setShowSettlementForm((v) => !v)}
            className="gap-1.5"
            variant={showSettlementForm ? "secondary" : "default"}
          >
            <Calculator size={15} />
            {showSettlementForm ? "Form Band Karo" : "Naya Settlement"}
          </Button>
        </div>

        {showSettlementForm && (
          <Card
            data-ocid="cashledger.settlement.card"
            className="shadow-card mb-6 border-amber-200"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Calculator size={16} className="text-amber-600" />
                Home Service Ka Hisaab
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Service amount, client ne jo diya, aur travel kharch daalein --
                baaki sab automatic ho jayega
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettlementSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Staff */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Beautician (Staff)
                    </Label>
                    <Select value={hsStaffId} onValueChange={setHsStaffId}>
                      <SelectTrigger
                        data-ocid="cashledger.settlement.staff.select"
                        className="h-9 text-sm"
                      >
                        <SelectValue placeholder="Staff select karo" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name} {s.role ? `(${s.role})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Client Ka Naam
                    </Label>
                    <Input
                      data-ocid="cashledger.settlement.client.input"
                      placeholder="e.g. Sunita Ji"
                      value={hsClientName}
                      onChange={(e) => setHsClientName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Service Amount */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Service Amount (₹) -- Actual Bill
                    </Label>
                    <Input
                      data-ocid="cashledger.settlement.service_amount.input"
                      type="number"
                      min="1"
                      placeholder="e.g. 2800"
                      value={hsServiceAmount}
                      onChange={(e) => setHsServiceAmount(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Client Paid */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Client ne Diya (₹) -- Actual Cash
                    </Label>
                    <Input
                      data-ocid="cashledger.settlement.client_paid.input"
                      type="number"
                      min="1"
                      placeholder="e.g. 3000"
                      value={hsClientPaid}
                      onChange={(e) => setHsClientPaid(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Travel Expense */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Travel Kharch (₹) -- Auto/Bike/Hotel
                    </Label>
                    <Input
                      data-ocid="cashledger.settlement.travel.input"
                      type="number"
                      min="0"
                      placeholder="e.g. 120"
                      value={hsTravelExpense}
                      onChange={(e) => setHsTravelExpense(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Notes (Optional)
                    </Label>
                    <Input
                      data-ocid="cashledger.settlement.notes.input"
                      placeholder="Koi extra baat..."
                      value={hsNotes}
                      onChange={(e) => setHsNotes(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Live Preview Calculator */}
                {hsPreview && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                      Hisaab Preview
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Bill:
                        </span>
                        <span className="font-medium">
                          {formatAmount(hsPreview.svc)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Client ne Diya:
                        </span>
                        <span className="font-medium">
                          {formatAmount(hsPreview.paid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Extra Mila (Change):
                        </span>
                        <span
                          className={`font-medium ${hsPreview.extra >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          {hsPreview.extra >= 0 ? "+" : ""}
                          {formatAmount(Math.abs(hsPreview.extra))}
                          {hsPreview.extra < 0 ? " (kam diya)" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Travel Kharch:
                        </span>
                        <span className="font-medium text-red-600">
                          -{formatAmount(hsPreview.travel)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-amber-300 pt-2 mt-2">
                      {hsPreview.netToPayStaff > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-sm font-bold text-orange-700">
                            Office ko Staff ko dene hain:
                          </div>
                          <div className="text-lg font-bold text-orange-700">
                            {formatAmount(hsPreview.netToPayStaff)}
                          </div>
                        </div>
                      ) : hsPreview.netToPayStaff < 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-sm font-bold text-green-700">
                            Staff office ko degi (extra change):
                          </div>
                          <div className="text-lg font-bold text-green-700">
                            {formatAmount(Math.abs(hsPreview.netToPayStaff))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-emerald-700">
                          Sab barabar! Koi pending nahi.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  data-ocid="cashledger.settlement.submit_button"
                  type="submit"
                  className="w-full"
                  disabled={hsSubmitting}
                >
                  <Plus size={15} className="mr-1.5" />
                  Settlement Save Karo
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Settlements List */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Home size={16} className="text-primary" />
              {date} ke Home Service Settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {settlements.length === 0 ? (
              <div
                data-ocid="cashledger.settlements.empty_state"
                className="text-center py-10 text-muted-foreground text-sm"
              >
                <Home size={32} className="mx-auto mb-2 opacity-25" />
                <p className="font-medium">
                  Is date ka koi home service settlement nahi hai
                </p>
                <p className="text-xs mt-1">
                  Upar "Naya Settlement" button se add karo
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {settlements.map((s, idx) => {
                  const extra = s.clientPaid - s.serviceAmount;
                  const netToPayStaff = s.travelExpense - extra;
                  return (
                    <div
                      key={s.id}
                      data-ocid={`cashledger.settlement.item.${idx + 1}`}
                      className="px-4 py-3 hover:bg-muted/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {staffMap[s.staffId] ?? "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              →
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {s.clientName}
                            </span>
                            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 border hover:bg-amber-100">
                              Home Service
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span>
                              Bill:{" "}
                              <strong className="text-foreground">
                                {formatAmount(s.serviceAmount)}
                              </strong>
                            </span>
                            <span>
                              Diya:{" "}
                              <strong className="text-foreground">
                                {formatAmount(s.clientPaid)}
                              </strong>
                            </span>
                            <span>
                              Travel:{" "}
                              <strong className="text-red-600">
                                {formatAmount(s.travelExpense)}
                              </strong>
                            </span>
                          </div>
                          <div className="mt-1.5">
                            {netToPayStaff > 0 ? (
                              <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                                Office degi staff ko:{" "}
                                {formatAmount(netToPayStaff)}
                              </span>
                            ) : netToPayStaff < 0 ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                                Staff degi office ko:{" "}
                                {formatAmount(Math.abs(netToPayStaff))}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                                Barabar -- koi pending nahi
                              </span>
                            )}
                          </div>
                          {s.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {s.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          data-ocid={`cashledger.settlement.delete_button.${idx + 1}`}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteSettlement(s.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
