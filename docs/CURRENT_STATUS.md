# Life Pilot Current Status

Last updated: 2026-07-15

## Authority

The locked authority is `docs/LIFE_PILOT_SOURCE_OF_TRUTH_v1.0.md`.

This status file records current execution priorities. It does not override the locked product hierarchy or authorise code, database, schema, migration, auth, permission, seed-data or production-like data changes.

## Current objective

Deliver the Life Pilot commercial MVP in **Q3 FY2026-27**, between **1 January and 31 March 2027**.

## Current product position

Life Pilot is a personal life-navigation platform for people and households dealing with interconnected real-life decisions, especially where social and economic pressure is present.

The primary commercial customer context is government, NGOs, NFPs, community organisations, social enterprises and related support services. The end user remains the person or household navigating life.

Money is a foundational signal across the product. Life Pilot should help users understand how smaller decisions can influence larger outcomes across work, home, family and future options.

## Locked architecture

### Four Core Life Areas

1. Home Life.
2. Work Life.
3. Family Life.
4. Future Life.

Do not use Money Life or Support Life as additional default top-level buckets. Money and support operate across the four areas.

### Life Tools

Shared tools include activity, calendar overlay, documents/evidence, people/providers, shopping and budget checks, notifications and Control Centre.

### Activated layers

- Real Life - appears when life becomes unusually difficult or complex.
- Business Life - appears for relevant self-employment or business contexts.

These are not default buckets and are not current MVP build priorities.

## Life Signal and scenario status

The Life Signal must remain explainable and traceable.

Basic scenario planning already exists and is included in MVP. It uses a fixed library of scenarios with limited adjustability. It is structured and rules-led, not open-ended AI prediction.

Before advanced AI is introduced, Life Pilot must validate which model produces reliable, repeatable and understandable signals.

## Active priorities

1. **Life Pilot commercial MVP** - target Q3 FY2026-27.
2. **Main Job Pilot** - active companion-product lane.
3. **Job Pilot Lite** - active Google AI Studio prototype.

## Parked priorities

Everything else is parked unless Gary explicitly promotes it:

- Gig Pilot.
- Trade Pilot.
- Business Life.
- Real Life activated workflows.
- Receipt Scanner.
- Receipt Scanner Pro.
- Advanced AI and scenario intelligence.
- Other assistants and future operating ideas.

Parking means no active build, design or marketing priority.

## Immediate documentation state

Completed in this pass:

- Added locked source of truth v1.0.
- Updated Life Pilot README.
- Updated this current-status file.
- Updated investor and commercial direction to reflect the locked architecture and customer model.
- Added status documentation to Job Pilot and Gig Pilot repositories.

## Build guardrails

- Documentation alignment does not authorise code changes.
- Do not change database schema, migrations, data models, seed data, authentication, permissions or production-like stored data without Gary's explicit approval.
- Do not broadly rename MYOH internals.
- Do not add activated layers or parked products to MVP.
- Do not introduce AI-generated Life Signals before the rules model is validated.

## MVP operating sequence

### Now

- Maintain source-of-truth alignment.
- Audit current UI labels and navigation against the four Core Life Areas.
- Check the four-dash motif against the approved GPS asset.
- Confirm existing scenario logic, inputs and outputs.

### Build and validation

- Stabilise the Life Signal dashboard.
- Complete the minimum Life Tools needed for the core journey.
- Confirm money-linked signals across all four Life Areas.
- Validate scenario consistency and explanations.
- Prepare a small, safe partner-test pathway.

### After MVP

- Partner testing and evidence collection.
- Signal-model refinement.
- Activated-layer validation.
- AI-assisted interpretation only after reliability is demonstrated.
- Reassessment of parked products.

## Current risks

1. Older documents reintroduce outdated bucket language.
2. Money becomes a fifth bucket rather than a cross-platform signal.
3. Real Life is presented as the default experience rather than an activated layer.
4. AI is introduced before reliable signal logic is established.
5. Partner use drifts into surveillance or unapproved case management.
6. Parked products distract from the Q3 MVP target.
7. Build work touches database, auth, permissions or stored data without approval.

## Next safe action

Run a documentation-informed UI and terminology audit against the locked source of truth. Do not apply implementation changes until the audit identifies exact safe edits and Gary approves the build handoff.
