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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddStaff,
  useDeleteStaff,
  useStaff,
  useUpdateStaff,
} from "../hooks/useQueries";

const staffCode = (id: bigint) => `S${Number(id).toString().padStart(3, "0")}`;

const PINNED_KEY = "pinnedStaffIds";

function getPinnedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function savePinnedIds(ids: Set<number>) {
  localStorage.setItem(PINNED_KEY, JSON.stringify([...ids]));
}

function exportStaffToExcel(
  data: { id: number; name: string; role: string; mobile?: string }[],
  filename: string,
) {
  const header = ["ID", "Name", "Role", "Mobile"];
  const rows = data.map((s) => [s.id, s.name, s.role, s.mobile ?? ""]);
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

interface FormData {
  name: string;
  role: string;
  mobile: string;
}

const EMPTY_FORM: FormData = { name: "", role: "", mobile: "" };

interface BulkRow {
  uid: string;
  name: string;
  role: string;
  mobile: string;
}

function parseBulkText(text: string): BulkRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: BulkRow[] = [];
  let currentRole = "Staff";
  for (const line of lines) {
    // If line ends with : it's a role header
    if (line.endsWith(":")) {
      currentRole = line.slice(0, -1).trim() || "Staff";
    } else {
      rows.push({
        uid: `${Date.now()}-${Math.random()}`,
        name: line,
        role: currentRole,
        mobile: "",
      });
    }
  }
  return rows;
}

