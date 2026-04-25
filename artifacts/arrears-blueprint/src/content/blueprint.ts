export type SectionType = 
  | 'text' 
  | 'list' 
  | 'template' 
  | 'tree' 
  | 'code';

export interface ContentBlock {
  type: SectionType;
  content: string | string[] | any;
  title?: string;
}

export interface Section {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export const blueprintContent: Section[] = [
  {
    id: "system-architecture",
    title: "1. System Architecture",
    blocks: [
      {
        type: "text",
        content: "Rule: each fact lives in exactly one system. Every other system links to it."
      },
      {
        type: "list",
        content: [
          "Spreadsheet — all numbers, calculations, balances, weekly/monthly equivalents, scenario modelling, totals, and any figure that should auto-update when inputs change.",
          "Notes / Wiki — written reasoning, plans, agreements, call notes, communication drafts, evidence links, decision history, and anything that needs context or narrative.",
          "Email + Calendar — incoming bills, statements, receipts, creditor correspondence, payment confirmations, and date-driven reminders (due dates, review dates, court/hearing dates).",
          "Tasks / Reminders — every action item with an owner and a date: follow-ups, payments to make, calls to place, evidence to file, reviews to run."
        ]
      }
    ]
  },
  {
    id: "notebook-structure",
    title: "2. Notebook / Wiki Structure",
    blocks: [
      {
        type: "list",
        content: [
          "00 — System: how the system works, conventions, links to the spreadsheet.",
          "10 — Income & Budget: narrative around income sources, assumptions, and weekly logic.",
          "20 — Arrears Plans: one page per arrears item (internal/private view).",
          "30 — External Communications: sanitised plans and message drafts per creditor.",
          "40 — Call & Comms Log: chronological record of all interactions.",
          "50 — Evidence Index: pointers to documents stored in email/archive.",
          "60 — Reviews & Decisions: weekly/monthly review notes and decision log.",
          "90 — Reference: contact details, account numbers, reference IDs, scripts."
        ]
      }
    ]
  },
  {
    id: "starter-pages",
    title: "3. Starter Pages by Section",
    blocks: [
      {
        type: "list",
        content: [
          "00 — System: System Overview; Conventions & Naming; Links Index (Spreadsheet, Email, Tasks)",
          "10 — Income & Budget: Income Assumptions Notes; Weekly Budget Logic; Scenario Notes (Low / Base / High)",
          "20 — Arrears Plans: Rent Arrears Plan; Electricity Arrears Plan; Gas / Water Arrears Plan; Council / Local Tax Arrears Plan; Fines Plan; Child Support Plan; Personal Debt — [Creditor A]; Personal Debt — [Creditor B]",
          "30 — External Communications: Rent — External Plan & Drafts; Utilities — External Plan & Drafts; Fines — External Plan & Drafts; Child Support — External Plan & Drafts; Personal Debts — External Plan & Drafts",
          "40 — Call & Comms Log: Call Log — Current Month; Call Log — Archive",
          "50 — Evidence Index: Bills Index; Receipts Index; Correspondence Index; Agreements Index",
          "60 — Reviews & Decisions: Weekly Review Notes; Monthly Review Notes; Decision Log",
          "90 — Reference: Creditor Contacts; Account & Reference Numbers; Standard Phrases / Scripts"
        ]
      }
    ]
  },
  {
    id: "internal-plan-template",
    title: "4. Arrears Reduction Plan (Internal)",
    blocks: [
      {
        type: "template",
        content: `# [Item] Arrears Plan

## Summary
One-paragraph plain-language description.

## Current Position
- Total owed:
- Last statement date:
- Active arrangement: yes / no
- Risk level: low / medium / high

## Objective
What "resolved" looks like and by when.

## Current Arrangement
- Amount:
- Frequency:
- Start date:
- Source of funds:

## Working Plan
- Step 1 — action / amount / date
- Step 2 — 
- Step 3 — 
- Contingencies:

## Communication Position
- What we will say externally
- What we will not disclose
- Tone

## Evidence Links
- Latest bill:
- Latest statement:
- Agreement letter:
- Payment receipts:

## Call Log
- YYYY-MM-DD — channel — who — outcome — next step

## Change Log
- YYYY-MM-DD — what changed — why

## Review Date
- Next review:
- Trigger conditions for early review:`
      }
    ]
  },
  {
    id: "external-plan-template",
    title: "5. Sanitised External Plan Template",
    blocks: [
      {
        type: "text",
        content: "Drafting rules: no income figures, no household composition, no medical detail, no third-party debt totals, no speculative future income."
      },
      {
        type: "template",
        content: `# [Creditor] — External Plan

## Acknowledgement
Brief acknowledgement of the debt and the relationship.

## Current Payment Intent
- Ongoing charge will be paid: amount / frequency / from date
- Method:

## Staged Arrears Reduction
- Stage 1: amount / frequency / from date
- Stage 2 (if applicable): amount / frequency / from date
- Indicative full-clearance horizon (range, not promise)

## Review Points
- First review date:
- Conditions that would trigger an earlier conversation:

## Communication Tracking
- Preferred channel:
- Reference to use:
- Sent log: YYYY-MM-DD — channel — subject — response received y/n`
      }
    ]
  },
  {
    id: "spreadsheet-tabs",
    title: "6. Spreadsheet Tab Structure",
    blocks: [
      {
        type: "text",
        content: "Conventions: weekly equivalent everywhere. Lock formulas. Inputs one color, calculated cells another, never overwrite calculated cells."
      },
      {
        type: "list",
        content: [
          "Inputs / Assumptions — every variable used elsewhere (pay rates, frequencies, dates, fixed deductions). Single source for formulas.",
          "Income Assumptions — gross/net per source, frequency, weekly + monthly equivalents, low/base/high scenarios.",
          "Personal Expenses — itemised living costs with frequency and weekly equivalent.",
          "Bills Register — every recurring bill: provider, account ref, amount, frequency, due day, autopay y/n.",
          "Arrears Matrix — one row per arrears item: creditor, balance, ongoing charge, arrears payment, total weekly cost, next review date, status.",
          "Weekly Tracker — week-by-week: income in, fixed bills, arrears payments, discretionary, variance vs plan.",
          "Monthly Tracker — roll-up of weekly tracker; compares to monthly obligations and statements.",
          "Budget Summary — single dashboard view: total in, total out, surplus/deficit, % of income to arrears, headroom.",
          "Scenarios — clone of summary driven by alternative inputs (income drop, extra cost, windfall).",
          "Calendar / Schedule — payments due by date for the next 8–12 weeks (feeds calendar/tasks)."
        ]
      }
    ]
  },
  {
    id: "email-workflow",
    title: "7. Email & Evidence Workflow",
    blocks: [
      {
        type: "text",
        title: "Folder structure (mirror in archive)",
        content: ""
      },
      {
        type: "tree",
        content: [
          { name: "Finance", children: [
            { name: "Bills", children: [
              { name: "Rent" },
              { name: "Electricity" },
              { name: "Gas" },
              { name: "Water" },
              { name: "Council" },
              { name: "Internet-Phone" }
            ]},
            { name: "Receipts", children: [{ name: "YYYY" }] },
            { name: "Arrears", children: [{ name: "Rent" }, { name: "[Creditor]" }] },
            { name: "Statements" },
            { name: "Agreements" },
            { name: "Government" }
          ]}
        ]
      },
      {
        type: "text",
        title: "Labels",
        content: "action-required; awaiting-response; evidence; agreement; paid; dispute; for-review"
      },
      {
        type: "list",
        title: "Handling rules",
        content: [
          "Bills → save PDF to /Bills/[Provider], label evidence, log amount in spreadsheet Bills Register.",
          "Receipts → /Receipts/YYYY, label paid, tick in Weekly Tracker.",
          "Arrears correspondence → /Arrears/[Creditor], label evidence + status label, summarise in Call & Comms Log, link to Arrears Plan.",
          "Agreements → /Agreements, label agreement, link from the relevant Arrears Plan."
        ]
      },
      {
        type: "text",
        title: "Wiki ↔ email linkage",
        content: "Each Arrears Plan's Evidence Links section holds direct links/permalinks to the email or archived file — never copies of the document. Evidence Index pages list every linked item with date, creditor, type, and a one-line description."
      }
    ]
  },
  {
    id: "task-workflow",
    title: "8. Task & Reminder Workflow",
    blocks: [
      {
        type: "text",
        content: "**Buckets:** Pay, Contact, File, Review, Negotiate, Watch\n**Labels:** creditor (rent, electric, gas, water, council, fines, child-support, debt-[name]); priority (p1, p2, p3); type (recurring, one-off, trigger); status (blocked, awaiting-reply)"
      },
      {
        type: "list",
        title: "Reminder cadence",
        content: [
          "Weekly: weekly review; pay fixed bills; update tracker; clear inbox.",
          "Monthly: reconcile statements; refresh Arrears Matrix; update Budget Summary; review one Arrears Plan in depth.",
          "Quarterly: re-baseline income assumptions; refresh scenarios; rotate creditor outreach.",
          "Trigger-based: new statement received, payment failure, income change, agreement expiry, court/hearing notice, creditor contact attempt."
        ]
      },
      {
        type: "text",
        content: "Every task carries: due date, creditor tag, link to the relevant wiki page, and the spreadsheet cell/tab it affects."
      }
    ]
  },
  {
    id: "weekly-rhythm",
    title: "9. Weekly Operating Rhythm",
    blocks: [
      {
        type: "text",
        content: "Time-box: 30–45 minutes, same day each week."
      },
      {
        type: "list",
        content: [
          "Spreadsheet: enter actual income; tick paid bills/arrears; refresh Weekly Tracker; check Budget Summary; adjust upcoming week if variance is material.",
          "Notes/Wiki: update Weekly Review note; update any Arrears Plan whose status changed; log calls/messages in Call & Comms Log.",
          "Email: clear action-required label to zero; file new bills/receipts; confirm awaiting-response items; archive resolved threads.",
          "Tasks: close completed tasks; promote next week's Pay & Contact items to dated reminders; raise new tasks; confirm next review date."
        ]
      }
    ]
  },
  {
    id: "minimal-implementation",
    title: "10. Minimal 1-Hour Implementation",
    blocks: [
      {
        type: "list",
        content: [
          "Spreadsheet (4 tabs): Inputs; Bills & Arrears; Weekly Tracker (current + next 4 weeks); Summary",
          "Notes/Wiki (5 pages): System Overview & Links; Income & Budget Notes; Arrears Plans; Call & Comms Log; Weekly Review",
          "Email (3 folders, 2 labels): Bills, Arrears, Receipts; labels action-required + evidence",
          "Tasks (3 lists): Pay, Contact, Review; recurring 'Run weekly review' task"
        ]
      }
    ]
  },
  {
    id: "naming-conventions",
    title: "11. Naming Conventions",
    blocks: [
      {
        type: "list",
        content: [
          "Spreadsheet files: Budget_YYYY_v#.ext (e.g. Budget_2026_v3). Keep one live file; archive prior versions quarterly.",
          "Notebook/wiki pages: Section## - Title (e.g. 20 - Rent Arrears Plan).",
          "Arrears plans: [Creditor] Arrears Plan. External versions: [Creditor] - External Plan.",
          "Evidence items (email subjects/file names): YYYY-MM-DD - [Creditor] - [Type] - [Short description] (e.g. 2026-04-12 - Electricity - Bill - Q2 statement).",
          "Communication logs: YYYY-MM-DD HH:MM - [Channel] - [Creditor] - [Outcome].",
          "Tasks: [Verb] [Creditor] [Object] - by YYYY-MM-DD (e.g. Pay Rent arrears instalment - by 2026-05-02)."
        ]
      }
    ]
  },
  {
    id: "best-operating-principle",
    title: "12. Best Operating Principle",
    blocks: [
      {
        type: "list",
        content: [
          "Numbers live in the spreadsheet — if it's a figure, calculate it there and read it from there.",
          "Decisions and logic live in the notes/wiki — if it explains why, it belongs in writing.",
          "Evidence lives in the email/archive layer — original documents stay where they arrived; everything else links to them.",
          "Actions live in the task system — if it has a date or an owner, it is a task, not a note."
        ]
      },
      {
        type: "text",
        content: "When the four layers stop overlapping, the system stays maintainable under pressure: you update one thing in one place, and the others just point to it."
      }
    ]
  }
];
