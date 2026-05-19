import { useState, useMemo } from "react";
import {
  useListScenarios,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
  useListBills,
  useListArrears,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GitBranch, Plus, Pencil, Trash2, CheckCircle, Circle,
  Truck, Clock, ShoppingCart, TrendingUp, BadgeCheck, AlertTriangle,
  ChevronRight, ChevronLeft, ArrowRight, Info, Save,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScenarioType =
  | "lower-doordash"
  | "delayed-bill"
  | "reduced-groceries"
  | "extra-arrears"
  | "repair-credit"
  | "pressure-week";

type BuilderStep = "pick" | "configure" | "results";

interface ScenarioResult {
  title: string;
  baselineIncome: number;
  baselineBills: number;
  baselineArrears: number;
  baselineSurplus: number;
  scenarioIncome: number;
  scenarioBills: number;
  scenarioArrears: number;
  scenarioSurplus: number;
  incomeChange: number;
  billsChange: number;
  arrearsChange: number;
  surplusChange: number;
  summary: string;
  impacts: string[];
  suggestedActions: string[];
  assumptions: {
    incomeAssumptions: string;
    billAssumptions: string;
    arrearsAssumptions: string;
    spendingChanges: string;
    notes: string;
  };
}

// ── Scenario type config ──────────────────────────────────────────────────────

const SCENARIO_TYPES: Array<{
  id: ScenarioType;
  icon: React.ElementType;
  title: string;
  prompt: string;
  description: string;
  iconBg: string;
}> = [
  {
    id: "lower-doordash",
    icon: Truck,
    title: "Lower DoorDash / Gig Week",
    prompt: "What if gig income is lower than usual this week?",
    description: "Model the impact of a quiet gig week on your weekly budget.",
    iconBg: "bg-orange-50 text-orange-600",
  },
  {
    id: "delayed-bill",
    icon: Clock,
    title: "Delay a Bill",
    prompt: "What if we defer a specific bill this week?",
    description: "See the short-term cash relief from deferring one bill.",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    id: "reduced-groceries",
    icon: ShoppingCart,
    title: "Cut Groceries / Spending",
    prompt: "What if we reduce grocery or incidental spending this week?",
    description: "Calculate the surplus improvement from spending less.",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "extra-arrears",
    icon: TrendingUp,
    title: "Extra Arrears Payment",
    prompt: "What if we pay extra toward a debt this week?",
    description: "See how an extra payment affects your balance and payoff timeline.",
    iconBg: "bg-purple-50 text-purple-600",
  },
  {
    id: "repair-credit",
    icon: BadgeCheck,
    title: "Credit or Rebate Accepted",
    prompt: "What if a repair credit or utility rebate comes through?",
    description: "Model a one-off credit or refund and its cash impact.",
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    id: "pressure-week",
    icon: AlertTriangle,
    title: "Pressure Week",
    prompt: "What if rent and multiple bills fall in the same week?",
    description: "Map your worst-case outgoings against income to spot shortfalls.",
    iconBg: "bg-rose-50 text-rose-600",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + Math.abs(n).toFixed(2);
}

function fmtSigned(n: number) {
  if (n === 0) return "$0.00";
  return (n > 0 ? "+" : "−") + "$" + Math.abs(n).toFixed(2);
}

function toWeekly(amount: number, freq: string): number {
  switch (freq) {
    case "weekly":      return amount;
    case "fortnightly": return amount / 2;
    case "monthly":     return (amount * 12) / 52;
    case "quarterly":   return (amount * 4) / 52;
    case "annually":    return amount / 52;
    default:            return 0;
  }
}

// ── Calculation engine ────────────────────────────────────────────────────────

function calcLowerDoorDash(
  params: { typicalWeekly: number; thisWeekAmount: number },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number }
): ScenarioResult {
  const delta = params.thisWeekAmount - params.typicalWeekly;
  const newIncome = base.weeklyIncome + delta;
  const newSurplus = base.weeklySurplus + delta;

  const short = newSurplus < 0;
  const impacts: string[] = [];
  if (delta < -50) impacts.push(`Weekly income drops by ${fmt(-delta)} — this puts pressure on all outgoings.`);
  if (short) impacts.push(`Surplus is negative (${fmt(newSurplus)} shortfall) — some outgoing must be deferred or reduced.`);
  if (!short && newSurplus < 50) impacts.push("Very little buffer remaining — avoid any non-essential spending this week.");
  if (!short && newSurplus >= 50) impacts.push(`A surplus of ${fmt(newSurplus)} is still achievable — rent and essential bills can be covered.`);

  const actions: string[] = ["Prioritise rent / landlord payment before any other spend."];
  if (short) {
    actions.push("Review bills due this week — defer any that allow it.");
    actions.push("Keep grocery spend to survival level (Aldi, no luxuries).");
    actions.push("Update the Weekly Tracker with the lower actual income once received.");
  } else {
    actions.push("Cover all essential bills. Hold non-essential spending.");
    actions.push("Log actual DoorDash earnings in Extra Work Income as shifts complete.");
  }

  return {
    title: `Lower DoorDash — ${fmt(params.thisWeekAmount)} this week`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: newIncome,
    scenarioBills: base.weeklyBills,
    scenarioArrears: base.weeklyArrears,
    scenarioSurplus: newSurplus,
    incomeChange: delta,
    billsChange: 0,
    arrearsChange: 0,
    surplusChange: delta,
    summary: `If gig income is ${fmt(params.thisWeekAmount)} this week instead of the usual ${fmt(params.typicalWeekly)}, your weekly surplus ${newSurplus >= base.weeklySurplus ? "improves" : "drops"} to ${fmt(newSurplus)}${newSurplus < 0 ? " — a shortfall that needs covering" : ""}.`,
    impacts,
    suggestedActions: actions,
    assumptions: {
      incomeAssumptions: `DoorDash earnings reduced to ${fmt(params.thisWeekAmount)}/week (normal: ${fmt(params.typicalWeekly)}/week).`,
      billAssumptions: "No change to bills.",
      arrearsAssumptions: "No change to arrears payments.",
      spendingChanges: "Hold non-essential spending.",
      notes: `Weekly income delta: ${fmtSigned(delta)}.`,
    },
  };
}

function calcDelayedBill(
  params: { billId: number },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number },
  bills: any[]
): ScenarioResult {
  const bill = bills.find(b => b.id === params.billId);
  if (!bill) return null as any;

  const relief = bill.weeklyEquivalent;
  const newBills = base.weeklyBills - relief;
  const newSurplus = base.weeklySurplus + relief;

  return {
    title: `Defer ${bill.provider} this week`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: base.weeklyIncome,
    scenarioBills: newBills,
    scenarioArrears: base.weeklyArrears,
    scenarioSurplus: newSurplus,
    incomeChange: 0,
    billsChange: -relief,
    arrearsChange: 0,
    surplusChange: relief,
    summary: `Deferring ${bill.provider} (${fmt(bill.weeklyEquivalent)}/week equivalent) frees up cash this week, lifting your surplus to ${fmt(newSurplus)}. Important: this bill still needs to be paid — it will fall due again.`,
    impacts: [
      `Short-term relief of ${fmt(relief)} this week.`,
      `${bill.provider} will still need paying — budget for it next week or arrange a deferral with the provider.`,
      bill.autopay ? "⚠️ This bill is on autopay — contact the provider before assuming it can be deferred." : "",
    ].filter(Boolean),
    suggestedActions: [
      `Contact ${bill.provider} to request a short deferral or payment plan.`,
      "Create a task: 'Confirm deferral of " + bill.provider + " — follow up by [date]'.",
      "Update the Weekly Tracker to reflect actual bills paid this week.",
    ],
    assumptions: {
      incomeAssumptions: "No change to income.",
      billAssumptions: `${bill.provider} deferred this week (${fmt(bill.amount)} actual / ${fmt(relief)}/week equivalent).`,
      arrearsAssumptions: "No change to arrears payments.",
      spendingChanges: "No change to other spending.",
      notes: `Weekly bills relief: ${fmtSigned(relief)}. Bill must still be paid.`,
    },
  };
}

