import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListWeeks, getListWeeksQueryKey,
  useUpsertWeek,
  useListIncomeEntries, getListIncomeEntriesQueryKey,
  useCreateIncomeEntry, useDeleteIncomeEntry,
  useListIncome,
  useListBills,
  useListArrears,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Edit2, ChevronLeft, ChevronRight, Plus, Trash2,
  DollarSign, Bike, TrendingUp, Receipt, AlertCircle,
  ClipboardList, ChevronDown, ChevronUp,
} from "lucide-react";

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

function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const s = new Date(weekStart + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
}

function billsDueInWeek(bills: any[], weekStart: string, weekEnd: string): any[] {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekEnd + "T23:59:59");
  return bills.filter(bill => {
    if (bill.dueDate) {
      const d = new Date(typeof bill.dueDate === "string" ? bill.dueDate + "T00:00:00" : bill.dueDate);
      if (d >= start && d <= end) return true;
    }
    if (bill.frequency === "weekly" || bill.frequency === "fortnightly") return true;
    if (bill.dueDay) {
      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        if (cur.getDate() === bill.dueDay) return true;
      }
    }
    return false;
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WeeklyTracker() {
  const { data: records, isLoading } = useListWeeks();
  const weeks = generateWeeksList();
  const currentMondayStr = getCurrentMonday();
  const [selectedWeek, setSelectedWeek] = useState(currentMondayStr);
  const [showSummaryTable, setShowSummaryTable] = useState(false);

  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px]" /></div>;

  const recordsMap = new Map(records?.map(r => [r.weekStart.slice(0, 10), r]));
  const weekIdx = weeks.indexOf(selectedWeek);
  const canPrev = weekIdx > 0;
  const canNext = weekIdx < weeks.length - 1;

  function handleWeekNav(dir: -1 | 1) {
    const next = weeks[weekIdx + dir];
    if (next) setSelectedWeek(next);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page header + week navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Weekly Tracker</h1>
          <p className="text-muted-foreground mt-1">Forecast vs actuals — week by week.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canPrev} onClick={() => handleWeekNav(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px]">
            <div className="text-sm font-semibold text-foreground">{weekLabel(selectedWeek)}</div>
            {selectedWeek === currentMondayStr && (
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Current Week</div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canNext} onClick={() => handleWeekNav(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary stat cards */}
      <WeekSummaryCards selectedWeek={selectedWeek} />

      {/* Section 1: Forecast Income */}
      <ForecastIncomeSection />

      {/* Section 2: Actual Income Received */}
      <ActualIncomeSection
        selectedWeek={selectedWeek}
        weeks={weeks}
        onWeekChange={setSelectedWeek}
      />

      {/* Section 3: Commitments This Week */}
      <CommitmentsSection selectedWeek={selectedWeek} />

      {/* Section 4: Notes & Review Checklist */}
      <WeeklyNotesSection selectedWeek={selectedWeek} />

      {/* Multi-week summary table (collapsible) */}
      <div>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground border rounded-lg px-4 py-2 h-auto"
          onClick={() => setShowSummaryTable(v => !v)}
        >
          <span className="text-sm font-medium">Multi-week overview (all weeks)</span>
          {showSummaryTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {showSummaryTable && (
          <Card className="mt-2">
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
                    <TableHead className="w-[80px]"></TableHead>
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
        )}
      </div>
    </div>
  );
}

// ── WeekSummaryCards ──────────────────────────────────────────────────────────

function WeekSummaryCards({ selectedWeek }: { selectedWeek: string }) {
  const weekEnd = addDays(selectedWeek, 6);
  const { data: allEntries = [] } = useListIncomeEntries();
  const { data: incomeSources = [] } = useListIncome();
  const { data: bills = [] } = useListBills();
  const { data: arrears = [] } = useListArrears();

  const weekEntries = allEntries.filter(e => {
    const d = (typeof e.dateReceived === "string" ? e.dateReceived : (e.dateReceived as Date).toISOString()).slice(0, 10);
    return d >= selectedWeek && d <= weekEnd;
  });

  const forecastIn = incomeSources.reduce((s: number, src: any) => s + (src.weeklyEquivalent ?? 0), 0);
  const actualIn = weekEntries.reduce((s, e) => s + e.grossAmount, 0);

  const dueBills = billsDueInWeek(bills, selectedWeek, weekEnd);
  const billsTotal = dueBills.reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? b.amount ?? 0), 0);
  const arrearsTotal = (arrears as any[]).filter((a: any) => a.status === "active").reduce(
    (s: number, a: any) => s + (a.weeklyOngoing ?? 0) + (a.weeklyArrears ?? 0), 0
  );
  const totalCommitments = billsTotal + arrearsTotal;
  const surplus = actualIn - totalCommitments;

  const stats = [
    {
      label: "Forecast Income",
      value: formatCurrency(forecastIn),
      sub: "Weekly from all sources",
      icon: TrendingUp,
      color: "text-muted-foreground",
    },
    {
      label: "Actual Received",
      value: formatCurrency(actualIn),
      sub: actualIn === 0 ? "Nothing recorded yet" : `${weekEntries.length} ${weekEntries.length === 1 ? "entry" : "entries"}`,
      icon: DollarSign,
      color: actualIn > 0 ? "text-primary" : "text-muted-foreground",
    },
    {
      label: "Commitments",
      value: formatCurrency(totalCommitments),
      sub: `Bills: ${formatCurrency(billsTotal)} · Arrears: ${formatCurrency(arrearsTotal)}`,
      icon: Receipt,
      color: "text-amber-600",
    },
    {
      label: surplus >= 0 ? "Surplus" : "Shortfall",
      value: (surplus >= 0 ? "+" : "") + formatCurrency(surplus),
      sub: surplus >= 0 ? "After commitments" : "Short of commitments",
      icon: AlertCircle,
      color: surplus >= 0 ? "text-emerald-600" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── ForecastIncomeSection ─────────────────────────────────────────────────────

function ForecastIncomeSection() {
  const { data: sources = [], isLoading } = useListIncome();
  const totalWeekly = (sources as any[]).reduce((s: number, src: any) => s + (src.weeklyEquivalent ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-serif">Forecast Income</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Weekly total</div>
            <div className="text-lg font-bold text-primary">{formatCurrency(totalWeekly)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Planned income from all active sources — actual receipts are recorded in the section below.
        </p>
        {/* Rent-first model note */}
        <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-800 leading-relaxed">
          <strong>Rent-first model:</strong> Sam's wages go to rent first. Gary's DoorDash / work covers bills, fuel, food and incidentals.
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (sources as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3 border rounded-md">
            No income sources configured — add them in Income &amp; Bills → Sources (Forecast).
          </p>
        ) : (
          <div className="divide-y rounded-md border overflow-hidden">
            {(sources as any[]).map((src: any) => (
              <div key={src.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/20 text-sm">
                <div>
                  <span className="font-medium">{src.name || src.description || "—"}</span>
                  {src.person && (
                    <span className="ml-2 text-xs text-muted-foreground">{src.person}</span>
                  )}
                  {src.type && (
                    <Badge variant="secondary" className="ml-2 text-[10px] py-0 px-1.5">{src.type}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary">{formatCurrency(src.weeklyEquivalent ?? 0)}</span>
                  <span className="text-xs text-muted-foreground ml-1">/wk</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── CommitmentsSection ────────────────────────────────────────────────────────

function CommitmentsSection({ selectedWeek }: { selectedWeek: string }) {
  const weekEnd = addDays(selectedWeek, 6);
  const { data: bills = [], isLoading: billsLoading } = useListBills();
  const { data: arrears = [], isLoading: arrearsLoading } = useListArrears();

  const dueBills = billsDueInWeek(bills as any[], selectedWeek, weekEnd);
  const activeArrears = (arrears as any[]).filter((a: any) => a.status === "active");

  const billsTotal = dueBills.reduce((s: number, b: any) => s + (b.weeklyEquivalent ?? b.amount ?? 0), 0);
  const arrearsTotal = activeArrears.reduce((s: number, a: any) => s + (a.weeklyOngoing ?? 0) + (a.weeklyArrears ?? 0), 0);
  const total = billsTotal + arrearsTotal;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base font-serif">Commitments This Week</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total due</div>
            <div className="text-lg font-bold text-amber-600">{formatCurrency(total)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Bills due this week plus ongoing arrears/rent-plan payments.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bills due */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bills Due</h3>
            <span className="text-xs font-medium text-amber-600">{formatCurrency(billsTotal)}</span>
          </div>
          {billsLoading ? (
            <Skeleton className="h-12" />
          ) : dueBills.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 border rounded-md text-center">No bills due this week.</p>
          ) : (
            <div className="divide-y rounded-md border overflow-hidden">
              {dueBills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/20">
                  <div>
                    <span className="font-medium">{bill.provider}</span>
                    {bill.category && (
                      <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1.5">{bill.category}</Badge>
                    )}
                    {bill.autopay && (
                      <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5">Autopay</Badge>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {bill.frequency}
                      {bill.dueDay ? ` · due on the ${bill.dueDay}${ordinal(bill.dueDay)}` : ""}
                    </div>
                  </div>
                  <span className="font-semibold text-amber-700">{formatCurrency(bill.weeklyEquivalent ?? bill.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Arrears / rent-plan */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arrears &amp; Rent-Plan Payments</h3>
            <span className="text-xs font-medium text-amber-600">{formatCurrency(arrearsTotal)}</span>
          </div>
          {arrearsLoading ? (
            <Skeleton className="h-12" />
          ) : activeArrears.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 border rounded-md text-center">No active arrears.</p>
          ) : (
            <div className="divide-y rounded-md border overflow-hidden">
              {activeArrears.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/20">
                  <div>
                    <span className="font-medium">{item.creditor}</span>
                    {item.riskLevel === "high" && (
                      <Badge className="ml-2 text-[10px] py-0 px-1.5 bg-destructive text-destructive-foreground">High risk</Badge>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5 space-x-3">
                      {item.weeklyOngoing > 0 && <span>Ongoing: {formatCurrency(item.weeklyOngoing)}/wk</span>}
                      {item.weeklyArrears > 0 && <span>Arrears repayment: {formatCurrency(item.weeklyArrears)}/wk</span>}
                    </div>
                  </div>
                  <span className="font-semibold text-amber-700">
                    {formatCurrency((item.weeklyOngoing ?? 0) + (item.weeklyArrears ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── WeeklyNotesSection ────────────────────────────────────────────────────────

const REVIEW_ITEMS = [
  "All income received for the week recorded",
  "Rent / arrears payment made on time",
  "Bills autopay confirmed or paid manually",
  "Fuel and food budget checked",
  "Any unexpected expenses noted",
  "Next week's income forecast confirmed",
];

function WeeklyNotesSection({ selectedWeek }: { selectedWeek: string }) {
  const storageKey = `myoh_notes_${selectedWeek}`;
  const checkKey = `myoh_checks_${selectedWeek}`;

  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; }
  });
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem(checkKey);
      return saved ? JSON.parse(saved) : REVIEW_ITEMS.map(() => false);
    } catch { return REVIEW_ITEMS.map(() => false); }
  });

  useEffect(() => {
    const storageKey = `myoh_notes_${selectedWeek}`;
    const checkKey = `myoh_checks_${selectedWeek}`;
    try { setNotes(localStorage.getItem(storageKey) ?? ""); } catch { setNotes(""); }
    try {
      const saved = localStorage.getItem(checkKey);
      setChecked(saved ? JSON.parse(saved) : REVIEW_ITEMS.map(() => false));
    } catch { setChecked(REVIEW_ITEMS.map(() => false)); }
  }, [selectedWeek]);

  function toggleCheck(i: number) {
    setChecked(prev => {
      const next = prev.map((v, idx) => idx === i ? !v : v);
      try { localStorage.setItem(checkKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    try { localStorage.setItem(storageKey, val); } catch {}
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-serif">Weekly Review &amp; Notes</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">{doneCount} / {REVIEW_ITEMS.length} checked</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">End-of-week checklist to confirm everything is in order.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist */}
        <div className="space-y-2">
          {REVIEW_ITEMS.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <div className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded border transition-colors ${checked[i] ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary/60"}`}
                onClick={() => toggleCheck(i)}
              >
                {checked[i] && <Check className="h-3 w-3 text-primary-foreground m-auto mt-0.5" />}
              </div>
              <span className={`text-sm leading-5 ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item}
              </span>
            </label>
          ))}
        </div>

        {/* Notes textarea */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Notes for this week</Label>
          <textarea
            className="w-full border rounded-md text-sm px-3 py-2 min-h-[80px] resize-y bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            placeholder="Any notes, observations, or reminders for this week…"
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Saved locally per week.</p>
        </div>
      </CardContent>
    </Card>
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
        paymentMethod: prev.paymentMethod,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-serif">Actual Income Received</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Week total received</div>
            <div className="text-lg font-bold text-primary">{formatCurrency(weekTotal)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Record money as it actually arrives — feeds the dashboard and budget calculations.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
            <div>
              <Label className="text-xs">Date Received</Label>
              <Input type="date" value={form.dateReceived} onChange={sf("dateReceived")} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Source / Description</Label>
              <Input placeholder="e.g. Centrelink, Salary" value={form.sourceName} onChange={sf("sourceName")} className="h-8 text-sm" required />
            </div>
            <div>
              <Label className="text-xs">Person</Label>
              <Input placeholder="e.g. Sam" value={form.person} onChange={sf("person")} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={sf("amount")} className="h-8 text-sm text-right" required />
            </div>
            <div>
              <Label className="text-xs">Account / Method</Label>
              <Input placeholder="e.g. ANZ savings" value={form.paymentMethod} onChange={sf("paymentMethod")} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Optional" value={form.notes} onChange={sf("notes")} className="h-8 text-sm" />
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
                  const fromGig = entry.gigEntryId != null;
                  return (
                    <tr key={entry.id} className={`border-b last:border-0 hover:bg-muted/20 ${fromGig ? "bg-blue-50/40" : ""}`}>
                      <td className="px-3 py-2">{formatDate(d)}</td>
                      <td className="px-3 py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          {entry.sourceName}
                          {fromGig && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                              <Bike className="h-2.5 w-2.5" /> Gig
                            </span>
                          )}
                        </span>
                      </td>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// suppress unused warning
void PAYMENT_METHODS;
