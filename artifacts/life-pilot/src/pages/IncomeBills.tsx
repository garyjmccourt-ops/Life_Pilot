import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListIncome, getListIncomeQueryKey,
  useListBills, getListBillsQueryKey,
  useCreateIncome, useDeleteIncome,
  useCreateBill, useUpdateBill, useDeleteBill,
  useListIncomeEntries, getListIncomeEntriesQueryKey,
  useCreateIncomeEntry, useDeleteIncomeEntry,
  useListArrears,
} from "@workspace/api-client-react";
import { useLookup, getDefaultValue } from "@/hooks/use-lookup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Wallet, Receipt, RefreshCw, Building, DollarSign, Check, Bike, Pencil, CalendarClock, TrendingDown } from "lucide-react";
import { formatCurrency, formatFrequency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// ── Income Sources (Forecast) ─────────────────────────────────────────────────

function IncomeList() {
  const { data: income, isLoading } = useListIncome();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const totalWeekly = income?.reduce((sum, item) => sum + item.weeklyEquivalent, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold">Income Sources</h2>
          <p className="text-sm text-muted-foreground">
            {income?.length || 0} sources • {formatCurrency(totalWeekly)}/wk forecast
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Source</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income Source</DialogTitle>
            </DialogHeader>
            <IncomeForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          These are <strong>forecast / expected</strong> income sources only — used for planning, not actuals.
          Record money actually received in the <strong>Actual Received</strong> tab.
        </span>
      </div>

      {!income?.length ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Wallet className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No income sources</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your salary, benefits, or other regular income.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Source</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {income.map((item) => (
            <Card key={item.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {formatFrequency(item.frequency)} • forecast
                    </div>
                  </div>
                  <IncomeActions id={item.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(item.amount)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  equiv. {formatCurrency(item.weeklyEquivalent)} / wk
                </div>
                {item.notes && <p className="text-xs mt-3 text-muted-foreground/80">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IncomeActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteIncome();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Delete this income source?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
          toast({ title: "Income source deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete} disabled={deleteMutation.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function IncomeForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateIncome();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    
    if (amount < 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        name: String(formData.get("name")),
        amount,
        frequency: String(formData.get("frequency")) as any,
        notes: String(formData.get("notes")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
        toast({ title: "Income source added" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Source Name</Label>
        <Input id="name" name="name" required placeholder="e.g. Salary, Centrelink" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Expected Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0.00" inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select name="frequency" defaultValue="monthly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="one-off">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Save Source</Button>
      </DialogFooter>
    </form>
  );
}

// ── Bills helpers ─────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDaysStr(base: string, days: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function billsDueInWindow(bills: any[], from: string, to: string): any[] {
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T23:59:59");
  return bills.filter(b => {
    if (b.dueDate) {
      const d = new Date((typeof b.dueDate === "string" ? b.dueDate : b.dueDate.toISOString().slice(0,10)) + "T00:00:00");
      if (d >= start && d <= end) return true;
    }
    if (b.frequency === "weekly" || b.frequency === "fortnightly") return true;
    if (b.dueDay) {
      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        if (cur.getDate() === b.dueDay) return true;
      }
    }
    return false;
  });
}

const PAID_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  unpaid:    { label: "Unpaid",    color: "text-muted-foreground", bg: "bg-muted/60" },
  paid:      { label: "Paid",      color: "text-emerald-700",      bg: "bg-emerald-50" },
  "part-paid": { label: "Part-paid", color: "text-amber-700",      bg: "bg-amber-50" },
  overdue:   { label: "Overdue",   color: "text-destructive",      bg: "bg-red-50" },
};

// ── Bills ─────────────────────────────────────────────────────────────────────

function BillsList() {
  const queryClient = useQueryClient();
  const { data: bills = [], isLoading } = useListBills();
  const { data: allEntries = [] } = useListIncomeEntries();
  const { data: arrears = [] } = useListArrears();
  const updateMutation = useUpdateBill();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any | null>(null);

  const today = todayStr();
  const in7 = addDaysStr(today, 7);
  const in30 = addDaysStr(today, 30);

  // Current week Mon-Sun
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now); monday.setDate(now.getDate() + mondayOffset); monday.setHours(0,0,0,0);
  const mondayStr = monday.toISOString().slice(0,10);
  const sundayStr = addDaysStr(mondayStr, 6);

  const thisWeekBills = billsDueInWindow(bills, mondayStr, sundayStr);
  const next7Bills   = billsDueInWindow(bills, today, in7);
  const next30Bills  = billsDueInWindow(bills, today, in30);

  const thisWeekTotal = thisWeekBills.reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? b.amount), 0);
  const next7Total    = next7Bills.reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? b.amount), 0);
  const next30Total   = next30Bills.reduce((s: number, b: any) => s + (b.amount ?? 0), 0);

  const arrearsWeekly = (arrears as any[]).filter((a: any) => a.status === "active")
    .reduce((s: number, a: any) => s + (a.weeklyOngoing ?? 0) + (a.weeklyArrears ?? 0), 0);

  // Actual income this week
  const weekEntries = allEntries.filter(e => {
    const d = (typeof e.dateReceived === "string" ? e.dateReceived : (e.dateReceived as Date).toISOString()).slice(0,10);
    return d >= mondayStr && d <= sundayStr;
  });
  const actualIncome = weekEntries.reduce((s, e) => s + e.grossAmount, 0);
  const totalCommitments = thisWeekTotal + arrearsWeekly;
  const surplus = actualIncome - totalCommitments;

  const totalWeekly = bills.reduce((sum, item) => sum + item.weeklyEquivalent, 0);

  async function quickStatus(bill: any, status: string) {
    await updateMutation.mutateAsync({
      id: bill.id,
      data: { ...bill, paidStatus: status },
    });
    queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
    toast({ title: `Marked as ${status}` });
  }

  if (isLoading) return <Skeleton className="h-[300px]" />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">{bills.length} bills • {formatCurrency(totalWeekly)}/wk total</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
            <BillForm onSuccess={() => { setIsCreateOpen(false); queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rent-first model note */}
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" />
        <span><strong>Rent-first model:</strong> Sam's wages cover rent/arrears first. Gary's DoorDash/work covers bills, fuel, food and incidentals.</span>
      </div>

      {/* Cashflow windows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "This Week", count: thisWeekBills.length, total: thisWeekTotal, sub: `${mondayStr} – ${sundayStr}`, icon: "📅" },
          { label: "Next 7 Days", count: next7Bills.length, total: next7Total, sub: "Rolling 7-day window", icon: "📆" },
          { label: "Next 30 Days", count: next30Bills.length, total: next30Total, sub: "Full bill amounts", icon: "🗓️" },
        ].map(w => (
          <Card key={w.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{w.label}</span>
              </div>
              <div className="text-xl font-bold text-amber-700">{formatCurrency(w.total)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{w.count} bills due · {w.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shortfall/surplus this week */}
      <Card className={`border ${surplus >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground">This Week Cashflow</div>
              <div className="text-xs text-muted-foreground">Actual income received vs bills + arrears commitments</div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Received</div>
                <div className="font-semibold text-primary">{formatCurrency(actualIncome)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Commitments</div>
                <div className="font-semibold text-amber-700">{formatCurrency(totalCommitments)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{surplus >= 0 ? "Surplus" : "Shortfall"}</div>
                <div className={`text-base font-bold ${surplus >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                  {surplus >= 0 ? "+" : "−"}{formatCurrency(Math.abs(surplus))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills list */}
      {bills.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Receipt className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No recurring bills</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your rent, utilities, subscriptions, etc.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Provider</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Category</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Frequency</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Due</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill: any) => {
                const cfg = PAID_STATUS_CONFIG[bill.paidStatus] ?? PAID_STATUS_CONFIG.unpaid;
                return (
                  <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{bill.provider}</div>
                      {bill.autopay && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Autopay</span>}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{bill.category}</td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{formatFrequency(bill.frequency)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">
                      <div>{formatCurrency(bill.amount)}</div>
                      {bill.frequency !== "weekly" && (
                        <div className="text-[10px] text-muted-foreground">{formatCurrency(bill.weeklyEquivalent)}/wk</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">
                      {bill.dueDate ? bill.dueDate : bill.dueDay ? `${bill.dueDay}${["","st","nd","rd"][bill.dueDay] ?? "th"} of month` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {bill.paidStatus !== "paid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50 px-2" onClick={() => quickStatus(bill, "paid")}>✓ Paid</Button>
                        )}
                        {bill.paidStatus !== "part-paid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-amber-700 hover:bg-amber-50 px-2 hidden sm:inline-flex" onClick={() => quickStatus(bill, "part-paid")}>½ Part</Button>
                        )}
                        {bill.paidStatus !== "overdue" && (
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:bg-red-50 px-2 hidden sm:inline-flex" onClick={() => quickStatus(bill, "overdue")}>! OD</Button>
                        )}
                        {bill.paidStatus !== "unpaid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground px-2 hidden sm:inline-flex" onClick={() => quickStatus(bill, "unpaid")}>↩ Reset</Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingBill(bill)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <BillDeleteButton id={bill.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t">
                <td colSpan={3} className="px-3 py-2 text-xs text-muted-foreground">{bills.length} bills</td>
                <td className="px-3 py-2 text-right font-bold text-sm">{formatCurrency(totalWeekly)}<span className="text-xs font-normal text-muted-foreground">/wk</span></td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Edit dialog */}
      {editingBill && (
        <Dialog open={!!editingBill} onOpenChange={() => setEditingBill(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Bill — {editingBill.provider}</DialogTitle></DialogHeader>
            <BillForm
              initial={editingBill}
              onSuccess={() => {
                setEditingBill(null);
                queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BillDeleteButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBill();
  const { toast } = useToast();
  return (
    <Button
      variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (confirm("Delete this bill?")) {
          deleteMutation.mutate({ id }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
              toast({ title: "Bill deleted" });
            }
          });
        }
      }}
      disabled={deleteMutation.isPending}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}

function BillForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBill();
  const updateMutation = useUpdateBill();
  const { toast } = useToast();
  const isEdit = !!initial;
  const { data: billCategories = [] } = useLookup("bill_category");
  const [categoryValue, setCategoryValue] = useState<string>(initial?.category ?? "");

  // Apply lookup default for new bills once categories load
  useEffect(() => {
    if (!isEdit && !categoryValue && billCategories.length > 0) {
      const def = getDefaultValue(billCategories);
      if (def) setCategoryValue(def);
    }
  }, [billCategories, isEdit, categoryValue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const dueDayStr = formData.get("dueDay");
    const dueDateStr = formData.get("dueDate");
    if (amount < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }

    const data = {
      provider: String(formData.get("provider")),
      category: categoryValue || String(formData.get("category")),
      amount,
      frequency: String(formData.get("frequency")) as any,
      dueDay: dueDayStr ? Number(dueDayStr) : null,
      dueDate: dueDateStr ? String(dueDateStr) : null,
      accountRef: String(formData.get("accountRef")) || null,
      autopay: formData.get("autopay") === "true",
      notes: String(formData.get("notes")) || null,
      paidStatus: String(formData.get("paidStatus") || "unpaid"),
    };

    if (isEdit) {
      updateMutation.mutate({ id: initial.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          toast({ title: "Bill updated" });
          onSuccess();
        }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          toast({ title: "Bill added" });
          onSuccess();
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Input id="provider" name="provider" required placeholder="e.g. Energy Co" defaultValue={initial?.provider ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          {billCategories.length > 0 ? (
            <>
              <Select value={categoryValue} onValueChange={setCategoryValue} required>
                <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                <SelectContent>
                  {billCategories.filter(c => c.value !== "").map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={categoryValue} />
            </>
          ) : (
            <Input id="category" name="category" required placeholder="e.g. Utilities" value={categoryValue} onChange={e => setCategoryValue(e.target.value)} />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0.00" inputMode="decimal" defaultValue={initial?.amount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select name="frequency" defaultValue={initial?.frequency ?? "monthly"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="one-off">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Exact Due Date</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={initial?.dueDate ? String(initial.dueDate).slice(0,10) : ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDay">Recurring Due Day (1-31)</Label>
          <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Optional" inputMode="numeric" defaultValue={initial?.dueDay ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="autopay">Auto-pay</Label>
          <Select name="autopay" defaultValue={initial?.autopay ? "true" : "false"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidStatus">Payment Status</Label>
          <Select name="paidStatus" defaultValue={initial?.paidStatus ?? "unpaid"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="part-paid">Part-paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional" defaultValue={initial?.notes ?? ""} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {isEdit ? "Save Changes" : "Save Bill"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Actual Income Received ────────────────────────────────────────────────────

type QuickForm = {
  dateReceived: string;
  sourceName: string;
  person: string;
  grossAmount: string;
  netAmount: string;
  paymentMethod: string;
  tags: string;
  notes: string;
  allocated: boolean;
};

function makeBlank(): QuickForm {
  return {
    dateReceived: new Date().toISOString().slice(0, 10),
    sourceName: "",
    person: "",
    grossAmount: "",
    netAmount: "",
    paymentMethod: "",
    tags: "",
    notes: "",
    allocated: false,
  };
}

function ActualReceivedSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useListIncomeEntries();
  const createEntry = useCreateIncomeEntry();
  const deleteEntry = useDeleteIncomeEntry();
  const [form, setForm] = useState<QuickForm>(makeBlank);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: peopleLookup = [] } = useLookup("household_people");

  const sf = (key: keyof QuickForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sourceName.trim() || !form.grossAmount) return;
    const gross = parseFloat(form.grossAmount);
    const net = form.netAmount ? parseFloat(form.netAmount) : gross;
    if (isNaN(gross) || gross <= 0) return;
    setSaving(true);
    try {
      await createEntry.mutateAsync({
        data: {
          dateReceived: form.dateReceived,
          sourceName: form.sourceName.trim(),
          person: form.person.trim() || null,
          grossAmount: gross,
          netAmount: net,
          paymentMethod: form.paymentMethod.trim() || null,
          tags: form.tags.trim() || null,
          notes: form.notes.trim() || null,
          allocated: form.allocated,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListIncomeEntriesQueryKey() });
      setForm(prev => ({ ...makeBlank(), paymentMethod: prev.paymentMethod }));
      toast({ title: "Income entry added" });
    } catch {
      toast({ title: "Failed to save entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEntry.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListIncomeEntriesQueryKey() });
      toast({ title: "Entry removed" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const displayed = showAll ? entries : entries.slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold">Actual Income Received</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Record money as it actually arrives — this feeds the dashboard, Weekly Tracker, and budget calculations.
        </p>
      </div>

      {/* Quick-add form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Quick Add Income Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date Received</Label>
                <Input type="date" value={form.dateReceived} onChange={sf("dateReceived")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source / Description</Label>
                <Input placeholder="e.g. Centrelink, Salary" value={form.sourceName} onChange={sf("sourceName")} className="h-8 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Person</Label>
                {peopleLookup.length > 0 ? (
                  <Select value={form.person || "__none__"} onValueChange={v => setForm(prev => ({ ...prev, person: v === "__none__" ? "" : v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not set —</SelectItem>
                      {peopleLookup.filter(p => p.value !== "" && p.label !== "").map(p => <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="e.g. Sam" value={form.person} onChange={sf("person")} className="h-8 text-sm" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gross Amount ($)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.grossAmount} onChange={sf("grossAmount")} className="h-8 text-sm text-right" inputMode="decimal" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Net Amount ($)</Label>
                <Input type="number" step="0.01" min="0" placeholder="Same as gross" value={form.netAmount} onChange={sf("netAmount")} className="h-8 text-sm text-right" inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Account / Method</Label>
                <Input placeholder="e.g. ANZ savings" value={form.paymentMethod} onChange={sf("paymentMethod")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags</Label>
                <Input placeholder="e.g. wages, centrelink" value={form.tags} onChange={sf("tags")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional" value={form.notes} onChange={sf("notes")} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.allocated}
                  onChange={e => setForm(prev => ({ ...prev, allocated: e.target.checked }))}
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Allocated to bills / expenses</span>
              </label>
              <Button type="submit" size="sm" disabled={saving || !form.sourceName.trim() || !form.grossAmount}>
                <PlusCircle className="h-4 w-4 mr-1" />
                {saving ? "Adding…" : "Add Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Entries list */}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : entries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-10 text-center border-dashed">
          <DollarSign className="h-10 w-10 text-primary/20 mb-3" />
          <h3 className="font-serif text-base font-medium">No income entries yet</h3>
          <p className="text-sm text-muted-foreground">Use the form above to record income as it arrives.</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Person</th>
                  <th className="px-3 py-2 text-right font-medium">Gross</th>
                  <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Net</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Account</th>
                  <th className="px-3 py-2 text-center font-medium">Allocated</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(entry => {
                  const d = (typeof entry.dateReceived === "string"
                    ? entry.dateReceived
                    : (entry.dateReceived as Date).toISOString()
                  ).slice(0, 10);
                  const fromGig = entry.gigEntryId != null;
                  return (
                    <tr key={entry.id} className={`border-b last:border-0 hover:bg-muted/20 ${fromGig ? "bg-blue-50/40" : ""}`}>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(d)}</td>
                      <td className="px-3 py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          {entry.sourceName}
                          {fromGig && (
                            <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 border-blue-200 bg-blue-50 px-1.5 py-0 h-4 gap-0.5">
                              <Bike className="h-2.5 w-2.5" /> Gig
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{entry.person ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-primary">{formatCurrency(entry.grossAmount)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground hidden md:table-cell">{formatCurrency(entry.netAmount)}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{entry.paymentMethod ?? "—"}</td>
                      <td className="px-3 py-2 text-center">
                        {entry.allocated ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title={fromGig ? "Remove entry — gig shift will be re-linkable" : "Remove entry"}
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t">
                  <td colSpan={3} className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    {entries.length} {entries.length === 1 ? "entry" : "entries"} total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-primary">
                    {formatCurrency(entries.reduce((s, e) => s + e.grossAmount, 0))}
                  </td>
                  <td colSpan={4} className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </CardContent>
          {entries.length > 20 && (
            <div className="px-4 py-3 border-t text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAll(v => !v)}>
                {showAll ? "Show less" : `Show all ${entries.length} entries`}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncomeBills() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Income & Bills</h1>
        <p className="text-muted-foreground mt-2 text-lg">Forecast sources, recurring bills, and actual income received.</p>
      </div>

      <Tabs defaultValue="actual" className="w-full">
        <TabsList className="mb-6 w-full grid grid-cols-3">
          <TabsTrigger value="actual" className="text-xs sm:text-sm">Received</TabsTrigger>
          <TabsTrigger value="income" className="text-xs sm:text-sm">Sources</TabsTrigger>
          <TabsTrigger value="bills" className="text-xs sm:text-sm">Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="actual" className="mt-0">
          <ActualReceivedSection />
        </TabsContent>
        <TabsContent value="income" className="mt-0">
          <IncomeList />
        </TabsContent>
        <TabsContent value="bills" className="mt-0">
          <BillsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
