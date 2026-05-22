# Life Pilot Status Language Guide

**Status:** Approved product guidance  
**Scope:** Life Pilot Core, MYOH prototype foundation, Financial Life, Safe to Spend, Future View / What If Planner, Life Admin, People & Support Network  
**Purpose:** Keep user-facing status language calm, practical, non-shaming and brand-consistent.

## Product decision

Life Pilot should avoid using harsh or alarmist status labels such as **Critical** on everyday money, family budget, safe-to-spend, task or planning screens unless the state is genuinely destructive, high-risk, or requires an emergency/safety response.

The Safe to Spend / family budget page should not use **Critical** as a normal budget-pressure label. It can feel too negative, too clinical, or blame-adjacent in a household context.

Use calm, practical language that tells the user what needs attention and what they can do next.

## Brand rationale

Life Pilot is built around the promise:

> See what matters. Plan what’s next. Take the next practical step.

The product voice should be:

- warm
- grounded
- practical
- mature
- inclusive
- human
- respectful
- non-shaming
- capable

Preferred language should surface signal without making the user feel like they have failed.

## Approved status language

Use this calm pressure scale across Life Pilot Core unless a specific feature has an approved exception.

| Meaning | Approved label | Use when |
|---|---|---|
| Healthy / stable | **On track** | Known essentials are covered and no immediate pressure is visible. |
| Mild pressure | **Watch this** | Things are close, changing, or worth checking before action. |
| Medium pressure | **Needs attention soon** | A bill, income gap, spending pattern, report date, arrears issue, or obligation may create pressure soon. |
| High pressure | **Needs attention now** | Essentials, upcoming bills, arrears, or available money may be affected and the user should review options before spending or committing. |
| Positive buffer | **Breathing room** | Essentials are covered and there is some flexible money or time available. |

## Replacement map

| Avoid / legacy wording | Replace with |
|---|---|
| Critical | Needs attention now |
| Urgent | Needs attention soon OR Needs attention now, depending on severity |
| Warning | Watch this |
| Danger | Needs attention now, unless it is a true safety/destructive state |
| Safe | On track |
| Good | On track |
| Surplus | Breathing room |
| Overdue | Needs attention |
| Failed | Not completed / Needs review |

## Safe to Spend page wording

Recommended Safe to Spend states:

### Breathing room
Essentials are covered and there is some flexible money available.

### On track
Known bills and planned essentials are covered.

### Watch this
Things are close. A small change could affect the week.

### Needs attention soon
A bill, income gap, or spending pattern may cause pressure soon.

### Needs attention now
There may not be enough for upcoming essentials. Review options before spending.

## Colour and severity rules

Use colour as signal, not shame.

- **Deep Teal-Green:** steady primary actions and active states.
- **Signal Orange:** next actions, attention markers and important highlights.
- **Soft Signal Surface + Dark Signal Text:** needs-attention cards and alert backgrounds.
- **Muted Red:** destructive actions and serious high-risk states only.

Do not pair everyday budget pressure with aggressive red styling unless the state is genuinely high-risk or destructive.

## Build Control / Replit Pilot instruction

When issuing commands or implementation prompts to Replit Pilot / Build GPT, Build Control should reference this file first:

`docs/product/life-pilot-status-language-guide.md`

Implementation prompts should instruct Replit Pilot to:

1. Replace user-facing **Critical** labels on Safe to Spend / family budget screens with **Needs attention now**.
2. Review related status labels across Life Pilot Core for consistency with the approved scale.
3. Preserve existing logic, thresholds, calculations, database schema, data models, migrations, auth, permissions and stored data unless Gary explicitly approves deeper changes.
4. Treat this as a UI/content terminology update first, not a budget-engine rewrite.
5. Report back with:
   - changed files
   - terminology labels updated
   - logic not touched
   - tests/checks run
   - any places where status text is generated from shared constants or backend values

## Acceptance intent

A terminology update is acceptable when:

- Safe to Spend no longer uses **Critical** as a normal family budget pressure label.
- Status language feels calm, practical and non-shaming.
- The user still understands what needs attention and when.
- The approved status scale is used consistently where practical.
- No database, schema, migration, permission, auth, or production-like data changes are made without explicit approval.

## Notes

This guidance applies to product language and UI behaviour. It does not require immediate implementation across every page in one pass. Small, safe, visible terminology improvements are preferred over broad refactors.
