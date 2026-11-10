# Life Pilot First Test Control Register

Version: 0.1. Status: review candidate. Updated: 10 November 2026 (draft Drive-index reconciliation).
Owner: Gary McCourt. Maintainer: Folio. Scope: documentation and first-test approval packet.
This register records observed availability and evidence, not deployment or approval of new capabilities.

## Capability inventory

| ID | Capability and version or evidence | Availability and assignment | Current state and limitation |
|---|---|---|---|
| CAP01 | Gary McCourt, founder and retained decision authority; current programme direction | Identified | Documentation direction confirmed; G1/G1A/G2 approvals pending |
| CAP02 | Folio coordination; this versioned packet and branch history | Assigned | Documentation preparation performed; no construction or release authority |
| CAP03 | Life Pilot Records and Product Governance, current supplied guidance; no published version declared | Available and consulted | Storage/privacy controls applied. Historical product-name list conflicts with locked source; not used as product authority. No installation/change performed |
| CAP04 | Scope Guardian, current supplied guidance; no published version declared | Available and consulted | Documentation-only boundary maintained; does not approve scope or canonical promotion |
| CAP05 | Brighter Work Intake, current supplied guidance; no published version declared | Available and consulted | Intake/routing guidance only. Personal-project boundary preserved |
| CAP06 | Independent documentation review; parent-reported review of b60be9e56c544d4b271d748d656005b8446af3cf | Review performed; named external reviewer not assigned | Findings received and corrected. Acceptance of corrected head pending |
| CAP07 | Implementation engineering | Unassigned | No approved build packet; runtime/stack capability not validated |
| CAP08 | Independent functional and scenario testing | Unassigned | Tests specified, none executed. Independence and execution environment must be confirmed before G3 |
| CAP09 | Privacy/security assessment for real-user pilot | Unassigned; no completed assessment available | Synthetic-only proposal; real participant data and sharing blocked pending assessment and approval |
| CAP10 | Accessibility verification | Unassigned; no executed results available | Keyboard, focus, labels, contrast and viewport checks specified only |
| CAP11 | Commercial evidence and claims review | Preparation available through existing working documents; final reviewer unassigned | Demand, pricing, costs, traction and outcomes unvalidated; G5 pending |
| CAP12 | Legal/entity/ABN verification | Unassigned; verified ABN/trading details unavailable | Founder identity recorded; no company or ABN number invented |
| CAP13 | Approved source promotion and readback | GitHub read/write available; promotion decision pending Gary | Review branch exists; no merge or canonical relocation performed |
| CAP14 | Release and partner-pilot operations | Unassigned; approved environment/support procedure unavailable | Deployment, publication, recruitment and outreach not authorised |

Availability does not mean configured, behaviour-validated or active. Reassess this inventory at G2 and before real-user activity. Missing capability blocks its dependent action rather than all drafting.

## Source index

