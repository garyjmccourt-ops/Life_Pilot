import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// ---------------------------------------------------------------------------
// Hoist mock factories so they are available inside vi.mock() calls, which
// are themselves hoisted to the top of the module by Vitest.
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  const selectWhere = vi.fn();
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const dbSelect = vi.fn(() => ({ from: selectFrom }));
  const dbTransaction = vi.fn();
  const syncGigWeekIncome = vi.fn();
  return { selectWhere, selectFrom, dbSelect, dbTransaction, syncGigWeekIncome };
});

// Mock the DB module entirely so the import doesn't require DATABASE_URL.
vi.mock("@workspace/db", () => ({
  db: {
    select: mocks.dbSelect,
    transaction: mocks.dbTransaction,
  },
  gigIncomeImportsTable: {},
  gigEntriesTable: {},
}));

// Mock the gig-sync helper used inside the transaction happy path.
vi.mock("../lib/gig-sync", () => ({
  syncGigWeekIncome: mocks.syncGigWeekIncome,
}));

// Import app *after* mocks are registered.
const { default: app } = await import("../app");

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const baseRow = {
  id: 42,
  receivedAt: new Date(),
  sourceSystem: "gig_pilot",
  sourceRef: "ref-001",
  entryDate: "2025-01-03",
  platform: "doordash",
  person: "Gary",
  grossEarnings: "120.00",
  netIncome: "100.00",
  tips: "5.00",
  fees: "2.00",
  fuelEstimate: "3.00",
  hoursWorked: null,
  deliveriesCount: null,
  paymentStatus: "pending",
  notes: null,
  reviewStatus: "pending",
  promotedGigEntryId: null,
  promotedAt: null,
  rejectionReason: null,
  duplicateOfImportId: null,
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("PATCH /api/gig-imports/:id/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: select chain always returns the raw where mock so each test
    // can configure its own resolved value.
    mocks.dbSelect.mockReturnValue({ from: mocks.selectFrom });
    mocks.selectFrom.mockReturnValue({ where: mocks.selectWhere });
  });

  // ── 404 ─────────────────────────────────────────────────────────────────
  it("returns 404 when the staged import does not exist", async () => {
    mocks.selectWhere.mockResolvedValueOnce([]);

    const res = await request(app).patch("/api/gig-imports/99/approve");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: "Staged import not found" });
  });

  // ── 409 – duplicate ──────────────────────────────────────────────────────
  it("returns 409 with a specific error when the import is a duplicate", async () => {
    mocks.selectWhere.mockResolvedValueOnce([
      { ...baseRow, reviewStatus: "duplicate" },
    ]);

    const res = await request(app).patch("/api/gig-imports/42/approve");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: "Duplicate imports cannot be approved",
    });
  });

  // ── 409 – already approved ───────────────────────────────────────────────
  it("returns 409 when the import is already approved", async () => {
    mocks.selectWhere.mockResolvedValueOnce([
      { ...baseRow, reviewStatus: "approved", promotedGigEntryId: 7 },
    ]);

    const res = await request(app).patch("/api/gig-imports/42/approve");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ currentReviewStatus: "approved" });
  });

  // ── 409 – already rejected ───────────────────────────────────────────────
  it("returns 409 when the import is already rejected", async () => {
    mocks.selectWhere.mockResolvedValueOnce([
      { ...baseRow, reviewStatus: "rejected" },
    ]);

    const res = await request(app).patch("/api/gig-imports/42/approve");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ currentReviewStatus: "rejected" });
  });

  // ── 200 – happy path ─────────────────────────────────────────────────────
  it("returns 200 and promotes a pending import", async () => {
    // Pre-flight read returns a pending row.
    mocks.selectWhere.mockResolvedValueOnce([
      { ...baseRow, reviewStatus: "pending" },
    ]);

    const gigEntry = { id: 55, entryDate: "2025-01-03", netIncome: "100.00" };
    const updatedStaging = { ...baseRow, reviewStatus: "approved", promotedGigEntryId: 55, promotedAt: new Date() };

    // Mock db.transaction to call the callback with a fake tx object.
    mocks.dbTransaction.mockImplementationOnce(async (callback: (tx: any) => Promise<any>) => {
      const txSelectWhere = vi.fn()
        .mockResolvedValueOnce([{ ...baseRow, reviewStatus: "pending" }])
        .mockResolvedValueOnce([gigEntry]);
      const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }));
      const txSelect = vi.fn(() => ({ from: txSelectFrom }));

      const txInsertReturning = vi.fn().mockResolvedValueOnce([gigEntry]);
      const txInsertValues = vi.fn(() => ({ returning: txInsertReturning }));
      const txInsert = vi.fn(() => ({ values: txInsertValues }));

      const txUpdateReturning = vi.fn().mockResolvedValueOnce([updatedStaging]);
      const txUpdateWhere = vi.fn(() => ({ returning: txUpdateReturning }));
      const txUpdateSet = vi.fn(() => ({ where: txUpdateWhere }));
      const txUpdate = vi.fn(() => ({ set: txUpdateSet }));

      const tx = { select: txSelect, insert: txInsert, update: txUpdate };

      mocks.syncGigWeekIncome.mockResolvedValueOnce({
        incomeEntryId: 10,
        weekEnding: "2025-01-05",
        isNew: true,
      });

      return callback(tx);
    });

    const res = await request(app).patch("/api/gig-imports/42/approve");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(res.body.stagingRow).toMatchObject({ reviewStatus: "approved" });
    expect(res.body.weeklyIncome).toMatchObject({ isNew: true });
  });
});
