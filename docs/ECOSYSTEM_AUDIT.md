# Life Pilot Ecosystem Audit

Last updated: 2026-05-30

## Purpose

This document is the working audit for the Life Pilot ecosystem. It records what is currently known, what appears to be source-of-truth material, what is outdated, and what still needs to be built or moved into the repository.

This is a product, brand, documentation, and go-to-market audit only. It does not change code, database schema, authentication, permissions, migrations, seed data, or production-like data.

## Current source-of-truth position

Preferred source of truth, when available:

1. Current GitHub repository documentation and committed assets.
2. Gary's latest explicit correction in the current working session.
3. Recent Google Drive source documents that match the current direction.
4. Older uploaded files only as historical context.

Important rule: older documents must not be treated as current if Gary has corrected the decision later.

## Current correction to preserve

`Future View / What If Planner` is outdated language unless Gary explicitly reinstates it.

Current corrected bucket language includes:

- Future Life

Any new repository documentation, partner material, investor material, Canva prompt, or Replit handoff should use `Future Life` rather than `Future View / What If Planner`.

## Product ecosystem

### Life Pilot

Life Pilot is the umbrella personal life-navigation system.

Core promise:

> See what matters. Plan what's next. Take the next practical step.

Core line:

> For when life throws a whole lot of life at you.

Life Pilot helps people bring scattered parts of real life into view: money, work, home, documents, people, support, identity, obligations, income changes, reporting dates, and decisions.

### MYOH / Manage Your Own Household

MYOH is not a separate active public product.

It is the private/local working model and prototype foundation for Life Pilot, currently used by Gary and Sam. It should not be marketed, externally positioned, or renamed recklessly in code. Any database, schema, auth, permissions, or stored data changes connected to MYOH require explicit approval.

### Job Pilot

Job Pilot is a Life Pilot companion app for job search, job capture, AI scoring, applications, tasks, evidence, reporting, and next steps.

It connects mainly to:

- Life Admin
- Future Life
- Financial Life
- People & Support Network

### Gig Pilot

Gig Pilot is a Life Pilot companion app for irregular income, gig work, source/platform tracking, costs, earnings evidence, and future Life Pilot integration.

It must remain platform/source agnostic. The MVP may use DoorDash/Amazon Flex-first assumptions for practical build reasons, but the product must not become DoorDash-only, delivery-only, or hustle-culture.

### real Life Pilot

real Life Pilot is the social-impact overlay for Life Pilot.

Positioning:

> Support for when life gets very real.

It is not a separate generic welfare app and not where inclusion lives exclusively. Inclusion belongs in core Life Pilot.

Social overlay functions:

1. Detect pressure.
2. Model scenarios.
3. Guide action.
4. Connect support safely.

Hard rule: no token modules. Every real Life Pilot feature must either change the app experience in a culturally safe or identity-safe way, or help the user complete a practical action.

## Repository state found

### GitHub repositories

Relevant repositories found:

- `garyjmccourt-ops/Life_Pilot` — Life Pilot Core.
- `garyjmccourt-ops/Gig_Pilot` — Gig Pilot companion app.
- `garyjmccourt-ops/Job-Pilot` — Job Pilot companion app.

### Life Pilot GitHub evidence

Recent committed work indicates:

- Life Pilot GTM-style build plan exists.
- Life Pilot Replit build brief exists.
- MYOH to Life Pilot handoff notes exist.
- Recommended curve asset exists.
- Approved brand asset source of truth exists.
- Approved primary logo SVG exists.
- Financial scenario builder exists.
- BNPL, stored value, arrears, and adjusted weekly surplus work exists.
- Navigation was organised into life areas and dashboard buckets.

### Google Drive material found

Relevant Drive documents found:

- `Life_Pilot_Brand_Story_Commercial_Context.pdf`
- `Life_Pilot_Navigation_Operations_Map.pdf`
- `Life_Pilot_QA_Commercial_Readiness_Checklist.pdf`
- `Life_Pilot_UI_Visual_Rules.pdf`
- `Life_Pilot_Brand_Tokens.pdf`
- `Life Pilot Branding Rules` folder
- `Life Pilot brand kit` folder
- `Life pilot Files` folder

The commercial context pack is directly relevant and should be treated as useful source material, with one caveat: older bucket names must be corrected where they conflict with Gary's latest language.

## Current product architecture working draft

Use this until superseded by a newer locked architecture file.

Core Life Pilot areas:

1. Life Admin
   - Tasks
   - Calendar
   - Documents
   - Home routines
   - Appointments
   - Obligations

2. Financial Life
   - Income
   - Bills
   - Arrears
   - Safe-to-spend
   - Budget visibility
   - Reporting dates
   - BNPL / stored value
   - Financial pressure signals

3. Future Life
   - Scenario planning
   - Pressure weeks
   - Income drops
   - Bill shock
   - Arrears catch-up
   - Food bridge
   - Provider negotiation impacts
   - Option comparison
   - Suggested next practical steps

4. People & Support Network
   - Chosen family
   - Trusted contacts
   - Household members
   - Support workers
   - Recruiters
   - Providers
   - Communication preferences
   - Pronouns
   - Identity-safe relationship records

## Brand state

### Keep

- Life Pilot — Real Life Signal.
- Warm, grounded, practical, mature, inclusive, human, lightly wry, respectful, capable.
- Warm sand / off-white backgrounds.
- Deep slate text.
- Deep teal primary actions.
- Signal orange for next actions and attention markers.
- Near-white cards.
- Subtle spectrum line only as restrained inclusion signal.
- Rounded rectangular dashboard/app frame.
- Horizon or route line.
- Small waypoint marker.
- Practical dashboard layouts.

### Revise / watch

- Any `Future View / What If Planner` wording.
- Any cockpit, control tower, captain, pilot wings, airline/travel language.
- Any productivity-bro, charity/welfare, or mystical prediction language.
- Any large rainbow block visual treatment.
- Any social-impact material that makes inclusion look like an add-on rather than core product behaviour.

### Reject

- MYOH as a separate public product.
- DoorDash-only or delivery-only positioning for Gig Pilot.
- real Life Pilot as a generic welfare app.
- Token inclusion modules that do not change the user experience or help complete a practical action.

## Missing documents to build

The following repository docs are needed:

- `docs/BRAND_RULES.md`
- `docs/COMMERCIAL_DEVELOPMENT.md`
- `docs/CORE_TESTING_PARTNER_PACK.md`
- `docs/INVESTOR_RELATIONS_PACK.md`
- `docs/REPLIT_HANDOFF.md`
- `archive/superseded/OUTDATED_LANGUAGE.md`

Optional later:

- `docs/PROJECT_SCOPE.md`
- `docs/CURRENT_STATUS.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`
- `docs/CHANGELOG.md`
- `README.md`

## Key risks

1. Source drift between GitHub, Drive, Canva, Replit, and chat history.
2. Old bucket language reappearing in brand and partner material.
3. MYOH being treated as a public product instead of private prototype foundation.
4. Overbuilding partner/investor packs before the current product scope is clean.
5. Companion apps being pulled into core Life Pilot too early.
6. Brand visuals drifting into cockpit, airline, generic SaaS, cartoon, or charity territory.
7. Social-impact material making unsupported claims before testing evidence exists.

## Current decision

Proceed with repository documentation cleanup first.

Priority order:

1. Ecosystem audit.
2. Brand rules.
3. Commercial development pack.
4. Core testing partner pack.
5. Investor relations pack.
6. Replit handoff.
7. Superseded language archive.

## Next safe action

Create and maintain the core repository documentation listed above. Do not modify code or database-impacting files as part of this documentation pass.
