import {
  db,
  gigEntriesTable,
  budgetCategoriesTable,
} from "@workspace/db";

async function main() {
  const [hasGig] = await db.select().from(gigEntriesTable).limit(1);
  if (!hasGig) {
    console.log("Seeding gig entries...");
    await db.insert(gigEntriesTable).values([
      { entryDate: "2026-03-02", platform: "doordash", person: "Jess", grossEarnings: "47.50", tips: "3.00", fastPayAmount: "47.50", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "8.00", otherExpenses: "0", netIncome: "40.51", paymentStatus: "received", notes: "FastPay same day" },
      { entryDate: "2026-03-05", platform: "doordash", person: "Jess", grossEarnings: "62.10", tips: "5.50", fastPayAmount: "62.10", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "10.00", otherExpenses: "0", netIncome: "55.61", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-03-09", platform: "doordash", person: "Jess", grossEarnings: "53.25", tips: "4.00", fastPayAmount: "0", weeklyDepositAmount: "53.25", fees: "0", fuelEstimate: "9.00", otherExpenses: "0", netIncome: "48.25", paymentStatus: "deposited", notes: "Weekly deposit Mon" },
      { entryDate: "2026-03-12", platform: "doordash", person: "Jess", grossEarnings: "71.80", tips: "6.00", fastPayAmount: "71.80", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "12.00", otherExpenses: "0", netIncome: "63.81", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-03-16", platform: "doordash", person: "Jess", grossEarnings: "58.60", tips: "2.50", fastPayAmount: "58.60", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "10.00", otherExpenses: "0", netIncome: "49.11", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-03-19", platform: "doordash", person: "Jess", grossEarnings: "44.90", tips: "3.50", fastPayAmount: "0", weeklyDepositAmount: "44.90", fees: "0", fuelEstimate: "8.00", otherExpenses: "0", netIncome: "40.40", paymentStatus: "deposited", notes: "Weekly deposit" },
      { entryDate: "2026-03-23", platform: "doordash", person: "Jess", grossEarnings: "66.40", tips: "4.50", fastPayAmount: "66.40", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "11.00", otherExpenses: "0", netIncome: "57.91", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-03-26", platform: "doordash", person: "Jess", grossEarnings: "55.20", tips: "5.00", fastPayAmount: "55.20", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "9.50", otherExpenses: "0", netIncome: "48.71", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-03-30", platform: "doordash", person: "Jess", grossEarnings: "49.75", tips: "3.00", fastPayAmount: "0", weeklyDepositAmount: "49.75", fees: "0", fuelEstimate: "8.50", otherExpenses: "0", netIncome: "44.25", paymentStatus: "deposited", notes: "Weekly deposit" },
      { entryDate: "2026-04-02", platform: "doordash", person: "Jess", grossEarnings: "68.30", tips: "6.50", fastPayAmount: "68.30", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "11.50", otherExpenses: "0", netIncome: "61.31", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-04-06", platform: "doordash", person: "Jess", grossEarnings: "74.90", tips: "7.00", fastPayAmount: "74.90", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "12.50", otherExpenses: "0", netIncome: "67.41", paymentStatus: "received", notes: "FastPay — good night" },
      { entryDate: "2026-04-09", platform: "doordash", person: "Jess", grossEarnings: "51.60", tips: "3.50", fastPayAmount: "0", weeklyDepositAmount: "51.60", fees: "0", fuelEstimate: "9.00", otherExpenses: "0", netIncome: "46.10", paymentStatus: "deposited", notes: "Weekly deposit" },
      { entryDate: "2026-04-13", platform: "doordash", person: "Jess", grossEarnings: "60.15", tips: "4.00", fastPayAmount: "60.15", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "10.00", otherExpenses: "0", netIncome: "52.16", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-04-16", platform: "doordash", person: "Jess", grossEarnings: "57.80", tips: "5.00", fastPayAmount: "57.80", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "9.50", otherExpenses: "0", netIncome: "50.31", paymentStatus: "received", notes: "FastPay" },
      { entryDate: "2026-04-20", platform: "doordash", person: "Jess", grossEarnings: "63.40", tips: "4.50", fastPayAmount: "0", weeklyDepositAmount: "63.40", fees: "0", fuelEstimate: "10.50", otherExpenses: "0", netIncome: "56.40", paymentStatus: "deposited", notes: "Weekly deposit Mon" },
      { entryDate: "2026-04-23", platform: "doordash", person: "Jess", grossEarnings: "79.20", tips: "8.00", fastPayAmount: "79.20", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "13.00", otherExpenses: "0", netIncome: "72.21", paymentStatus: "received", notes: "FastPay — best shift" },
      { entryDate: "2026-04-27", platform: "doordash", person: "Jess", grossEarnings: "55.50", tips: "3.00", fastPayAmount: "0", weeklyDepositAmount: "55.50", fees: "0", fuelEstimate: "9.50", otherExpenses: "0", netIncome: "49.00", paymentStatus: "deposited", notes: "Weekly deposit" },
      { entryDate: "2026-04-30", platform: "doordash", person: "Jess", grossEarnings: "48.90", tips: "2.50", fastPayAmount: "48.90", weeklyDepositAmount: "0", fees: "1.99", fuelEstimate: "8.50", otherExpenses: "0", netIncome: "40.91", paymentStatus: "received", notes: "FastPay" },
    ]);
    console.log("Gig entries seeded.");
  } else {
    console.log("Gig entries already present, skipping.");
  }

  const [hasBudget] = await db.select().from(budgetCategoriesTable).where((c) => c.id !== 1 as unknown as typeof c.id).limit(1);
  const budgetCount = (await db.select().from(budgetCategoriesTable)).length;
  if (budgetCount < 2) {
    console.log("Seeding budget categories...");
    await db.insert(budgetCategoriesTable).values([
      { name: "Transport / Fuel", group: "transport", plannedWeekly: "60.00", actualWeekly: "55.00", essential: true, includeInScenario: true, carryForward: false, color: "#4ECDC4" },
      { name: "Electricity (ongoing)", group: "utilities", plannedWeekly: "15.00", actualWeekly: "15.00", essential: true, includeInScenario: true, carryForward: false, color: "#FFA726" },
      { name: "Internet", group: "utilities", plannedWeekly: "18.23", actualWeekly: "18.23", essential: true, includeInScenario: true, carryForward: false, color: "#7E57C2" },
      { name: "Mobile", group: "utilities", plannedWeekly: "10.38", actualWeekly: "10.38", essential: true, includeInScenario: true, carryForward: false, color: "#7E57C2" },
      { name: "Eating Out", group: "living", plannedWeekly: "30.00", actualWeekly: "40.00", essential: false, includeInScenario: true, carryForward: false, color: "#EF5350" },
      { name: "Kids Activities", group: "family", plannedWeekly: "20.00", actualWeekly: "15.00", essential: false, includeInScenario: true, carryForward: false, color: "#66BB6A" },
      { name: "Clothing", group: "personal", plannedWeekly: "15.00", actualWeekly: "0.00", essential: false, includeInScenario: false, carryForward: true, color: "#FF7043" },
    ]);
    console.log("Budget categories seeded.");
  } else {
    console.log("Budget categories already present, skipping.");
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
