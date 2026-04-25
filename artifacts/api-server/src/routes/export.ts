import { Router, type IRouter } from "express";
import {
  db,
  incomeSourcesTable,
  billsTable,
  arrearsItemsTable,
  tasksTable,
  commsEntriesTable,
  weeklyEntriesTable,
} from "@workspace/db";
import { n } from "../lib/calc";

const router: IRouter = Router();

const SCHEMA_DOC = {
  description:
    "Arrears & Budget Manager export. Share this whole JSON with an LLM (e.g. ChatGPT) and ask it to help you clean, restructure or expand the `data` section. Then paste corrected entries back into the app one section at a time. Field rules below are authoritative — values outside the listed enums will be rejected on import.",
  enums: {
    frequency: [
      "weekly",
      "fortnightly",
      "monthly",
      "quarterly",
      "annual",
      "one-off",
    ],
    arrearsCategory: [
      "rent",
      "utility",
      "council",
      "fine",
      "child-support",
      "personal-debt",
      "tax",
      "other",
    ],
    riskLevel: ["low", "medium", "high"],
    arrearsStatus: ["active", "negotiating", "paused", "completed"],
    taskBucket: ["pay", "contact", "file", "review", "negotiate", "watch"],
    taskStatus: ["open", "in-progress", "blocked", "awaiting-reply", "done"],
    priority: ["p1", "p2", "p3"],
    commsChannel: ["phone", "email", "letter", "portal", "in-person", "sms"],
  },
  shapes: {
    incomeSources: {
      name: "string",
      amount: "number (per the frequency below)",
      frequency: "frequency enum",
      notes: "string | null",
    },
    bills: {
      provider: "string",
      category: "string (free-form, e.g. Utilities, Living)",
      amount: "number (per the frequency below)",
      frequency: "frequency enum",
      dueDay: "integer 1–31 | null",
      accountRef: "string | null",
      autopay: "boolean",
      notes: "string | null",
    },
    arrearsItems: {
      creditor: "string",
      category: "arrearsCategory enum",
      balance: "number (current outstanding balance)",
      ongoingCharge: "number (regular charge that would accrue going forward)",
      ongoingFrequency: "frequency enum",
      arrearsPayment: "number (catch-up amount on top of ongoing)",
      arrearsFrequency: "frequency enum",
      riskLevel: "riskLevel enum",
      status: "arrearsStatus enum",
      nextReviewDate: "YYYY-MM-DD | null",
      accountRef: "string | null",
      summary: "string | null — internal candid summary",
      objective: "string | null — your goal for this debt",
      workingPlan: "string | null — internal step-by-step plan",
      communicationPosition:
        "string | null — what you will and won't say externally",
      externalAcknowledgement:
        "string | null — sanitised acknowledgement to share with the creditor",
      externalPaymentIntent: "string | null",
      externalStagedReduction: "string | null",
      externalReviewPoints: "string | null",
      externalChannel: "string | null (e.g. Email, Phone, Portal)",
      evidenceLinks: "string | null — newline-separated references",
    },
    tasks: {
      title: "string",
      bucket: "taskBucket enum",
      status: "taskStatus enum",
      priority: "priority enum",
      dueDate: "YYYY-MM-DD | null",
      creditorTag: "string | null",
      arrearsItemId: "integer (existing arrears id) | null",
      notes: "string | null",
    },
    commsEntries: {
      occurredAt: "ISO 8601 datetime",
      channel: "commsChannel enum",
      creditor: "string",
      arrearsItemId: "integer (existing arrears id) | null",
      who: "string | null — person spoken to",
      outcome: "string — what was agreed or said",
      nextStep: "string | null",
    },
    weeklyEntries: {
      weekStart: "YYYY-MM-DD (Monday recommended, must be unique)",
      plannedIn: "number",
      actualIn: "number",
      plannedOut: "number",
      actualOut: "number",
      notes: "string | null",
    },
  },
  llmInstructions: [
    "Keep IDs intact when present so cross-references (arrearsItemId on tasks/comms) stay valid.",
    "Do not invent enum values — pick the closest one from the lists above.",
    "All amounts are in the user's local currency; do not convert.",
    "When proposing new entries, omit `id` and add a `_isNew: true` marker so the user knows.",
    "Return the corrected JSON in the same overall structure as the export.",
  ],
};

router.get("/export", async (_req, res): Promise<void> => {
  const [income, bills, arrears, tasks, comms, weeks] = await Promise.all([
    db.select().from(incomeSourcesTable).orderBy(incomeSourcesTable.id),
    db.select().from(billsTable).orderBy(billsTable.id),
    db.select().from(arrearsItemsTable).orderBy(arrearsItemsTable.id),
    db.select().from(tasksTable).orderBy(tasksTable.id),
    db.select().from(commsEntriesTable).orderBy(commsEntriesTable.id),
    db.select().from(weeklyEntriesTable).orderBy(weeklyEntriesTable.weekStart),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schema: SCHEMA_DOC,
    data: {
      incomeSources: income.map((r) => ({
        id: r.id,
        name: r.name,
        amount: n(r.amount),
        frequency: r.frequency,
        notes: r.notes,
      })),
      bills: bills.map((r) => ({
        id: r.id,
        provider: r.provider,
        category: r.category,
        amount: n(r.amount),
        frequency: r.frequency,
        dueDay: r.dueDay,
        accountRef: r.accountRef,
        autopay: r.autopay,
        notes: r.notes,
      })),
      arrearsItems: arrears.map((r) => ({
        id: r.id,
        creditor: r.creditor,
        category: r.category,
        balance: n(r.balance),
        ongoingCharge: n(r.ongoingCharge),
        ongoingFrequency: r.ongoingFrequency,
        arrearsPayment: n(r.arrearsPayment),
        arrearsFrequency: r.arrearsFrequency,
        riskLevel: r.riskLevel,
        status: r.status,
        nextReviewDate: r.nextReviewDate,
        accountRef: r.accountRef,
        summary: r.summary,
        objective: r.objective,
        workingPlan: r.workingPlan,
        communicationPosition: r.communicationPosition,
        externalAcknowledgement: r.externalAcknowledgement,
        externalPaymentIntent: r.externalPaymentIntent,
        externalStagedReduction: r.externalStagedReduction,
        externalReviewPoints: r.externalReviewPoints,
        externalChannel: r.externalChannel,
        evidenceLinks: r.evidenceLinks,
      })),
      tasks: tasks.map((r) => ({
        id: r.id,
        title: r.title,
        bucket: r.bucket,
        status: r.status,
        priority: r.priority,
        dueDate: r.dueDate,
        creditorTag: r.creditorTag,
        arrearsItemId: r.arrearsItemId,
        notes: r.notes,
      })),
      commsEntries: comms.map((r) => ({
        id: r.id,
        occurredAt: r.occurredAt.toISOString(),
        channel: r.channel,
        creditor: r.creditor,
        arrearsItemId: r.arrearsItemId,
        who: r.who,
        outcome: r.outcome,
        nextStep: r.nextStep,
      })),
      weeklyEntries: weeks.map((r) => ({
        id: r.id,
        weekStart: r.weekStart,
        plannedIn: n(r.plannedIn),
        actualIn: n(r.actualIn),
        plannedOut: n(r.plannedOut),
        actualOut: n(r.actualOut),
        notes: r.notes,
      })),
    },
  };

  const filename = `arrears-budget-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  res.send(JSON.stringify(payload, null, 2));
});

export default router;
