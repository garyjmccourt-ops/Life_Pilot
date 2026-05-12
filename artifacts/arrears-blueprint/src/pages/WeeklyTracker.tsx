import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListWeeks, getListWeeksQueryKey,
  useUpsertWeek,
  useListIncomeEntries, getListIncomeEntriesQueryKey,
  useCreateIncomeEntry, useDeleteIncomeEntry,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit2, ChevronLeft, ChevronRight, Plus, Trash2, DollarSign } from "lucide-react";

// ── Week helpers ──────────────────────────────────────────────────────────────

function generateWeeksList(): string[] {
  const dates = [];
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(now.setDate(diff));
  currentMonday.setHours(0, 0, 0, 0);
  for (let i = -2; i <= 10; i++) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + (i * 7));
    const offset = d.getTimezoneOffset();
    const finalDate = new Date(d.getTime() - (offset * 60 * 1000));
    dates.push(finalDate.toISOString().split("T")[0]);
  }
  return dates;
}

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(now.setDate(diff));
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WeeklyTracker() {
  const { data: records, isLoading } = useListWeeks();
  const weeks = generateWeeksList();
  const currentMondayStr = getCurrentMonday();
  const [selectedWeek, setSelectedWeek] = useState(currentMondayStr);

  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px]" /></div>;

  const recordsMap = new Map(records?.map(r => [r.weekStart.slice(0, 10), r]));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Weekly Tracker</h1>
        <p className="text-muted-foreground mt-2 text-lg">Compare your planned budget against actuals week by week.</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[180px] font-serif font-bold text-foreground">Week Commencing</TableHead>
                <TableHead className="text-right">Planned In</TableHead>
                <TableHead className="text-right">Actual In</TableHead>
                <TableHead className="text-right">Planned Out</TableHead>
                <TableHead className="text-right">Actual Out</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map(weekDate => {
                const record = recordsMap.get(weekDate);
                const isCurrent = weekDate === currentMondayStr;
                const isSelected = weekDate === selectedWeek;
                return (
                  <WeekRow
                    key={weekDate}
                    dateStr={weekDate}
                    record={record}
                    isCurrent={isCurrent}
                    isSelected={isSelected}
                    onSelect={() => setSelectedWeek(weekDate)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ActualIncomeSection
        selectedWeek={selectedWeek}
        weeks={weeks}
        onWeekChange={setSelectedWeek}
      />
    </div>
  );
}

// ── WeekRow ───────────────────────────────────────────────────────────────────

function WeekRow({
  dateStr, record, isCurrent, isSelected, onSelect,
}: {
  dateStr: string;
  record: any;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isEditing, setIsEditing] = useState(!record && isCurrent);
  const queryClient = useQueryClient();
  const upsertMutation = useUpsertWeek();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    upsertMutation.mutate({
      data: {
        weekStart: dateStr,
        plannedIn: Number(formData.get("plannedIn")),
        actualIn: Number(formData.get("actualIn")),
        plannedOut: Number(formData.get("plannedOut")),
        actualOut: Number(formData.get("actualOut")),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWeeksQueryKey() });
        setIsEditing(false);
        toast({ title: "Week updated" });
      }
    });
  };

  const variance = record
    ? (record.actualIn - record.actualOut) - (record.plannedIn - record.plannedOut)
    : 0;

  if (isEditing) {
    return (
      <TableRow className={isCurrent ? "bg-primary/5" : ""}>
        <TableCell className="font-medium align-top pt-4">
          {formatDate(dateStr)}
          {isCurrent && <div className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">Current Week</div>}
        </TableCell>
        <TableCell colSpan={6} className="p-0">
          <form onSubmit={handleSave} className="flex items-center w-full py-2 pr-2">
            <div className="flex-1 grid grid-cols-4 gap-2 px-4">
              <Input name="plannedIn" type="number" step="0.01" defaultValue={record?.plannedIn || 0} className="h-8 text-right" />
              <Input name="actualIn" type="number" step="0.01" defaultValue={record?.actualIn || 0} className="h-8 text-right" />
              <Input name="plannedOut" type="number" step="0.01" defaultValue={record?.plannedOut || 0} className="h-8 text-right" />
              <Input name="actualOut" type="number" step="0.01" defaultValue={record?.actualOut || 0} className="h-8 text-right" />
            </div>
            <div className="w-[180px] flex justify-end gap-2 pr-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8">Cancel</Button>
              <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="h-8">Save</Button>
            </div>
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className={`cursor-pointer transition-colors ${isCurrent ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"} ${isSelected ? "ring-1 ring-inset ring-primary/30" : ""}`}
      onClick={onSelect}
    >
      <TableCell className="font-medium">
        {formatDate(dateStr)}
        {isCurrent && <div className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">Current Week</div>}
        {isSelected && !isCurrent && <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Selected</div>}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">{record ? formatCurrency(record.plannedIn) : "—"}</TableCell>
      <TableCell className="text-right font-medium">{record ? formatCurrency(record.actualIn) : "—"}</TableCell>
      <TableCell className="text-right text-muted-foreground">{record ? formatCurrency(record.plannedOut) : "—"}</TableCell>
      <TableCell className="text-right font-medium">{record ? formatCurrency(record.actualOut) : "—"}</TableCell>
      <TableCell className={`text-right font-bold ${variance > 0 ? "text-primary" : variance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {record ? (variance > 0 ? "+" : "") + formatCurrency(variance) : "—"}
      </TableCell>
      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditing(true)}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── ActualIncomeSection ───────────────────────────────────────────────────────

const PAYMENT_METHODS = ["Bank transfer", "Cash", "Cheque", "PayPal", "Other"];

type EntryForm = {
  dateReceived: string;
  sourceName: string;
  person: string;
  amount: string;
  paymentMethod: string;
  notes: string;
  allocated: boolean;
};

function makeEntryForm(weekStart: string): EntryForm {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = addDays(weekStart, 6);
  return {
    dateReceived: today >= weekStart && today <= weekEnd ? today : weekStart,
    sourceName: "",
    person: "",
    amount: "",
    paymentMethod: "",
    notes: "",
    allocated: false,
  };
}

function ActualIncomeSection({
  selectedWeek,
  weeks,
  onWeekChange,
}: {
  selectedWeek: string;
  weeks: string[];
  onWeekChange: (w: string) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: allEntries = [], isLoading } = useListIncomeEntries();
  const createEntry = useCreateIncomeEntry();
  const deleteEntry = useDeleteIncomeEntry();

  const [form, setForm] = useState<EntryForm>(() => makeEntryForm(selectedWeek));
  const [saving, setSaving] = useState(false);

  const weekEnd = addDays(selectedWeek, 6);

  const weekEntries = allEntries.filter(e => {
    const d = (typeof e.dateReceived === "string" ? e.dateReceived : (e.dateReceived as Date).toISOString()).slice(0, 10);
    return d >= selectedWeek && d <= weekEnd;
  });

  const weekTotal = weekEntries.reduce((s, e) => s + e.grossAmount, 0);

  const weekIdx = weeks.indexOf(selectedWeek);
  const canPrev = weekIdx > 0;
  const canNext = weekIdx < weeks.length - 1;

  function handleWeekNav(dir: -1 | 1) {
    const next = weeks[weekIdx + dir];
    if (next) {
      onWeekChange(next);
      setForm(makeEntryForm(next));
    }
  }

  const sf = (key: keyof EntryForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sourceName.trim() || !form.amount) return;
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await createEntry.mutateAsync({
        data: {
          dateReceived: form.dateReceived,
          sourceName: form.sourceName.trim(),
          person: form.person.trim() || null,
          grossAmount: amt,
          netAmount: amt,
          paymentMethod: form.paymentMethod.trim() || null,
          notes: form.notes.trim() || null,
          allocated: form.allocated,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListIncomeEntriesQueryKey() });
      setForm(prev => ({
        ...makeEntryForm(selectedWeek),
        paymentMethod: prev.paymentMethod, // keep method for quick repeat
      }));
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-serif">Actual Income Received</CardTitle>
          </div>
          {/* Week navigator */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              disabled={!canPrev}
              onClick={() => handleWeekNav(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              Week of {formatDate(selectedWeek)}
            </span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              disabled={!canNext}
              onClick={() => handleWeekNav(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Weekly total */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Week total received</div>
            <div className="text-xl font-bold text-primary">{formatCurrency(weekTotal)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Actual income received — recorded here, not mixed with forecast income sources.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick-add form */}
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
            <div>
              <Label className="text-xs">Date Received</Label>
              <Input
                type="date"
                value={form.dateReceived}
                onChange={sf("dateReceived")}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Source / Description</Label>
              <Input
                placeholder="e.g. Centrelink, Salary"
                value={form.sourceName}
                onChange={sf("sourceName")}
                className="h-8 text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Person</Label>
              <Input
                placeholder="e.g. Jess"
                value={form.person}
                onChange={sf("person")}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={sf("amount")}
                className="h-8 text-sm text-right"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Account / Method</Label>
              <Input
                placeholder="e.g. ANZ savings"
                value={form.paymentMethod}
                onChange={sf("paymentMethod")}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                placeholder="Optional"
                value={form.notes}
                onChange={sf("notes")}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allocated}
                onChange={e => setForm(prev => ({ ...prev, allocated: e.target.checked }))}
                className="accent-primary h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">Allocated to bills / expenses</span>
            </label>
            <Button type="submit" size="sm" disabled={saving || !form.sourceName.trim() || !form.amount}>
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>

        {/* Entries list */}
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : weekEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
            No income recorded for this week yet — use the form above to add an entry.
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Person</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Account / Method</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Notes</th>
                  <th className="px-3 py-2 text-center font-medium">Allocated</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {weekEntries.map(entry => {
                  const d = (typeof entry.dateReceived === "string"
                    ? entry.dateReceived
                    : (entry.dateReceived as Date).toISOString()
                  ).slice(0, 10);
                  return (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2">{formatDate(d)}</td>
                      <td className="px-3 py-2 font-medium">{entry.sourceName}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{entry.person ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-primary">{formatCurrency(entry.grossAmount)}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{entry.paymentMethod ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{entry.notes ?? "—"}</td>
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
                    {weekEntries.length} {weekEntries.length === 1 ? "entry" : "entries"}
                  </td>
                  <td colSpan={1} className="px-3 py-2 text-xs font-medium text-muted-foreground md:hidden">
                    {weekEntries.length} {weekEntries.length === 1 ? "entry" : "entries"}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-primary">{formatCurrency(weekTotal)}</td>
                  <td colSpan={4} className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
