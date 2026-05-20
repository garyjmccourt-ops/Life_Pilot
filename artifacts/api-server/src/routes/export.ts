import { Router, type IRouter } from "express";
import {
  db,
  incomeSourcesTable,
  incomeEntriesTable,
  billsTable,
  arrearsItemsTable,
  tasksTable,
  commsEntriesTable,
  weeklyEntriesTable,
  gigEntriesTable,
  budgetCategoriesTable,
  scenariosTable,
  shoppingItemsTable,
  shoppingListsTable,
  shoppingListItemsTable,
} from "@workspace/db";
import { n } from "../lib/calc";

const router: IRouter = Router();

// ── helpers ────────────────────────────────────────────────────────────
function csvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields
    .map((f) => {
      if (f == null) return "";
      const s = String(f);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [csvRow(headers), ...rows.map(csvRow)].join("\n");
}

// ── full JSON export (existing, updated) ──────────────────────────────
const SCHEMA_DOC = {
  description:
    "MYOH – Manage Your Own Household export. Share this whole JSON with an LLM (e.g. ChatGPT/Claude) and ask it to help you clean, restructure or expand the `data` section. Then paste corrected entries back into the app one section at a time. Field rules below are authoritative — values outside the listed enums will be rejected on import.",
  enums: {
    frequency: ["weekly", "fortnightly", "monthly", "quarterly", "annual", "one-off"],
    arrearsCategory: ["rent", "utility", "council", "fine", "child-support", "personal-debt", "tax", "other"],
    riskLevel: ["low", "medium", "high"],
    arrearsStatus: ["active", "negotiating", "paused", "completed"],
    taskBucket: ["pay", "contact", "file", "review", "negotiate", "watch"],
    taskStatus: ["open", "in-progress", "waiting", "blocked", "awaiting-reply", "deferred", "cancelled", "done"],
    priority: ["critical", "p1", "p2", "p3"],
    commsChannel: ["phone", "email", "letter", "portal", "in-person", "sms"],
    gigPlatform: ["doordash", "uber", "airtasker", "cash", "other"],
    gigPaymentStatus: ["pending", "fast-paid", "deposited", "received"],
  },
};

router.get("/export", async (_req, res): Promise<void> => {
  const [income, incomeEntries, bills, arrears, tasks, comms, weeks, gig, budget, scenarios, shoppingItems, shoppingLists, shoppingListItems] =
    await Promise.all([
      db.select().from(incomeSourcesTable).orderBy(incomeSourcesTable.id),
      db.select().from(incomeEntriesTable).orderBy(incomeEntriesTable.id),
      db.select().from(billsTable).orderBy(billsTable.id),
      db.select().from(arrearsItemsTable).orderBy(arrearsItemsTable.id),
      db.select().from(tasksTable).orderBy(tasksTable.id),
      db.select().from(commsEntriesTable).orderBy(commsEntriesTable.id),
      db.select().from(weeklyEntriesTable).orderBy(weeklyEntriesTable.weekStart),
      db.select().from(gigEntriesTable).orderBy(gigEntriesTable.entryDate),
      db.select().from(budgetCategoriesTable).orderBy(budgetCategoriesTable.id),
      db.select().from(scenariosTable).orderBy(scenariosTable.id),
      db.select().from(shoppingItemsTable).orderBy(shoppingItemsTable.id),
      db.select().from(shoppingListsTable).orderBy(shoppingListsTable.id),
      db.select().from(shoppingListItemsTable).orderBy(shoppingListItemsTable.id),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schema: SCHEMA_DOC,
    data: {
      incomeSources: income.map((r) => ({ id: r.id, name: r.name, amount: n(r.amount), frequency: r.frequency, notes: r.notes })),
      incomeEntries: incomeEntries.map((r) => ({
        id: r.id, dateReceived: r.dateReceived, incomeSourceId: r.incomeSourceId, sourceName: r.sourceName,
        person: r.person, grossAmount: n(r.grossAmount), netAmount: n(r.netAmount), paymentMethod: r.paymentMethod,
        tags: r.tags, notes: r.notes, allocated: r.allocated, gigEntryId: r.gigEntryId,
      })),
      bills: bills.map((r) => ({
        id: r.id, provider: r.provider, category: r.category, amount: n(r.amount), frequency: r.frequency,
        dueDay: r.dueDay, dueDate: r.dueDate ?? null, accountRef: r.accountRef, autopay: r.autopay, notes: r.notes,
      })),
      arrearsItems: arrears.map((r) => ({
        id: r.id, creditor: r.creditor, category: r.category, balance: n(r.balance),
        ongoingCharge: n(r.ongoingCharge), ongoingFrequency: r.ongoingFrequency,
        arrearsPayment: n(r.arrearsPayment), arrearsFrequency: r.arrearsFrequency,
        riskLevel: r.riskLevel, status: r.status, nextReviewDate: r.nextReviewDate, accountRef: r.accountRef,
        summary: r.summary, objective: r.objective, workingPlan: r.workingPlan,
        communicationPosition: r.communicationPosition, externalAcknowledgement: r.externalAcknowledgement,
        externalPaymentIntent: r.externalPaymentIntent, externalStagedReduction: r.externalStagedReduction,
        externalReviewPoints: r.externalReviewPoints, externalChannel: r.externalChannel, evidenceLinks: r.evidenceLinks,
      })),
      tasks: tasks.map((r) => ({
        id: r.id, title: r.title, description: r.description, category: r.category, bucket: r.bucket,
        status: r.status, priority: r.priority, dueDate: r.dueDate, startDate: r.startDate,
        assignedPerson: r.assignedPerson, creditorTag: r.creditorTag, arrearsItemId: r.arrearsItemId,
        recurring: r.recurring === "true", completedAt: r.completedAt, notes: r.notes,
      })),
      commsEntries: comms.map((r) => ({
        id: r.id, occurredAt: r.occurredAt.toISOString(), channel: r.channel, creditor: r.creditor,
        arrearsItemId: r.arrearsItemId, who: r.who, outcome: r.outcome, nextStep: r.nextStep,
      })),
      weeklyEntries: weeks.map((r) => ({
        id: r.id, weekStart: r.weekStart, plannedIn: n(r.plannedIn), actualIn: n(r.actualIn),
        plannedOut: n(r.plannedOut), actualOut: n(r.actualOut), notes: r.notes,
      })),
      gigEntries: gig.map((r) => ({
        id: r.id, entryDate: r.entryDate, platform: r.platform, person: r.person,
        startTime: r.startTime, endTime: r.endTime, hoursWorked: r.hoursWorked != null ? n(r.hoursWorked) : null,
        grossEarnings: n(r.grossEarnings), tips: n(r.tips), fastPayAmount: n(r.fastPayAmount),
        weeklyDepositAmount: n(r.weeklyDepositAmount), fees: n(r.fees), fuelEstimate: n(r.fuelEstimate),
        otherExpenses: n(r.otherExpenses), netIncome: n(r.netIncome), paymentStatus: r.paymentStatus, notes: r.notes,
        estimatedKm: r.estimatedKm != null ? n(r.estimatedKm) : null,
        activeMinutes: r.activeMinutes ?? null,
        deliveriesCount: r.deliveriesCount ?? null,
        offersCount: r.offersCount ?? null,
        routeChain: r.routeChain ?? null,
      })),
      budgetCategories: budget.map((r) => ({
        id: r.id, name: r.name, group: r.group, plannedWeekly: n(r.plannedWeekly), actualWeekly: n(r.actualWeekly),
        essential: r.essential, includeInScenario: r.includeInScenario, carryForward: r.carryForward, notes: r.notes, color: r.color,
      })),
      scenarios: scenarios.map((r) => ({
        id: r.id, name: r.name, label: r.label, status: r.status, startDate: r.startDate, endDate: r.endDate,
        incomeAssumptions: r.incomeAssumptions, billAssumptions: r.billAssumptions,
        arrearsAssumptions: r.arrearsAssumptions, spendingChanges: r.spendingChanges, notes: r.notes,
      })),
      shoppingItems: shoppingItems.map((r) => ({
        id: r.id, item: r.item, category: r.category, quantitySize: r.quantitySize,
        preferredStore: r.preferredStore, alternativeStore: r.alternativeStore, alternativeItem: r.alternativeItem,
        estimatedPrice: r.estimatedPrice != null ? n(r.estimatedPrice) : null,
        actualPrice: r.actualPrice != null ? n(r.actualPrice) : null,
        priority: r.priority, usualFrequency: r.usualFrequency, lastPurchasedDate: r.lastPurchasedDate,
        notes: r.notes, active: r.active,
      })),
      shoppingLists: shoppingLists.map((r) => ({
        id: r.id, name: r.name, weekStart: r.weekStart, weekEnd: r.weekEnd, status: r.status,
        estimatedTotal: n(r.estimatedTotal), actualTotal: n(r.actualTotal), notes: r.notes,
      })),
      shoppingListItems: shoppingListItems.map((r) => ({
        id: r.id, shoppingListId: r.shoppingListId, shoppingItemId: r.shoppingItemId, item: r.item,
        category: r.category, quantitySize: r.quantitySize, store: r.store,
        estimatedPrice: r.estimatedPrice != null ? n(r.estimatedPrice) : null,
        actualPrice: r.actualPrice != null ? n(r.actualPrice) : null,
        needed: r.needed, bought: r.bought, priority: r.priority, notes: r.notes,
      })),
    },
  };

  const filename = `myoh-export-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(payload, null, 2));
});

// ── per-table CSV downloads ────────────────────────────────────────────
router.get("/export/csv/gig", async (_req, res): Promise<void> => {
  const rows = await db.select().from(gigEntriesTable).orderBy(gigEntriesTable.entryDate);
  const headers = ["id", "date", "platform", "person", "start_time", "end_time", "hours_worked",
    "gross_earnings", "tips", "fast_pay", "weekly_deposit", "fees", "fuel", "other_expenses", "net_income",
    "payment_status", "notes"];
  const data = rows.map((r) => [
    r.id, r.entryDate, r.platform, r.person, r.startTime, r.endTime,
    r.hoursWorked != null ? n(r.hoursWorked) : null,
    n(r.grossEarnings), n(r.tips), n(r.fastPayAmount), n(r.weeklyDepositAmount),
    n(r.fees), n(r.fuelEstimate), n(r.otherExpenses), n(r.netIncome),
    r.paymentStatus, r.notes,
  ]);
  const filename = `gig-entries-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/income", async (_req, res): Promise<void> => {
  const rows = await db.select().from(incomeEntriesTable).orderBy(incomeEntriesTable.dateReceived);
  const headers = ["id", "date_received", "source_name", "person", "gross_amount", "net_amount",
    "payment_method", "tags", "allocated", "notes"];
  const data = rows.map((r) => [
    r.id, r.dateReceived, r.sourceName, r.person, n(r.grossAmount), n(r.netAmount),
    r.paymentMethod, r.tags, r.allocated, r.notes,
  ]);
  const filename = `income-entries-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/bills", async (_req, res): Promise<void> => {
  const rows = await db.select().from(billsTable).orderBy(billsTable.id);
  const headers = ["id", "provider", "category", "amount", "frequency", "due_day", "account_ref", "autopay", "notes"];
  const data = rows.map((r) => [r.id, r.provider, r.category, n(r.amount), r.frequency, r.dueDay, r.accountRef, r.autopay, r.notes]);
  const filename = `bills-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/arrears", async (_req, res): Promise<void> => {
  const rows = await db.select().from(arrearsItemsTable).orderBy(arrearsItemsTable.id);
  const headers = ["id", "creditor", "category", "balance", "ongoing_charge", "ongoing_frequency",
    "arrears_payment", "arrears_frequency", "risk_level", "status", "next_review_date", "account_ref", "summary"];
  const data = rows.map((r) => [
    r.id, r.creditor, r.category, n(r.balance), n(r.ongoingCharge), r.ongoingFrequency,
    n(r.arrearsPayment), r.arrearsFrequency, r.riskLevel, r.status, r.nextReviewDate, r.accountRef, r.summary,
  ]);
  const filename = `arrears-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/tasks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tasksTable).orderBy(tasksTable.id);
  const headers = ["id", "title", "bucket", "status", "priority", "due_date", "assigned_person",
    "creditor_tag", "recurring", "completed_at", "notes"];
  const data = rows.map((r) => [
    r.id, r.title, r.bucket, r.status, r.priority, r.dueDate, r.assignedPerson,
    r.creditorTag, r.recurring === "true", r.completedAt, r.notes,
  ]);
  const filename = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/comms", async (_req, res): Promise<void> => {
  const rows = await db.select().from(commsEntriesTable).orderBy(commsEntriesTable.occurredAt);
  const headers = ["id", "occurred_at", "channel", "creditor", "who", "outcome", "next_step"];
  const data = rows.map((r) => [r.id, r.occurredAt.toISOString(), r.channel, r.creditor, r.who, r.outcome, r.nextStep]);
  const filename = `comms-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

router.get("/export/csv/shopping", async (_req, res): Promise<void> => {
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(shoppingItemsTable).where(eq(shoppingItemsTable.active, true)).orderBy(shoppingItemsTable.category);
  const headers = ["id", "item", "category", "quantity_size", "preferred_store", "alternative_store",
    "alternative_item", "estimated_price", "priority", "usual_frequency", "notes"];
  const data = rows.map((r) => [
    r.id, r.item, r.category, r.quantitySize, r.preferredStore, r.alternativeStore,
    r.alternativeItem, r.estimatedPrice != null ? n(r.estimatedPrice) : null,
    r.priority, r.usualFrequency, r.notes,
  ]);
  const filename = `shopping-items-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, data));
});

// ── GET /export/template — downloadable blank starter JSON ────────────
router.get("/export/template", async (_req, res): Promise<void> => {
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  try {
    const templatePath = resolve(
      process.cwd(),
      "../../artifacts/arrears-blueprint/public/myoh-template.json"
    );
    const raw = readFileSync(templatePath, "utf-8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="myoh-template.json"');
    res.send(raw);
  } catch {
    res.status(404).json({ error: "Template file not found" });
  }
});

// ── GET /export/starter — clean household starter with real structure ──
router.get("/export/starter", async (_req, res): Promise<void> => {
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  try {
    const filePath = resolve(
      process.cwd(),
      "../../artifacts/arrears-blueprint/public/myoh-clean-starter.json"
    );
    const raw = readFileSync(filePath, "utf-8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="myoh-clean-starter.json"');
    res.send(raw);
  } catch {
    res.status(404).json({ error: "Starter file not found" });
  }
});

// ── GET /export/wipe — replace-mode wipe file (clears all data) ───────
router.get("/export/wipe", async (_req, res): Promise<void> => {
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  try {
    const filePath = resolve(
      process.cwd(),
      "../../artifacts/arrears-blueprint/public/myoh-wipe-replace.json"
    );
    const raw = readFileSync(filePath, "utf-8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="myoh-wipe-replace.json"');
    res.send(raw);
  } catch {
    res.status(404).json({ error: "Wipe file not found" });
  }
});

export default router;

