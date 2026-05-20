import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Download, AlertTriangle, CheckCircle2, Info,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const OWNERSHIP = ["Gary", "Sam", "Shared"] as const;
type Owner = typeof OWNERSHIP[number];

const FREQUENCIES = ["weekly", "fortnightly", "monthly", "quarterly", "annual", "one-off"] as const;
type Frequency = typeof FREQUENCIES[number];

const ARREARS_CATEGORIES = ["rent", "utility", "council", "fine", "child-support", "personal-debt", "tax", "other"] as const;
type ArrearsCategory = typeof ARREARS_CATEGORIES[number];

const ARREARS_STATUSES = ["active", "negotiating", "paused", "completed"] as const;
const RISK_LEVELS = ["low", "medium", "high"] as const;
const TASK_BUCKETS = ["pay", "contact", "file", "review", "negotiate", "watch"] as const;
const TASK_STATUSES = ["open", "in-progress", "waiting", "blocked", "awaiting-reply", "deferred", "cancelled", "done"] as const;
const PRIORITIES = ["critical", "p1", "p2", "p3"] as const;
const COMMS_CHANNELS = ["phone", "email", "letter", "portal", "in-person", "sms"] as const;
const GIG_PLATFORMS = ["doordash", "uber", "airtasker", "cash", "other"] as const;
const GIG_PAYMENT_STATUSES = ["pending", "fast-paid", "deposited", "received"] as const;

// Monday-start week helper
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Row types ─────────────────────────────────────────────────────────────────

type IncomeSourceRow = { _id: string; name: string; amount: string; frequency: Frequency; notes: string };
type IncomeEntryRow = { _id: string; dateReceived: string; sourceName: string; person: Owner; grossAmount: string; netAmount: string; paymentMethod: string; estimated: boolean; notes: string };
type BillRow = { _id: string; provider: string; category: string; amount: string; frequency: Frequency; dueDay: string; autopay: boolean; notes: string; isRent: boolean };
type ArrearsRow = { _id: string; creditor: string; category: ArrearsCategory; balance: string; ongoingCharge: string; ongoingFrequency: Frequency; arrearsPayment: string; arrearsFrequency: Frequency; riskLevel: string; status: string; nextReviewDate: string; accountRef: string; summary: string; isRentArrears: boolean };
type GigEntryRow = { _id: string; entryDate: string; platform: string; person: Owner; grossEarnings: string; tips: string; fastPayAmount: string; fees: string; fuelEstimate: string; netIncome: string; paymentStatus: string; startTime: string; endTime: string; hoursWorked: string; deliveriesCount: string; notes: string };
type WeeklyEntryRow = { _id: string; weekStart: string; plannedIn: string; actualIn: string; plannedOut: string; actualOut: string; notes: string };
type TaskRow = { _id: string; title: string; bucket: string; status: string; priority: string; assignedPerson: Owner; dueDate: string; notes: string };
type CommsRow = { _id: string; occurredAt: string; channel: string; creditor: string; who: Owner; outcome: string; nextStep: string };

type GeneratorState = {
  mode: "merge" | "add-only" | "replace";
  incomeSources: IncomeSourceRow[];
  incomeEntries: IncomeEntryRow[];
  bills: BillRow[];
  arrearsItems: ArrearsRow[];
  gigEntries: GigEntryRow[];
  weeklyEntries: WeeklyEntryRow[];
  tasks: TaskRow[];
  commsEntries: CommsRow[];
};

type ValidationError = { section: string; row: number; field: string; message: string };

// ── Blank row factories ───────────────────────────────────────────────────────

