import { Router, type IRouter } from "express";
import { and, gte, lte } from "drizzle-orm";
import {
  db,
  arrearsItemsTable,
  billsTable,
  incomeSourcesTable,
  incomeEntriesTable,
  tasksTable,
  gigEntriesTable,
  bnplItemsTable,
  storedValueItemsTable,
} from "@workspace/db";
import { n, toWeekly } from "../lib/calc";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  // Current week: Monday to Sunday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  const [income, bills, arrears, tasks, gigEntries, weekIncomeEntries, bnplItems, storedValueItems] = await Promise.all([
    db.select().from(incomeSourcesTable),
    db.select().from(billsTable),
    db.select().from(arrearsItemsTable),
    db.select().from(tasksTable),
    db.select().from(gigEntriesTable),
    db.select().from(incomeEntriesTable)
      .where(and(gte(incomeEntriesTable.dateReceived, weekStart), lte(incomeEntriesTable.dateReceived, weekEnd))),
    db.select().from(bnplItemsTable),
    db.select().from(storedValueItemsTable),
  ]);

  const weeklyIncome =
    Math.round(
      income.reduce((s, r) => s + toWeekly(n(r.amount), r.frequency), 0) * 100,
    ) / 100;
  const weeklyBills =
    Math.round(
      bills.reduce((s, r) => s + toWeekly(n(r.amount), r.frequency), 0) * 100,
    ) / 100;
  const weeklyArrears =
    Math.round(
      arrears.reduce(
        (s, r) =>
          s +
          toWeekly(n(r.ongoingCharge), r.ongoingFrequency) +
          toWeekly(n(r.arrearsPayment), r.arrearsFrequency),
        0,
      ) * 100,
    ) / 100;
  const weeklyOut = Math.round((weeklyBills + weeklyArrears) * 100) / 100;
  const weeklySurplus = Math.round((weeklyIncome - weeklyOut) * 100) / 100;
  const totalArrearsBalance =
    Math.round(arrears.reduce((s, r) => s + n(r.balance), 0) * 100) / 100;
  const arrearsShareOfIncome =
    weeklyIncome > 0
      ? Math.round((weeklyArrears / weeklyIncome) * 1000) / 1000
      : 0;

  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((t) => !["done", "deferred", "cancelled"].includes(t.status)).length;
  const overdueTasks = tasks.filter(
    (t) => !["done", "deferred", "cancelled"].includes(t.status) && t.dueDate && t.dueDate < today,
  ).length;
  const arrearsCount = arrears.filter((a) => a.status !== "completed").length;
  const highRiskCount = arrears.filter(
    (a) => a.riskLevel === "high" && a.status !== "completed",
  ).length;

  const bnplWeeklyCommitment =
    Math.round(
      bnplItems
        .filter((b) => b.status === "active")
        .reduce((s, b) => s + toWeekly(n(b.instalmentAmount), b.instalmentFrequency), 0) * 100,
    ) / 100;
  const storedValueAvailable =
    Math.round(
      storedValueItems.reduce((s, v) => s + n(v.remainingBalance), 0) * 100,
    ) / 100;
  const adjustedWeeklySurplus =
    Math.round((weeklySurplus - bnplWeeklyCommitment + storedValueAvailable) * 100) / 100;

  // Calculate gig income from last 7 days — exclude entries already linked to an income record
  // (those are counted via income_entries to avoid double-counting)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const recentGig = gigEntries.filter(
    (g) => g.entryDate >= sevenDaysAgo && g.incomeEntryId == null,
  );
  const weeklyGigIncome = Math.round(
    recentGig.reduce((s, g) => s + n(g.netIncome), 0) * 100,
  ) / 100;
  const pendingGigPayout = Math.round(
    gigEntries
      .filter((g) => g.paymentStatus === "pending" && g.incomeEntryId == null)
      .reduce((s, g) => s + n(g.fastPayAmount) + n(g.weeklyDepositAmount), 0) * 100,
  ) / 100;

  // Actual income received this week (from income_entries, not forecast)
  const actualIncomeThisWeek = Math.round(
    weekIncomeEntries.reduce((s: number, e) => s + n(e.grossAmount), 0) * 100,
  ) / 100;

  res.json({
    weeklyIncome,
    actualIncomeThisWeek,
    weeklyBills,
    weeklyArrears,
    weeklyOut,
    weeklySurplus,
    totalArrearsBalance,
    arrearsShareOfIncome,
    openTasks,
    overdueTasks,
    arrearsCount,
    highRiskCount,
    weeklyGigIncome,
    pendingGigPayout,
    bnplWeeklyCommitment,
    storedValueAvailable,
    adjustedWeeklySurplus,
  });
});