export function Staff() {
  const { data: staff = [] } = useStaff();
  const addMutation = useAddStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const [pinnedIds, setPinnedIds] = useState<Set<number>>(getPinnedIds);

  useEffect(() => {
    savePinnedIds(pinnedIds);
  }, [pinnedIds]);

  const togglePin = (id: number) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Bulk add state
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkParsed, setBulkParsed] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  const handleBulkParse = () => {
    const rows = parseBulkText(bulkText);
    setBulkRows(rows);
    setBulkParsed(true);
  };

  const handleBulkAdd = async () => {
    if (bulkRows.length === 0) return;
    setBulkAdding(true);
    let count = 0;
    for (const row of bulkRows) {
      if (!row.name.trim()) continue;
      try {
        await addMutation.mutateAsync({
          name: row.name.trim(),
          role: row.role.trim() || "Staff",
          mobile: row.mobile.trim() || undefined,
        });
        count++;
      } catch {
        // skip failed rows
      }
    }
    setBulkAdding(false);
    setBulkText("");
    setBulkRows([]);
    setBulkParsed(false);
    toast.success(
      `${count} staff member${count !== 1 ? "s" : ""} added successfully!`,
    );
  };

  const filteredStaff = useMemo(() => {
    const base = search.trim()
      ? staff.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.role.toLowerCase().includes(search.toLowerCase()) ||
            (s.mobile ?? "").includes(search),
        )
      : staff;

    // Sort: pinned A-Z first, then non-pinned A-Z
    return [...base].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [staff, search, pinnedIds]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: {
    id: number;
    name: string;
    role: string;
    mobile?: string;
  }) => {
    setEditingId(s.id);
    setForm({ name: s.name, role: s.role, mobile: s.mobile ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Staff name is required");
      return;
    }
    if (!form.role.trim()) {
      toast.error("Role is required");
      return;
    }
    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: form.name.trim(),
          role: form.role.trim(),
          mobile: form.mobile.trim() || undefined,
        });
        toast.success("Staff member updated");
      } else {
        const newStaff = await addMutation.mutateAsync({
          name: form.name.trim(),
          role: form.role.trim(),
          mobile: form.mobile.trim() || undefined,
        });
        toast.success(
          `${form.name.trim()} added! Code: ${staffCode(BigInt(newStaff.id))}`,
        );
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
      toast.success(`${deleteTarget.name} removed from staff`);
    } catch {
      toast.error("Failed to remove staff member");
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Staff
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your salon team members
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list" data-ocid="staff.list.tab">
            Staff List
          </TabsTrigger>
          <TabsTrigger value="bulk" data-ocid="staff.bulk.tab">
            📋 Bulk Add (Category-wise)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Team Members
                  <Badge variant="secondary" className="ml-2 font-body text-xs">
                    {filteredStaff.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    data-ocid="staff.download_button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().slice(0, 10);
                      exportStaffToExcel(filteredStaff, `staff_${today}.csv`);
                    }}
                  >
                    <Download size={14} className="mr-1.5" />
                    Download Excel
                  </Button>
                  <Button
                    data-ocid="staff.clear_all_button"
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Kya aap sab ${staff.length} staff members ko delete karna chahte ho? Yeh action undo nahi ho sakta.`,
                        )
                      )
                        return;
                      for (const s of staff) {
                        try {
                          await deleteMutation.mutateAsync(s.id);
                        } catch {
                          /* ignore */
                        }
                      }
                      toast.success("Sab staff members delete ho gaye");
                    }}
                  >
                    Sab Staff Hatao
                  </Button>
                  <Button
                    data-ocid="staff.add_button"
                    onClick={openAdd}
                    size="sm"
                  >
                    <Plus size={15} className="mr-1.5" />
                    Add Staff
                  </Button>
                </div>
              </div>
              <div className="relative mt-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  data-ocid="staff.search_input"
                  className="pl-9 h-9"
                  placeholder="Search staff by name or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredStaff.length === 0 ? (
                <div
                  data-ocid="staff.empty_state"
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  <Users size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No staff members found</p>
                  <p className="text-xs mt-1">
                    {search
                      ? "Try a different search"
                      : "Add your first team member to get started"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs w-8">Pin</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Member</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Mobile</TableHead>
                      <TableHead className="text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((s, idx) => {
                      const ocidIdx = idx + 1;
                      const isPinned = pinnedIds.has(s.id);
                      return (
                        <TableRow
                          key={s.id}
                          data-ocid={`staff.item.${ocidIdx}`}
                          className={
                            isPinned ? "border-l-2 border-l-pink-500" : ""
                          }
                        >
                          <TableCell className="p-2">
                            <button
                              type="button"
                              onClick={() => togglePin(s.id)}
                              data-ocid={`staff.toggle.${ocidIdx}`}
                              title={isPinned ? "Unpin" : "Pin to top"}
                              className={`p-1 rounded transition-colors ${
                                isPinned
                                  ? "text-pink-500"
                                  : "text-muted-foreground hover:text-pink-400"
                              }`}
                            >
                              <Pin
                                size={14}
                                className={isPinned ? "fill-pink-500" : ""}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-pink-500">
                            {staffCode(BigInt(s.id))}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                  isPinned
                                    ? "bg-pink-500/20 text-pink-400"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {getInitials(s.name)}
                              </div>
                              <span className="text-sm font-medium">
                                {s.name}
                                {isPinned && (
                                  <span className="ml-2 text-xs text-pink-500 font-normal">
                                    📌
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs font-body"
                            >
                              {s.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.mobile ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                data-ocid={`staff.edit_button.${ocidIdx}`}
                                onClick={() => openEdit(s)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-ocid={`staff.delete_button.${ocidIdx}`}
                                onClick={() =>
                                  setDeleteTarget({ id: s.id, name: s.name })
                                }
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                📋 Bulk Add Staff (Category-wise)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Role/Category naam likho phir{" "}
                <code className="bg-muted px-1 rounded">:</code> ke baad — phir
                har line pe ek staff ka naam
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded p-3 text-xs text-muted-foreground font-mono">
                <div className="font-semibold text-foreground mb-1">
                  Format Example:
                </div>
                <div>Beautician:</div>
                <div>Priya Sharma</div>
                <div>Sunita Devi</div>
                <div>Makeup Artist:</div>
                <div>Kavita Singh</div>
                <div>Receptionist:</div>
                <div>Anjali Mehta</div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bulk-text">Staff Names Paste Karo</Label>
                <Textarea
                  id="bulk-text"
                  data-ocid="staff.bulk.textarea"
                  placeholder={
                    "Beautician:\nPriya Sharma\nSunita Devi\nMakeup Artist:\nKavita Singh"
                  }
                  rows={10}
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    setBulkParsed(false);
                  }}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                data-ocid="staff.bulk.parse_button"
                variant="outline"
                onClick={handleBulkParse}
                disabled={!bulkText.trim()}
              >
                🔍 Preview Karo
              </Button>

              {bulkParsed && bulkRows.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">
                    {bulkRows.length} staff members milenge:
                  </div>
                  <div className="border rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">Naam</TableHead>
                          <TableHead className="text-xs">Role</TableHead>
                          <TableHead className="text-xs">
                            Mobile (optional)
                          </TableHead>
                          <TableHead className="text-xs">Hatao</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkRows.map((row, i) => (
                          <TableRow key={row.uid}>
                            <TableCell className="text-xs text-muted-foreground">
                              {i + 1}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.name}
                                onChange={(e) => {
                                  const next = [...bulkRows];
                                  next[i] = {
                                    ...next[i],
                                    name: e.target.value,
                                  };
                                  setBulkRows(next);
                                }}
                                className="h-7 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.role}
                                onChange={(e) => {
                                  const next = [...bulkRows];
                                  next[i] = {
                                    ...next[i],
                                    role: e.target.value,
                                  };
                                  setBulkRows(next);
                                }}
                                className="h-7 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.mobile}
                                placeholder="optional"
                                onChange={(e) => {
                                  const next = [...bulkRows];
                                  next[i] = {
                                    ...next[i],
                                    mobile: e.target.value,
                                  };
                                  setBulkRows(next);
                                }}
                                className="h-7 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() =>
                                  setBulkRows((prev) =>
                                    prev.filter((_, j) => j !== i),
                                  )
                                }
                              >
                                <Trash2 size={12} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    data-ocid="staff.bulk.submit_button"
                    onClick={handleBulkAdd}
                    disabled={bulkAdding || bulkRows.length === 0}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {bulkAdding
                      ? "Add ho rahe hain..."
                      : `✅ Sab Add Karo (${bulkRows.length} staff)`}
                  </Button>
                </div>
              )}

              {bulkParsed && bulkRows.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Koi valid naam nahi mila. Format check karo.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="staff.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingId !== null ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Full Name</Label>
              <Input
                id="s-name"
                data-ocid="staff.name.input"
                placeholder="e.g., Priya Sharma"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-role">Role</Label>
              <Input
                id="s-role"
                data-ocid="staff.role.input"
                placeholder="e.g., Senior Stylist"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-mobile">
                Mobile Number{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="s-mobile"
                data-ocid="staff.mobile.input"
                placeholder="e.g., 9876543210"
                type="tel"
                value={form.mobile}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mobile: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="staff.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="staff.submit_button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget?.name}</strong> from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