const blankIncomeSource = (): IncomeSourceRow => ({ _id: uid(), name: "", amount: "", frequency: "fortnightly", notes: "" });
const blankIncomeEntry = (): IncomeEntryRow => ({ _id: uid(), dateReceived: today(), sourceName: "", person: "Gary", grossAmount: "", netAmount: "", paymentMethod: "", estimated: false, notes: "" });
const blankBill = (): BillRow => ({ _id: uid(), provider: "", category: "", amount: "", frequency: "monthly", dueDay: "", autopay: false, notes: "", isRent: false });
const blankArrears = (): ArrearsRow => ({ _id: uid(), creditor: "", category: "rent", balance: "", ongoingCharge: "", ongoingFrequency: "weekly", arrearsPayment: "", arrearsFrequency: "weekly", riskLevel: "medium", status: "active", nextReviewDate: "", accountRef: "", summary: "", isRentArrears: false });
const blankGigEntry = (): GigEntryRow => ({ _id: uid(), entryDate: today(), platform: "doordash", person: "Gary", grossEarnings: "", tips: "0", fastPayAmount: "0", fees: "0", fuelEstimate: "0", netIncome: "", paymentStatus: "pending", startTime: "", endTime: "", hoursWorked: "", deliveriesCount: "", notes: "" });
const blankWeeklyEntry = (): WeeklyEntryRow => ({ _id: uid(), weekStart: getMondayOf(today()), plannedIn: "", actualIn: "", plannedOut: "", actualOut: "", notes: "" });
const blankTask = (): TaskRow => ({ _id: uid(), title: "", bucket: "pay", status: "open", priority: "p2", assignedPerson: "Shared", dueDate: "", notes: "" });
const blankComms = (): CommsRow => ({ _id: uid(), occurredAt: today() + "T09:00:00.000Z", channel: "phone", creditor: "", who: "Gary", outcome: "", nextStep: "" });

// ── Validation ────────────────────────────────────────────────────────────────

function validate(state: GeneratorState): ValidationError[] {
  const errors: ValidationError[] = [];

  state.incomeSources.forEach((r, i) => {
    if (!r.name.trim()) errors.push({ section: "Income Sources", row: i + 1, field: "name", message: "Name is required" });
    if (!r.amount || isNaN(Number(r.amount))) errors.push({ section: "Income Sources", row: i + 1, field: "amount", message: "Valid amount required" });
  });

  state.incomeEntries.forEach((r, i) => {
    if (!r.sourceName.trim()) errors.push({ section: "Income Entries", row: i + 1, field: "sourceName", message: "Source name is required" });
    if (!r.dateReceived) errors.push({ section: "Income Entries", row: i + 1, field: "dateReceived", message: "Date is required" });
    if (!r.grossAmount || isNaN(Number(r.grossAmount))) errors.push({ section: "Income Entries", row: i + 1, field: "grossAmount", message: "Valid gross amount required" });
    if (!r.netAmount || isNaN(Number(r.netAmount))) errors.push({ section: "Income Entries", row: i + 1, field: "netAmount", message: "Valid net amount required" });
  });

  state.bills.forEach((r, i) => {
    if (!r.provider.trim()) errors.push({ section: "Bills", row: i + 1, field: "provider", message: "Provider is required" });
    if (!r.amount || isNaN(Number(r.amount))) errors.push({ section: "Bills", row: i + 1, field: "amount", message: "Valid amount required" });
    if (r.isRent && r.category && r.category !== "rent") errors.push({ section: "Bills", row: i + 1, field: "category", message: "Rent bills should use category 'rent'" });
  });

  state.arrearsItems.forEach((r, i) => {
    if (!r.creditor.trim()) errors.push({ section: "Arrears", row: i + 1, field: "creditor", message: "Creditor is required" });
    if (!r.balance || isNaN(Number(r.balance))) errors.push({ section: "Arrears", row: i + 1, field: "balance", message: "Valid balance required" });
    if (!r.ongoingCharge || isNaN(Number(r.ongoingCharge))) errors.push({ section: "Arrears", row: i + 1, field: "ongoingCharge", message: "Valid ongoing charge required" });
    if (!r.arrearsPayment || isNaN(Number(r.arrearsPayment))) errors.push({ section: "Arrears", row: i + 1, field: "arrearsPayment", message: "Valid arrears payment required" });
    if (r.isRentArrears && r.category !== "rent") errors.push({ section: "Arrears", row: i + 1, field: "category", message: "Rent arrears must use category 'rent'" });
  });

  state.gigEntries.forEach((r, i) => {
    if (!r.entryDate) errors.push({ section: "Gig Entries", row: i + 1, field: "entryDate", message: "Date is required" });
    if (!r.grossEarnings || isNaN(Number(r.grossEarnings))) errors.push({ section: "Gig Entries", row: i + 1, field: "grossEarnings", message: "Valid gross earnings required" });
    if (!r.netIncome || isNaN(Number(r.netIncome))) errors.push({ section: "Gig Entries", row: i + 1, field: "netIncome", message: "Valid net income required" });
  });

  state.weeklyEntries.forEach((r, i) => {
    if (!r.weekStart) errors.push({ section: "Weekly Entries", row: i + 1, field: "weekStart", message: "Week start is required" });
    else {
      const d = new Date(r.weekStart + "T00:00:00");
      if (d.getDay() !== 1) errors.push({ section: "Weekly Entries", row: i + 1, field: "weekStart", message: `${r.weekStart} is not a Monday` });
    }
    if (r.plannedIn !== "" && isNaN(Number(r.plannedIn))) errors.push({ section: "Weekly Entries", row: i + 1, field: "plannedIn", message: "Must be a number" });
    if (r.actualIn !== "" && isNaN(Number(r.actualIn))) errors.push({ section: "Weekly Entries", row: i + 1, field: "actualIn", message: "Must be a number" });
  });

  state.tasks.forEach((r, i) => {
    if (!r.title.trim()) errors.push({ section: "Tasks", row: i + 1, field: "title", message: "Title is required" });
  });

  state.commsEntries.forEach((r, i) => {
    if (!r.creditor.trim()) errors.push({ section: "Communications", row: i + 1, field: "creditor", message: "Creditor is required" });
    if (!r.outcome.trim()) errors.push({ section: "Communications", row: i + 1, field: "outcome", message: "Outcome is required" });
  });

  return errors;
}

