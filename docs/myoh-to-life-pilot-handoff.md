# MYOH to Life Pilot — Handoff Notes

## Summary

MYOH / Manage Your Own Household is the original private working prototype for household and life-admin functions.

Life Pilot is the commercial product direction built from the same lived-experience foundation, but it must be developed as a separate commercial copy rather than by overwriting or destabilising MYOH.

## Core Rule

Do not overwrite, destabilise, or recklessly rename the original MYOH test build.

MYOH remains the private working prototype used by Gary and Sam to test real household / life-admin functions.

Life Pilot should be created and refined as a commercial copy.

## Safe Build Strategy

1. Inspect first.
2. Preserve working MYOH functionality.
3. Apply Life Pilot naming, brand tokens, navigation labels and UI polish safely.
4. Avoid database/table renames unless explicitly approved.
5. Avoid auth changes unless explicitly approved.
6. Avoid broad refactors.
7. Avoid adding social-impact features at this stage.
8. Stop and report after each implementation packet.

## Commercial Life Pilot Scope

### In scope

- Commercial Life Pilot copy of MYOH
- Safe brand token implementation
- Safe display-name updates
- Navigation / dashboard shell alignment
- UI polish using approved brand system
- Testing / checking
- Backlog creation

### Out of scope for now

- real Life Pilot social-impact layer
- Support-worker views
- Referral pathways
- Partner portals
- Welfare-specific modules
- DEI / social-impact feature modules
- Major database / schema refactors
- Rebuilding Job Pilot inside Life Pilot Core
- Rebuilding Gig Pilot inside Life Pilot Core

## Core Life Pilot Buckets

| Bucket | Meaning |
|---|---|
| Money Life | Income, bills, arrears, safe-to-spend, budget visibility, payment dates, money pressure signals |
| Work Life | Job search, gig work, income activity, applications, work tasks, evidence |
| Home Life | Tasks, appointments, calendar, documents, household admin, routines, obligations |
| Support Life | Trusted contacts, chosen family, household/support people, providers, communication preferences, safe profile language |

Do not overbuild Support Life into the social-impact layer yet.

## Preferred Commercial Navigation Shell

1. Dashboard
2. Money Life
3. Work Life
4. Home Life
5. Future View
6. Support Life
7. Documents / Evidence
8. Settings

## Dashboard Intent

The Dashboard should show what matters now.

It should support:

- Today / this week overview
- Next practical step
- Attention cards
- Upcoming bills
- Upcoming appointments
- Important tasks
- Recent changes
- Quick add

## Future View Intent

Future View should model what could happen next.

It should support:

- What If Planner
- Pressure weeks
- Income drop scenarios
- Bill shock scenarios
- Arrears catch-up plans
- Option comparison
- Suggested next actions

## Voice and Copy Rules

Use plain English.

Be practical, respectful, warm and non-shaming.

### Preferred phrases

- This needs attention.
- Here are the next options.
- Bring the important pieces into view.
- Next practical step.
- Trusted contact.
- Chosen family.
- Support network.
- Future View.
- What If Planner.

### Avoid

- Get organised.
- You are overdue.
- Take control of your life.
- Hustle harder.
- Empowering vulnerable people.
- Transform your life.
- Cockpit.
- Control tower.
- Captain.

## First Replit Instruction

Use this prompt first:

```text
Packet 1 — Inspect copied MYOH build only

Please inspect the current Life Pilot / copied MYOH build only.

Do not edit files yet.

Report back with:
1. Current routes, tabs and navigation
2. Main layout, dashboard and styling/theme files
3. App-name/display-label locations
4. Database/schema/auth-sensitive files that must not be touched
5. Personal/test-specific MYOH references
6. Recommended next packet

Hard stop after the report.
Do not continue to implementation until Gary explicitly says to continue.
```

## Packet Completion Format

Each packet must end with:

1. Changed files
2. What was completed
3. What was not touched
4. Tests/checks run
5. Risks or assumptions
6. Recommended next packet

Hard stop after every packet.
