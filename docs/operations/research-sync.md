# Research Backlog Sync

## Purpose

The Research Backlog is a workflow queue and the current source consumed by the legacy Research sync. The detailed queue remains in the Hermes Wiki because the existing parent `sync_research.py` contract reads it there.

This document records the contract and safe operating procedure; it is not a second copy of the queue.

## Current flow

```text
Hermes Wiki Research Backlog
  → parent workspace scripts/sync_research.py
  → Supabase posts (`blog_id=research`)
  → Vercel `/research`
```

The sync follows `[[wiki-link]]` references to include a sanitized research detail section. It masks local paths, internal IPs, emails, and wiki links before publication.

## Parser contract

The current parser expects:

- category sections beginning with `##`
- numbered item headings in the form `### N. Title`
- status and investigation date on the same line
- a `상세` line with a wiki link when a detail page should be included
- optional `SEO 설명` and `태그` lines

The status is workflow metadata. It does not, by itself, mean that an item is safe to publish.

## Safe procedure

Run from the parent workspace's `scripts/` directory, using the local environment file that is already ignored:

```bash
python3 sync_research.py --dry
```

Review:

- parsed item count
- slug changes
- category/status changes
- missing detail pages
- stale deletion candidates
- unexpected content or masking output

The legacy Research sync is safe by default:

```bash
python3 sync_research.py
# equivalent explicit read-only mode
python3 sync_research.py --dry
```

A database mutation requires an explicit reviewed apply:

```bash
python3 sync_research.py --apply
```

The guarded implementation protects DB-only draft rows and non-live lifecycle rows from stale deletion, and refuses to promote an existing draft row automatically. Review parsed items, slug changes, status changes, protected rows, and deletable stale candidates before any apply.

After an apply run, read back the exact affected `research` rows and the corresponding Vercel `/research/<slug>` routes. Do not rely on the process exit code alone.

## Future source migration

If the queue is moved into this repository later, update the parser's input contract deliberately rather than maintaining two independent copies. The migration gate should include:

1. parser fixture coverage and a count comparison;
2. dry-run slug/category/status comparison with the current source;
3. stale-delete safety check;
4. exact Supabase read-back;
5. Vercel route read-back;
6. a rollback path to the wiki source.
