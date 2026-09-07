# DevSnack Blog Management History

This is the sanitized management timeline. Detailed implementation evidence remains in the dated phase documents linked below.

## 2026-04 — initial publication surface

The project began as a technical blog with Blogger-era content and local automation. The application repository became the home for the Next.js site and its deployable code.

## 2026-07 — Vercel/Supabase consolidation

The public surface moved toward a Vercel-hosted Next.js application backed by Supabase. DevSnack, StockPulse, and AI Tech were separated by explicit `blog_id` values while preserving public content identifiers where possible.

## 2026-08 — lifecycle, IA, and quality work

The repository accumulated phase records for feed lifecycle, IA projections, navigation, SEO, content migration pilots, and batch handoff. These records are evidence for bounded changes, not current configuration by default.

- [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`AI-COLLAB.md`](../AI-COLLAB.md)
- [`PHASE1_FEED_LIFECYCLE_FOUNDATION_RESULT.md`](../PHASE1_FEED_LIFECYCLE_FOUNDATION_RESULT.md)
- [`phase3-aitech/`](../phase3-aitech/)
- [`phase3-stockpulse/`](../phase3-stockpulse/)
- [`src/lib/ia/README.md`](../../src/lib/ia/README.md)

## 2026-09-07 — documentation boundary

The wiki DevSnack page was reduced to a one-page hub. Operational detail, content-management rules, Research sync safeguards, and sanitized history were placed under `docs/operations/`. The existing Research Backlog remains the sync source until a separately verified input-contract migration is performed.

This documentation change does not alter routes, Supabase rows, or publication behavior.

## Ongoing rule

Add a dated record for each material migration. Link the detailed evidence, state what was not changed, and separate historical observations from current live verification.
