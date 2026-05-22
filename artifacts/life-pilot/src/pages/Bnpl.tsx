import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Gift, Plus, Pencil, Trash2, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

interface BnplItem {
  id: number;
  provider: string;
  description: string;
  originalAmount: number;
  remainingBalance: number;
  instalmentAmount: number;
  instalmentFrequency: string;
  nextPaymentDate?: string | null;
  status: string;
  feeRisk?: string | null;
  linkedBudgetCategory?: string | null;
  notes?: string | null;
}

interface BnplScheduleEntry {
  id: number;
  bnplItemId: number;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string | null;
  notes?: string | null;
}

interface StoredValueItem {
  id: number;
  provider: string;
  startingValue: number;
  remainingBalance: number;
  purchaseDate?: string | null;
  expiryDate?: string | null;
  linkedBudgetCategory?: string | null;
  notes?: string | null;
}

interface StoredValueTransaction {
  id: number;
  storedValueItemId: number;
  transactionDate: string;
  type: string;
  amount: number;
  description?: string | null;
  notes?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toWeekly(amount: number, freq: string): number {
  switch (freq) {
    case "weekly":      return amount;
    case "fortnightly": return amount / 2;
    case "monthly":     return (amount * 12) / 52;
    default:            return amount / 2;
  }
}

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  paused:    "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  missed:    "bg-red-100 text-red-700",
  skipped:   "bg-gray-100 text-gray-500",
};

const TX_TYPE_COLORS: Record<string, string> = {
  top_up: "bg-green-100 text-green-700",
  spend:  "bg-amber-100 text-amber-700",
};

// ── Fetch hooks ───────────────────────────────────────────────────────────────

function useBnpl() {
  return useQuery<BnplItem[]>({ queryKey: ["bnpl"], queryFn: () => fetch(`${BASE}api/bnpl`).then(r => r.json()) });
}
function useStoredValue() {
  return useQuery<StoredValueItem[]>({ queryKey: ["stored-value"], queryFn: () => fetch(`${BASE}api/stored-value`).then(r => r.json()) });
}
function useBnplSchedule(bnplItemId: number) {
  return useQuery<BnplScheduleEntry[]>({
    queryKey: ["bnpl-schedule", bnplItemId],
    queryFn: () => fetch(`${BASE}api/bnpl-schedule?bnplItemId=${bnplItemId}`).then(r => r.json()),
  });
}
function useStoredValueTransactions(storedValueItemId: number) {
  return useQuery<StoredValueTransaction[]>({
    queryKey: ["stored-value-transactions", storedValueItemId],
    queryFn: () => fetch(`${BASE}api/stored-value-transactions?storedValueItemId=${storedValueItemId}`).then(r => r.json()),
  });
}

// ── Schedule sub-section ──────────────────────────────────────────────────────