function calcReducedGroceries(
  params: { currentWeekly: number; targetWeekly: number },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number }
): ScenarioResult {
  const saving = params.currentWeekly - params.targetWeekly;
  const newSurplus = base.weeklySurplus + saving;

  return {
    title: `Cut spending to ${fmt(params.targetWeekly)}/week`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: base.weeklyIncome,
    scenarioBills: base.weeklyBills + params.targetWeekly - params.currentWeekly,
    scenarioArrears: base.weeklyArrears,
    scenarioSurplus: newSurplus,
    incomeChange: 0,
    billsChange: -saving,
    arrearsChange: 0,
    surplusChange: saving,
    summary: `Cutting grocery and incidental spending from ${fmt(params.currentWeekly)} to ${fmt(params.targetWeekly)} saves ${fmt(saving)} this week, improving your surplus to ${fmt(newSurplus)}.`,
    impacts: [
      `Saving of ${fmt(saving)} this week from reduced grocery/incidental spend.`,
      saving >= 50 ? "A meaningful improvement — enough to cover a small bill or add to the emergency buffer." : "A modest improvement — every dollar helps.",
      "Aldi + meal planning is the most practical way to hit this target.",
    ],
    suggestedActions: [
      "Shop at Aldi for groceries this week. Avoid Woolworths premium items.",
      "Plan meals in advance — reduce takeaways and impulse purchases.",
      `Set a cash/card limit of ${fmt(params.targetWeekly)} for groceries before shopping.`,
      "Log actual grocery spend in the Weekly Tracker.",
    ],
    assumptions: {
      incomeAssumptions: "No change to income.",
      billAssumptions: "No change to fixed bills.",
      arrearsAssumptions: "No change to arrears payments.",
      spendingChanges: `Grocery/incidental spend reduced from ${fmt(params.currentWeekly)} to ${fmt(params.targetWeekly)}/week (saving ${fmt(saving)}).`,
      notes: "",
    },
  };
}