| ID | Record and source | Observed version or revision | Classification and use |
|---|---|---|---|
| SRC01 | [Locked Source of Truth](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/LIFE_PILOT_SOURCE_OF_TRUTH_v1.0.md) | v1.0; blob 48aa5237a65699d48743301d243cfb3e0accb1c3 | Approved product baseline. Not changed by this packet |
| SRC02 | [Drive source counterpart](https://drive.google.com/file/d/1Ad8PkqoxtKcQSgbZdz0oE4dhvyUvsE5H/view) | Filename v1.1; heading v1.0; modified 5 August 2026 | Version discrepancy. Reviewed text matches the product baseline substantively; not treated as a separate newer approval |
| SRC03 | [Current status](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/CURRENT_STATUS.md) | 15 July 2026; blob 984b4c12d369518fa98ac069acb8e4a265f36ca2 | Historical execution record; not evidence of current completion |
| SRC04 | [Commercial development](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/COMMERCIAL_DEVELOPMENT.md) | 15 July 2026; blob 1f0601cb27252c980fca38dc3ea8a88bc3b43577 | Existing commercial direction; models remain hypotheses |
| SRC05 | [Investor relations pack](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/INVESTOR_RELATIONS_PACK.md) | 15 July 2026; blob 90a4bb0fbed6f9d233abf65c62f2d5794f796420 | Existing working investor narrative, not a final offer or pitch |
| SRC06 | [Partner pack baseline](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/CORE_TESTING_PARTNER_PACK.md) | 30 May 2026; original blob aa4117f8fe867bca09803999be6fb5cab674ed72 | Historical source; corrections proposed on review branch |
| SRC07 | [Brand rules baseline](https://github.com/garyjmccourt-ops/Life_Pilot/blob/fbca62c17d634f7bbbfa827cec29c83196e14a58/docs/BRAND_RULES.md) | 30 May 2026; original blob 09ea712e18d001d31141b068a3f8a6e98aba04a8 | Non-conflicting visual tokens retained; obsolete architecture corrected in candidate |
| SRC08 | [Existing SVG proposal PR 4](https://github.com/garyjmccourt-ops/Life_Pilot/pull/4) | Observed open; head 9af5ef2f40cc15cd72cf793bc3a02b541c3537f0 | Preserved. Derived/concept status requires approval; not merged here |
| SRC09 | [Existing roadmap PR 1](https://github.com/garyjmccourt-ops/Life_Pilot/pull/1) | Observed draft; head 88545e113b477ffcc4f304ee4bb686cdf2ef50d8 | Preserved unrelated implementation; no merge or reuse |
| SRC10 | Gary's current documentation-first direction, relayed in the task | Documentation → project plan → build → test → investor pack | User-confirmed direction; does not approve candidate contents |
| SRC11 | [This packet manifest](FIRST_TEST_PACKET_MANIFEST.md) | v0.1 review candidate | Index of proposed deliverables; not a new canonical master |

## Promotion ledger

PROM01 Foundation additions and first-test scope: proposed; G1 pending; canonical source update not executed. After approval, identify precisely which approved baseline changes, obtain any required merge/location authority, promote only those changes, and record resulting revision/readback before dependent implementation.

PROM02 Governance procedure: proposed; G1 pending; approved canonical non-code destination not established. Preserve review copy; do not silently designate GitHub as a replacement for the approved non-code source.

PROM03 Brand and partner terminology corrections: review candidate only; merge approval pending. Verify exact approved diff and resulting source after authorised promotion.

PROM04 Project plan and website/demo brief: proposed; approval pending. Website code and publication remain separately gated.

## Review actions

ACT01 Correct independent review findings: documentation corrections prepared; exact-head readback and independent acceptance required before closure.
ACT02 Verify ABN and legal trading identity only when required: pending, owner Gary or explicitly assigned verifier.
ACT03 Confirm approved non-code canonical destinations: pending Gary decision before any relocation or canonical replacement.
ACT04 Assign implementer, independent tester and specialist reviewers: pending G2 readiness.
ACT05 Validate January–March 2027 target feasibility against scope, resources and baseline: pending project-plan assessment. Target remains approved.

## Drive review reconciliation — 10 November 2026

This section records the actual review documents; it is not approval, source promotion or an assertion that all draft bodies match GitHub. Owner: Gary McCourt. Maintainer: Folio. All entries below are **v0.1, Draft for Gary review, dated 10 November 2026**. Approval reference: **pending**. Approved master ID: **not designated by this packet**.

Human-review/customer-facing documents belong in Google Drive; GitHub holds code and AI working instructions. Existing approved sources remain unchanged. The established personal-project home is [Garys Personal / Life Pilot / LifePilot / Life_Pilot_Records_and_Product_Governance](https://drive.google.com/drive/folders/1jySbew4Khj5L1VqgNSfVHyrsIHw8H3pV), folder ID `1jySbew4Khj5L1VqgNSfVHyrsIHw8H3pV`. No permission changes were made; inherited access must not be described as verified owner-only access.

The eight branch-derived review documents originated at commit `855d11dabd16b51a0a08fe48f8c38d32152ff539` on `docs/first-test-approval-2026-11-09`. The following links retain their stable Drive IDs. Native creation and content readback were verified on 10 November. New Drive-only review drafts are indexed here, not silently copied into competing GitHub masters.

| Record | Human-review document and Drive ID | Source / reconciliation state |
|---|---|---|
| LP-R01 | [Life Pilot Project Charter](https://docs.google.com/document/d/11mPLESje0M6lrp68UEXqFoN0UWk19A2_zvtMyEGJmJI/edit?usp=drivesdk) — `11mPLESje0M6lrp68UEXqFoN0UWk19A2_zvtMyEGJmJI` | New 10 November charter consolidation; current Drive candidate includes latest roadmap exclusion. |
| LP-R02 | [Life Pilot Review Register Policy and Role Advice](https://docs.google.com/document/d/1tNicU30aczHUS0XTDbRs6QIYYrLIVFLKLLCjewALij8/edit?usp=drivesdk) — `1tNicU30aczHUS0XTDbRs6QIYYrLIVFLKLLCjewALij8` | New 10 November policy, register and role advice; Drive candidate is the detailed human-review record. |
| LP-R03 | [Life Pilot First Test Documentation Approval](https://docs.google.com/document/d/1CZ6EUISlClyjRYSpf8Wap8eNVAHwfgYpceSEqadu3bI/edit?usp=drivesdk) — `1CZ6EUISlClyjRYSpf8Wap8eNVAHwfgYpceSEqadu3bI` | `docs/FIRST_TEST_DOCUMENTATION_APPROVAL.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R04 | [Life Pilot Governance and Skills Procedure](https://docs.google.com/document/d/1yFTQCAsXaQOKTdCSI9nZJ_c6fIDm7RvqgFayT3fU8sE/edit?usp=drivesdk) — `1yFTQCAsXaQOKTdCSI9nZJ_c6fIDm7RvqgFayT3fU8sE` | `docs/FIRST_TEST_GOVERNANCE_PROCEDURE.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R05 | [Life Pilot First Test Control Register](https://docs.google.com/document/d/1CzOWPz1UfbpDa4iU2eBRksjpvIMPCO6zJJFgWtkP23o/edit?usp=drivesdk) — `1CzOWPz1UfbpDa4iU2eBRksjpvIMPCO6zJJFgWtkP23o` | `docs/FIRST_TEST_CONTROL_REGISTER.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. Drive copy retains the source snapshot; this GitHub register now adds the Drive-ID reconciliation. Not byte-identical. |
| LP-R06 | [Life Pilot Project Plan](https://docs.google.com/document/d/15fBuEGp0j1KpChwTgMg3KgRbrv4fEMB-CRCe5yX0Ztk/edit?usp=drivesdk) — `15fBuEGp0j1KpChwTgMg3KgRbrv4fEMB-CRCe5yX0Ztk` | `docs/FIRST_TEST_PROJECT_PLAN.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R07 | [Life Pilot Website and Demo Brief](https://docs.google.com/document/d/1VGkT8UvEAhbeSQvEHqLW9boY0yI00cJjf9PlTkp-clw/edit?usp=drivesdk) — `1VGkT8UvEAhbeSQvEHqLW9boY0yI00cJjf9PlTkp-clw` | `docs/WEBSITE_AND_DEMO_BRIEF.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R08 | [Life Pilot Core Testing Partner Pack](https://docs.google.com/document/d/1Z7qHEt66h3la7yGQbhviHyBRp3fyWnX7rA1VFEkjpwo/edit?usp=drivesdk) — `1Z7qHEt66h3la7yGQbhviHyBRp3fyWnX7rA1VFEkjpwo` | `docs/CORE_TESTING_PARTNER_PACK.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R09 | [Life Pilot Brand Rules](https://docs.google.com/document/d/1JTnDf5gkvkqRaPySyGPmOV-lq02demj6gvw7mC4m89U/edit?usp=drivesdk) — `1JTnDf5gkvkqRaPySyGPmOV-lq02demj6gvw7mC4m89U` | `docs/BRAND_RULES.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. |
| LP-R10 | [Life Pilot Controlled Document Template](https://docs.google.com/document/d/1epWuqW3rU975Ov4ZtPDxlXuicv8E4C6mHUKhkw6saOA/edit?usp=drivesdk) — `1epWuqW3rU975Ov4ZtPDxlXuicv8E4C6mHUKhkw6saOA` | New 10 November Life Pilot template candidate; no installed skill. |
| LP-R11 | [Life Pilot First Test Packet Manifest](https://docs.google.com/document/d/1EHss03NhvSg34U13SFsNjhX0fYzPpNPnS99ZaFmbsOQ/edit?usp=drivesdk) — `1EHss03NhvSg34U13SFsNjhX0fYzPpNPnS99ZaFmbsOQ` | `docs/FIRST_TEST_PACKET_MANIFEST.md` at `855d11dabd16b51a0a08fe48f8c38d32152ff539`. Drive manifest has the expanded 16-record review index; branch manifest is the older source snapshot. |
| LP-EXPLAINER | [Life Pilot Investor and Council One Page Explainer](https://docs.google.com/document/d/1XujbnLYHejEMIEp7y8ZojGbcwMYlixVw0bwsYjunZZY/edit?usp=drivesdk) — `1XujbnLYHejEMIEp7y8ZojGbcwMYlixVw0bwsYjunZZY` | New budget-led review narrative; historical visual 1oI4KLvdLP-nVf-2XlDZRcLijAscpwdfr; unchanged approved SVG blob b9cc3da59385fae5fe34cb5f4fc793a9e4c3e1f4. |
| LP-GTM | [Life Pilot Go to Market Plan](https://docs.google.com/document/d/1gn7ggKMo_zRlqQI1oO6MuIdqtz5QHg2bMzIJGpQ6m-0/edit?usp=drivesdk) — `1gn7ggKMo_zRlqQI1oO6MuIdqtz5QHg2bMzIJGpQ6m-0` | New independent review plan, informed by docs/COMMERCIAL_DEVELOPMENT.md baseline blob 1f0601cb27252c980fca38dc3ea8a88bc3b43577. |
| LP-INVESTMENT | [Life Pilot Investment Readiness Plan](https://docs.google.com/document/d/1V7pSbP5L901UCJmXSdjyvBP1aaiVozbTQ1QwepGlbd4/edit?usp=drivesdk) — `1V7pSbP5L901UCJmXSdjyvBP1aaiVozbTQ1QwepGlbd4` | New independent review plan, informed by docs/INVESTOR_RELATIONS_PACK.md baseline blob 90a4bb0fbed6f9d233abf65c62f2d5794f796420. |
| LP-ECOSYSTEM | [Life Pilot Ecosystem Assessment](https://docs.google.com/document/d/1nPDccoincSwtnVOyUlI4GqH9IDmINnip4yyqVddnNic/edit?usp=drivesdk) — `1nPDccoincSwtnVOyUlI4GqH9IDmINnip4yyqVddnNic` | New source-based review; includes 10 November Workforce Australia evidence reconciliation, not an app test. |
| LP-BRAND-KIT | [Life Pilot Brand Kit Specification](https://docs.google.com/document/d/1-VfmzJxHBk2e2F85syHQVO5dEuTLSwkNdydVKsW21zw/edit?usp=drivesdk) — `1-VfmzJxHBk2e2F85syHQVO5dEuTLSwkNdydVKsW21zw` | New brand specification candidate, grounded in APPROVED_BRAND_ASSETS.md and approved primary SVG; no built website or kit approval. |

### Current direction preserved

- Budgeting and money management lead the vision; Real Life Signal should help identify achievable improvements. Home Life, Work Life, Family Life and Future Life remain the four areas, with money cross-cutting. Later user clarification is for controlled reconciliation, not build authority.
- Initial demonstration remains a proposed synthetic Life Pilot Starter, explainable signal and controlled scenario. Job Pilot capture/tracking and budget/goals links are a potential future investor roadmap only, excluded from the initial demo/build. Job Pilot Lite and the authenticated government app have not been inspected.
- Workforce Australia official guidance supports user-submitted job title/employer/application-date reporting lists up to 20 jobs per reporting period, subject to applicable rules. External applications require separate reporting; saving is not applying or reporting. Requirements vary and income reporting is separate. No automatic compliance, guaranteed points, government integration or app-test claim is made. See LP-ECOSYSTEM for linked official guidance and the future hypothesis.
- GTM and investment drafts remain independently updateable; no validated demand, funding, partnerships or outcomes are claimed. Preserve original visuals, approved SVG and reusable ecosystem ideas. No role or skill has been removed, repurposed, installed or activated.

### Synchronisation and promotion status

**Draft index reconciliation: recorded here. Approved-copy synchronisation: NOT PERFORMED. Documentation approval: PENDING. Merge: NOT AUTHORISED/PERFORMED. Code, publication and external sharing: NOT PERFORMED.**

LP-R02 contains the detailed human-review register/policy. LP-R11 links the review packet. This GitHub register is the developer-facing index, not another approved non-code master. Drive-specific edits and new documents are deliberately not claimed to be fully replicated into the older branch bodies. The separate charter, explainer, GTM, investment, ecosystem and brand-specification content must be read at their linked current Drive drafts when considering approval.

Keep existing approved Drive copies unchanged during branch work. Gary must identify the exact approved revision/delta and authorise any merge. After that merge, read the merged commit, update only the matching approved Drive copy (preserve its stable ID where supported), and record approval, prior/resulting versions, merge commit, Drive ID, updater, timestamp and content readback. Where an approved copy does not yet exist, establish its master designation explicitly. Pending/failed sync stays visible and blocks dependent implementation; preserve a recoverable prior approved revision.

PROM02 and ACT03 clarification: the human-review destination is now established above; approval/master designation and any authorised promotion remain pending. The filename-v1.1/heading-v1.0 discrepancy in SRC02 remains unresolved and is not newer approval. Baseline main `fbca62c17d634f7bbbfa827cec29c83196e14a58` is preserved.
