# Content Inventory and Change Records

## Where each kind of content belongs

| Content | Location | Rule |
|:--------|:---------|:-----|
| Next.js routes and UI | `src/app/`, `src/components/` | Code changes require focused checks and a build |
| Repository media/assets | `public/` | Keep only assets required by the application |
| Dynamic published posts | Supabase `posts` | Query by explicit `blog_id`, `slug`, and status |
| Research queue | Hermes Wiki Research Backlog | Keep one source until the sync contract is migrated |
| Operating rules | `docs/operations/` | Keep concise, current, and actionable |
| Phase implementation evidence | `docs/phase*` | Preserve dates, scope, and verification results |
| One-off drafts or local credentials | ignored local files | Never commit or document secret values |

## Avoid duplicate inventories

The public post list is dynamic and belongs to Supabase plus the production routes. Do not maintain another hand-edited list in the wiki or repository that can drift from production. A dated inventory is acceptable only when it includes its query scope, timestamp, and purpose.

## Change record format

Each meaningful content or publishing change should retain:

- date and operator/automation name;
- target `blog_id` and slug(s);
- reason and intended effect;
- before snapshot or content hash when a batch is involved;
- exact write result;
- database read-back;
- public route read-back;
- rollback or follow-up action.

Use a phase document for a bounded migration and [`history.md`](./history.md) for durable milestones. Do not put secrets, internal absolute paths, or personal authentication details in a change record.

## Content quality minimum

Before a public write, check:

- title and excerpt are coherent;
- body is complete and not an internal report dump;
- sources are visible where needed;
- images have descriptive alt text;
- links resolve and media uses an approved public origin;
- private paths, IPs, emails, credentials, and internal instructions are absent;
- `slug` and public route are unchanged unless the migration explicitly includes redirects.