function calcExtraArrears(
  params: { arrearsId: number; extraAmount: number },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number },
  arrears: any[]
): ScenarioResult {
  const item = arrears.find(a => a.id === params.arrearsId);
  if (!item) return null as any;

  const weeklyExtra = params.extraAmount;
  const newArrears = base.weeklyArrears + weeklyExtra;
  const newSurplus = base.weeklySurplus - weeklyExtra;

  const currentWeeklyPayment = toWeekly(item.arrearsPayment, item.arrearsFrequency);
  const newWeeklyPayment = currentWeeklyPayment + weeklyExtra;
  const weeksToClear = newWeeklyPayment > 0 ? Math.ceil(item.balance / newWeeklyPayment) : null;
  const currentWeeksToClear = currentWeeklyPayment > 0 ? Math.ceil(item.balance / currentWeeklyPayment) : null;

  return {
    title: `Extra ${fmt(weeklyExtra)}/week to ${item.creditor}`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: base.weeklyIncome,
    scenarioBills: base.weeklyBills,
    scenarioArrears: newArrears,
    scenarioSurplus: newSurplus,
    incomeChange: 0,
    billsChange: 0,
    arrearsChange: weeklyExtra,
    surplusChange: -weeklyExtra,
    summary: `Paying an extra ${fmt(weeklyExtra)}/week to ${item.creditor} reduces your surplus to ${fmt(newSurplus)} but accelerates your payoff${weeksToClear ? ` — clearing the balance in approximately ${weeksToClear} weeks` : ""}.`,
    impacts: [
      `Weekly surplus reduces by ${fmt(weeklyExtra)}.`,
      currentWeeksToClear && weeksToClear
        ? `Payoff timeline: ${currentWeeksToClear} weeks → ${weeksToClear} weeks (${currentWeeksToClear - weeksToClear} weeks faster).`
        : `Current balance: $${item.balance.toFixed(2)}.`,
      newSurplus < 0 ? "⚠️ This leaves a negative surplus — ensure other essentials are still covered." : "Surplus remains positive — this is sustainable if income holds.",
    ],
    suggestedActions: [
      `Contact ${item.creditor} to confirm the extra payment arrangement.`,
      `Create a task: 'Confirm extra payment arrangement with ${item.creditor}'.`,
      "Log the extra payment in Arrears once made.",
      "Review weekly after the first month to confirm the arrangement is sustainable.",
    ],
    assumptions: {
      incomeAssumptions: "No change to income.",
      billAssumptions: "No change to fixed bills.",
      arrearsAssumptions: `Extra ${fmt(weeklyExtra)}/week to ${item.creditor} (total: ${fmt(newWeeklyPayment)}/week). Balance: $${item.balance.toFixed(2)}.`,
      spendingChanges: "No change to other spending.",
      notes: weeksToClear ? `Approx weeks to clear: ${weeksToClear}.` : "",
    },
  };
}

