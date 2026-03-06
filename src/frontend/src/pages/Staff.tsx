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
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddStaff,
  useDeleteStaff,
  useStaff,
  useUpdateStaff,
} from "../hooks/useQueries";

interface FormData {
  name: string;
  role: string;
}

const EMPTY_FORM: FormData = { name: "", role: "" };

const ROLE_COLORS: Record<string, string> = {
  Senior: "bg-primary/10 text-primary border-primary/20",
  Junior: "bg-secondary text-secondary-foreground border-secondary",
  Manager: "bg-accent text-accent-foreground border-accent",
};

export function Staff() {
  const { data: staff = [] } = useStaff();
  const addMutation = useAddStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: { id: number; name: string; role: string }) => {
    setEditingId(s.id);
    setForm({ name: s.name, role: s.role });
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
        });
        toast.success("Staff member updated");
      } else {
        await addMutation.mutateAsync({
          name: form.name.trim(),
          role: form.role.trim(),
        });
        toast.success(`${form.name.trim()} added to staff`);
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

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Team Members
              <Badge variant="secondary" className="ml-2 font-body text-xs">
                {staff.length}
              </Badge>
            </CardTitle>
            <Button data-ocid="staff.add_button" onClick={openAdd} size="sm">
              <Plus size={15} className="mr-1.5" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <div
              data-ocid="staff.empty_state"
              className="text-center py-12 text-muted-foreground text-sm"
            >
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No staff members yet</p>
              <p className="text-xs mt-1">
                Add your first team member to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Member</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s, idx) => {
                  const ocidIdx = idx + 1;
                  const roleClass =
                    ROLE_COLORS[s.role] ??
                    "bg-secondary text-secondary-foreground border-secondary";
                  return (
                    <TableRow key={s.id} data-ocid={`staff.item.${ocidIdx}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                            {getInitials(s.name)}
                          </div>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-body ${roleClass}`}
                        >
                          {s.role}
                        </Badge>
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
