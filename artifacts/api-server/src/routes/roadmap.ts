import { Router, type IRouter } from "express";
import { db, roadmapItemsTable } from "@workspace/db";

const router: IRouter = Router();

const seedRoadmapItems = [
  { name: "Money Life", layer: "Core", status: "Planned", buildPriority: "Now", description: "Core area for bills, income, arrears, safe-to-spend, budget visibility, payment dates and financial pressure signals.", whyItMatters: "Helps users see money pressure before it becomes crisis.", validationNeeded: null, riskNotes: null, notes: null },
  { name: "Work Life", layer: "Core", status: "Planned", buildPriority: "Now", description: "Core area for work obligations, job search, gig income links, applications, shifts, work tasks and employment-related evidence.", whyItMatters: "Work and income changes directly affect household pressure.", validationNeeded: null, riskNotes: null, notes: null },
  { name: "Home Life", layer: "Core", status: "Planned", buildPriority: "Now", description: "Core area for household admin, routines, appointments, obligations, renewals and practical home-life tasks.", whyItMatters: "Life admin is often scattered and hard to track.", validationNeeded: null, riskNotes: null, notes: null },
  { name: "Future Life", layer: "Core", status: "Planned", buildPriority: "Now", description: "Scenario and planning area for pressure weeks, what-if planning, bill shock, income drops, arrears catch-up, provider negotiation impacts and next options.", whyItMatters: "Scenarios are a core Life Pilot promise: see what may happen early enough that there are still options.", validationNeeded: null, riskNotes: null, notes: "Future View can exist as a feature or mode inside Future Life." },
  { name: "Activity", layer: "Cross-cutting Tool", status: "Planned", buildPriority: "Now", description: "Tasks, reminders, recent changes, follow-ups, communications and next practical steps.", whyItMatters: "Activity shows what needs doing.", validationNeeded: null, riskNotes: null, notes: null },
  { name: "Calendar Overlay", layer: "Cross-cutting Tool", status: "Planned", buildPriority: "Next", description: "Dates, due dates, appointments, reporting dates, payment dates, pressure weeks and planned actions across all areas.", whyItMatters: "Calendar shows when things matter. It is an overlay, not a separate bucket.", validationNeeded: null, riskNotes: null, notes: "Activity is what needs doing. Calendar is when it matters." },
  { name: "Documents / Evidence", layer: "Cross-cutting Tool", status: "Planned", buildPriority: "Now", description: "Files, proof, receipts, letters, exports, evidence packs and documents linked across Money, Work, Home, Future, Real Life and Business Life.", whyItMatters: "Users need proof and records attached to real-life actions.", validationNeeded: null, riskNotes: null, notes: null },
  { name: "People & Providers", layer: "Cross-cutting Tool", status: "Planned", buildPriority: "Next", description: "Lightweight relationship and provider register for trusted contacts, chosen family, household members, vendors, providers, landlords, employers, recruiters, services and support contacts.", whyItMatters: "Life Pilot needs workflow-linked people and provider details without becoming a CRM.", validationNeeded: null, riskNotes: "Do not build as a full CRM or generic address book.", notes: null },
  { name: "Real Life", layer: "Activated Layer", status: "Parked", buildPriority: "Later", description: "Conditional support/social layer activated by onboarding, pressure signals or user consent. Holds guided support tools, safety/privacy workflows, cultural or identity-aware options, provider negotiation, food bridge, referral pathways and evidence packs.", whyItMatters: "Support should be meaningful and practical, not a static resources page.", validationNeeded: "Sensitive features require co-design, consent controls, privacy controls and specialist input.", riskNotes: "Do not make this always visible. Do not build public social features.", notes: "Real Life replaces Support Life as the activated support/social layer." },
  { name: "Business Life", layer: "Activated Layer", status: "Parked", buildPriority: "Research First", description: "Conditional business layer for sole traders, partnerships and micro-businesses. May later include business money, opportunities, clients/providers, documents/records, business future and assistant-led workflows.", whyItMatters: "Some users’ personal life pressure is directly tied to micro-business income and obligations.", validationNeeded: "Core beta survey, small-business survey, possible Q2 2027 test group.", riskNotes: "No tax, BAS, GST, lodgement, accounting advice or certification workflows.", notes: "Business Life is the activated in-app business layer." },
  { name: "Job Pilot", layer: "Companion App", status: "Scoped", buildPriority: "Later", description: "Companion app for job search, job capture, AI scoring, applications, evidence, reporting, calendar/planner and next steps.", whyItMatters: "Work-search pressure can be managed through structured tasks and evidence.", validationNeeded: null, riskNotes: null, notes: "Roadmap record only." },
  { name: "Gig Pilot", layer: "Companion App", status: "Scoped / Existing repo", buildPriority: "Later", description: "Companion app for irregular income, gig work, source/platform tracking, costs, earnings evidence and future Life Pilot integration.", whyItMatters: "Irregular income creates planning pressure.", validationNeeded: null, riskNotes: null, notes: "Roadmap record only." },
  { name: "Trade Pilot", layer: "Companion App", status: "Parked", buildPriority: "Research First", description: "Future companion/investor-facing product concept for sole traders, partnerships and micro-businesses. Business Life is the in-app activated layer; Trade Pilot is the broader companion brand.", whyItMatters: "Shows ecosystem potential without building too early.", validationNeeded: "Surveys, beta-team feedback, partner testing, possible Q2 2027 small-business test group.", riskNotes: "Do not build features yet beyond light architectural wiring. Do not provide tax, BAS, GST, lodgement or accounting advice.", notes: null },
  { name: "Receipt Scanner", layer: "Future Tool", status: "Parked", buildPriority: "Later", description: "Lightweight tool for quick receipt capture and expense tracking. Could support Money Life and Business Life later.", whyItMatters: "Helps users capture expenses and attach evidence to budgets.", validationNeeded: null, riskNotes: "Light wiring only for receipts, expense tags, providers, documents and budget categories.", notes: "Do not build agent scanning yet." },
  { name: "Receipt Scanner Pro", layer: "Future Tool", status: "Parked", buildPriority: "Research First", description: "Future consent-based agent tool to search email/files for receipts, invoices, recurring payments and subscriptions, then reconcile against budget or reporting periods.", whyItMatters: "Could help users find lost money, missed expenses and forgotten subscriptions.", validationNeeded: "Requires strong consent, privacy controls and review-before-action.", riskNotes: "No tax/accounting advice. Do not build agent features yet.", notes: null },
];

router.get("/roadmap", async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(roadmapItemsTable).orderBy(roadmapItemsTable.id);

    if (rows.length === 0) {
      const seeded = await db.insert(roadmapItemsTable).values(seedRoadmapItems).returning();
      res.json(seeded);
      return;
    }

    res.json(rows);
  } catch (error) {
    console.error("Roadmap route failed", error);
    res.status(500).json({ error: "Roadmap is not available yet. Check that the roadmap_items table has been pushed." });
  }
});

export default router;
