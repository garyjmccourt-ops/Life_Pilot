# Life Pilot

Last updated: 2026-05-30

## Project

Life Pilot is a personal life-navigation system built from lived experience.

It helps people bring the scattered parts of real life into view — money, work, home, documents, people, support, identity, obligations, income changes, reporting dates, and decisions — then see what matters, plan what's next, and take the next practical step.

Core line:

> For when life throws a whole lot of life at you.

Supporting promise:

> See what matters. Plan what's next. Take the next practical step.

## Current source-of-truth warning

This repository should be treated as the preferred project source of truth when available.

Older uploads, Canva outputs, Drive files, Replit text, and chat history may contain superseded wording. Do not treat older material as locked, approved, or current unless it matches the latest repository documentation or Gary's latest explicit correction.

Current correction to preserve:

- Use `Future Life` as the current bucket language.
- Do not treat `Future View / What If Planner` as current top-level bucket language unless Gary explicitly reinstates it.

## Product ecosystem

### Life Pilot Core

The umbrella personal life-navigation platform.

Core areas:

1. Life Admin
2. Financial Life
3. Future Life
4. People & Support Network

### MYOH / Manage Your Own Household

MYOH is the private/local working model and prototype foundation for Life Pilot, currently used by Gary and Sam.

MYOH is not a separate active public product. Do not market it, externally position it, or broadly rename its internal code/database/schema/auth/storage concepts without Gary's explicit approval.

### Job Pilot

A Life Pilot companion app for job search, job capture, AI scoring, applications, tasks, evidence, reporting, and next steps.

### Gig Pilot

A Life Pilot companion app for irregular income, gig work, source/platform tracking, costs, earnings evidence, and future Life Pilot integration.

Gig Pilot must remain platform/source agnostic. It must not become DoorDash-only, delivery-only, or hustle-culture.

### real Life Pilot

The social-impact overlay for Life Pilot.

Positioning:

> Support for when life gets very real.

real Life Pilot is not a separate generic welfare app and not where inclusion lives exclusively. Inclusion belongs in core Life Pilot.

## Brand direction

Theme:

> Life Pilot — Real Life Signal

Look and feel:

> A warm, grown-up life-navigation notebook meets a practical dashboard.

Use:

- Warm sand / off-white backgrounds.
- Near-white cards.
- Deep slate text.
- Deep teal-green primary actions.
- Signal orange for next actions and attention markers.
- Subtle spectrum line only as a restrained inclusion signal.
- Rounded rectangular dashboard/app frames.
- Simple horizon or route lines.
- Small waypoint markers.

Avoid:

- Cockpit.
- Control tower.
- Captain.
- Planes.
- Pilot wings.
- Airline/travel branding.
- Cartoon people or cartoon icons.
- Charity/welfare clichés.
- Large rainbow blocks.
- Generic SaaS gradients.
- Productivity-bro language.
- Mystical prediction language.

## Repository documentation

Key docs:

- `docs/CURRENT_STATUS.md` — current working status and immediate priorities.
- `docs/ECOSYSTEM_AUDIT.md` — ecosystem audit and source-of-truth map.
- `docs/BRAND_RULES.md` — brand rules, voice, visuals, and drift controls.
- `docs/COMMERCIAL_DEVELOPMENT.md` — commercial development direction.
- `docs/CORE_TESTING_PARTNER_PACK.md` — partner testing pack foundation.
- `docs/INVESTOR_RELATIONS_PACK.md` — investor/funder/advisor pack foundation.
- `docs/REPLIT_HANDOFF.md` — safe handoff for Replit/Build GPT work.
- `archive/superseded/OUTDATED_LANGUAGE.md` — superseded terms and rejected directions.

## Build safety

Do not change any of the following without explicit approval from Gary:

- Database schema.
- Migrations.
- Data models.
- Auth.
- Permissions.
- Seed data.
- Production-like stored data.
- Broad MYOH internal names.
- User identity or export/share permission logic.

## Current working priority

Documentation and source-of-truth cleanup first.

Then:

1. Review current app UI labels against brand rules.
2. Confirm current bucket language.
3. Prepare safe Replit handoff.
4. Build partner and investor-facing deck/memo versions from the repository docs.
5. Return to product build only after the current source of truth is clear.

## Next safe action

Use `docs/CURRENT_STATUS.md` before starting new work.
