/**
 * Shared gig weekly income sync helpers.
 * Extracted so that both gig.ts (user-entered shifts) and gig-imports.ts
 * (Gig_Pilot staged promotions) can call the same rollup logic without
 * duplicating code.
 */

import { eq, and, gte, lte } from "drizzle-orm";
import { db, gigEntriesTable, incomeEntriesTable, incomeSourcesTable } from "@workspace/db";
import { n } from "./calc";

/** Given any date string (YYYY-MM-DD), return the Monday and Sunday of that Mon–Sun week. */
export function getWeekBounds(dateStr: string): { monday: string; sunday: string } {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
  };
}

/** Format a YYYY-MM-DD date as "19 Jan 2025" (en-AU, UTC). */
export function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Find-or-create a "Gig Work" income source, then find-or-create the weekly
 * income entry for the week containing `dateStr`. Recalculates amounts from
 * all gig entries in that Mon–Sun window and links them to the weekly entry.
 *
 * Returns the income entry id.
 */
export async function syncGigWeekIncome(dateStr: string): Promise<{ incomeEntryId: number; weekEnding: string; isNew: boolean }> {
  const { monday, sunday } = getWeekBounds(dateStr);
  const tag = `gig_week:${sunday}`;

  // 1. Find or create the "Gig Work" income source
  let [gigSource] = await db
    .select()
    .from(incomeSourcesTable)
    .where(eq(incomeSourcesTable.name, "Gig Work"));

  if (!gigSource) {
    [gigSource] = await db
      .insert(incomeSourcesTable)
      .values({
        name: "Gig Work",
        amount: "0",
        frequency: "weekly",
        notes: "Auto-created — aggregates weekly gig shift income",
      })
      .returning();
  }

  // 2. Sum all gig entries in this Mon–Sun window
  const weekEntries = await db
    .select()
    .from(gigEntriesTable)
    .where(and(
      gte(gigEntriesTable.entryDate, monday),
      lte(gigEntriesTable.entryDate, sunday),
    ));

  const totalGross = weekEntries.reduce((s, e) => s + n(e.grossEarnings) + n(e.tips), 0);
  const totalNet = weekEntries.reduce((s, e) => s + n(e.netIncome), 0);
  const shiftIds = weekEntries.map(e => e.id);
  const noteText = shiftIds.length > 0
    ? `${shiftIds.length} shift${shiftIds.length !== 1 ? "s" : ""} (${monday} – ${sunday}) — IDs: ${shiftIds.join(", ")}`
    : `No shifts recorded for week ${monday} – ${sunday}`;
  const sourceName = `Gig Work Week Ending ${fmtDate(sunday)}`;

  // 3. Find or create the weekly income entry (keyed by tag)
  const [existing] = await db
    .select()
    .from(incomeEntriesTable)
    .where(eq(incomeEntriesTable.tags, tag));

  let weekIncomeId: number;
  let isNew = false;

  if (existing) {
    const [updated] = await db
      .update(incomeEntriesTable)
      .set({
        sourceName,
        incomeSourceId: gigSource.id,
        grossAmount: String(totalGross.toFixed(2)),
        netAmount: String(totalNet.toFixed(2)),
        notes: noteText,
        dateReceived: sunday,
      })
      .where(eq(incomeEntriesTable.id, existing.id))
      .returning();
    weekIncomeId = updated.id;
  } else {
    const [created] = await db
      .insert(incomeEntriesTable)
      .values({
        dateReceived: sunday,
        incomeSourceId: gigSource.id,
        sourceName,
        grossAmount: String(totalGross.toFixed(2)),
        netAmount: String(totalNet.toFixed(2)),
        tags: tag,
        notes: noteText,
        allocated: false,
        gigEntryId: null,
      })
      .returning();
    weekIncomeId = created.id;
    isNew = true;
  }

  // 4. Link all gig entries in this week to the weekly income entry
  if (weekEntries.length > 0) {
    await db
      .update(gigEntriesTable)
      .set({ incomeEntryId: weekIncomeId })
      .where(and(
        gte(gigEntriesTable.entryDate, monday),
        lte(gigEntriesTable.entryDate, sunday),
      ));
  }

  return { incomeEntryId: weekIncomeId, weekEnding: sunday, isNew };
}
