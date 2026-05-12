import { useState } from "react";
import {
  useListBudgetCategories,
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PieChart, Plus, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";

type BudgetCategory = {
  id: number;
  name: string;
  group: string;
  plannedWeekly: number;
  actualWeekly: number;
  essential: boolean;
  includeInScenario: boolean;
  carryForward: boolean;
  notes?: string | null;
  color?: string | null;
};

const defaultForm = {
  name: "",
  group: "living",
  plannedWeekly: "",
  actualWeekly: "0",
  essential: true,
  includeInScenario: true,
  carryForward: false,
  notes: "",
  color: "",
};

export default function FamilyBudget() {
  const { data: categories = [], isLoading, refetch } = useListBudgetCategories();
  const createMutation = useCreateBudgetCategory();
  const updateMutation = useUpdateBudgetCategory();
  const deleteMutation = useDeleteBudgetCategory();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const totalPlanned = categories.reduce((s, c) => s + c.plannedWeekly, 0);
  const totalActual = categories.reduce((s, c) => s + c.actualWeekly, 0);
  const variance = totalActual - totalPlanned;

  const groups = [...new Set(categories.map((c) => c.group))].sort();

  function openCreate() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(c: BudgetCategory) {
    setForm({
      name: c.name,
      group: c.group,
      plannedWeekly: String(c.plannedWeekly),
      actualWeekly: String(c.actualWeekly),
      essential: c.essential,
      includeInScenario: c.includeInScenario,
      carryForward: c.carryForward,
      notes: c.notes ?? "",
      color: c.color ?? "",
    });
    setEditingId(c.id);
    setDialogOpen(true);
  }

  function buildPayload() {
    return {
      name: form.name,
      group: form.group,
      plannedWeekly: Number(form.plannedWeekly) || 0,
      actualWeekly: Number(form.actualWeekly) || 0,
      essential: form.essential,
      includeInScenario: form.includeInScenario,
      carryForward: form.carryForward,
      notes: form.notes || null,
      color: form.color || null,
    };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const payload = buildPayload();
    try {
      if (editingId != null) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Category updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Category added" });
      }
      setDialogOpen(false);
      refetch();
    } catch {
      toast({ title: "Error saving category", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this budget category?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Category deleted" });
      refetch();
    } catch {
      toast({ title: "Error deleting category", variant: "destructive" });
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PieChart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Family Budget</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Weekly Planned</div>
            <div className="text-xl font-bold">{formatCurrency(totalPlanned)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Weekly Actual</div>
            <div className="text-xl font-bold">{formatCurrency(totalActual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Variance</div>
            <div className={`text-xl font-bold flex items-center gap-1 ${variance > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(Math.abs(variance))}
              <span className="text-xs font-normal">{variance > 0 ? "over" : "under"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories by group */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No budget categories yet. Add your first category to track weekly spending.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const items = categories.filter((c) => c.group === group);
            const groupPlanned = items.reduce((s, c) => s + c.plannedWeekly, 0);
            const groupActual = items.reduce((s, c) => s + c.actualWeekly, 0);
            return (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm capitalize">{group}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(groupActual)} / {formatCurrency(groupPlanned)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((c) => {
                        const v = c.actualWeekly - c.plannedWeekly;
                        const pct = c.plannedWeekly > 0 ? (c.actualWeekly / c.plannedWeekly) * 100 : 0;
                        return (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="py-2.5 w-full">
                              <div className="flex items-center gap-2">
                                {c.color && (
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                )}
                                <span className="font-medium">{c.name}</span>
                                {c.essential && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Essential</Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground pr-4 hidden md:table-cell whitespace-nowrap">
                              {formatCurrency(c.plannedWeekly)} plan
                            </td>
                            <td className="py-2.5 text-right pr-4 whitespace-nowrap font-medium">
                              {formatCurrency(c.actualWeekly)}
                            </td>
                            <td className="py-2.5 text-right pr-4 hidden md:table-cell whitespace-nowrap">
                              <span className={`text-xs ${v > 0 ? "text-destructive" : "text-emerald-600"}`}>
                                {v > 0 ? "+" : ""}{formatCurrency(v)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right w-20 hidden md:table-cell">
                              <div className="flex items-center gap-1 justify-end">
                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${pct > 100 ? "bg-destructive" : "bg-primary"}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Category" : "Add Budget Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input placeholder="e.g. Groceries" value={form.name} onChange={f("name")} />
            </div>
            <div>
              <Label>Group</Label>
              <Input placeholder="e.g. living, utilities, transport" value={form.group} onChange={f("group")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Planned Weekly ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.plannedWeekly} onChange={f("plannedWeekly")} />
              </div>
              <div>
                <Label>Actual Weekly ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.actualWeekly} onChange={f("actualWeekly")} />
              </div>
            </div>
            <div>
              <Label>Color (hex)</Label>
              <div className="flex gap-2">
                <Input placeholder="#2D6A4F" value={form.color} onChange={f("color")} />
                {form.color && <div className="w-9 h-9 rounded border flex-shrink-0" style={{ backgroundColor: form.color }} />}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.essential} onCheckedChange={(v) => setForm((p) => ({ ...p, essential: v }))} />
                <Label>Essential</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.includeInScenario} onCheckedChange={(v) => setForm((p) => ({ ...p, includeInScenario: v }))} />
                <Label>In Scenarios</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.carryForward} onCheckedChange={(v) => setForm((p) => ({ ...p, carryForward: v }))} />
                <Label>Carry Forward</Label>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={form.notes} onChange={f("notes")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
