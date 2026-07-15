# Life Pilot

Last updated: 2026-07-15

## Locked source of truth

The authoritative product document is:

- `docs/LIFE_PILOT_SOURCE_OF_TRUTH_v1.0.md`

Where material conflicts, that locked document takes precedence unless Gary later makes an explicit written decision.

## Product

Life Pilot is a personal life-navigation platform built to help people understand how the connected parts of life affect one another, especially where social and economic pressure is present.

It helps people bring money, work, home, family, future decisions, documents, people, providers, obligations and activity into one practical view, then:

> See what matters. Plan what's next. Take the next practical step.

Core line:

> For when life throws a whole lot of life at you.

Theme:

> Life Pilot - Real Life Signal

## Primary commercial customer

The primary customer context is organisation-supported access and testing through:

- Government and local government.
- NGOs and not-for-profits.
- Community organisations and social enterprises.
- Employment, housing, financial wellbeing and family-support services.

The end user is the person or household navigating real life. User agency, consent and non-shaming design are mandatory.

## Locked product architecture

### Life Pilot Starter

The always-on commercial core and current MVP focus.

### Four Core Life Areas

These are the only default top-level Life Areas:

1. Home Life.
2. Work Life.
3. Family Life.
4. Future Life.

Money is a foundational signal across all four areas. It is not a fifth bucket. Support also works across the four areas rather than becoming a default Support Life bucket.

### Life Tools

Shared tools operating across the four Life Areas, including activity, calendar overlay, documents/evidence, people/providers, shopping and budget checks, notifications and Control Centre.

### Activated layers

- Real Life - activated when life becomes unusually difficult or complex.
- Business Life - activated for relevant self-employment or business contexts.

Activated layers are not default buckets and are not current MVP build priorities.

### Companion products

- Job Pilot.
- Job Pilot Lite.
- Gig Pilot.
- Trade Pilot.

## MVP target and scope

**Target:** Q3 FY2026-27 (1 January to 31 March 2027).

MVP includes:

- Life Signal dashboard.
- Four Core Life Areas.
- Minimum Life Tools needed for the core journey.
- Money-linked visibility across the Life Areas.
- Next Practical Step guidance.
- Controlled basic scenario planning.
- Explainable signal and scenario logic.
- A product experience suitable for structured partner testing.

Basic scenario planning already exists. It uses a fixed library of scenarios with limited adjustability. It is rules-led and explainable, not open-ended AI prediction. Advanced AI must wait until the underlying signal model has been shown to produce reliable, repeatable results.

## Current priorities

### Active

1. Life Pilot commercial MVP.
2. Main Job Pilot.
3. Job Pilot Lite, built in Google AI Studio.

### Parked

Everything else is parked unless Gary explicitly promotes it, including Gig Pilot, Trade Pilot, Business Life, Real Life activated workflows, Receipt Scanner, Receipt Scanner Pro, advanced AI and other future operating ideas.

## MYOH boundary

MYOH / Manage Your Own Household is the private working model and prototype foundation currently used by Gary and Sam.

It is not a separate public product. Do not market it, externally position it or broadly rename its internal code, database, schema, auth, permissions or stored data without Gary's explicit approval.

## Brand direction

Look and feel:

> A warm, grown-up life-navigation notebook meets a practical dashboard.

Use warm sand and near-white surfaces, deep slate text, deep teal primary actions and signal orange only for next actions and important attention markers. The four-dash motif must match the approved GPS colours, order and proportions.

Avoid cockpit, airline, captain, plane, wings, cartoon, charity-cliche, generic SaaS and mystical-prediction language or visuals.

## Repository documentation

Key docs:

- `docs/LIFE_PILOT_SOURCE_OF_TRUTH_v1.0.md` - locked product authority.
- `docs/CURRENT_STATUS.md` - current operating status.
- `docs/ECOSYSTEM_AUDIT.md` - ecosystem and source-drift audit.
- `docs/BRAND_RULES.md` - brand and visual guardrails.
- `docs/COMMERCIAL_DEVELOPMENT.md` - commercial pathway and customer strategy.
- `docs/CORE_TESTING_PARTNER_PACK.md` - partner testing foundation.
- `docs/INVESTOR_RELATIONS_PACK.md` - investor and funder narrative.
- `docs/REPLIT_HANDOFF.md` - safe implementation handoff.

## Build safety

Do not change database schema, migrations, data models, seed data, auth, permissions, production-like stored data or broad MYOH internal names without Gary's explicit approval.

Documentation alignment does not authorise implementation changes.