function calcRepairCredit(
  params: { creditor: string; amount: number },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number }
): ScenarioResult {
  const newIncome = base.weeklyIncome + params.amount;
  const newSurplus = base.weeklySurplus + params.amount;

  return {
    title: `${fmt(params.amount)} credit from ${params.creditor}`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: newIncome,
    scenarioBills: base.weeklyBills,
    scenarioArrears: base.weeklyArrears,
    scenarioSurplus: newSurplus,
    incomeChange: params.amount,
    billsChange: 0,
    arrearsChange: 0,
    surplusChange: params.amount,
    summary: `A one-off credit of ${fmt(params.amount)} from ${params.creditor} boosts your available cash to ${fmt(newSurplus)} surplus this week. This is a one-time event — do not rely on it recurring.`,
    impacts: [
      `One-off cash boost of ${fmt(params.amount)}.`,
      "This does not change your ongoing weekly income — surplus returns to normal next week.",
      params.amount >= 200 ? "Meaningful one-off relief — consider using it toward arrears or emergency buffer." : "Modest relief — apply it toward the highest-priority bill or arrears.",
    ],
    suggestedActions: [
      `Confirm the credit has been applied to your ${params.creditor} account in writing.`,
      `Create a task: 'Confirm ${params.creditor} credit applied — check account statement'.`,
      "Decide now how to allocate the credit: arrears payment, emergency buffer, or bill payment.",
      "Do not spend it on non-essentials until essentials are confirmed covered.",
    ],
    assumptions: {
      incomeAssumptions: `One-off credit of ${fmt(params.amount)} from ${params.creditor} received this week.`,
      billAssumptions: "No change to bills.",
      arrearsAssumptions: "No change to arrears payments.",
      spendingChanges: "No change to spending.",
      notes: "One-time event. Does not affect ongoing weekly income.",
    },
  };
}

function calcPressureWeek(
  params: { selectedBillIds: number[] },
  base: { weeklyIncome: number; weeklyBills: number; weeklyArrears: number; weeklySurplus: number },
  bills: any[]
): ScenarioResult {
  const selectedBills = bills.filter(b => params.selectedBillIds.includes(b.id));
  const totalBillsThisWeek = selectedBills.reduce((sum, b) => sum + b.amount, 0);
  const totalOut = totalBillsThisWeek + base.weeklyArrears;
  const scenarioSurplus = base.weeklyIncome - totalOut;
  const billsChange = totalBillsThisWeek - base.weeklyBills;

  return {
    title: `Pressure week — ${selectedBills.length} bills due`,
    baselineIncome: base.weeklyIncome,
    baselineBills: base.weeklyBills,
    baselineArrears: base.weeklyArrears,
    baselineSurplus: base.weeklySurplus,
    scenarioIncome: base.weeklyIncome,
    scenarioBills: totalBillsThisWeek,
    scenarioArrears: base.weeklyArrears,
    scenarioSurplus: scenarioSurplus,
    incomeChange: 0,
    billsChange: billsChange,
    arrearsChange: 0,
    surplusChange: scenarioSurplus - base.weeklySurplus,
    summary: `With ${selectedBills.map(b => b.provider).join(", ")} all due this week, total outgoings reach ${fmt(totalOut)}. ${scenarioSurplus >= 0 ? `A surplus of ${fmt(scenarioSurplus)} remains — tight but manageable.` : `There is a shortfall of ${fmt(-scenarioSurplus)} — some bills must be deferred or income boosted.`}`,
    impacts: [
      `Total bills due this week: ${fmt(totalBillsThisWeek)} (${selectedBills.map(b => b.provider).join(", ")}).`,
      scenarioSurplus < 0
        ? `Shortfall of ${fmt(-scenarioSurplus)} — at least one bill needs deferring or extra income is needed.`
        : `Surplus of ${fmt(scenarioSurplus)} after all bills and arrears — covered, but tight.`,
      "Rent / landlord must be paid first regardless.",
    ],
    suggestedActions: [
      "Pay rent and arrears commitments first — protect the plan.",
      scenarioSurplus < 0
        ? `Identify which bill(s) can be deferred: consider the lowest-risk deferral first.`
        : "Confirm each bill payment once made — mark in the app.",
      "Reduce grocery and incidental spend to minimum this week.",
      "Do not make any non-essential purchases until all bills are confirmed covered.",
      "Update the Weekly Tracker with actual amounts once all payments are made.",
    ],
    assumptions: {
      incomeAssumptions: "No change to income.",
      billAssumptions: `All of the following fall due this week: ${selectedBills.map(b => `${b.provider} (${fmt(b.amount)})`).join(", ")}.`,
      arrearsAssumptions: "Normal arrears payments continue.",
      spendingChanges: "Reduce grocery/incidental spend to minimum.",
      notes: `Total bills due: ${fmt(totalBillsThisWeek)}. Total out: ${fmt(totalOut)}.`,
    },
  };
}

