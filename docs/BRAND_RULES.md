# Life Pilot Brand Rules

Last updated: 2026-05-30

## Purpose

This document defines the working brand rules for Life Pilot across GitHub documentation, Replit prompts, Canva outputs, product copy, partner material, and investor material.

It is intended to prevent drift between older files, Canva experiments, Replit outputs, and current product decisions.

## Brand

Name: Life Pilot

Theme: Life Pilot — Real Life Signal

Core line:

> For when life throws a whole lot of life at you.

Supporting promise:

> See what matters. Plan what's next. Take the next practical step.

## Meaning of Real Life Signal

Real Life means the product is grounded in lived experience, not polished productivity fantasy.

Signal means the product helps surface what matters, what needs attention, and what the next practical step is.

Real Life Signal is a brand and visual theme. It is not a separate app, product, or feature.

## Brand feeling

Life Pilot should feel:

- Warm
- Grounded
- Practical
- Mature
- Inclusive
- Human
- Lightly wry where appropriate
- Respectful
- Capable

Look and feel:

> A warm, grown-up life-navigation notebook meets a practical dashboard.

## Visual anchors

Use:

- Warm sand / off-white backgrounds.
- Near-white cards.
- Deep slate text.
- Deep teal-green primary actions.
- Signal orange for next actions, attention markers, and important highlights.
- Warm light-grey borders and subtle dividers.
- Rounded rectangular dashboard/app frames.
- Simple horizon or route lines.
- Small waypoint markers.
- Practical dashboard layouts.
- Almost-square cards with subtle radius.
- A subtle spectrum line only as a restrained inclusion and identity-safe signal.

Avoid:

- Cockpit imagery.
- Control tower imagery.
- Captain language.
- Planes.
- Pilot wings.
- Airline/travel branding.
- Cartoon people or cartoon icons.
- Charity/welfare clichés.
- Large rainbow blocks.
- Robot AI imagery.
- Generic SaaS gradients.
- Productivity-bro language.
- Mystical prediction language.

## Colour system

Approved colour system:

| Token | HSL | Use |
|---|---:|---|
| Warm Sand | `hsl(40 33% 96%)` | Main background |
| Deep Slate Blue | `hsl(200 40% 15%)` | Main text, headings, serious content |
| Deep Teal-Green | `hsl(180 25% 35%)` | Primary buttons, active states, steady-system actions |
| Near White | `hsl(40 33% 98%)` | Card background and text on primary |
| Slightly Darker Sand | `hsl(40 33% 93%)` | Sidebar, panels, secondary surfaces |
| Warm Light Grey | `hsl(40 20% 85%)` | Borders, dividers, card outlines |
| Mid Slate | `hsl(200 20% 45%)` | Muted text, captions, metadata |
| Muted Red | `hsl(10 50% 50%)` | Destructive actions and serious high-risk states only |
| Signal Orange | `hsl(24 85% 55%)` | Next actions, attention markers, important highlights |
| Soft Signal Surface | `hsl(28 80% 92%)` | Needs-attention cards and alert backgrounds |
| Dark Signal Text | `hsl(24 65% 32%)` | Text on soft orange surfaces |
| Subtle Spectrum Line | n/a | Restrained inclusion and identity-safe signal |

Rules:

- Use orange as a signal/action colour, not as decoration everywhere.
- Use the spectrum line sparingly.
- Keep the palette warm and practical.
- Do not use harsh neon colours.
- Do not use large rainbow blocks.
- Do not make the product look like a cold finance app.
- Do not make the product look like a cartoon brand.

## Typography

Preferred:

- Libre Baskerville for headings, story moments, major brand statements, and refined wordmark use.
- DM Sans for body text, UI, labels, buttons, and cards.
- JetBrains Mono only for IDs, JSON, exports, technical labels, and structured examples.

## Voice

Use plain English.

Be practical, respectful, warm, and human.

Be lightly wry only where the context is safe. Do not be jokey in serious situations.

Use non-shaming language.

Do not assume family structure, gender, income stability, household type, work capacity, or support needs.

Preferred phrases:

- This needs attention.
- Here are the next options.
- Bring the important pieces into view.
- Trusted contact.
- Chosen family.
- Support network.
- Future Life.
- Next practical step.
- For when life throws a whole lot of life at you.

Avoid:

- Get organised.
- You are overdue.
- Family contact only.
- Take control of your life.
- Hustle harder.
- Empowering vulnerable people.
- Transform your life.
- Survive and thrive as the primary brand phrase.
- Cockpit.
- Control tower.
- Captain.

## Product architecture language

Current corrected core areas:

1. Life Admin
2. Financial Life
3. Future Life
4. People & Support Network

Outdated unless Gary explicitly reinstates it:

- Future View
- What If Planner as a top-level bucket name

`What If` may still be used descriptively inside Future Life if needed, but it should not be treated as the current bucket name.

## MYOH rule

MYOH / Manage Your Own Household is the private/local working model and prototype foundation for Life Pilot.

It is not a separate active public product.

Do not suggest public marketing, standalone branding, or external positioning for MYOH unless Gary explicitly changes that.

Do not broadly rename MYOH database/schema/auth/storage concepts without explicit approval.

## Companion app rules

### Job Pilot

Job Pilot is a Life Pilot companion app for job search, job capture, AI scoring, applications, tasks, evidence, reporting, and next steps.

Do not overbuild it into Life Pilot Core during core MVP work.

### Gig Pilot

Gig Pilot is a Life Pilot companion app for irregular income and gig work tracking.

It must remain platform/source agnostic.

Do not make it DoorDash-only, delivery-only, or hustle-culture.

## real Life Pilot rule

real Life Pilot is the social-impact overlay for Life Pilot.

Positioning:

> Support for when life gets very real.

It is not a separate generic welfare app.

Inclusion belongs in core Life Pilot, not only in real Life Pilot.

Hard rule:

No token modules. Every real Life Pilot feature must either:

1. Change the app experience in a culturally safe or identity-safe way; or
2. Help the user complete a practical action.

## Canva review rule

Every Canva output is a standalone brand test.

Use this verdict system:

- Save
- Revise
- Reject

Save only if the output could belong across:

- App UI
- Pitch deck
- GitHub/Replit docs
- Partner materials
- real Life Pilot social-impact materials

Reject if it feels:

- Too cartoony
- Too corporate
- Too airline/travel
- Too charity/welfare
- Too rainbow-heavy
- Too generic SaaS
- Too disconnected from the app

## Current brand progress

Known progress:

- Approved primary logo SVG exists in the repository.
- Approved brand asset source-of-truth exists in the repository.
- Brand tokens and visual rules exist in Drive and should be reconciled into repo docs.
- Colour swatch material exists but must be checked against current wording before being treated as final.

## Repository documentation rule

Any new documentation must:

- Use `Future Life`, not `Future View / What If Planner`, unless Gary explicitly reinstates the old language.
- Treat MYOH as private prototype/foundation only.
- Avoid cockpit/airline/pilot-wing language.
- Keep commercial, partner, investor, and social-impact claims grounded.
- Avoid unsupported claims about outcomes until testing evidence exists.
