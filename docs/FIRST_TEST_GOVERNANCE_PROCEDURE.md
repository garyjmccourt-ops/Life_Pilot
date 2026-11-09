# Life Pilot Governance Skills and Decision Procedure

Status: DRAFT FOR GARY REVIEW. Version 0.1. Prepared 9 November 2026.
Applies to this documentation and first-test programme. No new role, Skill installation or delegated legal authority is established by this draft.

## Accountability

Gary is founder, product owner and retained approval authority. Folio coordinates scope, evidence, dependencies and decisions. A named implementer builds only an approved packet. A separate reviewer evaluates the exact submitted revision and records findings. The implementer cannot certify independent assurance of their own work.

Life Pilot remains Gary's personal project. Brighter Group governance repositories are not its product source of truth. Product documentation must not include actual personal recovery, household, financial, health, identity or support case records.

## Required capabilities

Use product/scope review for every material packet; records governance for every controlled document; privacy and safety review before any data collection or sharing; engineering review before implementation; accessibility and testing review before demonstration; commercial claims review before investor or public material.

A capability is not active merely because it is named. Record its source/version, assigned person or tool, permitted work, availability and evidence of its actual use. If unavailable, identify the gap and restrict only dependent work. Do not invent a specialist approval.

The current Life Pilot records-governance guidance supplies storage/privacy controls but contains historical product names. The locked product source controls naming and scope. Record this discrepancy; do not silently install or modify Skills.

## Document control

Each controlled record must state title, owner, status, version, date, source baseline, proposed changes, approval state and canonical location. Drafts are not approved requirements. Preserve approved text and mark proposed additions separately.

Personal Google Drive is the default canonical location for approved strategy, commercial and operating documents. GitHub holds technical specifications, build packets, tests and developer evidence. Existing non-code repository records are preserved as historical/working sources until Gary approves any canonical reconciliation. This branch does not move ownership or storage.

Use one index linking each record, its approved version and review candidate. Do not keep two independent editable masters. A new repository or relocation requires a recorded decision, preservation check and rollback plan.

## Decision and resulting action procedure

1. Capture the proposal with a unique ID, objective, source, scope and affected records.
2. Classify the proposal: routine within an approved packet, scope change, data/security change, publication, spending/contract, or exception.
3. Gather evidence and alternatives, including doing nothing. State cost/effort assumptions and risk.
4. Identify the approving authority. An AI recommendation is never Gary's approval.
5. Record Approve, Revise, Reject, Defer or Stop, with date and exact revision. Conditions must be explicit.
6. Create resulting actions, each with owner, due trigger, dependencies, acceptance evidence and rollback.
7. Execute only the approved action. Reopen the decision when scope, destination, data, cost or material risk changes.
8. Verify the outcome and close the action with evidence. Failed or uncertain execution remains open.

Decision fields: ID; date; proposer; decision required; evidence links; options; recommendation; authority; disposition; conditions; approved revision; resulting action IDs; verification; supersedes.
Action fields: ID; decision ID; owner; task; permitted target; trigger; status; evidence; blocker; rollback; closure date.

## Gates

G0 Source and scope: coordinator confirms authority, baseline, privacy boundary and document-only scope. This permits documentation, not code.

G1 Documentation: Gary approves foundation additions, test scope, governance and evidence rules. A rejected or incomplete packet returns to drafting.

G2 Project and build: Gary approves plan, exact repository/branch/base revision, implementation slice, test matrix and exclusions. Schema, authentication, permissions, seed/real data and migration proposals must be explicit; general build approval is not a blanket approval for them.

G3 Technical assurance: independent reviewer checks submitted revision and test evidence. Blocker or material failures stop progression. Failed/inconclusive assurance cannot be represented as acceptance.

G4 Demonstration readiness: Gary approves the tested demonstration, audience, data and environment. Approval to show a private demo does not authorise public deployment or recruitment.

G5 Investor readiness: review each factual claim against evidence, identify estimates, verify founder/entity details and approve the final pack. No investment offer, valuation, promised return or financial commitment is implied.

G6 External action: Gary approves publication, deployment, partner approach, participant involvement, spending or contracts as applicable. Required security and legal confirmations remain in force.

## Change and exception control

A change request states why the approved scope is insufficient, impacted requirements/tests, effort, risks and alternatives. Work can continue on unaffected approved tasks. No convenience change may activate a parked product or remove an approval gate.

An exception record names the exact failed control, evidence, risk, proposed compensating control, approver, expiry and rollback. Gary must explicitly accept a material exception. Safety/legal requirements cannot be waived by this procedure.

## Privacy and test-data procedure

Use fictional adult personas. Do not copy MYOH or actual personal records into fixtures, screenshots, Git or investor assets. Check files and screenshots before committing or sharing. Avoid collecting analytics or feedback identifiers in the first synthetic demo.

Before any real-user pilot, approve purpose, consent, minimisation, storage location, access, retention/deletion, withdrawal, incident response and participant support. Sharing with a funding organisation must remain optional, specific and user-controlled.

## Incident and stop procedure

Stop the affected test or action on suspected leakage, unauthorised access, incorrect high-impact guidance or unexpected external transmission. Preserve minimal diagnostic evidence without copying sensitive payloads. Notify Gary with facts, impact, containment and decisions required. Do not claim resolution until retesting verifies it. Restart requires the appropriate recorded gate.

## Repository procedure

Use a documentation-only branch. Preserve main and existing PRs. Review the diff for accidental code, fixtures with real data or unrelated edits. Record source and resulting commits. No merge, branch deletion or history rewrite is implied by this task.

After build approval, use a bounded implementation branch with requirement-linked commits. Run checks on the actual candidate revision. Keep independent test evidence separate from implementation claims.

## Initial decision register

D001 User direction: documentation before project plan, build, testing and final investor pack. Status: user-confirmed direction; specific document approval pending.
D002 Mission/vision additions: proposed; G1 pending.
D003 Synthetic first test: proposed; G1 pending.
D004 Existing repository documentation branch: working approach; no replacement repository created.
D005 Real participant pilot and external release: deferred until evidence and explicit approval.
D006 Historical vocabulary correction: align derivative documents to the locked source; no hierarchy change proposed.
D007 Founder ABN: use only when verified and required; external use subject to the specific publication/transaction gate.
