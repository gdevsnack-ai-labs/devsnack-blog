# Content Publishing Runbook

## Canonical publication path

The current public site is the Vercel/Supabase application in this repository.

```text
reviewed content
  → explicit publisher or approved sync
  → Supabase posts row
  → Next.js/Vercel read
  → database and public-route read-back
```

The legacy Blogger integration is retained only for historical or explicitly marked DRAFT workflows. It is not the default LIVE publishing path.

## Content boundaries

- `blog_id` identifies a content lane (`devsnack`, `lab`, `research`) or a retained historical archive lane (`stockpulse`, `aitech`).
- `status`, `lifecycle_status`, and publication timestamps must be set explicitly by the publisher.
- The old `/stock` archive and the current `/labs/stockpulse-v1-fixed` Live Shadow publication are separate surfaces.
- `content`, `excerpt`, `labels`, `seo_desc`, `cover_image`, and `updated` must be treated as a single write contract.
- Images and media must use approved public URLs or repository assets. Do not publish local filesystem paths, internal IPs, credentials, or private instructions.

## Before publishing

1. Confirm the primary content type and destination.
2. Check title, body completeness, sources, labels, image alt text, and internal links.
3. Run the relevant local validator or preview.
4. Capture the target slug and expected fields before writing.
5. For batch work, snapshot the candidate IDs and content hashes first.

## Available repository checks

Run from the child repository root:

```bash
npm test
npm run audit:site
npm run audit:links
npm run lint
npm run build
```

Use the focused checks first. A full build is required before claiming a deployable documentation or code change.

## Read-back checklist

After a publication write:

- Read the exact Supabase row by `blog_id` and `slug`.
- Confirm `status`, `lifecycle_status` where applicable, title, body hash/length, and `updated`.
- Request the exact public route and confirm HTTP success.
- Check that the visible title, source links, media, and key content are present.
- Check that no private path, IP, email, credential-like value, or internal wikilink leaked into the public result.
- Record the result in the appropriate phase/history document.

## Research publication caution

The legacy Research sync parses the Hermes Wiki Research Backlog and can update `blog_id=research` only with an explicit `--apply`. It defaults to dry-run, protects DB-only drafts/non-live lifecycle rows, and is not an unattended content mirror.

## Retired Misc sync

`sync_junk.py` is preserved as a historical parser only. It defaults to dry-run, skips archived/retired items, and refuses all live apply while `/misc` remains retired. Do not use it to recreate a `misc` row; a future Misc replacement needs a separately approved route and publication contract.

## Legacy Blogger tools

Blogger scripts under `scripts/legacy/` are historical/DRAFT helpers. The parent `sync_devsnack.py` is blocked unless `--apply` is explicit, and the parent AI Tech Blogger sync is fail-closed because its detail lane is retired. No legacy Blogger sync is registered in the active Hermes cron list.
