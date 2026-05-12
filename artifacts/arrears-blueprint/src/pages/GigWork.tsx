import { useState } from "react";
import { useListGigEntries, useCreateGigEntry, useUpdateGigEntry, useDeleteGigEntry } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bike, Plus, Pencil, Trash2, TrendingUp, Clock, DollarSign, Zap } from "lucide-react";

type GigEntry = {
  id: number;
  entryDate: string;
  platform: string;
  person?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  hoursWorked?: number | null;
  grossEarnings: number;
  tips: number;
  fastPayAmount: number;
  weeklyDepositAmount: number;
  fees: number;
  fuelEstimate: number;
  otherExpenses: number;
  netIncome: number;
  paymentStatus: string;
  notes?: string | null;
};

const defaultForm = {
  entryDate: new Date().toISOString().slice(0, 10),
  platform: "doordash" as const,
  person: "",
  startTime: "",
  endTime: "",
  hoursWorked: "",
  grossEarnings: "",
  tips: "0",
  fastPayAmount: "0",
  weeklyDepositAmount: "0",
  fees: "0",
  fuelEstimate: "0",
  otherExpenses: "0",
  netIncome: "",
  paymentStatus: "pending" as const,
  notes: "",
};

const PLATFORM_LABELS: Record<string, string> = {
  doordash: "DoorDash",
  uber: "Uber",
  airtasker: "Airtasker",
  cash: "Cash",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  "fast-paid": "bg-blue-100 text-blue-700",
  deposited: "bg-green-100 text-green-700",
  received: "bg-emerald-100 text-emerald-700",
};

export default function GigWork() {
  const { data: entries = [], isLoading, refetch } = useListGigEntries();
  const createMutation = useCreateGigEntry();
  const updateMutation = useUpdateGigEntry();
  const deleteMutation = useDeleteGigEntry();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const totalNetThisMonth = entries
    .filter((e) => e.entryDate >= new Date().toISOString().slice(0, 8))
    .reduce((s, e) => s + e.netIncome, 0);
  const totalFastPay = entries
    .filter((e) => e.paymentStatus === "pending")
    .reduce((s, e) => s + e.fastPayAmount, 0);
  const totalHours = entries
    .filter((e) => e.hoursWorked != null)
    .reduce((s, e) => s + (e.hoursWorked ?? 0), 0);
  const avgHourly = totalHours > 0
    ? entries.filter((e) => e.hoursWorked != null).reduce((s, e) => s + e.netIncome, 0) / totalHours
    : 0;

  function openCreate() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(e: GigEntry) {
    setForm({
      entryDate: e.entryDate,
      platform: e.platform as typeof defaultForm.platform,
      person: e.person ?? "",
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      hoursWorked: e.hoursWorked != null ? String(e.hoursWorked) : "",
      grossEarnings: String(e.grossEarnings),
      tips: String(e.tips),
      fastPayAmount: String(e.fastPayAmount),
      weeklyDepositAmount: String(e.weeklyDepositAmount),
      fees: String(e.fees),
      fuelEstimate: String(e.fuelEstimate),
      otherExpenses: String(e.otherExpenses),
      netIncome: String(e.netIncome),
      paymentStatus: e.paymentStatus as typeof defaultForm.paymentStatus,
      notes: e.notes ?? "",
    });
    setEditingId(e.id);
    setDialogOpen(true);
  }

  function buildPayload() {
    return {
      entryDate: form.entryDate,
      platform: form.platform,
      person: form.person || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      hoursWorked: form.hoursWorked ? Number(form.hoursWorked) : null,
      grossEarnings: Number(form.grossEarnings) || 0,
      tips: Number(form.tips) || 0,
      fastPayAmount: Number(form.fastPayAmount) || 0,
      weeklyDepositAmount: Number(form.weeklyDepositAmount) || 0,
      fees: Number(form.fees) || 0,
      fuelEstimate: Number(form.fuelEstimate) || 0,
      otherExpenses: Number(form.otherExpenses) || 0,
      netIncome: Number(form.netIncome) || 0,
      paymentStatus: form.paymentStatus,
      notes: form.notes || null,
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    try {
      if (editingId != null) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Entry updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Entry added" });
      }
      setDialogOpen(false);
      refetch();
    } catch {
      toast({ title: "Error saving entry", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Entry deleted" });
      refetch();
    } catch {
      toast({ title: "Error deleting entry", variant: "destructive" });
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bike className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gig Work</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> This Month Net
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(totalNetThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3 w-3" /> Pending FastPay
            </div>
            <div className="text-xl font-bold text-amber-600">{formatCurrency(totalFastPay)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" /> Total Hours
            </div>
            <div className="text-xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" /> Avg $/hr
            </div>
            <div className="text-xl font-bold">{avgHourly > 0 ? formatCurrency(avgHourly) : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No gig entries yet — add your first DoorDash or Uber shift.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="pb-2 text-left font-medium">Date</th>
                    <th className="pb-2 text-left font-medium">Platform</th>
                    <th className="pb-2 text-left font-medium hidden md:table-cell">Person</th>
                    <th className="pb-2 text-right font-medium">Gross</th>
                    <th className="pb-2 text-right font-medium hidden md:table-cell">FastPay</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                    <th className="pb-2 text-center font-medium">Status</th>
                    <th className="pb-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-left">{formatDate(e.entryDate)}</td>
                      <td className="py-2.5 text-left">{PLATFORM_LABELS[e.platform] ?? e.platform}</td>
                      <td className="py-2.5 text-left text-muted-foreground hidden md:table-cell">{e.person ?? "—"}</td>
                      <td className="py-2.5 text-right">{formatCurrency(e.grossEarnings)}</td>
                      <td className="py-2.5 text-right hidden md:table-cell text-blue-600">
                        {e.fastPayAmount > 0 ? formatCurrency(e.fastPayAmount) : "—"}
                      </td>
                      <td className="py-2.5 text-right font-medium text-primary">{formatCurrency(e.netIncome)}</td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Entry" : "Add Gig Entry"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 md:col-span-1">
              <Label>Date</Label>
              <Input type="date" value={form.entryDate} onChange={f("entryDate")} />
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v as typeof defaultForm.platform }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Person</Label>
              <Input placeholder="e.g. Jess" value={form.person} onChange={f("person")} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={f("startTime")} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={form.endTime} onChange={f("endTime")} />
            </div>
            <div>
              <Label>Hours Worked</Label>
              <Input type="number" step="0.25" placeholder="0.0" value={form.hoursWorked} onChange={f("hoursWorked")} />
            </div>
            <div>
              <Label>Gross Earnings ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.grossEarnings} onChange={f("grossEarnings")} />
            </div>
            <div>
              <Label>Tips ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.tips} onChange={f("tips")} />
            </div>
            <div>
              <Label>FastPay Amount ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.fastPayAmount} onChange={f("fastPayAmount")} />
            </div>
            <div>
              <Label>Weekly Deposit ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.weeklyDepositAmount} onChange={f("weeklyDepositAmount")} />
            </div>
            <div>
              <Label>Fees ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.fees} onChange={f("fees")} />
            </div>
            <div>
              <Label>Fuel Estimate ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.fuelEstimate} onChange={f("fuelEstimate")} />
            </div>
            <div>
              <Label>Other Expenses ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.otherExpenses} onChange={f("otherExpenses")} />
            </div>
            <div>
              <Label>Net Income ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.netIncome} onChange={f("netIncome")} />
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm((p) => ({ ...p, paymentStatus: v as typeof defaultForm.paymentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fast-paid">Fast-Paid</SelectItem>
                  <SelectItem value="deposited">Deposited</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
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
