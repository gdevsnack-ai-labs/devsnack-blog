# DevSnack Blog Operations

Canonical operator documentation for the DevSnack Blog application, its publishing workflow, and its project history.

## Scope

This directory is the management surface for the child repository. It contains durable operating rules and links to phase-specific implementation records.

- **Application and deploy code**: this repository (`src/`, `public/`, `supabase/`)
- **Published content authority**: Supabase `posts` rows, read by the Next.js application
- **Research publication source**: the Hermes Wiki Research Backlog while the existing `sync_research.py` input contract remains in place
- **Parent operational scripts**: the parent workspace `scripts/` directory, including the Research sync wrapper
- **Detailed implementation history**: `docs/phase*.md` and the records linked from [`history.md`](./history.md)

## Document map

- [`content-publishing.md`](./content-publishing.md) — canonical publishing path, safety gates, and read-back checklist
- [`research-sync.md`](./research-sync.md) — Research Backlog parser contract and sync procedure
- [`content-inventory.md`](./content-inventory.md) — where content, assets, routes, and change records belong
- [`history.md`](./history.md) — sanitized project timeline and links to detailed phase records

## Source-of-truth matrix

| Area | Authoritative source | Do not use as a source of truth |
|:-----|:---------------------|:---------------------------------|
| Routes and UI | `src/app/`, `src/components/`, production read-back | old wiki design snippets |
| Published posts | Supabase `posts` with explicit `blog_id` and `status` | duplicated static post lists |
| Research queue | Hermes Wiki Research Backlog | a manually copied repo mirror |
| Publishing behavior | current scripts plus this runbook | legacy Blogger-only instructions |
| Project history | Git history and `docs/phase*` records | stale wiki snapshots without a date |

## Operating rules

1. Preserve existing `slug`, `blog_id`, public routes, and publication semantics unless a change explicitly covers migration and read-back.
2. Keep credentials in ignored environment files or the platform secret store. Never put tokens, cookies, service-role keys, or private authentication material in this repository or its documents.
3. Use a dry-run or read-only inventory before a write. After a write, read back the exact target row and the public route.
4. Treat dated phase records as historical evidence. Do not copy their old counts or status into a current-state summary without rechecking.
5. Append operational history; do not rewrite a past result to make it look like a current run.
6. Keep the wiki page as a concise navigation hub. Put implementation detail, checklists, and history here.

## Current boundary

The current reorganization changes documentation only. It does not change Next.js routes, Supabase schema, published rows, or the Research sync input contract. Moving the Research Backlog source out of the wiki is a separate migration that must include parser tests, a dry run, and production read-back.
