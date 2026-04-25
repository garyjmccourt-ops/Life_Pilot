import {
  db,
  incomeSourcesTable,
  billsTable,
  arrearsItemsTable,
  tasksTable,
  commsEntriesTable,
  weeklyEntriesTable,
} from "@workspace/db";

async function main() {
  const [hasIncome] = await db.select().from(incomeSourcesTable).limit(1);
  if (hasIncome) {
    console.log("Seed already present, skipping.");
    return;
  }

  await db.insert(incomeSourcesTable).values([
    {
      name: "Primary wage",
      amount: "1850.00",
      frequency: "fortnightly",
      notes: "Net pay after tax",
    },
    {
      name: "Family payment",
      amount: "320.00",
      frequency: "fortnightly",
      notes: null,
    },
  ]);

  await db.insert(billsTable).values([
    {
      provider: "Internet",
      category: "Utilities",
      amount: "79.00",
      frequency: "monthly",
      dueDay: 14,
      accountRef: "INET-44821",
      autopay: true,
      notes: null,
    },
    {
      provider: "Mobile",
      category: "Utilities",
      amount: "45.00",
      frequency: "monthly",
      dueDay: 6,
      accountRef: null,
      autopay: true,
      notes: null,
    },
    {
      provider: "Groceries",
      category: "Living",
      amount: "180.00",
      frequency: "weekly",
      dueDay: null,
      accountRef: null,
      autopay: false,
      notes: "Estimated weekly average",
    },
  ]);

  const [{ id: rentId }] = await db
    .insert(arrearsItemsTable)
    .values([
      {
        creditor: "Landlord — 12 Birch St",
        category: "rent",
        balance: "1240.00",
        ongoingCharge: "520.00",
        ongoingFrequency: "weekly",
        arrearsPayment: "60.00",
        arrearsFrequency: "weekly",
        riskLevel: "high",
        status: "active",
        nextReviewDate: new Date(Date.now() + 14 * 86400000)
          .toISOString()
          .slice(0, 10),
        accountRef: "Tenancy 4471",
        summary:
          "Rent fell behind during a three-week reduced-hours period. Currently paying full rent plus a weekly catch-up.",
        objective:
          "Clear the full balance within 22 weeks while never falling further behind on ongoing rent.",
        workingPlan:
          "Step 1 — pay $580/wk ($520 rent + $60 arrears) every Friday.\nStep 2 — review at the 6-week mark and consider lifting catch-up to $80/wk if income holds.\nContingency — if shifts drop, contact landlord same week before missing.",
        communicationPosition:
          "Be transparent about the catch-up plan, do not disclose specific income figures or other creditors.",
        externalAcknowledgement:
          "I acknowledge the outstanding rent balance and want to keep our arrangement on track.",
        externalPaymentIntent:
          "Ongoing weekly rent of $520 will continue to be paid every Friday by direct transfer.",
        externalStagedReduction:
          "Stage 1: $60/week toward arrears starting this Friday. Stage 2 (from week 7): review and consider increasing to $80/week.",
        externalReviewPoints:
          "First review at 6 weeks. I will contact you proactively if my income changes before then.",
        externalChannel: "Email",
        evidenceLinks:
          "Tenancy agreement (email 2025-11-04)\nLatest statement (email 2026-04-12)",
      },
    ])
    .returning({ id: arrearsItemsTable.id });

  const [{ id: elecId }] = await db
    .insert(arrearsItemsTable)
    .values([
      {
        creditor: "City Energy",
        category: "utility",
        balance: "382.50",
        ongoingCharge: "65.00",
        ongoingFrequency: "monthly",
        arrearsPayment: "30.00",
        arrearsFrequency: "fortnightly",
        riskLevel: "medium",
        status: "active",
        nextReviewDate: null,
        accountRef: "EL-99003",
        summary: "Quarterly statement arrived higher than expected after winter usage.",
        objective: "Clear within ~6 months without disconnection notice.",
        workingPlan:
          "Pay ongoing usage monthly via autopay; add $30 fortnightly to chip down arrears.",
        communicationPosition:
          "Use hardship line; do not volunteer information about other arrears.",
        externalAcknowledgement: null,
        externalPaymentIntent: null,
        externalStagedReduction: null,
        externalReviewPoints: null,
        externalChannel: null,
        evidenceLinks: null,
      },
    ])
    .returning({ id: arrearsItemsTable.id });

  await db.insert(arrearsItemsTable).values([
    {
      creditor: "Council — Local Rates",
      category: "council",
      balance: "215.00",
      ongoingCharge: "0",
      ongoingFrequency: "one-off",
      arrearsPayment: "25.00",
      arrearsFrequency: "fortnightly",
      riskLevel: "low",
      status: "active",
      nextReviewDate: null,
      accountRef: null,
      summary: null,
      objective: null,
      workingPlan: null,
      communicationPosition: null,
      externalAcknowledgement: null,
      externalPaymentIntent: null,
      externalStagedReduction: null,
      externalReviewPoints: null,
      externalChannel: null,
      evidenceLinks: null,
    },
  ]);

  await db.insert(tasksTable).values([
    {
      title: "Pay rent + arrears instalment",
      bucket: "pay",
      status: "open",
      priority: "p1",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      creditorTag: "rent",
      arrearsItemId: rentId,
      notes: "$580 total — Friday transfer",
    },
    {
      title: "Call City Energy hardship team",
      bucket: "contact",
      status: "open",
      priority: "p2",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      creditorTag: "electric",
      arrearsItemId: elecId,
      notes: "Confirm fortnightly arrears amount is sufficient.",
    },
    {
      title: "File latest electricity bill PDF",
      bucket: "file",
      status: "done",
      priority: "p3",
      dueDate: null,
      creditorTag: "electric",
      arrearsItemId: elecId,
      notes: null,
    },
    {
      title: "Run weekly review",
      bucket: "review",
      status: "open",
      priority: "p2",
      dueDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
      creditorTag: null,
      arrearsItemId: null,
      notes: "30-45 min — see Weekly tab",
    },
  ]);

  await db.insert(commsEntriesTable).values([
    {
      occurredAt: new Date(Date.now() - 2 * 86400000),
      channel: "phone",
      creditor: "Landlord — 12 Birch St",
      arrearsItemId: rentId,
      who: "Property manager (Sam)",
      outcome: "Confirmed $60/wk catch-up acceptable; review in 6 weeks.",
      nextStep: "Send written confirmation by email.",
    },
    {
      occurredAt: new Date(Date.now() - 8 * 86400000),
      channel: "email",
      creditor: "City Energy",
      arrearsItemId: elecId,
      who: "Hardship team",
      outcome: "Account flagged for hardship; no disconnection while paying.",
      nextStep: "Reconfirm at next quarterly bill.",
    },
  ]);

  const monday = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  })();

  await db.insert(weeklyEntriesTable).values([
    {
      weekStart: monday,
      plannedIn: "1085.00",
      actualIn: "1085.00",
      plannedOut: "925.00",
      actualOut: "938.00",
      notes: "Slightly over on groceries.",
    },
  ]);

  console.log("Seeded.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