// ── JSON builder ──────────────────────────────────────────────────────────────

function buildPayload(state: GeneratorState) {
  return {
    mode: state.mode,
    sections: [] as string[],
    data: {
      incomeSources: state.incomeSources.map(r => ({
        name: r.name.trim(),
        amount: Number(r.amount),
        frequency: r.frequency,
        notes: r.notes.trim() || null,
      })),
      incomeEntries: state.incomeEntries.map(r => ({
        dateReceived: r.dateReceived,
        sourceName: r.sourceName.trim(),
        person: r.person,
        grossAmount: Number(r.grossAmount),
        netAmount: Number(r.netAmount),
        paymentMethod: r.paymentMethod.trim() || null,
        tags: r.estimated ? "estimated" : null,
        notes: r.notes.trim() || null,
        allocated: false,
        gigEntryId: null,
      })),
      bills: state.bills.map(r => ({
        provider: r.provider.trim(),
        category: r.isRent ? "rent" : (r.category.trim() || "other"),
        amount: Number(r.amount),
        frequency: r.frequency,
        dueDay: r.dueDay ? parseInt(r.dueDay, 10) : null,
        dueDate: null,
        accountRef: null,
        autopay: r.autopay,
        notes: r.notes.trim() || null,
      })),
      arrearsItems: state.arrearsItems.map(r => ({
        creditor: r.creditor.trim(),
        category: r.isRentArrears ? "rent" : r.category,
        balance: Number(r.balance),
        ongoingCharge: Number(r.ongoingCharge),
        ongoingFrequency: r.ongoingFrequency,
        arrearsPayment: Number(r.arrearsPayment),
        arrearsFrequency: r.arrearsFrequency,
        riskLevel: r.riskLevel,
        status: r.status,
        nextReviewDate: r.nextReviewDate || null,
        accountRef: r.accountRef.trim() || null,
        summary: r.summary.trim() || null,
        objective: null,
        workingPlan: null,
        communicationPosition: null,
        externalAcknowledgement: null,
        externalPaymentIntent: null,
        externalStagedReduction: null,
        externalReviewPoints: null,
        externalChannel: null,
        evidenceLinks: null,
      })),
      gigEntries: state.gigEntries.map(r => ({
        entryDate: r.entryDate,
        platform: r.platform,
        person: r.person,
        startTime: r.startTime.trim() || null,
        endTime: r.endTime.trim() || null,
        hoursWorked: r.hoursWorked ? Number(r.hoursWorked) : null,
        grossEarnings: Number(r.grossEarnings),
        tips: Number(r.tips) || 0,
        fastPayAmount: Number(r.fastPayAmount) || 0,
        weeklyDepositAmount: 0,
        fees: Number(r.fees) || 0,
        fuelEstimate: Number(r.fuelEstimate) || 0,
        otherExpenses: 0,
        netIncome: Number(r.netIncome),
        paymentStatus: r.paymentStatus,
        notes: r.notes.trim() || null,
        estimatedKm: null,
        activeMinutes: null,
        deliveriesCount: r.deliveriesCount ? parseInt(r.deliveriesCount, 10) : null,
        offersCount: null,
        routeChain: null,
      })),
      weeklyEntries: state.weeklyEntries.map(r => ({
        weekStart: r.weekStart,
        plannedIn: Number(r.plannedIn) || 0,
        actualIn: Number(r.actualIn) || 0,
        plannedOut: Number(r.plannedOut) || 0,
        actualOut: Number(r.actualOut) || 0,
        notes: r.notes.trim() || null,
      })),
      tasks: state.tasks.map(r => ({
        title: r.title.trim(),
        description: null,
        category: null,
        bucket: r.bucket,
        status: r.status,
        priority: r.priority,
        dueDate: r.dueDate || null,
        startDate: null,
        assignedPerson: r.assignedPerson,
        creditorTag: null,
        arrearsItemId: null,
        recurring: false,
        completedAt: null,
        notes: r.notes.trim() || null,
      })),
      commsEntries: state.commsEntries.map(r => ({
        occurredAt: r.occurredAt.includes("T") ? r.occurredAt : r.occurredAt + "T09:00:00.000Z",
        channel: r.channel,
        creditor: r.creditor.trim(),
        arrearsItemId: null,
        who: r.who,
        outcome: r.outcome.trim(),
        nextStep: r.nextStep.trim() || null,
      })),
      budgetCategories: [],
      scenarios: [],
    },
  };
}