// ── Saved scenario config ─────────────────────────────────────────────────────

const LABEL_COLORS: Record<string, string> = {
  base: "bg-blue-100 text-blue-700",
  "best-case": "bg-green-100 text-green-700",
  "worst-case": "bg-red-100 text-red-700",
  "minimum-survival": "bg-amber-100 text-amber-700",
  "catch-up": "bg-purple-100 text-purple-700",
  custom: "bg-slate-100 text-slate-600",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Scenarios() {
  const { data: scenarios = [], isLoading, refetch } = useListScenarios();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const deleteMutation = useDeleteScenario();
  const { toast } = useToast();

  // Live data for calculations
  const { data: dashboard } = useGetDashboardSummary();
  const { data: bills = [] } = useListBills();
  const { data: arrears = [] } = useListArrears();

  // Builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState<BuilderStep>("pick");
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);
  const [builderParams, setBuilderParams] = useState<any>({});
  const [builderResult, setBuilderResult] = useState<ScenarioResult | null>(null);

  // Saved scenario edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  function openBuilder() {
    setBuilderStep("pick");
    setSelectedType(null);
    setBuilderParams({});
    setBuilderResult(null);
    setBuilderOpen(true);
  }

  function pickType(type: ScenarioType) {
    setSelectedType(type);
    // Pre-fill sensible defaults
    const base = dashboard ?? { weeklyIncome: 0, weeklyBills: 0, weeklyArrears: 0, weeklySurplus: 0, weeklyGigIncome: 0 };
    if (type === "lower-doordash") {
      setBuilderParams({ typicalWeekly: Number(base.weeklyGigIncome?.toFixed(2) ?? 0), thisWeekAmount: "" });
    } else if (type === "delayed-bill") {
      setBuilderParams({ billId: bills[0]?.id ?? "" });
    } else if (type === "reduced-groceries") {
      setBuilderParams({ currentWeekly: "", targetWeekly: "" });
    } else if (type === "extra-arrears") {
      setBuilderParams({ arrearsId: arrears[0]?.id ?? "", extraAmount: "" });
    } else if (type === "repair-credit") {
      setBuilderParams({ creditor: "", amount: "" });
    } else if (type === "pressure-week") {
      setBuilderParams({ selectedBillIds: [] });
    }
    setBuilderStep("configure");
  }

  function runCalculation() {
    if (!dashboard || !selectedType) return;
    const base = {
      weeklyIncome: dashboard.weeklyIncome,
      weeklyBills: dashboard.weeklyBills,
      weeklyArrears: dashboard.weeklyArrears,
      weeklySurplus: dashboard.weeklySurplus,
    };

    let result: ScenarioResult | null = null;
    try {
      if (selectedType === "lower-doordash") {
        result = calcLowerDoorDash(
          { typicalWeekly: Number(builderParams.typicalWeekly), thisWeekAmount: Number(builderParams.thisWeekAmount) },
          base
        );
      } else if (selectedType === "delayed-bill") {
        result = calcDelayedBill({ billId: Number(builderParams.billId) }, base, bills as any[]);
      } else if (selectedType === "reduced-groceries") {
        result = calcReducedGroceries(
          { currentWeekly: Number(builderParams.currentWeekly), targetWeekly: Number(builderParams.targetWeekly) },
          base
        );
      } else if (selectedType === "extra-arrears") {
        result = calcExtraArrears(
          { arrearsId: Number(builderParams.arrearsId), extraAmount: Number(builderParams.extraAmount) },
          base,
          arrears as any[]
        );
      } else if (selectedType === "repair-credit") {
        result = calcRepairCredit(
          { creditor: builderParams.creditor, amount: Number(builderParams.amount) },
          base
        );
      } else if (selectedType === "pressure-week") {
        result = calcPressureWeek(
          { selectedBillIds: builderParams.selectedBillIds as number[] },
          base,
          bills as any[]
        );
      }
    } catch {
      toast({ title: "Calculation error", variant: "destructive" });
      return;
    }
    if (result) {
      setBuilderResult(result);
      setBuilderStep("results");
    }
  }

  async function saveAsScenario() {
    if (!builderResult) return;
    try {
      await createMutation.mutateAsync({
        data: {
          name: builderResult.title,
          label: "custom",
          status: "draft",
          startDate: null,
          endDate: null,
          incomeAssumptions: builderResult.assumptions.incomeAssumptions || null,
          billAssumptions: builderResult.assumptions.billAssumptions || null,
          arrearsAssumptions: builderResult.assumptions.arrearsAssumptions || null,
          spendingChanges: builderResult.assumptions.spendingChanges || null,
          notes: builderResult.assumptions.notes || null,
        },
      });
      toast({ title: "Scenario saved" });
      refetch();
      setBuilderOpen(false);
    } catch {
      toast({ title: "Error saving scenario", variant: "destructive" });
    }
  }

  function openEdit(s: any) {
    setEditForm({
      name: s.name,
      label: s.label,
      status: s.status,
      startDate: s.startDate ?? "",
      endDate: s.endDate ?? "",
      incomeAssumptions: s.incomeAssumptions ?? "",
      billAssumptions: s.billAssumptions ?? "",
      arrearsAssumptions: s.arrearsAssumptions ?? "",
      spendingChanges: s.spendingChanges ?? "",
      notes: s.notes ?? "",
    });
    setEditingId(s.id);
    setEditOpen(true);
  }

  async function handleEditSave() {
    if (!editForm.name?.trim() || editingId == null) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name: editForm.name,
          label: editForm.label,
          status: editForm.status,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          incomeAssumptions: editForm.incomeAssumptions || null,
          billAssumptions: editForm.billAssumptions || null,
          arrearsAssumptions: editForm.arrearsAssumptions || null,
          spendingChanges: editForm.spendingChanges || null,
          notes: editForm.notes || null,
        },
      });
      toast({ title: "Scenario updated" });
      setEditOpen(false);
      refetch();
    } catch {
      toast({ title: "Error saving", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this scenario?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Scenario deleted" });
      refetch();
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  }

  const active = scenarios.filter(s => s.status === "active");
  const drafts = scenarios.filter(s => s.status === "draft");
  const archived = scenarios.filter(s => s.status === "archived");

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GitBranch className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-serif font-bold tracking-tight">Scenarios</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Model household what-if situations before committing. No live data is changed until you explicitly apply a scenario.
          </p>
        </div>
        <Button onClick={openBuilder} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Run What-If
        </Button>
      </div>

      {/* Quick What-If prompt cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick What-If Builder</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIO_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => { setBuilderOpen(true); setBuilderStep("configure"); setSelectedType(type.id); setBuilderResult(null); pickType(type.id); }}
                className="text-left p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3 ${type.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{type.title}</p>
                <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                  {type.prompt}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Saved scenarios */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Saved Scenarios ({scenarios.length})
        </h2>
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-4">Loading…</p>
        ) : scenarios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No saved scenarios yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Run a what-if and save the result to keep a record.</p>
              <Button onClick={openBuilder} size="sm" variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Run a What-If
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {[
              { label: "Active",   items: active },
              { label: "Drafts",   items: drafts },
              { label: "Archived", items: archived },
            ]
              .filter(g => g.items.length > 0)
              .map(group => (
                <div key={group.label}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {group.items.map(s => (
                      <Card key={s.id} className={s.status === "archived" ? "opacity-60" : ""}>
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {s.status === "active"
                                ? <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                                : <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              }
                              <CardTitle className="text-sm leading-snug">{s.name}</CardTitle>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${LABEL_COLORS[s.label] ?? "bg-slate-100 text-slate-600"}`}>
                              {s.label}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 space-y-2">
                          {s.startDate && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(s.startDate)}{s.endDate ? ` → ${formatDate(s.endDate)}` : ""}
                            </p>
                          )}
                          {s.incomeAssumptions && <p className="text-xs"><span className="font-medium">Income: </span>{s.incomeAssumptions}</p>}
                          {s.billAssumptions && <p className="text-xs"><span className="font-medium">Bills: </span>{s.billAssumptions}</p>}
                          {s.arrearsAssumptions && <p className="text-xs"><span className="font-medium">Arrears: </span>{s.arrearsAssumptions}</p>}
                          {s.spendingChanges && <p className="text-xs"><span className="font-medium">Spending: </span>{s.spendingChanges}</p>}
                          {s.notes && <p className="text-xs text-muted-foreground italic">{s.notes}</p>}
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
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Builder wizard dialog */}
      <ScenarioBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        step={builderStep}
        selectedType={selectedType}
        params={builderParams}
        setParams={setBuilderParams}
        result={builderResult}
        bills={bills as any[]}
        arrears={arrears as any[]}
        dashboard={dashboard as any}
        onPickType={pickType}
        onBack={() => setBuilderStep(builderStep === "results" ? "configure" : "pick")}
        onRun={runCalculation}
        onSave={saveAsScenario}
        isSaving={createMutation.isPending}
      />

      {/* Edit saved scenario dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Label</Label>
                <Select value={editForm.label ?? "custom"} onValueChange={v => setEditForm((p: any) => ({ ...p, label: v }))}>
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
                <Select value={editForm.status ?? "draft"} onValueChange={v => setEditForm((p: any) => ({ ...p, status: v }))}>
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
              <div><Label>Start Date</Label><Input type="date" value={editForm.startDate ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, startDate: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" value={editForm.endDate ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div><Label>Income Assumptions</Label><Textarea rows={2} value={editForm.incomeAssumptions ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, incomeAssumptions: e.target.value }))} /></div>
            <div><Label>Bill Assumptions</Label><Textarea rows={2} value={editForm.billAssumptions ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, billAssumptions: e.target.value }))} /></div>
            <div><Label>Arrears Assumptions</Label><Textarea rows={2} value={editForm.arrearsAssumptions ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, arrearsAssumptions: e.target.value }))} /></div>
            <div><Label>Spending Changes</Label><Textarea rows={2} value={editForm.spendingChanges ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, spendingChanges: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={editForm.notes ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Builder wizard dialog ─────────────────────────────────────────────────────

function ScenarioBuilderDialog({
  open, onOpenChange, step, selectedType, params, setParams,
  result, bills, arrears, dashboard, onPickType, onBack, onRun, onSave, isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  step: BuilderStep;
  selectedType: ScenarioType | null;
  params: any;
  setParams: (v: any) => void;
  result: ScenarioResult | null;
  bills: any[];
  arrears: any[];
  dashboard: any;
  onPickType: (t: ScenarioType) => void;
  onBack: () => void;
  onRun: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const typeConfig = SCENARIO_TYPES.find(t => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {step === "pick" && "What would you like to model?"}
            {step === "configure" && (typeConfig?.prompt ?? "Configure scenario")}
            {step === "results" && "Scenario result"}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Pick type */}
        {step === "pick" && (
          <div className="grid sm:grid-cols-2 gap-2 py-2">
            {SCENARIO_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => onPickType(type.id)}
                  className={`text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all group flex items-start gap-3`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${type.iconBg}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{type.title}</p>
                    <p className="text-xs text-foreground mt-0.5 leading-snug">{type.prompt}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && (
          <div className="py-2 space-y-4">
            <BuilderConfigForm
              type={selectedType!}
              params={params}
              setParams={setParams}
              bills={bills}
              arrears={arrears}
              dashboard={dashboard}
            />
            <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 border">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              This calculation uses your current household data as the baseline. No live data is changed.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button onClick={onRun}>Calculate <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && result && (
          <div className="py-2 space-y-4">
            {/* Comparison table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-3 text-xs font-semibold bg-muted/60 px-3 py-2 border-b">
                <span>Category</span>
                <span className="text-center">Baseline</span>
                <span className="text-center">This Scenario</span>
              </div>
              {[
                { label: "Weekly income", base: result.baselineIncome, after: result.scenarioIncome, change: result.incomeChange, higherIsBetter: true },
                { label: "Weekly bills",  base: result.baselineBills,  after: result.scenarioBills,  change: result.billsChange,   higherIsBetter: false },
                { label: "Weekly arrears",base: result.baselineArrears,after: result.scenarioArrears,change: result.arrearsChange, higherIsBetter: false },
              ].map(row => (
                <div key={row.label} className="grid grid-cols-3 px-3 py-2 text-xs border-b last:border-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-center">{fmt(row.base)}</span>
                  <span className={`text-center font-medium ${
                    row.change === 0 ? "" :
                    (row.higherIsBetter ? row.change > 0 : row.change < 0)
                      ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {fmt(row.after)}
                    {row.change !== 0 && (
                      <span className="ml-1 text-[10px] opacity-80">({fmtSigned(row.change)})</span>
                    )}
                  </span>
                </div>
              ))}
              <div className={`grid grid-cols-3 px-3 py-2.5 text-sm font-semibold border-t ${result.scenarioSurplus >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                <span>Weekly surplus</span>
                <span className="text-center text-muted-foreground text-xs font-normal">{fmt(result.baselineSurplus)}</span>
                <span className={`text-center ${result.scenarioSurplus >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {fmt(result.scenarioSurplus)}
                  {result.surplusChange !== 0 && (
                    <span className="ml-1 text-xs font-normal opacity-80">({fmtSigned(result.surplusChange)})</span>
                  )}
                </span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>

            {/* Impacts */}
            {result.impacts.length > 0 && (
              <div className="space-y-1">
                {result.impacts.map((impact, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>{impact}
                  </p>
                ))}
              </div>
            )}

            {/* Suggested actions */}
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-1.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Suggested next steps</p>
              {result.suggestedActions.map((action, i) => (
                <p key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="flex-shrink-0 font-semibold text-primary">{i + 1}.</span>
                  {action}
                </p>
              ))}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded p-2">
              <Info className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
              This is a what-if calculation only. No live budget data has been changed.
            </p>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button variant="outline" onClick={onSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1.5" />
                {isSaving ? "Saving…" : "Save this scenario"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Builder config form (per scenario type) ───────────────────────────────────

function BuilderConfigForm({ type, params, setParams, bills, arrears, dashboard }: {
  type: ScenarioType;
  params: any;
  setParams: (v: any) => void;
  bills: any[];
  arrears: any[];
  dashboard: any;
}) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setParams({ ...params, [key]: e.target.value });

  if (type === "lower-doordash") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Typical weekly DoorDash / gig income</Label>
          <Input type="number" min="0" step="0.01"
            value={params.typicalWeekly}
            onChange={set("typicalWeekly")}
            placeholder="e.g. 700.00"
          />
          {dashboard?.weeklyGigIncome > 0 && (
            <p className="text-xs text-muted-foreground">Based on your income data: {fmt(dashboard.weeklyGigIncome)}/week</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Expected earnings this week</Label>
          <Input type="number" min="0" step="0.01"
            value={params.thisWeekAmount}
            onChange={set("thisWeekAmount")}
            placeholder="e.g. 400.00"
          />
        </div>
      </div>
    );
  }

  if (type === "delayed-bill") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Which bill would you defer?</Label>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills found — add bills in Income & Bills first.</p>
          ) : (
            <Select value={String(params.billId)} onValueChange={v => setParams({ ...params, billId: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bills.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.provider} — {fmt(b.amount)} ({b.frequency}) · {fmt(b.weeklyEquivalent)}/wk
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }

  if (type === "reduced-groceries") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Current weekly grocery / incidental spend ($)</Label>
          <Input type="number" min="0" step="0.01"
            value={params.currentWeekly}
            onChange={set("currentWeekly")}
            placeholder="e.g. 200.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Target spend this week ($)</Label>
          <Input type="number" min="0" step="0.01"
            value={params.targetWeekly}
            onChange={set("targetWeekly")}
            placeholder="e.g. 130.00"
          />
        </div>
      </div>
    );
  }

  if (type === "extra-arrears") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Which arrears item?</Label>
          {arrears.length === 0 ? (
            <p className="text-sm text-muted-foreground">No arrears found — add records in Arrears first.</p>
          ) : (
            <Select value={String(params.arrearsId)} onValueChange={v => setParams({ ...params, arrearsId: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {arrears.map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.creditor} — balance ${a.balance?.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Extra weekly payment amount ($)</Label>
          <Input type="number" min="0" step="0.01"
            value={params.extraAmount}
            onChange={set("extraAmount")}
            placeholder="e.g. 50.00"
          />
        </div>
      </div>
    );
  }

  if (type === "repair-credit") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Creditor / provider name</Label>
          <Input
            value={params.creditor}
            onChange={e => setParams({ ...params, creditor: e.target.value })}
            placeholder="e.g. SA Water, Energy Australia"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Credit amount ($)</Label>
          <Input type="number" min="0" step="0.01"
            value={params.amount}
            onChange={set("amount")}
            placeholder="e.g. 150.00"
          />
        </div>
      </div>
    );
  }

  if (type === "pressure-week") {
    return (
      <div className="space-y-3">
        <Label>Which bills fall due this week? (select all that apply)</Label>
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bills found — add bills in Income & Bills first.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bills.map(b => {
              const checked = (params.selectedBillIds ?? []).includes(b.id);
              return (
                <label key={b.id} className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const ids: number[] = params.selectedBillIds ?? [];
                      setParams({
                        ...params,
                        selectedBillIds: checked ? ids.filter(id => id !== b.id) : [...ids, b.id],
                      });
                    }}
                    className="rounded"
                  />
                  <span className="flex-1 text-sm">{b.provider}</span>
                  <span className="text-sm font-medium">{fmt(b.amount)}</span>
                  <span className="text-xs text-muted-foreground">({b.frequency})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