function BnplScheduleSection({ item }: { item: BnplItem }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const { data: entries = [] } = useBnplSchedule(item.id);

  const saveEntry = useMutation({
    mutationFn: async (data: any) => {
      const url = entryId ? `${BASE}api/bnpl-schedule/${entryId}` : `${BASE}api/bnpl-schedule`;
      const method = entryId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bnpl-schedule", item.id] });
      qc.invalidateQueries({ queryKey: ["bnpl"] });
      setEntryOpen(false);
      toast({ title: entryId ? "Entry updated" : "Entry added" });
    },
    onError: () => toast({ title: "Error saving", variant: "destructive" }),
  });

  const deleteEntry = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/bnpl-schedule/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bnpl-schedule", item.id] });
      qc.invalidateQueries({ queryKey: ["bnpl"] });
      toast({ title: "Entry deleted" });
    },
  });

  function openNew() {
    setEntryId(null);
    setForm({ bnplItemId: item.id, dueDate: "", amount: "", status: "scheduled", paidDate: "", notes: "" });
    setEntryOpen(true);
  }

  function openEdit(e: BnplScheduleEntry) {
    setEntryId(e.id);
    setForm({ bnplItemId: e.bnplItemId, dueDate: e.dueDate, amount: String(e.amount), status: e.status, paidDate: e.paidDate ?? "", notes: e.notes ?? "" });
    setEntryOpen(true);
  }

  function handleSave() {
    saveEntry.mutate({
      bnplItemId: item.id,
      dueDate: form.dueDate,
      amount: Number(form.amount) || 0,
      status: form.status || "scheduled",
      paidDate: form.paidDate || null,
      notes: form.notes || null,
    });
  }

  const hasPaidEntries = entries.some(e => e.status === "paid");

  return (
    <div className="mt-3 border-t pt-3">
      {hasPaidEntries && (
        <p className="text-[10px] text-emerald-600 mb-1.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Balance recalculated from payments
        </p>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Payment Schedule ({entries.length})
      </button>

      {open && (
        <div className="mt-2">
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={openNew}>
              <Plus className="h-3 w-3" /> Add Entry
            </Button>
          </div>
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">No schedule entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1 pr-2 font-medium">Due Date</th>
                    <th className="text-right py-1 pr-2 font-medium">Amount</th>
                    <th className="text-left py-1 pr-2 font-medium">Status</th>
                    <th className="text-left py-1 pr-2 font-medium">Paid Date</th>
                    <th className="text-left py-1 pr-2 font-medium">Notes</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} className="border-b border-muted/40">
                      <td className="py-1 pr-2">{e.dueDate}</td>
                      <td className="py-1 pr-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                      <td className="py-1 pr-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SCHEDULE_STATUS_COLORS[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-1 pr-2 text-muted-foreground">{e.paidDate ?? "—"}</td>
                      <td className="py-1 pr-2 text-muted-foreground italic">{e.notes ?? ""}</td>
                      <td className="py-1 flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(e)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => { if (confirm("Delete entry?")) deleteEntry.mutate(e.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{entryId ? "Edit Schedule Entry" : "Add Schedule Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Due Date *</Label><Input type="date" value={form.dueDate ?? ""} onChange={e => setForm((p: any) => ({ ...p, dueDate: e.target.value }))} /></div>
              <div><Label>Amount ($) *</Label><Input type="number" step="0.01" value={form.amount ?? ""} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status ?? "scheduled"} onValueChange={v => setForm((p: any) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Paid Date</Label><Input type="date" value={form.paidDate ?? ""} onChange={e => setForm((p: any) => ({ ...p, paidDate: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Input value={form.notes ?? ""} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveEntry.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Stored value transaction log ──────────────────────────────────────────────

function StoredValueTransactionLog({ sv }: { sv: StoredValueItem }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [txId, setTxId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const { data: transactions = [] } = useStoredValueTransactions(sv.id);

  const saveTx = useMutation({
    mutationFn: async (data: any) => {
      const url = txId ? `${BASE}api/stored-value-transactions/${txId}` : `${BASE}api/stored-value-transactions`;
      const method = txId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stored-value-transactions", sv.id] });
      setTxOpen(false);
      toast({ title: txId ? "Transaction updated" : "Transaction added" });
    },
    onError: () => toast({ title: "Error saving", variant: "destructive" }),
  });

  const deleteTx = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/stored-value-transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stored-value-transactions", sv.id] }); toast({ title: "Transaction deleted" }); },
  });

  function openNew() {
    setTxId(null);
    setForm({ storedValueItemId: sv.id, transactionDate: new Date().toISOString().slice(0, 10), type: "spend", amount: "", description: "", notes: "" });
    setTxOpen(true);
  }

  function openEdit(t: StoredValueTransaction) {
    setTxId(t.id);
    setForm({ storedValueItemId: t.storedValueItemId, transactionDate: t.transactionDate, type: t.type, amount: String(t.amount), description: t.description ?? "", notes: t.notes ?? "" });
    setTxOpen(true);
  }

  function handleSave() {
    saveTx.mutate({
      storedValueItemId: sv.id,
      transactionDate: form.transactionDate,
      type: form.type,
      amount: Number(form.amount) || 0,
      description: form.description || null,
      notes: form.notes || null,
    });
  }

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Transaction Log ({transactions.length})
      </button>

      {open && (
        <div className="mt-2">
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={openNew}>
              <Plus className="h-3 w-3" /> Add Transaction
            </Button>
          </div>
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1 pr-2 font-medium">Date</th>
                    <th className="text-left py-1 pr-2 font-medium">Type</th>
                    <th className="text-right py-1 pr-2 font-medium">Amount</th>
                    <th className="text-left py-1 pr-2 font-medium">Description</th>
                    <th className="text-left py-1 pr-2 font-medium">Notes</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-muted/40">
                      <td className="py-1 pr-2">{t.transactionDate}</td>
                      <td className="py-1 pr-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TX_TYPE_COLORS[t.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {t.type === "top_up" ? "Top-up" : "Spend"}
                        </span>
                      </td>
                      <td className="py-1 pr-2 text-right font-medium">{formatCurrency(t.amount)}</td>
                      <td className="py-1 pr-2 text-muted-foreground">{t.description ?? "—"}</td>
                      <td className="py-1 pr-2 text-muted-foreground italic">{t.notes ?? ""}</td>
                      <td className="py-1 flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => { if (confirm("Delete transaction?")) deleteTx.mutate(t.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{txId ? "Edit Transaction" : "Add Transaction"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.transactionDate ?? ""} onChange={e => setForm((p: any) => ({ ...p, transactionDate: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={form.type ?? "spend"} onValueChange={v => setForm((p: any) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top_up">Top-up</SelectItem>
                    <SelectItem value="spend">Spend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Amount ($) *</Label><Input type="number" step="0.01" value={form.amount ?? ""} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Description</Label><Input placeholder="e.g. Weekly groceries" value={form.description ?? ""} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Notes</Label><Input value={form.notes ?? ""} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveTx.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Bnpl() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: bnpls = [], isLoading: bnplLoading } = useBnpl();
  const { data: stored = [], isLoading: storedLoading } = useStoredValue();

  // BNPL dialog
  const [bnplOpen, setBnplOpen] = useState(false);
  const [bnplId, setBnplId] = useState<number | null>(null);
  const [bnplForm, setBnplForm] = useState<any>({});

  // Stored value dialog
  const [svOpen, setSvOpen] = useState(false);
  const [svId, setSvId] = useState<number | null>(null);
  const [svForm, setSvForm] = useState<any>({});

  // Mutations
  const saveBnpl = useMutation({
    mutationFn: async (data: any) => {
      const url = bnplId ? `${BASE}api/bnpl/${bnplId}` : `${BASE}api/bnpl`;
      const method = bnplId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Save failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bnpl"] }); setBnplOpen(false); toast({ title: bnplId ? "Updated" : "Added" }); },
    onError: () => toast({ title: "Error saving", variant: "destructive" }),
  });

  const deleteBnpl = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/bnpl/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bnpl"] }); toast({ title: "Deleted" }); },
  });

  const saveSv = useMutation({
    mutationFn: async (data: any) => {
      const url = svId ? `${BASE}api/stored-value/${svId}` : `${BASE}api/stored-value`;
      const method = svId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Save failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stored-value"] }); setSvOpen(false); toast({ title: svId ? "Updated" : "Added" }); },
    onError: () => toast({ title: "Error saving", variant: "destructive" }),
  });

  const deleteSv = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}api/stored-value/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stored-value"] }); toast({ title: "Deleted" }); },
  });

  function openNewBnpl() {
    setBnplId(null);
    setBnplForm({ provider: "", description: "", originalAmount: "", remainingBalance: "", instalmentAmount: "", instalmentFrequency: "fortnightly", nextPaymentDate: "", status: "active", feeRisk: "", linkedBudgetCategory: "", notes: "" });
    setBnplOpen(true);
  }

  function openEditBnpl(item: BnplItem) {
    setBnplId(item.id);
    setBnplForm({ ...item, originalAmount: String(item.originalAmount), remainingBalance: String(item.remainingBalance), instalmentAmount: String(item.instalmentAmount), nextPaymentDate: item.nextPaymentDate ?? "", feeRisk: item.feeRisk ?? "", linkedBudgetCategory: item.linkedBudgetCategory ?? "", notes: item.notes ?? "" });
    setBnplOpen(true);
  }

  function openNewSv() {
    setSvId(null);
    setSvForm({ provider: "", startingValue: "", remainingBalance: "", purchaseDate: "", expiryDate: "", linkedBudgetCategory: "", notes: "" });
    setSvOpen(true);
  }

  function openEditSv(item: StoredValueItem) {
    setSvId(item.id);
    setSvForm({ ...item, startingValue: String(item.startingValue), remainingBalance: String(item.remainingBalance), purchaseDate: item.purchaseDate ?? "", expiryDate: item.expiryDate ?? "", linkedBudgetCategory: item.linkedBudgetCategory ?? "", notes: item.notes ?? "" });
    setSvOpen(true);
  }

  function handleSaveBnpl() {
    saveBnpl.mutate({
      provider: bnplForm.provider,
      description: bnplForm.description,
      originalAmount: Number(bnplForm.originalAmount) || 0,
      remainingBalance: Number(bnplForm.remainingBalance) || 0,
      instalmentAmount: Number(bnplForm.instalmentAmount) || 0,
      instalmentFrequency: bnplForm.instalmentFrequency || "fortnightly",
      nextPaymentDate: bnplForm.nextPaymentDate || null,
      status: bnplForm.status || "active",
      feeRisk: bnplForm.feeRisk || null,
      linkedBudgetCategory: bnplForm.linkedBudgetCategory || null,
      notes: bnplForm.notes || null,
    });
  }

  function handleSaveSv() {
    saveSv.mutate({
      provider: svForm.provider,
      startingValue: Number(svForm.startingValue) || 0,
      remainingBalance: Number(svForm.remainingBalance) || 0,
      purchaseDate: svForm.purchaseDate || null,
      expiryDate: svForm.expiryDate || null,
      linkedBudgetCategory: svForm.linkedBudgetCategory || null,
      notes: svForm.notes || null,
    });
  }

  // Summary totals
  const activeBnpls = bnpls.filter(b => b.status === "active");
  const totalBnplBalance = activeBnpls.reduce((s, b) => s + b.remainingBalance, 0);
  const weeklyBnplCommitment = activeBnpls.reduce((s, b) => s + toWeekly(b.instalmentAmount, b.instalmentFrequency), 0);
  const totalStoredValue = stored.reduce((s, sv) => s + sv.remainingBalance, 0);

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-serif font-bold tracking-tight">BNPL & Stored Value</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Track Afterpay / BNPL repayment plans and gift card balances. These are not bills — they're managed separately to avoid double-counting.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Active BNPL Balance</div>
            <div className="text-xl font-bold text-destructive">{formatCurrency(totalBnplBalance)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{activeBnpls.length} active plan{activeBnpls.length !== 1 ? "s" : ""}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Weekly Repayments</div>
            <div className="text-xl font-bold text-amber-700">{formatCurrency(weeklyBnplCommitment)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">BNPL instalments/week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground mb-1">Stored Value Available</div>
            <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalStoredValue)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stored.length} card{stored.length !== 1 ? "s" : ""}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
        <span>
          BNPL repayments ({formatCurrency(weeklyBnplCommitment)}/week) are separate from bills and arrears.
          Include them in your weekly budget review manually. Stored value (gift cards) reduces how much cash you need — not income.
        </span>
      </div>

      {/* BNPL section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            BNPL / Repayment Plans ({bnpls.length})
          </h2>
          <Button size="sm" onClick={openNewBnpl}><Plus className="h-4 w-4 mr-1" /> Add Plan</Button>
        </div>

        {bnplLoading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
        ) : bnpls.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No BNPL plans tracked. Add Afterpay or similar repayment plans here.</p>
              <Button size="sm" variant="outline" onClick={openNewBnpl} className="mt-3"><Plus className="h-4 w-4 mr-1" /> Add Plan</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bnpls.map(item => {
              const pct = item.originalAmount > 0 ? (item.remainingBalance / item.originalAmount) * 100 : 0;
              const weeklyAmt = toWeekly(item.instalmentAmount, item.instalmentFrequency);
              return (
                <Card key={item.id} className={item.status !== "active" ? "opacity-60" : ""}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{item.provider}</span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-sm">{item.description}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>Original: {formatCurrency(item.originalAmount)}</span>
                          <span className="font-medium text-foreground">Remaining: {formatCurrency(item.remainingBalance)}</span>
                          <span>{formatCurrency(item.instalmentAmount)} / {item.instalmentFrequency}</span>
                          <span className="text-amber-600">{formatCurrency(weeklyAmt)}/wk</span>
                          {item.nextPaymentDate && <span>Next: {item.nextPaymentDate}</span>}
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        {item.feeRisk && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />{item.feeRisk}
                          </p>
                        )}
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
                        <BnplScheduleSection item={item} />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBnpl(item)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this plan?")) deleteBnpl.mutate(item.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Stored value section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Gift Cards & Stored Value ({stored.length})
          </h2>
          <Button size="sm" onClick={openNewSv}><Plus className="h-4 w-4 mr-1" /> Add Card</Button>
        </div>

        {storedLoading ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
        ) : stored.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Gift className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No gift cards or stored value tracked.</p>
              <Button size="sm" variant="outline" onClick={openNewSv} className="mt-3"><Plus className="h-4 w-4 mr-1" /> Add Card</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stored.map(sv => {
              const pct = sv.startingValue > 0 ? (sv.remainingBalance / sv.startingValue) * 100 : 0;
              const expiring = sv.expiryDate && new Date(sv.expiryDate) <= new Date(Date.now() + 30 * 86400000);
              return (
                <Card key={sv.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <Gift className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{sv.provider}</div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>Starting: {formatCurrency(sv.startingValue)}</span>
                          <span className="font-medium text-emerald-700">Remaining: {formatCurrency(sv.remainingBalance)}</span>
                        </div>
                        <div className="mt-1.5 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        {sv.expiryDate && (
                          <p className={`text-xs mt-1 ${expiring ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                            {expiring ? "⚠️ " : ""}Expires: {sv.expiryDate}
                          </p>
                        )}
                        {sv.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{sv.notes}</p>}
                        <StoredValueTransactionLog sv={sv} />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSv(sv)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete?")) deleteSv.mutate(sv.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* BNPL dialog */}
      <Dialog open={bnplOpen} onOpenChange={setBnplOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{bnplId ? "Edit Plan" : "Add BNPL / Repayment Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Provider</Label><Input placeholder="Afterpay" value={bnplForm.provider ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, provider: e.target.value }))} /></div>
              <div><Label>Status</Label>
                <Select value={bnplForm.status ?? "active"} onValueChange={v => setBnplForm((p: any) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description / Purchase</Label><Input placeholder="e.g. Winter jacket from ASOS" value={bnplForm.description ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Original Amount ($)</Label><Input type="number" step="0.01" value={bnplForm.originalAmount ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, originalAmount: e.target.value }))} /></div>
              <div><Label>Remaining Balance ($)</Label><Input type="number" step="0.01" value={bnplForm.remainingBalance ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, remainingBalance: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Instalment Amount ($)</Label><Input type="number" step="0.01" value={bnplForm.instalmentAmount ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, instalmentAmount: e.target.value }))} /></div>
              <div><Label>Frequency</Label>
                <Select value={bnplForm.instalmentFrequency ?? "fortnightly"} onValueChange={v => setBnplForm((p: any) => ({ ...p, instalmentFrequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Next Payment Date</Label><Input type="date" value={bnplForm.nextPaymentDate ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, nextPaymentDate: e.target.value }))} /></div>
            <div><Label>Fee Risk / Warning</Label><Input placeholder="e.g. $10 late fee if missed" value={bnplForm.feeRisk ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, feeRisk: e.target.value }))} /></div>
            <div><Label>Linked Budget Category</Label><Input placeholder="e.g. clothing, household" value={bnplForm.linkedBudgetCategory ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, linkedBudgetCategory: e.target.value }))} /></div>
            <div><Label>Notes</Label><Input value={bnplForm.notes ?? ""} onChange={e => setBnplForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBnplOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBnpl} disabled={saveBnpl.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stored value dialog */}
      <Dialog open={svOpen} onOpenChange={setSvOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{svId ? "Edit Card" : "Add Gift Card / Stored Value"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Provider / Store</Label><Input placeholder="e.g. Coles Group Gift Card" value={svForm.provider ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, provider: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starting Value ($)</Label><Input type="number" step="0.01" value={svForm.startingValue ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, startingValue: e.target.value }))} /></div>
              <div><Label>Remaining Balance ($)</Label><Input type="number" step="0.01" value={svForm.remainingBalance ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, remainingBalance: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Purchase Date</Label><Input type="date" value={svForm.purchaseDate ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, purchaseDate: e.target.value }))} /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={svForm.expiryDate ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, expiryDate: e.target.value }))} /></div>
            </div>
            <div><Label>Linked Budget Category</Label><Input placeholder="e.g. groceries, fuel" value={svForm.linkedBudgetCategory ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, linkedBudgetCategory: e.target.value }))} /></div>
            <div><Label>Notes</Label><Input value={svForm.notes ?? ""} onChange={e => setSvForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSv} disabled={saveSv.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
