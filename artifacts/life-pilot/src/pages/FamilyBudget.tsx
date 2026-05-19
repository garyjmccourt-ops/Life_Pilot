import { useState, useMemo } from "react";
import {
  useListBudgetCategories,
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
  useListIncomeEntries,
  useListBills,
  useListArrears,
  useListIncome,
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
import {
  PieChart, Plus, Pencil, Trash2, TrendingDown, TrendingUp,
  ShieldCheck, AlertTriangle, AlertCircle, XCircle, CalendarDays,
} from "lucide-react";

// ── Date helpers ──────────────────────────────────────────────────────────────

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(now);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  const offset = m.getTimezoneOffset();
  return new Date(m.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

type PeriodKey = "weekly" | "fortnightly" | "monthly";

interface PeriodRange {
  key: PeriodKey;
  label: string;
  start: string;
  end: string;
  factor: number;  // multiply weekly amounts by this to get period amount
}

function buildPeriods(): Record<PeriodKey, PeriodRange> {
  const monday = getCurrentMonday();
  const weekEnd = addDays(monday, 6);
  const fortStart = addDays(monday, -7);
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    weekly: {
      key: "weekly", factor: 1,
      label: `${fmtShort(monday)} – ${fmtShort(weekEnd)}`,
      start: monday, end: weekEnd,
    },
    fortnightly: {
      key: "fortnightly", factor: 2,
      label: `${fmtShort(fortStart)} – ${fmtShort(weekEnd)}`,
      start: fortStart, end: weekEnd,
    },
    monthly: {
      key: "monthly", factor: lastDay / 7,
      label: now.toLocaleString("en-AU", { month: "long", year: "numeric" }),
      start: monthStart, end: monthEnd,
    },
  };
}

function billsDueInPeriod(bills: any[], start: string, end: string): any[] {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T23:59:59");
  return bills.filter(bill => {
    if (bill.dueDate) {
      const d = new Date(typeof bill.dueDate === "string" ? bill.dueDate + "T00:00:00" : bill.dueDate);
      if (d >= s && d <= e) return true;
    }
    if (bill.frequency === "weekly" || bill.frequency === "fortnightly") return true;
    if (bill.dueDay) {
      for (let cur = new Date(s); cur <= e; cur.setDate(cur.getDate() + 1)) {
        if (cur.getDate() === bill.dueDay) return true;
      }
    }
    return false;
  });
}

// ── Household status ──────────────────────────────────────────────────────────

type HouseholdStatus = "stable" | "tight" | "watch" | "critical";

function getStatus(safeToSpend: number, baseIncome: number): HouseholdStatus {
  if (safeToSpend < 0) return "critical";
  if (baseIncome <= 0) return "watch";
  const pct = safeToSpend / baseIncome;
  if (pct >= 0.25) return "stable";
  if (pct >= 0.12) return "tight";
  if (pct >= 0) return "watch";
  return "critical";
}

const STATUS_CONFIG: Record<HouseholdStatus, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  stable:   { label: "Stable",        color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", Icon: ShieldCheck   },
  tight:    { label: "Tight",         color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   Icon: AlertTriangle },
  watch:    { label: "Watch closely", color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",  Icon: AlertCircle   },
  critical: { label: "Critical",      color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     Icon: XCircle       },
};

// ── BudgetHealthSection ───────────────────────────────────────────────────────

function BudgetHealthSection({
  categories, period,
}: {
  categories: BudgetCategory[];
  period: PeriodRange;
}) {
  const { data: allEntries = [] } = useListIncomeEntries();
  const { data: incomeSources = [] } = useListIncome();
  const { data: bills = [] } = useListBills();
  const { data: arrears = [] } = useListArrears();

  // Actual income received in period
  const periodEntries = allEntries.filter(e => {
    const d = (typeof e.dateReceived === "string" ? e.dateReceived : (e.dateReceived as Date).toISOString()).slice(0, 10);
    return d >= period.start && d <= period.end;
  });
  const actualReceived = periodEntries.reduce((s, e) => s + e.grossAmount, 0);

  // Forecast income: sum of income sources weekly equiv × period factor
  const forecastIncome = (incomeSources as any[]).reduce((s: number, src: any) => s + (src.weeklyEquivalent ?? 0), 0) * period.factor;

  // Bills due in period
  const dueBills = billsDueInPeriod(bills as any[], period.start, period.end);
  const billsTotal = dueBills.reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? b.amount ?? 0), 0) * (period.factor > 1 ? 1 : 1);
  // For weekly: use weeklyEquivalent directly; for longer periods scale
  const billsScaled = (bills as any[]).reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? 0), 0) * period.factor;

  // Arrears / rent-plan weekly commitments × factor
  const activeArrears = (arrears as any[]).filter((a: any) => a.status === "active");
  const arrearsTotal = activeArrears.reduce((s: number, a: any) => s + (a.weeklyOngoing ?? 0) + (a.weeklyArrears ?? 0), 0) * period.factor;

  // Essential budget spending (essential categories, not arrears/bills/buffer groups)
  const essentialBudget = categories
    .filter(c => c.essential && c.group !== "arrears" && c.group !== "bills" && c.group !== "buffer")
    .reduce((s, c) => s + c.plannedWeekly, 0) * period.factor;

  const bufferBudget = categories
    .filter(c => c.group === "buffer")
    .reduce((s, c) => s + c.plannedWeekly, 0) * period.factor;

  // Safe-to-spend = actual received − bills − arrears − essential − buffer
  const safeToSpend = actualReceived - billsScaled - arrearsTotal - essentialBudget - bufferBudget;

  const baseIncome = actualReceived || forecastIncome;
  const status = getStatus(safeToSpend, baseIncome);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;

  const coveragePct = forecastIncome > 0 ? Math.min(999, Math.round((actualReceived / forecastIncome) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Period income summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Forecast Income</div>
            <div className="text-xl font-bold">{formatCurrency(forecastIncome)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">All sources × period</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Actual Received</div>
            <div className={`text-xl font-bold ${actualReceived > 0 ? "text-primary" : "text-muted-foreground"}`}>
              {formatCurrency(actualReceived)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {periodEntries.length} {periodEntries.length === 1 ? "entry" : "entries"} this period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Commitments</div>
            <div className="text-xl font-bold text-amber-700">{formatCurrency(billsScaled + arrearsTotal)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Bills {formatCurrency(billsScaled)} · Arrears {formatCurrency(arrearsTotal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Coverage</div>
            <div className={`text-xl font-bold ${coveragePct >= 80 ? "text-emerald-600" : coveragePct >= 50 ? "text-amber-600" : "text-destructive"}`}>
              {coveragePct}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">of forecast income received</div>
          </CardContent>
        </Card>
      </div>

      {/* Safe-to-spend breakdown + household status */}
      <Card className={`border ${cfg.border}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1 flex-1 text-sm">
              <div className="font-semibold text-foreground mb-2">
                Safe-to-Spend — <span className="text-muted-foreground font-normal">{period.label}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Actual income received</span>
                <span className="font-medium text-foreground">+{formatCurrency(actualReceived)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>− Bills (all, weekly equiv × period)</span>
                <span className="text-destructive">−{formatCurrency(billsScaled)}</span>
              </div>
              {arrearsTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− Arrears / rent-plan</span>
                  <span className="text-destructive">−{formatCurrency(arrearsTotal)}</span>
                </div>
              )}
              {essentialBudget > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− Essential planned spending</span>
                  <span className="text-destructive">−{formatCurrency(essentialBudget)}</span>
                </div>
              )}
              {bufferBudget > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>− Buffer</span>
                  <span className="text-destructive">−{formatCurrency(bufferBudget)}</span>
                </div>
              )}
              <div className={`flex justify-between font-bold text-base pt-1.5 border-t mt-1 ${safeToSpend >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                <span>Safe to spend</span>
                <span>{safeToSpend >= 0 ? "+" : "−"}{formatCurrency(Math.abs(safeToSpend))}</span>
              </div>
            </div>
            <div className={`flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-4 ${cfg.bg} ${cfg.border} border min-w-[140px] flex-shrink-0`}>
              <StatusIcon className={`h-8 w-8 ${cfg.color}`} />
              <div className={`text-base font-bold ${cfg.color}`}>{cfg.label}</div>
              <div className="text-xs text-muted-foreground text-center">Household status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FamilyBudget() {
  const { data: categories = [], isLoading, refetch } = useListBudgetCategories();
  const createMutation = useCreateBudgetCategory();
  const updateMutation = useUpdateBudgetCategory();
  const deleteMutation = useDeleteBudgetCategory();
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("weekly");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const periods = useMemo(() => buildPeriods(), []);
  const period = periods[selectedPeriod];

  const pf = period.factor;
  const totalPlanned = categories.reduce((s, c) => s + c.plannedWeekly * pf, 0);
  const totalActual = categories.reduce((s, c) => s + c.actualWeekly * pf, 0);
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
    try {
      if (editingId != null) {
        await updateMutation.mutateAsync({ id: editingId, data: buildPayload() });
        toast({ title: "Category updated" });
      } else {
        await createMutation.mutateAsync({ data: buildPayload() });
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <PieChart className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold font-serif">Family Budget</h1>
            <p className="text-sm text-muted-foreground">Weekly spending plan and household health.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
            {(["weekly", "fortnightly", "monthly"] as PeriodKey[]).map(pk => (
              <button
                key={pk}
                onClick={() => setSelectedPeriod(pk)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors capitalize ${selectedPeriod === pk ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {pk === "weekly" ? "Week" : pk === "fortnightly" ? "Fortnight" : "Month"}
              </button>
            ))}
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Date range banner */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border">
        <CalendarDays className="h-4 w-4 flex-shrink-0" />
        <span>Showing: <strong className="text-foreground">{period.label}</strong></span>
        {selectedPeriod !== "weekly" && (
          <span className="text-xs">({formatCurrency(1)} weekly = {formatCurrency(period.factor)} this period)</span>
        )}
      </div>

      {/* Budget health section */}
      {!isLoading && <BudgetHealthSection categories={categories} period={period} />}

      {/* Category totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Budget Planned</div>
            <div className="text-xl font-bold">{formatCurrency(totalPlanned)}</div>
            <div className="text-xs text-muted-foreground">{selectedPeriod} total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Budget Actual</div>
            <div className="text-xl font-bold">{formatCurrency(totalActual)}</div>
            <div className="text-xs text-muted-foreground">{selectedPeriod} total</div>
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
        <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No budget categories yet. Add your first category.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const items = categories.filter((c) => c.group === group);
            const gPlanned = items.reduce((s, c) => s + c.plannedWeekly * pf, 0);
            const gActual = items.reduce((s, c) => s + c.actualWeekly * pf, 0);
            return (
              <Card key={group}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm capitalize">{group}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(gActual)} actual / {formatCurrency(gPlanned)} planned
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((c) => {
                        const planned = c.plannedWeekly * pf;
                        const actual = c.actualWeekly * pf;
                        const v = actual - planned;
                        const pct = planned > 0 ? (actual / planned) * 100 : 0;
                        return (
                          <tr key={c.id} className="border-t">
                            <td className="py-2.5 pl-4 w-full">
                              <div className="flex items-center gap-2">
                                {c.color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />}
                                <span className="font-medium">{c.name}</span>
                                {c.essential && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Essential</Badge>}
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground pr-4 hidden md:table-cell whitespace-nowrap">
                              {formatCurrency(planned)} planned
                            </td>
                            <td className="py-2.5 text-right pr-4 whitespace-nowrap font-medium">
                              {formatCurrency(actual)}
                            </td>
                            <td className="py-2.5 text-right pr-4 hidden md:table-cell whitespace-nowrap">
                              <span className={`text-xs ${v > 0 ? "text-destructive" : "text-emerald-600"}`}>
                                {v > 0 ? "+" : ""}{formatCurrency(v)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right pr-3 hidden md:table-cell w-20">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden ml-auto">
                                <div
                                  className={`h-full rounded-full transition-all ${pct > 100 ? "bg-destructive" : "bg-primary"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">
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

      {/* Edit / create dialog */}
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
              <p className="text-xs text-muted-foreground mt-1">Groups: living, utilities, transport, arrears, bills, buffer</p>
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
            <div className="flex flex-wrap items-center gap-4">
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
