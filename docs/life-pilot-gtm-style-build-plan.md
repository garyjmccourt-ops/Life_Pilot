# Life Pilot — GTM-Style Build Plan

## Purpose

This plan gives Life Pilot a focused path from the current MYOH prototype through to a clean commercial MVP, then into packaging, testing, market positioning and future expansion.

It follows the same discipline as the Build Control timeline approach: Life Pilot should be treated as a proper product, not a junk-drawer build. The immediate goal is to protect the working MYOH prototype while creating a safer commercial Life Pilot copy that can be explained, tested, polished and expanded.

---

## Timeline Overview

| Phase | Focus | Target Outcome |
|---|---|---|
| Phase 0 | Scope checkpoint | Confirm Life Pilot Core purpose, boundaries and source relationship to MYOH |
| Phase 1 | Safe commercial copy | Inspect copied MYOH build and identify low-risk change areas |
| Phase 2 | MVP structure | Core navigation, bucket mapping, dashboard shell and safe display naming |
| Phase 3 | Practical life-control workflows | Money Life, Work Life, Home Life and Support Life operating flows |
| Phase 4 | Review and operating rhythm | Dashboards, next actions, attention cards and weekly review patterns |
| Phase 5 | Polish and testing | Clean UX, brand tokens, smoke testing and bug fixing |
| Phase 6 | Packaging | Replit-ready handover, repo documentation, deployment notes and commercial-readiness checklist |
| Phase 7 | Expansion | Companion app alignment, social-impact layer, AI support and integrations |

---

## Phase 0 — Scope Checkpoint

### Goal

Confirm what Life Pilot Core is, what MYOH remains, and what must be excluded from the first commercial build.

### Key Decisions

☐ Confirm product name: **Life Pilot**  
☐ Confirm prototype source: **MYOH / Manage Your Own Household**  
☐ Confirm MYOH remains live/private for Gary and Sam testing  
☐ Confirm commercial Life Pilot is built from a copy, not by overwriting MYOH  
☐ Confirm the first commercial build is **Life Pilot Core**, not the full ecosystem  
☐ Confirm relationship to:
- MYOH
- Job Pilot
- Gig Pilot
- Money Pilot
- Home Pilot
- real Life Pilot social-impact layer
- Build Control
- BrightOps

☐ Confirm MVP user types:
- Personal user / household owner
- Household partner / trusted person
- Future trusted supporter / chosen family contact
- Future professional support contact

☐ Confirm what should be excluded from MVP to prevent scope creep:
- Support-worker portals
- Partner/referral pathways
- Funded service workflows
- Full Centrelink / Workforce Australia compliance workflow
- Deep AI automation
- Full companion app rebuilds
- Major schema/auth/database changes

### Deliverables

☐ One-page Life Pilot Core scope summary  
☐ Confirmed MVP feature list  
☐ Confirmed non-MVP parking lot  
☐ Source-copy decision log  
☐ Risk list for MYOH protection  

---

## Phase 1 — Safe Commercial Copy

### Goal

Create and inspect a commercial Life Pilot copy of MYOH without destabilising the private prototype.

### Required Checks

☐ Confirm repo/source for MYOH prototype  
☐ Confirm repo/source for commercial Life Pilot copy  
☐ Confirm original MYOH is not edited directly  
☐ List current routes, tabs and navigation  
☐ Identify main layout, dashboard and styling/theme files  
☐ Find app-name and display-label locations  
☐ Flag database/schema/auth-sensitive files that must not be touched  
☐ Flag personal/test-specific MYOH references  
☐ Confirm environment variables, secrets and auth settings are not exposed or changed  

### Deliverables

☐ Inspection report only  
☐ File map  
☐ Routes/navigation map  
☐ Safe-change list  
☐ Do-not-touch list  
☐ Recommended first implementation packet  

---

## Phase 2 — MVP Structure

### Goal

Create a clear Life Pilot shell around the working MYOH functionality using safe display naming, brand tokens and navigation grouping.