router.get("/dashboard/arrears-matrix", async (_req, res): Promise<void> => {
  const rows = await db.select().from(arrearsItemsTable).orderBy(arrearsItemsTable.id);
  const out = rows.map((r) => {
    const balance = n(r.balance);
    const weeklyOngoing = toWeekly(n(r.ongoingCharge), r.ongoingFrequency);
    const weeklyArrears = toWeekly(n(r.arrearsPayment), r.arrearsFrequency);
    const weeklyTotal = Math.round((weeklyOngoing + weeklyArrears) * 100) / 100;
    const weeksToClear =
      weeklyArrears > 0 ? Math.ceil(balance / weeklyArrears) : null;
    return {
      id: r.id,
      creditor: r.creditor,
      category: r.category,
      balance,
      weeklyOngoing,
      weeklyArrears,
      weeklyTotal,
      riskLevel: r.riskLevel,
      status: r.status,
      nextReviewDate: r.nextReviewDate,
      weeksToClear,
    };
  });
  res.json(out);
});

router.get("/dashboard/upcoming", async (_req, res): Promise<void> => {
  const [bills, arrears] = await Promise.all([
    db.select().from(billsTable),
    db.select().from(arrearsItemsTable),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 84); // 12 weeks

  type Item = {
    date: string;
    label: string;
    amount: number;
    kind: "bill" | "arrears" | "ongoing";
    creditor: string | null;
  };
  const items: Item[] = [];

  function addRecurring(
    startDate: Date,
    frequency: string,
    amount: number,
    label: string,
    kind: "bill" | "arrears" | "ongoing",
    creditor: string | null,
  ) {
    if (amount <= 0 || frequency === "one-off") return;
    let stepDays = 7;
    if (frequency === "fortnightly") stepDays = 14;
    if (frequency === "monthly") stepDays = 30;
    if (frequency === "quarterly") stepDays = 91;
    if (frequency === "annual") stepDays = 365;
    const cursor = new Date(startDate);
    while (cursor <= horizon) {
      if (cursor >= today) {
        items.push({
          date: cursor.toISOString().slice(0, 10),
          label,
          amount,
          kind,
          creditor,
        });
      }
      cursor.setDate(cursor.getDate() + stepDays);
    }
  }

  for (const b of bills) {
    const amount = n(b.amount);

    // One-off bills: show once on their exact dueDate (if within horizon)
    if (b.frequency === "one-off") {
      if (b.dueDate) {
        const d = new Date(b.dueDate);
        d.setHours(0, 0, 0, 0);
        if (d >= today && d <= horizon) {
          items.push({
            date: b.dueDate,
            label: b.provider,
            amount,
            kind: "bill",
            creditor: b.provider,
          });
        }
      }
      continue;
    }

    // Recurring bills: use dueDate as anchor if supplied, else fall back to dueDay
    let start: Date;
    if (b.dueDate) {
      start = new Date(b.dueDate);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(today);
      if (b.dueDay) {
        start.setDate(b.dueDay);
        if (start < today) {
          start.setMonth(start.getMonth() + 1);
          start.setDate(b.dueDay);
        }
      }
    }
    addRecurring(start, b.frequency, amount, b.provider, "bill", b.provider);
  }

  for (const a of arrears) {
    if (a.status === "completed") continue;
    const start = new Date(today);
    addRecurring(
      start,
      a.ongoingFrequency,
      n(a.ongoingCharge),
      `${a.creditor} (ongoing)`,
      "ongoing",
      a.creditor,
    );
    addRecurring(
      start,
      a.arrearsFrequency,
      n(a.arrearsPayment),
      `${a.creditor} (arrears)`,
      "arrears",
      a.creditor,
    );
  }

  items.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  res.json(items.slice(0, 60));
});

export default router;
