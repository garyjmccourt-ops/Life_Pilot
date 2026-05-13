import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListIncome, getListIncomeQueryKey,
  useListBills, getListBillsQueryKey,
  useCreateIncome, useDeleteIncome,
  useCreateBill, useDeleteBill,
  useListIncomeEntries, getListIncomeEntriesQueryKey,
  useCreateIncomeEntry, useDeleteIncomeEntry,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Wallet, Receipt, RefreshCw, Building, DollarSign, Check, Bike } from "lucide-react";
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

// ── Bills ─────────────────────────────────────────────────────────────────────

function BillsList() {
  const { data: bills, isLoading } = useListBills();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const totalWeekly = bills?.reduce((sum, item) => sum + item.weeklyEquivalent, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">{bills?.length || 0} bills • {formatCurrency(totalWeekly)}/wk total</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bill</DialogTitle>
            </DialogHeader>
            <BillForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {!bills?.length ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Receipt className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No recurring bills</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your rent, utilities, subscriptions, etc.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bills.map((item) => (
            <Card key={item.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.provider}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="flex items-center"><Building className="h-3 w-3 mr-1" />{item.category}</span>
                      <span className="flex items-center"><RefreshCw className="h-3 w-3 mr-1" />{formatFrequency(item.frequency)}</span>
                    </div>
                  </div>
                  <BillActions id={item.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{formatCurrency(item.amount)}</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-muted-foreground">
                    equiv. {formatCurrency(item.weeklyEquivalent)} / wk
                  </div>
                  {item.dueDate ? (
                    <div className="text-xs bg-secondary px-2 py-1 rounded">
                      Due: {item.dueDate}
                    </div>
                  ) : item.dueDay ? (
                    <div className="text-xs bg-secondary px-2 py-1 rounded">
                      Due: {item.dueDay}{[1,21,31].includes(item.dueDay)?'st':[2,22].includes(item.dueDay)?'nd':[3,23].includes(item.dueDay)?'rd':'th'}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BillActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBill();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Delete this bill?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          toast({ title: "Bill deleted" });
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

function BillForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBill();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const dueDayStr = formData.get("dueDay");
    const dueDateStr = formData.get("dueDate");
    
    if (amount < 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        provider: String(formData.get("provider")),
        category: String(formData.get("category")),
        amount,
        frequency: String(formData.get("frequency")) as any,
        dueDay: dueDayStr ? Number(dueDayStr) : null,
        dueDate: dueDateStr ? String(dueDateStr) : null,
        accountRef: String(formData.get("accountRef")) || null,
        autopay: formData.get("autopay") === "true",
        notes: String(formData.get("notes")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        toast({ title: "Bill added" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Input id="provider" name="provider" required placeholder="e.g. Energy Co" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" required placeholder="e.g. Utilities" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
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
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Exact Due Date</Label>
          <Input id="dueDate" name="dueDate" type="date" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDay">Recurring Due Day (1-31)</Label>
          <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Optional" inputMode="numeric" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="autopay">Auto-pay</Label>
        <Select name="autopay" defaultValue="false">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Save Bill</Button>
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
                <Input placeholder="e.g. Sam" value={form.person} onChange={sf("person")} className="h-8 text-sm" />
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Income & Bills</h1>
        <p className="text-muted-foreground mt-2 text-lg">Forecast sources, recurring bills, and actual income received.</p>
      </div>

      <Tabs defaultValue="actual" className="w-full">
        <TabsList className="mb-6 w-full max-w-[500px] grid grid-cols-3">
          <TabsTrigger value="actual">Actual Received</TabsTrigger>
          <TabsTrigger value="income">Sources (Forecast)</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
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