### Core Buckets

☐ Money Life  
☐ Work Life  
☐ Home Life  
☐ Support Life  

### Preferred Navigation

☐ Dashboard  
☐ Money Life  
☐ Work Life  
☐ Home Life  
☐ Future View  
☐ Support Life  
☐ Documents / Evidence  
☐ Settings  

### Dashboard Requirements

☐ Today / this week overview  
☐ Next practical step  
☐ Attention cards  
☐ Upcoming bills  
☐ Upcoming appointments  
☐ Important tasks  
☐ Recent changes  
☐ Quick add  

### Required Safe Implementation Rules

☐ Add Life Pilot colour tokens/CSS variables  
☐ Add Life Pilot font variables/stacks where low risk  
☐ Update safe user-facing display names only  
☐ Leave code/internal/database names unchanged unless clearly safe  
☐ Avoid auth and database refactors  
☐ Stop after each packet and report  

### Deliverables

☐ Brand tokens applied safely  
☐ Display labels updated where safe  
☐ Initial Life Pilot navigation shell  
☐ Dashboard bucket cards if low risk  
☐ Updated README or docs note describing MYOH-to-Life Pilot relationship  

---

## Phase 3 — Practical Life-Control Workflows

### Goal

Make Life Pilot useful for daily life navigation, not just rebranded MYOH screens.

### Money Life

☐ Income visibility  
☐ Bills and payment dates  
☐ Arrears / pressure signals  
☐ Safe-to-spend concept  
☐ Payment-date reminders  
☐ Money pressure attention cards  
☐ What If Planner inputs for bill shock / income drop scenarios  

### Work Life

☐ Job search activity overview  
☐ Gig work / income activity placeholder  
☐ Applications / work tasks placeholder  
☐ Evidence capture placeholder  
☐ Companion alignment with Job Pilot and Gig Pilot  

### Home Life

☐ Tasks  
☐ Appointments  
☐ Calendar items  
☐ Household admin  
☐ Routines and obligations  
☐ Documents and evidence links  

### Support Life

☐ Trusted contacts  
☐ Chosen family  
☐ Support network  
☐ Providers / professional contacts  
☐ Communication preferences  
☐ Safe, non-shaming profile language  

### Deliverables

☐ Bucket-by-bucket workflow map  
☐ Minimal user journeys  
☐ Field/object inventory based on existing MYOH structure  
☐ Gap list for MVP usefulness  
☐ Parking lot for companion apps and social-impact layer  

---

## Phase 4 — Review and Operating Rhythm

### Goal

Create a practical rhythm so Life Pilot helps users see what matters and decide what to do next.

### Review Cadence

☐ Daily quick check  
☐ Weekly life admin review  
☐ Monthly money / obligations review  
☐ Future View scenario review when pressure changes  

### Dashboard Views

☐ Needs attention  
☐ Due soon  
☐ This week  
☐ Money pressure  
☐ Upcoming appointments  
☐ Open tasks  
☐ Recent changes  
☐ Next practical step  

### Notification / Reminder Concepts

☐ Bill due soon  
☐ Appointment approaching  
☐ Task due soon  
☐ Evidence/document needed  
☐ Pressure week approaching  
☐ Follow-up required  

### Deliverables

☐ Management-style dashboard for personal life admin  
☐ Weekly review checklist  
☐ Simple reporting / summary view  
☐ Attention card rules  
☐ Non-shaming empty states and prompts  

---

## Phase 5 — Polish and Testing

### Goal

Turn the working commercial copy into something clean, reliable and safe to use.

### Testing Areas

☐ Confirm original MYOH was not touched  
☐ Create / update a task  
☐ Add a bill or money item  
☐ Add / view an appointment  
☐ Review dashboard attention cards  
☐ Use Future View / What If Planner if present  
☐ Add / view trusted contact or support item  
☐ Upload / link document if present  
☐ Check safe display labels  
☐ Check personal-only MYOH references  
☐ Check permissions / auth behaviour  
☐ Check mobile usability if relevant  

