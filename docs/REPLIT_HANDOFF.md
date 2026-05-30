# Life Pilot Replit Handoff

Last updated: 2026-05-30

## Purpose

This document is the safe handoff note for Replit Pilot, Build GPT, or any implementation assistant working on Life Pilot.

It defines the product intent, current guardrails, and next-safe-step behaviour.

This document is product/service/UX/brand guidance only. It does not authorise database, schema, migration, auth, permission, seed data, or production-like data changes.

## Project

Life Pilot

## Context

Life Pilot is a personal life-navigation system built from lived experience.

It helps users bring scattered parts of real life into view: money, work, home, documents, people, support, identity, obligations, income changes, reporting dates, and decisions.

Core promise:

> See what matters. Plan what's next. Take the next practical step.

Core line:

> For when life throws a whole lot of life at you.

## Product state

Current ecosystem:

- Life Pilot Core: main umbrella product.
- MYOH / Manage Your Own Household: private/local prototype foundation, not public product.
- Job Pilot: companion app for job search, applications, tasks, evidence, and reporting.
- Gig Pilot: companion app for irregular income and gig work evidence.
- real Life Pilot: social-impact overlay for support workflows and safety controls.

## Current core areas

Use the current corrected architecture:

1. Life Admin
2. Financial Life
3. Future Life
4. People & Support Network

Do not treat `Future View / What If Planner` as the current bucket name unless Gary explicitly reinstates it.

## Brand rules

Use Life Pilot — Real Life Signal.

The product should feel:

- Warm
- Grounded
- Practical
- Mature
- Inclusive
- Human
- Respectful
- Capable

Look and feel:

> A warm, grown-up life-navigation notebook meets a practical dashboard.

Use:

- Warm sand backgrounds.
- Near-white cards.
- Deep slate text.
- Deep teal primary actions.
- Signal orange only for attention/next actions.
- Subtle spectrum line only as a restrained inclusion signal.
- Rounded rectangular dashboard/app frames.
- Horizon/route lines and waypoint markers where useful.

Avoid:

- Cockpit.
- Control tower.
- Captain.
- Planes.
- Pilot wings.
- Airline/travel branding.
- Cartoon style.
- Charity/welfare clichés.
- Big rainbow blocks.
- Generic SaaS gradients.
- Productivity-bro language.
- Mystical prediction language.

## MYOH safety rule

MYOH is the private prototype/foundation for Life Pilot.

Do not broadly rename MYOH database tables, schema, storage keys, auth, permissions, seed data, local storage keys, or stored data unless Gary explicitly approves the specific change.

If a label can be safely changed in the UI without affecting data or app behaviour, list it clearly before implementation.

## Database and auth safety

Do not change any of the following without explicit approval:

- Database schema.
- Migrations.
- Data models.
- Auth.
- Permissions.
- Seed data.
- Production-like stored data.
- User identity fields.
- Export/share permissions.
- API contract changes that could break existing data.

If a change might affect any of the above, stop and ask for explicit approval.

## Preferred Replit workflow

Use one safe prompt/change at a time.

After each build step, report:

1. Changed files.
2. What was completed.
3. What was not touched.
4. Tests/checks run.
5. Any errors or warnings.
6. Next safe step.

Avoid broad refactors unless explicitly approved.

## Current safe implementation priorities

Product/UX priorities only; implementation details belong to Replit Pilot/Build GPT.

1. Align visible language with current architecture.
2. Replace outdated `Future View / What If Planner` bucket wording with `Future Life` where safe.
3. Keep MYOH private prototype references in internal/handoff contexts only.
4. Make dashboard bucket language match brand rules.
5. Keep Financial Life, Life Admin, Future Life, and People & Support Network distinct.
6. Keep Job Pilot and Gig Pilot as companion references, not merged core modules.
7. Ensure warning/attention states use signal orange purposefully.
8. Avoid any cockpit/airline/pilot-wing visuals or wording.

## Replit prompt pattern

Use this structure for build prompts:

```text
Task: [one specific safe task]

Context:
Life Pilot is a personal life-navigation system. Use the current Life Pilot Brand Rules and keep MYOH as the private prototype/foundation only.

Required behaviour:
[clear user-facing behaviour]

Do not touch:
- Database schema
- Migrations
- Auth
- Permissions
- Seed data
- Stored production-like data
- Broad MYOH internal names unless explicitly approved

After completion, report:
- Changed files
- What was completed
- What was not touched
- Tests/checks run
- Any warnings
- Next safe step
```

## Acceptance intent

A change is acceptable if:

- It improves clarity without widening scope.
- It follows Life Pilot brand rules.
- It uses `Future Life` as the current bucket language.
- It does not accidentally turn MYOH into a public product.
- It does not merge companion apps into core prematurely.
- It does not change database/auth/schema without approval.
- It produces a clear post-change summary.

## Current documentation dependencies

Before implementation, check:

- `docs/ECOSYSTEM_AUDIT.md`
- `docs/BRAND_RULES.md`
- `docs/COMMERCIAL_DEVELOPMENT.md`
- `docs/CORE_TESTING_PARTNER_PACK.md`
- `docs/INVESTOR_RELATIONS_PACK.md`
- `archive/superseded/OUTDATED_LANGUAGE.md`

## Next safe handoff action

Ask Replit Pilot to run a language and UI-label audit only. Do not apply broad code changes until the audit report identifies exact safe changes.
