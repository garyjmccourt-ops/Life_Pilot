# Life Pilot Current Status

Last updated: 2026-05-30

## Current status summary

Life Pilot is in a source-of-truth consolidation phase.

The immediate priority is to make the repository clear enough that future Replit, Canva, partner, commercial, and investor work does not drift back into older language or unsafe assumptions.

This is a documentation and product-direction status file only. It does not authorise code, database, schema, migration, auth, permission, seed data, or production-like data changes.

## Current source of truth

Use this order:

1. Current GitHub repository documentation.
2. Gary's latest explicit correction.
3. Recent Google Drive source documents that match current decisions.
4. Older uploaded files only as historical context.

Do not claim that a Life Pilot decision is locked, approved, current, or final unless it matches the latest repository/project source of truth.

## Current correction to preserve

Use:

- Future Life

Do not treat this as current top-level bucket language unless Gary explicitly reinstates it:

- Future View
- What If Planner

`What If` may still be used descriptively inside Future Life if useful, but it should not be treated as the current top-level bucket name.

## Current product architecture

### Life Pilot Core

Life Pilot is the umbrella personal life-navigation platform.

Core areas:

1. Life Admin
2. Financial Life
3. Future Life
4. People & Support Network

### MYOH / Manage Your Own Household

Status: private/local prototype foundation only.

MYOH is currently used by Gary and Sam and should not be externally marketed or positioned as a separate active public product.

Do not broadly rename MYOH internal code, database, schema, auth, storage, or stored data without explicit approval.

### Job Pilot

Status: companion app.

Purpose: job search, job capture, AI scoring, applications, tasks, evidence, reporting, and next steps.

### Gig Pilot

Status: companion app.

Purpose: irregular income, gig work tracking, source/platform activity, costs, evidence, and future Life Pilot integration.

Guardrail: keep it platform/source agnostic. Do not make it DoorDash-only, delivery-only, or hustle-culture.

### real Life Pilot

Status: social-impact overlay.

Positioning:

> Support for when life gets very real.

Guardrail: inclusion belongs in core Life Pilot, not only in the overlay.

## Current repository documentation state

Created during the 2026-05-30 cleanup pass:

- `README.md`
- `docs/ECOSYSTEM_AUDIT.md`
- `docs/BRAND_RULES.md`
- `docs/COMMERCIAL_DEVELOPMENT.md`
- `docs/CORE_TESTING_PARTNER_PACK.md`
- `docs/INVESTOR_RELATIONS_PACK.md`
- `docs/REPLIT_HANDOFF.md`
- `archive/superseded/OUTDATED_LANGUAGE.md`

## Current Drive/source material found

Relevant Google Drive material found and used as context:

- `Life_Pilot_Brand_Story_Commercial_Context.pdf`
- `Life_Pilot_Navigation_Operations_Map.pdf`
- `Life_Pilot_QA_Commercial_Readiness_Checklist.pdf`
- `Life_Pilot_UI_Visual_Rules.pdf`
- `Life_Pilot_Brand_Tokens.pdf`
- `Life Pilot Branding Rules` folder
- `Life Pilot brand kit` folder
- `Life pilot Files` folder

Notes:

Some Drive material uses older bucket language. Where it conflicts with Gary's latest correction, use the current repository language.

## Current GitHub findings

Relevant repos:

- `garyjmccourt-ops/Life_Pilot`
- `garyjmccourt-ops/Gig_Pilot`
- `garyjmccourt-ops/Job-Pilot`

Known Life Pilot repo signals:

- Life Pilot GTM-style build plan exists in history.
- Life Pilot Replit build brief exists in history.
- MYOH to Life Pilot handoff notes exist in history.
- Approved primary logo SVG exists in history.
- Approved brand asset source-of-truth exists in history.
- Financial scenario builder work exists in history.
- BNPL, stored value, arrears, and adjusted weekly surplus work exists in history.
- Navigation organised into life areas and dashboard buckets exists in history.

Known Gig Pilot signals:

- Shift logging and recommendations exist.
- Migration plan included OCR, route-KM, weekly summary, MYOH export, and settings work.
- Brand should be checked against current Life Pilot rules before further polish.

Known Job Pilot signals:

- Build prompt PDF exists in attached assets.
- API endpoints for jobs, tasks, profiles, and data retrieval exist.
- A later Replit checkpoint saved progress at end of loop.

## Current brand status

Theme:

> Life Pilot — Real Life Signal

Look and feel:

> A warm, grown-up life-navigation notebook meets a practical dashboard.

Known progress:

- Approved primary logo SVG exists in repository history.
- Approved brand asset source-of-truth exists in repository history.
- Brand tokens and UI visual rules exist in Drive.
- Colour swatch material exists.

Needs checking before being treated as fully final:

- Any Canva outputs not yet reviewed as Save / Revise / Reject.
- Any Drive or uploaded docs that still use Future View / What If Planner.
- Any visual assets that drift into cartoon, airline, cockpit, generic SaaS, or charity territory.

## Current commercial status

Commercial direction is drafted in `docs/COMMERCIAL_DEVELOPMENT.md`.

Current commercial logic:

- Build evidence before overclaiming.
- Use core testing partner pack before broad sales/investor claims.
- Treat commercial model options as options, not locked decisions.
- Keep direct user, partner-funded, social-impact licensing, and companion-app pathways open until tested.

## Current partner status

Core testing partner pack foundation exists in `docs/CORE_TESTING_PARTNER_PACK.md`.

Current partner direction:

- Morella-style / Narawindi-style partner framing is appropriate as a pattern.
- Pack should be adapted once a specific partner is chosen.
- The first partner engagement should validate usefulness, safety, language, and practical next-step behaviour.

Not yet done:

- Partner-specific version.
- Testing cohort design.
- Consent/export/sharing rules.
- Partner-facing deck.

## Current investor status

Investor relations pack foundation exists in `docs/INVESTOR_RELATIONS_PACK.md`.

Current investor direction:

- Evidence-led.
- Grounded.
- No exaggerated impact claims.
- Show product ecosystem, working build base, commercial pathways, social-impact relevance, and testing plan.

Not yet done:

- Investor-facing deck.
- Financial model.
- Use-of-funds detail.
- Partner evidence.
- Roadmap costings.

## Current Replit/build status

Replit work should follow `docs/REPLIT_HANDOFF.md`.

Safe next Replit action:

Run a language and UI-label audit only.

Do not immediately apply broad code changes.

The audit should check for:

- Future View / What If Planner wording.
- MYOH public-product drift.
- Cockpit/airline/pilot-wing language.
- Old bucket names.
- Companion apps being merged into core too early.
- Brand token mismatches.

## Current risks

1. Old files reintroduce outdated language.
2. Future View / What If Planner appears as current architecture.
3. MYOH gets treated as a public product.
4. Partner material overclaims before testing evidence.
5. Investor material overstates readiness.
6. Gig Pilot becomes delivery-only or hustle-culture.
7. Social-impact language becomes generic welfare framing.
8. Replit changes touch database/auth/schema without approval.
9. Canva visuals drift into cartoon, airline, cockpit, or generic SaaS.

## Current priorities

### Priority 1: Source of truth

Complete repository entry docs and status docs.

Status: underway / mostly complete.

### Priority 2: Replit audit

Run a safe language/UI audit before implementation changes.

Status: not started.

### Priority 3: Partner pack refinement

Turn the generic core testing partner pack into a partner-specific version once partner target is chosen.

Status: draft foundation created.

### Priority 4: Investor pack refinement

Turn the investor relations pack into a concise investor/funder deck or memo.

Status: draft foundation created.

### Priority 5: Canva/brand reconciliation

Check approved Canva/brand assets against `docs/BRAND_RULES.md` and archive rejected variants.

Status: not complete.

## Next safe action

Ask Replit Pilot / Build GPT for a documentation-informed language and UI-label audit using `docs/REPLIT_HANDOFF.md`.

Do not request implementation changes until the audit report identifies exact safe edits.