### UX Polish

☐ Warm sand background  
☐ Near-white cards  
☐ Deep slate text  
☐ Deep teal primary actions  
☐ Signal orange only for next actions / attention markers  
☐ Clear section headings  
☐ Sensible defaults  
☐ Minimal duplicate fields  
☐ Helpful non-shaming empty states  
☐ Reusable card/button/status styles  
☐ Restrained four-dash motif  

### Deliverables

☐ Smoke test script  
☐ Issues list  
☐ Fixed MVP bugs  
☐ Final MVP acceptance checklist  
☐ Commercial-readiness review  

---

## Phase 6 — Packaging

### Goal

Prepare Life Pilot so it can be handed to Replit, deployed, reused or documented without relying on chat memory.

### Package Contents

☐ Product overview  
☐ MYOH relationship and protection notes  
☐ User roles  
☐ Core buckets  
☐ Navigation map  
☐ Data model inventory  
☐ Screen list  
☐ Workflow rules  
☐ Field list  
☐ Status / label settings  
☐ Dashboard requirements  
☐ Voice and copy rules  
☐ Brand tokens  
☐ Test checklist  
☐ Known limitations  
☐ Future roadmap  

### Replit / Build Handover Notes

☐ Confirm preferred tech stack  
☐ Confirm database approach  
☐ Confirm authentication approach  
☐ Confirm file storage approach  
☐ Confirm deployment target  
☐ Confirm GitHub repo relationship  
☐ Confirm Replit import workflow  
☐ Confirm integrations for later phases  

### Deliverables

☐ Replit-ready build brief  
☐ Markdown project scope file  
☐ MVP test checklist  
☐ Deployment notes  
☐ Backlog split into small implementation packets  

---

## Phase 7 — Expansion Roadmap

### Goal

Capture future improvements without letting them derail the MVP.

### Candidate Enhancements

☐ Job Pilot integration  
☐ Gig Pilot integration  
☐ Money Pilot deeper forecasting  
☐ Home Pilot household operations  
☐ real Life Pilot social-impact layer  
☐ Support-worker views  
☐ Referral pathways  
☐ Provider / partner portals  
☐ Centrelink / Workforce Australia evidence support  
☐ Volunteer work tracking  
☐ AI next-step assistant  
☐ AI-generated weekly summaries  
☐ AI task extraction from notes  
☐ Calendar sync  
☐ Gmail / email ingestion  
☐ BrightOps integration  
☐ Document/evidence pack export  
☐ Multi-household or multi-profile support  

### Expansion Guardrail

Do not start Phase 7 enhancements until the MVP can reliably:

☐ Preserve MYOH separately  
☐ Show current priorities clearly  
☐ Capture and manage tasks  
☐ Track bills, income pressure and key dates  
☐ Show attention items without shaming language  
☐ Provide a useful weekly review flow  
☐ Explain its core purpose to another person without rebuilding the scope from memory  

---

## Suggested Build Order

1. Confirm the Life Pilot repo and copied MYOH source.
2. Inspect the copied MYOH build only.
3. Create file, route and risk maps.
4. Add brand tokens and safe display naming.
5. Create the Life Pilot navigation shell.
6. Map existing MYOH features into Money Life, Work Life, Home Life and Support Life.
7. Build or refine the Dashboard and Future View shell.
8. Polish UI with approved brand tokens.
9. Run smoke tests and check original MYOH was not touched.
10. Package for Replit and deployment.
11. Only then move into companion integrations, AI and social-impact expansion.

---

## Immediate Next Actions

1. Confirm whether the current `Life_Pilot` repo is already the copied MYOH commercial build or still needs to be connected/imported from Replit.
2. Ask Replit to run Packet 1: inspect only, report only, no code edits.
3. Use this document plus `docs/life-pilot-replit-build-gpt-brief.md` as the initial Replit handoff pack.