// ── Small shared helpers ───────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="font-serif font-semibold text-base">{title}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <Button size="sm" variant="outline" onClick={onAdd} className="h-7 gap-1 text-xs">
        <Plus className="h-3 w-3" /> {addLabel}
      </Button>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0 mt-5" onClick={onClick} type="button">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

function OwnerSelect({ value, onChange }: { value: Owner; onChange: (v: Owner) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as Owner)}>
      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>{OWNERSHIP.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function FreqSelect({ value, onChange }: { value: Frequency; onChange: (v: Frequency) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as Frequency)}>
      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
    </Select>
  );
}

// ── Section editors ───────────────────────────────────────────────────────────

function IncomeSources({ rows, onChange }: { rows: IncomeSourceRow[]; onChange: (rows: IncomeSourceRow[]) => void }) {
  const update = (id: string, patch: Partial<IncomeSourceRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Income Sources" count={rows.length} onAdd={() => onChange([...rows, blankIncomeSource()])} addLabel="Add source" />
      <p className="text-xs text-muted-foreground mb-3">Regular income sources — salary, Centrelink, etc. Use the expected amount for planning.</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No income sources added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Source name *"><Input className="h-8 text-sm" value={r.name} onChange={e => update(r._id, { name: e.target.value })} placeholder="e.g. Gary Centrelink" /></Field>
              <Field label="Expected amount ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.amount} onChange={e => update(r._id, { amount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Frequency"><FreqSelect value={r.frequency} onChange={v => update(r._id, { frequency: v })} /></Field>
              <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function IncomeEntries({ rows, onChange }: { rows: IncomeEntryRow[]; onChange: (rows: IncomeEntryRow[]) => void }) {
  const update = (id: string, patch: Partial<IncomeEntryRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Income Entries" count={rows.length} onAdd={() => onChange([...rows, blankIncomeEntry()])} addLabel="Add entry" />
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700 mb-3">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Use actual received amounts. Only tick "Estimated" if the exact amount is not yet confirmed.</span>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No income entries added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Date received *"><Input className="h-8 text-sm" type="date" value={r.dateReceived} onChange={e => update(r._id, { dateReceived: e.target.value })} /></Field>
              <Field label="Source name *"><Input className="h-8 text-sm" value={r.sourceName} onChange={e => update(r._id, { sourceName: e.target.value })} placeholder="e.g. Gary Centrelink" /></Field>
              <Field label="Person">
                <OwnerSelect value={r.person} onChange={v => update(r._id, { person: v })} />
              </Field>
              <Field label="Gross amount ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.grossAmount} onChange={e => update(r._id, { grossAmount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Net amount ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.netAmount} onChange={e => update(r._id, { netAmount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Payment method"><Input className="h-8 text-sm" value={r.paymentMethod} onChange={e => update(r._id, { paymentMethod: e.target.value })} placeholder="e.g. ANZ direct" /></Field>
              <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
              <div className="flex items-center gap-2 mt-5">
                <Switch checked={r.estimated} onCheckedChange={v => update(r._id, { estimated: v })} id={`est-${r._id}`} />
                <label htmlFor={`est-${r._id}`} className="text-xs text-muted-foreground cursor-pointer">Estimated</label>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bills({ rows, onChange }: { rows: BillRow[]; onChange: (rows: BillRow[]) => void }) {
  const update = (id: string, patch: Partial<BillRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Bills" count={rows.length} onAdd={() => onChange([...rows, blankBill()])} addLabel="Add bill" />
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700 mb-3">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Current rent goes here as a regular bill. Rent <em>arrears</em> (the overdue amount) go in the Arrears section.</span>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No bills added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className={`flex gap-2 items-start p-3 border rounded-lg ${r.isRent ? "bg-amber-50 border-amber-200" : "bg-muted/20"}`}>
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Provider *"><Input className="h-8 text-sm" value={r.provider} onChange={e => update(r._id, { provider: e.target.value })} placeholder="e.g. Real Estate Agency" /></Field>
              <Field label="Category">
                <Input className="h-8 text-sm" value={r.isRent ? "rent" : r.category} onChange={e => update(r._id, { category: e.target.value })} placeholder="e.g. rent, electricity" disabled={r.isRent} />
              </Field>
              <Field label="Amount ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.amount} onChange={e => update(r._id, { amount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Frequency"><FreqSelect value={r.frequency} onChange={v => update(r._id, { frequency: v })} /></Field>
              <Field label="Due day (1–31)"><Input className="h-8 text-sm" type="number" min="1" max="31" value={r.dueDay} onChange={e => update(r._id, { dueDay: e.target.value })} placeholder="e.g. 1" /></Field>
              <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
              <div className="flex items-center gap-2 mt-5">
                <Switch checked={r.autopay} onCheckedChange={v => update(r._id, { autopay: v })} id={`ap-${r._id}`} />
                <label htmlFor={`ap-${r._id}`} className="text-xs cursor-pointer">Autopay</label>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch checked={r.isRent} onCheckedChange={v => update(r._id, { isRent: v, category: v ? "rent" : r.category })} id={`rent-${r._id}`} />
                <label htmlFor={`rent-${r._id}`} className="text-xs text-amber-700 cursor-pointer font-medium">This is current rent</label>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ArrearsItems({ rows, onChange }: { rows: ArrearsRow[]; onChange: (rows: ArrearsRow[]) => void }) {
  const update = (id: string, patch: Partial<ArrearsRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Arrears" count={rows.length} onAdd={() => onChange([...rows, blankArrears()])} addLabel="Add arrears" />
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700 mb-3">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Rent arrears (overdue rent balance) go here — not in Bills. Enable "Rent arrears" to auto-set the category.</span>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No arrears added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className={`flex gap-2 items-start p-3 border rounded-lg ${r.isRentArrears ? "bg-amber-50 border-amber-200" : "bg-muted/20"}`}>
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Creditor *"><Input className="h-8 text-sm" value={r.creditor} onChange={e => update(r._id, { creditor: e.target.value })} placeholder="e.g. Real Estate Agency" /></Field>
              <Field label="Category">
                <Select value={r.isRentArrears ? "rent" : r.category} onValueChange={v => update(r._id, { category: v as ArrearsCategory })} disabled={r.isRentArrears}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{ARREARS_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Balance ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.balance} onChange={e => update(r._id, { balance: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Ongoing charge ($) *" hint="Current regular amount due"><Input className="h-8 text-sm" type="number" step="0.01" value={r.ongoingCharge} onChange={e => update(r._id, { ongoingCharge: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Ongoing frequency"><FreqSelect value={r.ongoingFrequency} onChange={v => update(r._id, { ongoingFrequency: v })} /></Field>
              <Field label="Arrears repayment ($) *" hint="Extra amount paying off the arrears"><Input className="h-8 text-sm" type="number" step="0.01" value={r.arrearsPayment} onChange={e => update(r._id, { arrearsPayment: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Arrears frequency"><FreqSelect value={r.arrearsFrequency} onChange={v => update(r._id, { arrearsFrequency: v })} /></Field>
              <Field label="Risk level">
                <Select value={r.riskLevel} onValueChange={v => update(r._id, { riskLevel: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={r.status} onValueChange={v => update(r._id, { status: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{ARREARS_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Next review date"><Input className="h-8 text-sm" type="date" value={r.nextReviewDate} onChange={e => update(r._id, { nextReviewDate: e.target.value })} /></Field>
              <Field label="Account ref"><Input className="h-8 text-sm" value={r.accountRef} onChange={e => update(r._id, { accountRef: e.target.value })} placeholder="Optional" /></Field>
              <div className="sm:col-span-2">
                <Field label="Summary"><Textarea className="text-sm min-h-[60px]" value={r.summary} onChange={e => update(r._id, { summary: e.target.value })} placeholder="Brief description of the arrears situation" /></Field>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch checked={r.isRentArrears} onCheckedChange={v => update(r._id, { isRentArrears: v, category: v ? "rent" : r.category })} id={`ra-${r._id}`} />
                <label htmlFor={`ra-${r._id}`} className="text-xs text-amber-700 cursor-pointer font-medium">Rent arrears</label>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GigEntries({ rows, onChange }: { rows: GigEntryRow[]; onChange: (rows: GigEntryRow[]) => void }) {
  const update = (id: string, patch: Partial<GigEntryRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  function addDoorDashDay() {
    onChange([...rows, { ...blankGigEntry(), platform: "doordash" }]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-serif font-semibold text-base">Gig Entries</span>
          <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addDoorDashDay} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> DoorDash day
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange([...rows, blankGigEntry()])} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Other entry
          </Button>
        </div>
      </div>
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700 mb-3">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Add one entry per day for DoorDash. Weekly rollups (deposit totals) go in Weekly Entries. Net income = gross + tips − fees − fuel.</span>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No gig entries added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Date *"><Input className="h-8 text-sm" type="date" value={r.entryDate} onChange={e => update(r._id, { entryDate: e.target.value })} /></Field>
              <Field label="Platform">
                <Select value={r.platform} onValueChange={v => update(r._id, { platform: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{GIG_PLATFORMS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Person"><OwnerSelect value={r.person} onChange={v => update(r._id, { person: v })} /></Field>
              <Field label="Payment status">
                <Select value={r.paymentStatus} onValueChange={v => update(r._id, { paymentStatus: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{GIG_PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Gross earnings ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.grossEarnings} onChange={e => update(r._id, { grossEarnings: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Tips ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.tips} onChange={e => update(r._id, { tips: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Fast pay ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.fastPayAmount} onChange={e => update(r._id, { fastPayAmount: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Fees ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.fees} onChange={e => update(r._id, { fees: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Fuel estimate ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.fuelEstimate} onChange={e => update(r._id, { fuelEstimate: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Net income ($) *"><Input className="h-8 text-sm" type="number" step="0.01" value={r.netIncome} onChange={e => update(r._id, { netIncome: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Start time"><Input className="h-8 text-sm" type="time" value={r.startTime} onChange={e => update(r._id, { startTime: e.target.value })} /></Field>
              <Field label="End time"><Input className="h-8 text-sm" type="time" value={r.endTime} onChange={e => update(r._id, { endTime: e.target.value })} /></Field>
              <Field label="Hours worked"><Input className="h-8 text-sm" type="number" step="0.25" value={r.hoursWorked} onChange={e => update(r._id, { hoursWorked: e.target.value })} placeholder="e.g. 3.5" /></Field>
              <Field label="Deliveries"><Input className="h-8 text-sm" type="number" step="1" value={r.deliveriesCount} onChange={e => update(r._id, { deliveriesCount: e.target.value })} placeholder="e.g. 8" /></Field>
              <div className="sm:col-span-2">
                <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyEntries({ rows, onChange }: { rows: WeeklyEntryRow[]; onChange: (rows: WeeklyEntryRow[]) => void }) {
  const update = (id: string, patch: Partial<WeeklyEntryRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  function handleDateChange(id: string, raw: string) {
    const monday = getMondayOf(raw);
    update(id, { weekStart: monday });
  }

  return (
    <div>
      <SectionHeader title="Weekly Entries" count={rows.length} onAdd={() => onChange([...rows, blankWeeklyEntry()])} addLabel="Add week" />
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700 mb-3">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>Weeks always start on Monday. Pick any date in the week — it will snap to the Monday. Use this for weekly DoorDash deposit totals and weekly income/spending summaries.</span>
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No weekly entries added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Any date in week *" hint={r.weekStart ? `→ Week of ${r.weekStart}` : ""}>
                <Input className="h-8 text-sm" type="date" value={r.weekStart} onChange={e => handleDateChange(r._id, e.target.value)} />
              </Field>
              <Field label="Planned in ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.plannedIn} onChange={e => update(r._id, { plannedIn: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Actual in ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.actualIn} onChange={e => update(r._id, { actualIn: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Planned out ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.plannedOut} onChange={e => update(r._id, { plannedOut: e.target.value })} placeholder="0.00" /></Field>
              <Field label="Actual out ($)"><Input className="h-8 text-sm" type="number" step="0.01" value={r.actualOut} onChange={e => update(r._id, { actualOut: e.target.value })} placeholder="0.00" /></Field>
              <div className="sm:col-span-2">
                <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Tasks({ rows, onChange }: { rows: TaskRow[]; onChange: (rows: TaskRow[]) => void }) {
  const update = (id: string, patch: Partial<TaskRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Tasks" count={rows.length} onAdd={() => onChange([...rows, blankTask()])} addLabel="Add task" />
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No tasks added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <div className="sm:col-span-2">
                <Field label="Title *"><Input className="h-8 text-sm" value={r.title} onChange={e => update(r._id, { title: e.target.value })} placeholder="e.g. Call real estate about arrears" /></Field>
              </div>
              <Field label="Assigned to"><OwnerSelect value={r.assignedPerson} onChange={v => update(r._id, { assignedPerson: v })} /></Field>
              <Field label="Due date"><Input className="h-8 text-sm" type="date" value={r.dueDate} onChange={e => update(r._id, { dueDate: e.target.value })} /></Field>
              <Field label="Bucket">
                <Select value={r.bucket} onValueChange={v => update(r._id, { bucket: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_BUCKETS.map(b => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={r.status} onValueChange={v => update(r._id, { status: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={r.priority} onValueChange={v => update(r._id, { priority: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Notes"><Input className="h-8 text-sm" value={r.notes} onChange={e => update(r._id, { notes: e.target.value })} placeholder="Optional" /></Field>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CommsEntries({ rows, onChange }: { rows: CommsRow[]; onChange: (rows: CommsRow[]) => void }) {
  const update = (id: string, patch: Partial<CommsRow>) =>
    onChange(rows.map(r => r._id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => onChange(rows.filter(r => r._id !== id));

  return (
    <div>
      <SectionHeader title="Communications" count={rows.length} onAdd={() => onChange([...rows, blankComms()])} addLabel="Add entry" />
      {rows.length === 0 && <p className="text-xs text-muted-foreground italic py-2">No communications added.</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r._id} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/20">
            <span className="text-xs text-muted-foreground mt-2 w-4 flex-shrink-0">{i + 1}</span>
            <div className="grid sm:grid-cols-4 gap-2 flex-1">
              <Field label="Date *"><Input className="h-8 text-sm" type="date" value={r.occurredAt.slice(0, 10)} onChange={e => update(r._id, { occurredAt: e.target.value + "T09:00:00.000Z" })} /></Field>
              <Field label="Channel">
                <Select value={r.channel} onValueChange={v => update(r._id, { channel: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{COMMS_CHANNELS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Creditor *"><Input className="h-8 text-sm" value={r.creditor} onChange={e => update(r._id, { creditor: e.target.value })} placeholder="e.g. Real Estate Agency" /></Field>
              <Field label="Who made contact"><OwnerSelect value={r.who} onChange={v => update(r._id, { who: v })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Outcome *"><Textarea className="text-sm min-h-[60px]" value={r.outcome} onChange={e => update(r._id, { outcome: e.target.value })} placeholder="What was discussed and agreed" /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Next step"><Textarea className="text-sm min-h-[60px]" value={r.nextStep} onChange={e => update(r._id, { nextStep: e.target.value })} placeholder="What happens next" /></Field>
              </div>
            </div>
            <RemoveBtn onClick={() => remove(r._id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Collapsible section wrapper ───────────────────────────────────────────────

function CollapsibleSection({ title, count, defaultOpen = false, children }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader className="pb-0 pt-4 px-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-4 px-4 pb-4">{children}</CardContent>}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ImportGenerator() {
  const [state, setState] = useState<GeneratorState>({
    mode: "merge",
    incomeSources: [],
    incomeEntries: [],
    bills: [],
    arrearsItems: [],
    gigEntries: [],
    weeklyEntries: [],
    tasks: [],
    commsEntries: [],
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [validated, setValidated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const set = useCallback(<K extends keyof GeneratorState>(key: K, val: GeneratorState[K]) => {
    setState(s => ({ ...s, [key]: val }));
    setValidated(false);
    setErrors([]);
  }, []);

  const totalRows = state.incomeSources.length + state.incomeEntries.length + state.bills.length +
    state.arrearsItems.length + state.gigEntries.length + state.weeklyEntries.length +
    state.tasks.length + state.commsEntries.length;

  function handleValidate() {
    const errs = validate(state);
    setErrors(errs);
    setValidated(true);
  }

  function handleExport() {
    const errs = validate(state);
    setErrors(errs);
    setValidated(true);
    if (errs.length > 0) return;

    const payload = buildPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myoh-import-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewJson = previewOpen ? JSON.stringify(buildPayload(state), null, 2) : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">MYOH Import Generator</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Build a MYOH-ready import file by filling in the sections below. The file validates against the MYOH schema and can be imported immediately via the Data tab.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Import mode</Label>
              <Select value={state.mode} onValueChange={v => set("mode", v as GeneratorState["mode"])}>
                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Merge (default)</SelectItem>
                  <SelectItem value="add-only">Add only</SelectItem>
                  <SelectItem value="replace">Replace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 text-xs text-blue-700 flex-1 min-w-[200px]">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span><strong>Merge</strong> updates existing records by name/provider and adds new ones. Recommended for ongoing use.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="income" className="text-xs">Income</TabsTrigger>
          <TabsTrigger value="bills" className="text-xs">Bills & Arrears</TabsTrigger>
          <TabsTrigger value="gig" className="text-xs">Gig Work</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Tasks & Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-6 mt-4">
          <CollapsibleSection title="Income Sources" count={state.incomeSources.length} defaultOpen>
            <IncomeSources rows={state.incomeSources} onChange={v => set("incomeSources", v)} />
          </CollapsibleSection>
          <CollapsibleSection title="Income Entries (received payments)" count={state.incomeEntries.length} defaultOpen>
            <IncomeEntries rows={state.incomeEntries} onChange={v => set("incomeEntries", v)} />
          </CollapsibleSection>
        </TabsContent>

        <TabsContent value="bills" className="space-y-6 mt-4">
          <CollapsibleSection title="Bills (including current rent)" count={state.bills.length} defaultOpen>
            <Bills rows={state.bills} onChange={v => set("bills", v)} />
          </CollapsibleSection>
          <CollapsibleSection title="Arrears (overdue balances, including rent arrears)" count={state.arrearsItems.length} defaultOpen>
            <ArrearsItems rows={state.arrearsItems} onChange={v => set("arrearsItems", v)} />
          </CollapsibleSection>
        </TabsContent>

        <TabsContent value="gig" className="space-y-6 mt-4">
          <CollapsibleSection title="Gig Entries (day-by-day)" count={state.gigEntries.length} defaultOpen>
            <GigEntries rows={state.gigEntries} onChange={v => set("gigEntries", v)} />
          </CollapsibleSection>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6 mt-4">
          <CollapsibleSection title="Weekly Entries (Monday-start rollups)" count={state.weeklyEntries.length} defaultOpen>
            <WeeklyEntries rows={state.weeklyEntries} onChange={v => set("weeklyEntries", v)} />
          </CollapsibleSection>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-4">
          <CollapsibleSection title="Tasks" count={state.tasks.length} defaultOpen>
            <Tasks rows={state.tasks} onChange={v => set("tasks", v)} />
          </CollapsibleSection>
          <CollapsibleSection title="Communications Log" count={state.commsEntries.length}>
            <CommsEntries rows={state.commsEntries} onChange={v => set("commsEntries", v)} />
          </CollapsibleSection>
        </TabsContent>
      </Tabs>

      {/* Validation & Export */}
      <Card className="sticky bottom-4 shadow-md">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[160px]">
              <div className="text-sm font-medium">{totalRows} row{totalRows !== 1 ? "s" : ""} across all sections</div>
              {validated && errors.length === 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All rows valid — ready to export
                </div>
              )}
              {validated && errors.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.length} issue{errors.length !== 1 ? "s" : ""} found — fix before exporting
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleValidate} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Validate
            </Button>
            <Button size="sm" onClick={handleExport} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={totalRows === 0}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(o => !o)} className="gap-1 text-xs text-muted-foreground">
              {previewOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {previewOpen ? "Hide" : "Preview"} JSON
            </Button>
          </div>

          {validated && errors.length > 0 && (
            <div className="border border-destructive/30 rounded-md bg-destructive/5 p-3 space-y-1 max-h-48 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="flex gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span><strong>{e.section}</strong> row {e.row} · {e.field}: {e.message}</span>
                </div>
              ))}
            </div>
          )}

          {previewOpen && (
            <div className="mt-2">
              <pre className="text-[11px] font-mono bg-muted/60 rounded-md p-3 max-h-64 overflow-auto border whitespace-pre-wrap break-all">
                {previewJson}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
