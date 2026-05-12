import { useState } from "react";
import {
  useListScenarios,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, Pencil, Trash2, CheckCircle, Circle } from "lucide-react";

type Scenario = {
  id: number;
  name: string;
  label: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  incomeAssumptions?: string | null;
  billAssumptions?: string | null;
  arrearsAssumptions?: string | null;
  spendingChanges?: string | null;
  notes?: string | null;
  createdAt: string;
};

const defaultForm = {
  name: "",
  label: "base" as const,
  status: "draft" as const,
  startDate: "",
  endDate: "",
  incomeAssumptions: "",
  billAssumptions: "",
  arrearsAssumptions: "",
  spendingChanges: "",
  notes: "",
};

const LABEL_COLORS: Record<string, string> = {
  base: "bg-blue-100 text-blue-700",
  "best-case": "bg-green-100 text-green-700",
  "worst-case": "bg-red-100 text-red-700",
  "minimum-survival": "bg-amber-100 text-amber-700",
  "catch-up": "bg-purple-100 text-purple-700",
  custom: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Circle,
  active: CheckCircle,
  archived: Circle,
};

export default function Scenarios() {
  const { data: scenarios = [], isLoading, refetch } = useListScenarios();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const deleteMutation = useDeleteScenario();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  function openCreate() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(s: Scenario) {
    setForm({
      name: s.name,
      label: s.label as typeof defaultForm.label,
      status: s.status as typeof defaultForm.status,
      startDate: s.startDate ?? "",
      endDate: s.endDate ?? "",
      incomeAssumptions: s.incomeAssumptions ?? "",
      billAssumptions: s.billAssumptions ?? "",
      arrearsAssumptions: s.arrearsAssumptions ?? "",
      spendingChanges: s.spendingChanges ?? "",
      notes: s.notes ?? "",
    });
    setEditingId(s.id);
    setDialogOpen(true);
  }

  function buildPayload() {
    return {
      name: form.name,
      label: form.label,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      incomeAssumptions: form.incomeAssumptions || null,
      billAssumptions: form.billAssumptions || null,
      arrearsAssumptions: form.arrearsAssumptions || null,
      spendingChanges: form.spendingChanges || null,
      notes: form.notes || null,
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
        toast({ title: "Scenario updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Scenario created" });
      }
      setDialogOpen(false);
      refetch();
    } catch {
      toast({ title: "Error saving scenario", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this scenario?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Scenario deleted" });
      refetch();
    } catch {
      toast({ title: "Error deleting scenario", variant: "destructive" });
    }
  }

  const ta = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const inp = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const active = scenarios.filter((s) => s.status === "active");
  const drafts = scenarios.filter((s) => s.status === "draft");
  const archived = scenarios.filter((s) => s.status === "archived");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Scenarios</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Scenario
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Plan and compare different financial situations — best case, worst case, minimum survival, and custom projections.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>
      ) : scenarios.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No scenarios yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Create your first scenario to model what-if situations.</p>
            <Button onClick={openCreate} size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> Create Scenario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Active", items: active },
            { label: "Drafts", items: drafts },
            { label: "Archived", items: archived },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {group.items.map((s) => {
                    const StatusIcon = STATUS_ICONS[s.status] ?? Circle;
                    return (
                      <Card key={s.id} className={s.status === "archived" ? "opacity-60" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 flex-shrink-0 ${s.status === "active" ? "text-emerald-600" : "text-muted-foreground"}`} />
                              <CardTitle className="text-sm">{s.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${LABEL_COLORS[s.label] ?? "bg-gray-100 text-gray-600"}`}>
                                {s.label}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {s.startDate && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(s.startDate)}{s.endDate ? ` → ${formatDate(s.endDate)}` : ""}
                            </div>
                          )}
                          {s.incomeAssumptions && (
                            <div className="text-xs"><span className="font-medium">Income: </span>{s.incomeAssumptions}</div>
                          )}
                          {s.arrearsAssumptions && (
                            <div className="text-xs"><span className="font-medium">Arrears: </span>{s.arrearsAssumptions}</div>
                          )}
                          {s.spendingChanges && (
                            <div className="text-xs"><span className="font-medium">Spending: </span>{s.spendingChanges}</div>
                          )}
                          {s.notes && (
                            <div className="text-xs text-muted-foreground">{s.notes}</div>
                          )}
                          <div className="flex justify-end gap-1 pt-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Scenario" : "New Scenario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input placeholder="e.g. Best case — both incomes" value={form.name} onChange={inp("name")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Label</Label>
                <Select value={form.label} onValueChange={(v) => setForm((p) => ({ ...p, label: v as typeof defaultForm.label }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="best-case">Best Case</SelectItem>
                    <SelectItem value="worst-case">Worst Case</SelectItem>
                    <SelectItem value="minimum-survival">Minimum Survival</SelectItem>
                    <SelectItem value="catch-up">Catch Up</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as typeof defaultForm.status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={inp("startDate")} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={inp("endDate")} />
              </div>
            </div>
            <div>
              <Label>Income Assumptions</Label>
              <Textarea rows={2} placeholder="e.g. Both partners working full-time" value={form.incomeAssumptions} onChange={ta("incomeAssumptions")} />
            </div>
            <div>
              <Label>Bill Assumptions</Label>
              <Textarea rows={2} placeholder="e.g. SA Water reduced to $150/qtr" value={form.billAssumptions} onChange={ta("billAssumptions")} />
            </div>
            <div>
              <Label>Arrears Assumptions</Label>
              <Textarea rows={2} placeholder="e.g. Rent catch-up lifted to $80/wk" value={form.arrearsAssumptions} onChange={ta("arrearsAssumptions")} />
            </div>
            <div>
              <Label>Spending Changes</Label>
              <Textarea rows={2} placeholder="e.g. Groceries cut to $130/wk" value={form.spendingChanges} onChange={ta("spendingChanges")} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Any additional notes" value={form.notes} onChange={ta("notes")} />
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
