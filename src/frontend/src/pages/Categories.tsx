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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddCategory,
  useCategories,
  useDeleteCategory,
} from "../hooks/useQueries";

const DEFAULT_CATEGORY_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
]);

export function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const addMutation = useAddCategory();
  const deleteMutation = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return;
    }
    try {
      await addMutation.mutateAsync(trimmed);
      setNewName("");
      toast.success(`Category "${trimmed}" added`);
    } catch {
      toast.error("Failed to add category");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Category "${deleteTarget.name}" deleted`);
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Categories
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage product categories for your inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Category Form */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              Add Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-sm font-medium">
                Category Name
              </Label>
              <Input
                id="cat-name"
                data-ocid="categories.name.input"
                placeholder="e.g., Hair Color"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Button
              data-ocid="categories.submit_button"
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full"
            >
              {addMutation.isPending ? "Adding..." : "Add Category"}
            </Button>
          </CardContent>
        </Card>

        {/* Category List */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Tag size={18} className="text-primary" />
              All Categories
              <Badge variant="secondary" className="ml-auto font-body text-xs">
                {categories.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
                  <Skeleton key={key} className="h-10 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div
                data-ocid="categories.empty_state"
                className="text-center py-12 text-muted-foreground text-sm"
              >
                <Tag size={32} className="mx-auto mb-2 opacity-30" />
                No categories found
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-16">ID</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat, idx) => {
                      const isDefault = DEFAULT_CATEGORY_IDS.has(cat.id);
                      const ocidIdx = idx + 1;
                      return (
                        <TableRow
                          key={cat.id}
                          data-ocid={`categories.item.${ocidIdx}`}
                        >
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {cat.id}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {cat.name}
                          </TableCell>
                          <TableCell>
                            {isDefault ? (
                              <Badge
                                variant="secondary"
                                className="text-xs font-body"
                              >
                                Default
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs font-body text-primary border-primary/30"
                              >
                                Custom
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                data-ocid={`categories.delete_button.${ocidIdx}`}
                                onClick={() =>
                                  setDeleteTarget({
                                    id: cat.id,
                                    name: cat.name,
                                  })
                                }
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="categories.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{deleteTarget?.name}"</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="categories.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="categories.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
