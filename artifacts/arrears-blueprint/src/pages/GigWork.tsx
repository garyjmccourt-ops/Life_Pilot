import { useState, useEffect, useCallback } from "react";
import { useListGigEntries, useCreateGigEntry, useUpdateGigEntry, useDeleteGigEntry, getListIncomeEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLookup, getDefaultValue } from "@/hooks/use-lookup";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bike, Plus, Pencil, Trash2, TrendingUp, Clock, DollarSign, Zap,
  Settings, Fuel, Package, ExternalLink,
  AlertTriangle, ChevronDown, ChevronUp, ChevronRight,
  Link2, ArrowRightCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

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
  incomeEntryId?: number | null;
  notes?: string | null;
  estimatedKm?: number | null;
  activeMinutes?: number | null;
  deliveriesCount?: number | null;
  offersCount?: number | null;
  routeChain?: string | null;
};

type FuelSettings = { pricePerL: number; l100km: number };

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Fuel settings (localStorage) ────────────────────────────────────────────

const FUEL_KEY = "gigFuelSettings";

function loadFuelSettings(): FuelSettings {
  try {
    const raw = localStorage.getItem(FUEL_KEY);
    if (raw) return { ...{ pricePerL: 1.75, l100km: 12 }, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { pricePerL: 1.75, l100km: 12 };
}

function saveFuelSettings(s: FuelSettings) {
  localStorage.setItem(FUEL_KEY, JSON.stringify(s));
}

// ── Period date helpers ───────────────────────────────────────────────────────

function getPeriodStarts() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  // Week: Monday
  const dow = now.getDay();
  const daysFromMon = (dow + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMon);

  // Quarter: Jan/Apr/Jul/Oct
  const qM = Math.floor(m / 3) * 3;

  // Australian Financial Year: 1 Jul (FY starts July 1)
  const fyY = m >= 6 ? y : y - 1;

  return {
    week: weekStart.toISOString().slice(0, 10),
    month: new Date(y, m, 1).toISOString().slice(0, 10),
    quarter: new Date(y, qM, 1).toISOString().slice(0, 10),
    fy: new Date(fyY, 6, 1).toISOString().slice(0, 10),
  };
}

// ── Entry computed helpers ────────────────────────────────────────────────────

function getDashMinutes(e: GigEntry): number | null {
  if (!e.startTime || !e.endTime) return null;
  const [sh, sm] = e.startTime.split(":").map(Number);
  const [eh, em] = e.endTime.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins > 0 ? mins : null;
}

function getActiveMinutes(e: GigEntry): number | null {
  if (e.activeMinutes != null && e.activeMinutes > 0) return e.activeMinutes;
  if (e.hoursWorked != null && e.hoursWorked > 0) return e.hoursWorked * 60;
  return null;
}

function calcFuel(km: number, s: FuelSettings) {
  return (km / 100) * s.l100km * s.pricePerL;
}

// ── Form default ─────────────────────────────────────────────────────────────

function makeDefault(): FormState {
  return {
    entryDate: new Date().toISOString().slice(0, 10),
    platform: "doordash",
    person: "",
    startTime: "",
    endTime: "",
    activeMinutes: "",
    grossEarnings: "",
    tips: "0",
    fastPayAmount: "0",
    weeklyDepositAmount: "0",
    fees: "0",
    fuelEstimate: "",
    otherExpenses: "0",
    netIncome: "",
    paymentStatus: "pending",
    notes: "",
    estimatedKm: "",
    deliveriesCount: "",
    offersCount: "",
    routeChain: "",
  };
}

type FormState = {
  entryDate: string;
  platform: string;
  person: string;
  startTime: string;
  endTime: string;
  activeMinutes: string;
  grossEarnings: string;
  tips: string;
  fastPayAmount: string;
  weeklyDepositAmount: string;
  fees: string;
  fuelEstimate: string;
  otherExpenses: string;
  netIncome: string;
  paymentStatus: string;
  notes: string;
  estimatedKm: string;
  deliveriesCount: string;
  offersCount: string;
  routeChain: string;
};

// ── Provider Summary Card ────────────────────────────────────────────────────

type GigProvider = {
  id: number;
  providerName: string;
  providerType: string;
  status: string;
  expectedWeeklyIncome: number | null;
  taxSetAsidePct: number;
  feedsMyohBudget: boolean;
};

function ProviderSummaryCard({ entries }: { entries: GigEntry[] }) {
  const BASE = import.meta.env.BASE_URL;
  const [providers, setProviders] = useState<GigProvider[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isEnabled = localStorage.getItem("myoh_gig_economy_enabled") !== "false"
      && localStorage.getItem("myoh_gig_economy_enabled") !== null;
    setEnabled(isEnabled);
    if (isEnabled) {
      fetch(`${BASE}api/gig-providers`)
        .then(r => r.json())
        .then(setProviders)
        .catch(() => {});
    }
  }, []);

  if (!enabled || providers.length === 0) return null;

  const active = providers.filter(p => p.status === "Active" && p.feedsMyohBudget);

  const expectedWeekly = active.reduce((s, p) => s + (p.expectedWeeklyIncome ?? 0), 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStr = weekStart.toISOString().slice(0, 10);
  const confirmedWeekly = entries
    .filter(e => e.entryDate >= weekStr)
    .reduce((s, e) => s + e.netIncome, 0);

  const confirmedFuel = entries
    .filter(e => e.entryDate >= weekStr)
    .reduce((s, e) => s + e.fuelEstimate, 0);

  const taxSetAside = active.reduce((s, p) => {
    const income = p.expectedWeeklyIncome ?? 0;
    return s + (income * p.taxSetAsidePct) / 100;
  }, 0);

  const netContribution = expectedWeekly - confirmedFuel - taxSetAside;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Gig Economy — Household Contribution
          <span className="text-xs font-normal text-muted-foreground ml-auto">{active.length} active provider{active.length !== 1 ? "s" : ""}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Expected weekly</div>
            <div className="font-semibold text-primary">${expectedWeekly.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Confirmed this week</div>
            <div className={`font-semibold ${confirmedWeekly >= expectedWeekly * 0.8 ? "text-emerald-700" : "text-amber-600"}`}>
              ${confirmedWeekly.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Est. fuel / vehicle</div>
            <div className="font-semibold">${confirmedFuel.toFixed(2)}</div>
          </div>
          {taxSetAside > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">Tax set-aside (est.)</div>
              <div className="font-semibold text-amber-700">${taxSetAside.toFixed(2)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">Est. net contribution</div>
            <div className={`font-semibold ${netContribution >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              ${netContribution.toFixed(2)}
            </div>
          </div>
          <div className="flex items-end">
            <button
              disabled
              title="Open Gig Economy Hub — coming soon"
              className="text-xs flex items-center gap-1 text-muted-foreground border border-dashed border-muted-foreground/40 rounded px-2 py-1 cursor-not-allowed opacity-60"
            >
              <ExternalLink className="h-3 w-3" /> Open Hub
            </button>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t">
          <div className="flex flex-wrap gap-1.5">
            {providers.map(p => (
              <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full border ${
                p.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                p.status === "Applying" ? "bg-blue-50 border-blue-200 text-blue-800" :
                "bg-muted border-muted-foreground/20 text-muted-foreground"
              }`}>
                {p.providerName} · {p.status}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GigWork() {
  const { data: entries = [], isLoading, refetch } = useListGigEntries();
  const createMutation = useCreateGigEntry();
  const updateMutation = useUpdateGigEntry();
  const deleteMutation = useDeleteGigEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(makeDefault());
  const [linkingId, setLinkingId] = useState<number | null>(null);

  const [fuelSettings, setFuelSettings] = useState<FuelSettings>(loadFuelSettings);
  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ pricePerL: "", l100km: "" });

  const { data: platformLookup = [] } = useLookup("gig_platform");
  const { data: peopleLookup = [] } = useLookup("household_people");

  const platformOptions = platformLookup.length > 0
    ? platformLookup.map(p => ({ value: p.value, label: p.label }))
    : Object.entries(PLATFORM_LABELS).map(([k, v]) => ({ value: k, label: v }));

  // ── Auto-calc: fuel from km ───────────────────────────────────────────────
  useEffect(() => {
    const km = parseFloat(form.estimatedKm);
    if (!isNaN(km) && km > 0) {
      const fuel = calcFuel(km, fuelSettings);
      setForm((prev) => ({ ...prev, fuelEstimate: fuel.toFixed(2) }));
    }
  }, [form.estimatedKm, fuelSettings]);

  // ── Auto-calc: net from components ───────────────────────────────────────
  useEffect(() => {
    const gross = parseFloat(form.grossEarnings) || 0;
    const tips = parseFloat(form.tips) || 0;
    const fees = parseFloat(form.fees) || 0;
    const fuel = parseFloat(form.fuelEstimate) || 0;
    const other = parseFloat(form.otherExpenses) || 0;
    const net = gross + tips - fees - fuel - other;
    setForm((prev) => ({ ...prev, netIncome: net.toFixed(2) }));
  }, [form.grossEarnings, form.tips, form.fees, form.fuelEstimate, form.otherExpenses]);

  // ── Dash time display ─────────────────────────────────────────────────────
  const dashMinutesPreview = (() => {
    if (!form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return mins > 0 ? mins : null;
  })();

  // ── Period stats ──────────────────────────────────────────────────────────
  const periods = getPeriodStarts();

  function periodNet(start: string) {
    return entries
      .filter((e) => e.entryDate >= start)
      .reduce((s, e) => s + e.netIncome, 0);
  }

  const totalFastPay = entries
    .filter((e) => e.paymentStatus === "pending")
    .reduce((s, e) => s + e.fastPayAmount, 0);

  const allActiveHrs = entries
    .map((e) => getActiveMinutes(e))
    .filter((m): m is number => m != null)
    .reduce((s, m) => s + m / 60, 0);

  const allNetForActive = entries
    .filter((e) => getActiveMinutes(e) != null)
    .reduce((s, e) => s + e.netIncome, 0);

  const avgNetPerActiveHr = allActiveHrs > 0 ? allNetForActive / allActiveHrs : 0;

  const allDashHrs = entries
    .map((e) => getDashMinutes(e))
    .filter((m): m is number => m != null)
    .reduce((s, m) => s + m / 60, 0);

  const allNetForDash = entries
    .filter((e) => getDashMinutes(e) != null)
    .reduce((s, e) => s + e.netIncome, 0);

  const avgNetPerDashHr = allDashHrs > 0 ? allNetForDash / allDashHrs : 0;

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function openCreate() {
    const def = getDefaultValue(platformLookup);
    setForm({ ...makeDefault(), ...(def ? { platform: def } : {}) });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(e: GigEntry) {
    const activeMins = e.activeMinutes != null
      ? String(e.activeMinutes)
      : (e.hoursWorked != null ? String(Math.round(e.hoursWorked * 60)) : "");
    setForm({
      entryDate: e.entryDate,
      platform: e.platform,
      person: e.person ?? "",
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      activeMinutes: activeMins,
      grossEarnings: String(e.grossEarnings),
      tips: String(e.tips),
      fastPayAmount: String(e.fastPayAmount),
      weeklyDepositAmount: String(e.weeklyDepositAmount),
      fees: String(e.fees),
      fuelEstimate: String(e.fuelEstimate),
      otherExpenses: String(e.otherExpenses),
      netIncome: String(e.netIncome),
      paymentStatus: e.paymentStatus,
      notes: e.notes ?? "",
      estimatedKm: e.estimatedKm != null ? String(e.estimatedKm) : "",
      deliveriesCount: e.deliveriesCount != null ? String(e.deliveriesCount) : "",
      offersCount: e.offersCount != null ? String(e.offersCount) : "",
      routeChain: e.routeChain ?? "",
    });
    setEditingId(e.id);
    setDialogOpen(true);
  }

  function buildPayload() {
    const activeMins = parseInt(form.activeMinutes) || null;
    return {
      entryDate: form.entryDate,
      platform: form.platform,
      person: form.person || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      hoursWorked: activeMins != null ? activeMins / 60 : null,
      grossEarnings: parseFloat(form.grossEarnings) || 0,
      tips: parseFloat(form.tips) || 0,
      fastPayAmount: parseFloat(form.fastPayAmount) || 0,
      weeklyDepositAmount: parseFloat(form.weeklyDepositAmount) || 0,
      fees: parseFloat(form.fees) || 0,
      fuelEstimate: parseFloat(form.fuelEstimate) || 0,
      otherExpenses: parseFloat(form.otherExpenses) || 0,
      netIncome: parseFloat(form.netIncome) || 0,
      paymentStatus: form.paymentStatus,
      notes: form.notes || null,
      estimatedKm: parseFloat(form.estimatedKm) || null,
      activeMinutes: activeMins,
      deliveriesCount: parseInt(form.deliveriesCount) || null,
      offersCount: parseInt(form.offersCount) || null,
      routeChain: form.routeChain || null,
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    try {
      if (editingId != null) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({
          title: "Shift updated",
          description: "Weekly income record updated automatically.",
        });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({
          title: "Shift added",
          description: "Weekly income record created/updated automatically.",
        });
      }
      setDialogOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: getListIncomeEntriesQueryKey() });
    } catch {
      toast({ title: "Error saving entry", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({
        title: "Shift deleted",
        description: "Weekly income record totals updated automatically.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: getListIncomeEntriesQueryKey() });
    } catch {
      toast({ title: "Error deleting entry", variant: "destructive" });
    }
  }

  async function handleLinkIncome(entry: GigEntry) {
    if (entry.incomeEntryId != null) {
      toast({
        title: "Already linked",
        description: `This shift is already recorded as income entry #${entry.incomeEntryId}.`,
      });
      return;
    }
    setLinkingId(entry.id);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/gig/${entry.id}/link-income`, {
        method: "POST",
      });
      if (res.status === 409) {
        const body = await res.json() as { incomeEntryId: number };
        toast({
          title: "Already linked",
          description: `This shift is already recorded as income entry #${body.incomeEntryId}.`,
        });
        refetch();
        return;
      }
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast({
        title: "Income entry created",
        description: "The payout has been recorded in Actual Income Received.",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Could not link income",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLinkingId(null);
    }
  }

  // ── Fuel settings ─────────────────────────────────────────────────────────

  function openFuelDialog() {
    setFuelForm({ pricePerL: String(fuelSettings.pricePerL), l100km: String(fuelSettings.l100km) });
    setFuelDialogOpen(true);
  }

  function saveFuelDialog() {
    const updated: FuelSettings = {
      pricePerL: parseFloat(fuelForm.pricePerL) || 1.75,
      l100km: parseFloat(fuelForm.l100km) || 12,
    };
    setFuelSettings(updated);
    saveFuelSettings(updated);
    setFuelDialogOpen(false);
    toast({ title: "Fuel settings saved" });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const sf = useCallback(
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }),
    ),
    [],
  );

  function fmtRate(rate: number | null) {
    return rate != null && rate > 0 ? `${formatCurrency(rate)}/hr` : "—";
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bike className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold truncate">Gig Work</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={openFuelDialog} title="Fuel settings">
            <Fuel className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate} size="sm" className="h-10 px-3">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Add Shift</span>
          </Button>
        </div>
      </div>

      {/* Provider summary card — only shown if Gig Economy enabled + providers exist */}
      <ProviderSummaryCard entries={entries} />

      {/* Gig Economy Hub notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 text-sm">
        <ArrowRightCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-medium text-blue-900 dark:text-blue-100">Shift capture has moved to the Gig Economy Hub</p>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
            Record shifts and scan screenshots in the Hub companion app, then use Hub → Export → Send to MYOH to import earnings here.
            You can still add shifts manually below using Add Shift.
          </p>
        </div>
      </div>

      {/* Fuel badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground -mt-2">
        <Fuel className="h-3 w-3" />
        Fuel: {fuelSettings.pricePerL.toFixed(2)} $/L · {fuelSettings.l100km} L/100km
        <button className="underline ml-0.5" onClick={openFuelDialog}>edit</button>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> This Week Net
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(periodNet(periods.week))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> This Month Net
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(periodNet(periods.month))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> This Quarter Net
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(periodNet(periods.quarter))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" /> This FY Net
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(periodNet(periods.fy))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Zap className="h-3 w-3" /> Pending FastPay
            </div>
            <div className="text-xl font-bold text-amber-600">{formatCurrency(totalFastPay)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" /> Total Active Hrs
            </div>
            <div className="text-xl font-bold">{allActiveHrs.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" /> Avg $/Active Hr
            </div>
            <div className="text-xl font-bold">{avgNetPerActiveHr > 0 ? formatCurrency(avgNetPerActiveHr) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" /> Avg $/Dash Hr
            </div>
            <div className="text-xl font-bold">{avgNetPerDashHr > 0 ? formatCurrency(avgNetPerDashHr) : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Entries */}
      <Card>
        <CardHeader className="pb-2 px-3 md:px-6">
          <CardTitle className="text-base">All Entries</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No gig entries yet — add a shift manually or import from the Gig Economy Hub.
            </p>
          ) : (
            <>
              {/* Mobile cards — visible below sm */}
              <div className="sm:hidden space-y-2">
                {entries.map((e) => {
                  const isLinked = e.incomeEntryId != null;
                  const canLink = !isLinked && e.paymentStatus !== "pending";
                  const isLinkingThis = linkingId === e.id;
                  return (
                    <div key={e.id} className="border rounded-xl p-3 space-y-2">
                      {/* Row 1: date + platform + status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm leading-tight">{formatDate(e.entryDate)}</p>
                          <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[e.platform] ?? e.platform}
                            {e.person ? ` · ${e.person}` : ""}
                            {(e.deliveriesCount != null || e.offersCount != null) ? ` · ${e.deliveriesCount ?? "?"}/${e.offersCount ?? "?"} orders` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.paymentStatus}
                        </span>
                      </div>
                      {/* Row 2: key numbers */}
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Gross</p>
                          <p className="font-medium text-sm">{formatCurrency(e.grossEarnings)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net</p>
                          <p className="font-semibold text-sm text-primary">{formatCurrency(e.netIncome)}</p>
                        </div>
                        {e.estimatedKm != null && (
                          <div>
                            <p className="text-xs text-muted-foreground">KM</p>
                            <p className="text-sm">{e.estimatedKm.toFixed(1)}</p>
                          </div>
                        )}
                        {isLinked && (
                          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <Link2 className="h-3 w-3" /> Linked
                          </span>
                        )}
                      </div>
                      {/* Row 3: actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t">
                        {canLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-1"
                            disabled={isLinkingThis}
                            onClick={() => handleLinkIncome(e)}
                          >
                            {isLinkingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ArrowRightCircle className="h-3.5 w-3.5 mr-1" />}
                            → Income
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table — hidden below sm */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="pb-2 text-left font-medium">Date</th>
                      <th className="pb-2 text-left font-medium">Platform</th>
                      <th className="pb-2 text-center font-medium hidden md:table-cell">D/O</th>
                      <th className="pb-2 text-right font-medium">Gross</th>
                      <th className="pb-2 text-right font-medium hidden md:table-cell">KM / Fuel</th>
                      <th className="pb-2 text-right font-medium">Net</th>
                      <th className="pb-2 text-right font-medium hidden lg:table-cell">$/Act·hr</th>
                      <th className="pb-2 text-right font-medium hidden lg:table-cell">$/Dash·hr</th>
                      <th className="pb-2 text-center font-medium">Status</th>
                      <th className="pb-2 text-center font-medium">Income</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => {
                      const activeMins = getActiveMinutes(e);
                      const dashMins = getDashMinutes(e);
                      const activeHrs = activeMins != null ? activeMins / 60 : null;
                      const dashHrs = dashMins != null ? dashMins / 60 : null;
                      const netPerActiveHr = activeHrs && activeHrs > 0 ? e.netIncome / activeHrs : null;
                      const netPerDashHr = dashHrs && dashHrs > 0 ? e.netIncome / dashHrs : null;
                      const isLinked = e.incomeEntryId != null;
                      const canLink = !isLinked && e.paymentStatus !== "pending";
                      const isLinkingThis = linkingId === e.id;
                      return (
                        <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 text-left">{formatDate(e.entryDate)}</td>
                          <td className="py-2.5 text-left">{PLATFORM_LABELS[e.platform] ?? e.platform}</td>
                          <td className="py-2.5 text-center hidden md:table-cell text-muted-foreground text-xs">
                            {e.deliveriesCount != null || e.offersCount != null
                              ? `${e.deliveriesCount ?? "?"}/${e.offersCount ?? "?"}`
                              : "—"}
                          </td>
                          <td className="py-2.5 text-right">{formatCurrency(e.grossEarnings)}</td>
                          <td className="py-2.5 text-right hidden md:table-cell text-muted-foreground text-xs">
                            {e.estimatedKm != null ? (
                              <span>
                                {e.estimatedKm.toFixed(1)} km<br />
                                <span className="text-orange-600">{formatCurrency(e.fuelEstimate)}</span>
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2.5 text-right font-medium text-primary">{formatCurrency(e.netIncome)}</td>
                          <td className="py-2.5 text-right hidden lg:table-cell text-xs">{fmtRate(netPerActiveHr)}</td>
                          <td className="py-2.5 text-right hidden lg:table-cell text-xs text-muted-foreground">{fmtRate(netPerDashHr)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                              {e.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            {isLinked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700" title={`Linked to income entry #${e.incomeEntryId}`}>
                                <Link2 className="h-3 w-3" /> Linked
                              </span>
                            ) : e.paymentStatus === "pending" ? (
                              <span className="text-xs text-muted-foreground">Pending</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not linked</span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {canLink && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Create income entry from this payout" disabled={isLinkingThis} onClick={() => handleLinkIncome(e)}>
                                  {isLinkingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRightCircle className="h-3 w-3" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-2xl flex flex-col max-h-[90dvh] p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
            <DialogTitle>{editingId != null ? "Edit Entry" : "Add Gig Entry"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* Section: Session */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Session</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input className="h-11" type="date" value={form.entryDate} onChange={sf("entryDate")} />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Person</Label>
                  {peopleLookup.length > 0 ? (
                    <Select value={form.person || "__none__"} onValueChange={v => setForm(p => ({ ...p, person: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Not set —</SelectItem>
                        {peopleLookup.filter(p => p.value !== "" && p.label !== "").map(p => <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="h-11" placeholder="e.g. Jess" value={form.person} onChange={sf("person")} />
                  )}
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={form.paymentStatus} onValueChange={(v) => setForm((p) => ({ ...p, paymentStatus: v }))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="fast-paid">Fast-Paid</SelectItem>
                      <SelectItem value="deposited">Deposited</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Time & Activity */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Time & Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input className="h-11" type="time" value={form.startTime} onChange={sf("startTime")} />
                </div>
                <div>
                  <Label>
                    End Time
                    {dashMinutesPreview != null && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">→ {dashMinutesPreview} min</span>
                    )}
                  </Label>
                  <Input className="h-11" type="time" value={form.endTime} onChange={sf("endTime")} />
                </div>
                <div>
                  <Label>Active Mins <span className="text-muted-foreground font-normal text-xs">(on deliveries)</span></Label>
                  <Input className="h-11" type="number" inputMode="numeric" min="0" placeholder="e.g. 45" value={form.activeMinutes} onChange={sf("activeMinutes")} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Deliveries</Label>
                    <Input className="h-11" type="number" inputMode="numeric" min="0" placeholder="0" value={form.deliveriesCount} onChange={sf("deliveriesCount")} />
                  </div>
                  <div>
                    <Label>Offers</Label>
                    <Input className="h-11" type="number" inputMode="numeric" min="0" placeholder="0" value={form.offersCount} onChange={sf("offersCount")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Earnings */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Earnings</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gross ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.grossEarnings} onChange={sf("grossEarnings")} />
                </div>
                <div>
                  <Label>Tips ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.tips} onChange={sf("tips")} />
                </div>
                <div>
                  <Label>FastPay ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.fastPayAmount} onChange={sf("fastPayAmount")} />
                </div>
                <div>
                  <Label>Weekly Deposit ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.weeklyDepositAmount} onChange={sf("weeklyDepositAmount")} />
                </div>
              </div>
            </div>

            {/* Section: Expenses & Net */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expenses & Net</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fees ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.fees} onChange={sf("fees")} />
                </div>
                <div>
                  <Label>Other Expenses ($)</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.otherExpenses} onChange={sf("otherExpenses")} />
                </div>
                <div className="col-span-2">
                  <Label>
                    Net Income ($)
                    <span className="ml-2 text-xs text-emerald-600 font-normal">auto</span>
                  </Label>
                  <Input
                    className="h-11 font-semibold text-primary"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={form.netIncome}
                    onChange={sf("netIncome")}
                  />
                </div>
              </div>
            </div>

            {/* Section: KM & Fuel */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                KM & Fuel
                <span className="ml-2 text-muted-foreground font-normal normal-case text-xs">
                  ({fuelSettings.pricePerL} $/L · {fuelSettings.l100km} L/100km)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Estimated KM</Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.001" min="0" placeholder="e.g. 12.5" value={form.estimatedKm} onChange={sf("estimatedKm")} />
                </div>
                <div>
                  <Label>
                    Fuel ($)
                    {form.estimatedKm && parseFloat(form.estimatedKm) > 0 && (
                      <span className="ml-1 text-xs text-orange-600 font-normal">auto</span>
                    )}
                  </Label>
                  <Input className="h-11" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.fuelEstimate} onChange={sf("fuelEstimate")} />
                </div>
                <div className="col-span-2">
                  <Label>Route Chain <span className="text-muted-foreground font-normal text-xs">(Stop A → Stop B → Stop C — KM auto-calc in Hub)</span></Label>
                  <Textarea
                    placeholder="e.g. Home -> KFC Elizabeth -> Woolworths Salisbury"
                    value={form.routeChain}
                    onChange={sf("routeChain")}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div>
              <Label>Notes</Label>
              <Input className="h-11" placeholder="Optional notes" value={form.notes} onChange={sf("notes")} />
            </div>

          </div>

          <DialogFooter className="px-4 py-3 border-t flex-shrink-0 gap-2">
            <Button variant="outline" className="h-11" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="h-11 flex-1 sm:flex-none" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fuel Settings Dialog */}
      <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fuel className="h-4 w-4" /> Fuel Settings
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Used to auto-calculate fuel cost from KM driven.
          </p>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label>Fuel Price ($/L)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1.75"
                value={fuelForm.pricePerL}
                onChange={(e) => setFuelForm((p) => ({ ...p, pricePerL: e.target.value }))}
              />
            </div>
            <div>
              <Label>Consumption (L/100km)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="12"
                value={fuelForm.l100km}
                onChange={(e) => setFuelForm((p) => ({ ...p, l100km: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuelDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFuelDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
