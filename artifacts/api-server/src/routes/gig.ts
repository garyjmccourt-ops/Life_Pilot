import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, gigEntriesTable } from "@workspace/db";
import {
  CreateGigEntryBody,
  UpdateGigEntryBody,
  UpdateGigEntryParams,
  DeleteGigEntryParams,
} from "@workspace/api-zod";
import { n } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof gigEntriesTable.$inferSelect) {
  return {
    id: row.id,
    entryDate: row.entryDate,
    platform: row.platform,
    person: row.person,
    startTime: row.startTime,
    endTime: row.endTime,
    hoursWorked: row.hoursWorked != null ? n(row.hoursWorked) : null,
    grossEarnings: n(row.grossEarnings),
    tips: n(row.tips),
    fastPayAmount: n(row.fastPayAmount),
    weeklyDepositAmount: n(row.weeklyDepositAmount),
    fees: n(row.fees),
    fuelEstimate: n(row.fuelEstimate),
    otherExpenses: n(row.otherExpenses),
    netIncome: n(row.netIncome),
    paymentStatus: row.paymentStatus,
    incomeEntryId: row.incomeEntryId,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function numStr(v: number | undefined | null): string | undefined {
  if (v == null) return undefined;
  return String(v);
}

router.get("/gig", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(gigEntriesTable)
    .orderBy(desc(gigEntriesTable.entryDate));
  res.json(rows.map(shape));
});

router.post("/gig", async (req, res): Promise<void> => {
  const parsed = CreateGigEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    grossEarnings, tips, fastPayAmount, weeklyDepositAmount, fees,
    fuelEstimate, otherExpenses, netIncome, hoursWorked, entryDate, ...rest
  } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .insert(gigEntriesTable)
    .values({
      ...rest,
      entryDate: toDate(entryDate) as string,
      grossEarnings: String(grossEarnings),
      tips: String(tips),
      fastPayAmount: String(fastPayAmount),
      weeklyDepositAmount: String(weeklyDepositAmount),
      fees: String(fees),
      fuelEstimate: String(fuelEstimate),
      otherExpenses: String(otherExpenses),
      netIncome: String(netIncome),
      hoursWorked: numStr(hoursWorked) ?? null,
    })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/gig/:id", async (req, res): Promise<void> => {
  const params = UpdateGigEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGigEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    grossEarnings, tips, fastPayAmount, weeklyDepositAmount, fees,
    fuelEstimate, otherExpenses, netIncome, hoursWorked, entryDate, ...rest
  } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .update(gigEntriesTable)
    .set({
      ...rest,
      ...("entryDate" in parsed.data ? { entryDate: toDate(entryDate) as string } : {}),
      ...(grossEarnings !== undefined ? { grossEarnings: String(grossEarnings) } : {}),
      ...(tips !== undefined ? { tips: String(tips) } : {}),
      ...(fastPayAmount !== undefined ? { fastPayAmount: String(fastPayAmount) } : {}),
      ...(weeklyDepositAmount !== undefined ? { weeklyDepositAmount: String(weeklyDepositAmount) } : {}),
      ...(fees !== undefined ? { fees: String(fees) } : {}),
      ...(fuelEstimate !== undefined ? { fuelEstimate: String(fuelEstimate) } : {}),
      ...(otherExpenses !== undefined ? { otherExpenses: String(otherExpenses) } : {}),
      ...(netIncome !== undefined ? { netIncome: String(netIncome) } : {}),
      ...(hoursWorked !== undefined ? { hoursWorked: numStr(hoursWorked) ?? null } : {}),
    })
    .where(eq(gigEntriesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/gig/:id", async (req, res): Promise<void> => {
  const params = DeleteGigEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(gigEntriesTable).where(eq(gigEntriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
