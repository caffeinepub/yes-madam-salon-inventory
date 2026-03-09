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
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAddCategory,
  useCategories,
  useDeleteCategory,
} from "../hooks/useQueries";

function exportToExcel(data: { id: number; name: string }[], filename: string) {
  const header = ["ID", "Category Name"];
  const rows = data.map((c) => [c.id, c.name]);
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

export function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const addMutation = useAddCategory();
  const deleteMutation = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Paste multiple mode
  const [addMode, setAddMode] = useState<"single" | "paste">("single");
  const [pasteText, setPasteText] = useState("");
  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [isAddingAll, setIsAddingAll] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

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

  const handleParsePaste = () => {
    const raw = pasteText;
    const names = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // Deduplicate
    const unique = [...new Set(names)];
    setParsedNames(unique);
    if (unique.length === 0) {
      toast.error(
        "No valid names found. Enter names separated by commas or new lines.",
      );
    }
  };

  const handleRemoveParsed = (idx: number) => {
    setParsedNames((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAll = async () => {
    if (parsedNames.length === 0) return;
    setIsAddingAll(true);
    let added = 0;
    let failed = 0;
    for (const name of parsedNames) {
      try {
        await addMutation.mutateAsync(name);
        added++;
      } catch {
        failed++;
      }
    }
    setIsAddingAll(false);
    setParsedNames([]);
    setPasteText("");
    if (added > 0) toast.success(`${added} categories added`);
    if (failed > 0) toast.error(`${failed} categories failed to add`);
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
            {/* Mode Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                data-ocid="categories.mode_single.tab"
                onClick={() => setAddMode("single")}
                className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${
                  addMode === "single"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single
              </button>
              <button
                type="button"
                data-ocid="categories.mode_paste.tab"
                onClick={() => setAddMode("paste")}
                className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${
                  addMode === "paste"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Paste Multiple
              </button>
            </div>

            {addMode === "single" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cat-name" className="text-sm font-medium">
                    Category Name
                  </Label>
                  <Input
                    id="cat-name"
                    data-ocid="categories.name.input"
                    placeholder="e.g., Nail Art"
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Paste Category Names
                  </Label>
                  <Textarea
                    data-ocid="categories.paste_textarea"
                    placeholder={"Bleach\nFacial\nWax, Hair Spa, Cleanup"}
                    value={pasteText}
                    onChange={(e) => {
                      setPasteText(e.target.value);
                      setParsedNames([]);
                    }}
                    rows={4}
                    className="text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    One per line or comma-separated
                  </p>
                </div>
                <Button
                  data-ocid="categories.parse_button"
                  variant="outline"
                  onClick={handleParsePaste}
                  className="w-full"
                  disabled={!pasteText.trim()}
                >
                  Preview Names
                </Button>

                {parsedNames.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Preview ({parsedNames.length} names):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-muted/40 rounded-md">
                      {parsedNames.map((name, idx) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="text-xs pl-2 pr-1 py-0.5 flex items-center gap-1"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleRemoveParsed(idx)}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Button
                      data-ocid="categories.add_all_button"
                      onClick={handleAddAll}
                      disabled={isAddingAll || parsedNames.length === 0}
                      className="w-full"
                    >
                      {isAddingAll ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        `Add All (${parsedNames.length})`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Category List */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                All Categories
                <Badge variant="secondary" className="ml-2 font-body text-xs">
                  {filtered.length}
                </Badge>
              </CardTitle>
              <Button
                data-ocid="categories.download_button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  exportToExcel(filtered, `categories_${today}.csv`);
                }}
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
                data-ocid="categories.search_input"
                className="pl-9 h-9"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
                  <Skeleton key={key} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
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
                      <TableHead className="text-xs w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((cat, idx) => {
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
