# DevSnack Blog — Current Architecture

> Current baseline verified against Production, Supabase, repository code, and active runtime on 2026-09-07.
> Dated phase documents preserve earlier implementation evidence and are not current configuration by default.

## System boundary

```text
Reader
  ↓
Vercel / Next.js public routes
  ├── static snapshots and curated releases
  ├── Supabase public projections
  └── external publication links

Supabase posts
  ├── devsnack / lab / research: current public lanes
  ├── aitech: archived v1 rows, retired detail URLs
  └── stockpulse: legacy archive rows, external archive mapping

Hermes / content-factory runtime
  ├── StockPulse V1 Fixed current Morning/Evening experiment
  ├── controlled operations refresh
  └── legacy sync tools, manually gated and not scheduled
```

The public application does not depend on the local LLM, Hindsight, or ComfyUI service being active. Their current stopped/optional state belongs to the infrastructure Wiki, not to the public deployment contract.

## Current route contract

| Route | Role | Current behavior |
|:------|:-----|:-----------------|
| `/` | public entry point | indexable home projection |
| `/devsnack` | Stories collection | bounded static snapshot with public detail links |
| `/devsnack/[slug]` | Story detail | dynamic public detail |
| `/research` | Knowledge collection | Supabase knowledge projection plus Research Notebook board |
| `/research/[slug]` | Research detail | public detail unless an explicit external migration redirect applies |
| `/labs` | Lab hub | canonical experiments/builds/creative tests hub |
| `/labs/[id]` | Lab project | project projection and verified findings |
| `/labs/stockpulse-v1-fixed` | current experiment | read-only Live Shadow projection |
| `/lab` | legacy Lab hub | HTTP 308 to `/labs` |
| `/lab/[id]` | compatibility detail | retained only where a mapped legacy detail route is required |
| `/benchmarks` | curated benchmark hub | indexable public release collection |
| `/data` | publication/tracker hub | archive gateways and aggregate tracker links |
| `/stock` | StockPulse legacy archive | `noindex, follow`; external old publication gateway |
| `/stock/[slug]` | legacy StockPulse detail | mapped external redirect when an exact publication exists |
| `/aitech` | AI Tech v1 archive hub | indexable compact title/date history |
| `/aitech/[slug]` | AI Tech v1 detail | HTTP 410 and `noindex`; never in sitemap/RSS/search |
| `/demos` | Showcase hub | public interactive artifacts |
| `/rss.xml` | Korean RSS | live public rows with valid Vercel detail routes |
| `/en/rss.xml` | English pilot RSS | existing English publication lane |
| `/sitemap.xml` | discovery contract | indexable hubs and eligible public details only |

## Data projection rules

### Supabase posts

`blog_id`, `status`, and `lifecycle_status` are evaluated together. The current database retains historical rows so that archive evidence and compatibility mappings are not destroyed.

- `devsnack`, `lab`, and `research` live rows may project to public Vercel surfaces when route and safety policy permit.
- `aitech` rows remain `status=live` with `lifecycle_status=archived`, but their detail paths are retired by the root proxy.
- `stockpulse` rows remain historical archive records with `archived` or `consolidated` lifecycle state; the old `/stock` route is not the V1 Fixed experiment surface.
- draft rows are never promoted or deleted by a legacy sync merely because they are absent from a queue source.

### Static and external projections

- DevSnack Stories use the bounded `src/data/devsnack-snapshot.json` projection.
- AI Tech uses `src/data/aitech-v1-archive.json` for title/date history only.
- StockPulse `/stock` uses the legacy external-publication mapping and does not represent the current V1 Fixed Live Shadow.
- StockPulse V1 Fixed uses `src/data/stockpulse-v1-fixed-projection.json` for the Vercel Lab view. Reader-facing reports live under the separate GitHub Pages publication. A report link is rendered only when the projection has an available status and a real path.
- Research Notebook is an external publication surface for mapped notes; migrated Vercel Research details redirect there.

## Publication flows

### Current direct content path

```text
reviewed content
  → public-content safety gate
  → explicit publisher or guarded sync
  → Supabase read-back
  → Vercel route / metadata / link read-back
```

### Current StockPulse V1 Fixed path

```text
active Morning/Evening scheduler
  → private canonical run evidence
  → public-safe projection
  → GitHub Pages report when the real publication path exists
  → Vercel /labs/stockpulse-v1-fixed read-only projection
```

The Vercel Lab is the experiment-record surface. It is not a daily article feed, and a pending publication must not receive an inferred URL.

### Research sync boundary

```text
Hermes Wiki Research Backlog
  → legacy sync parser (dry-run by default)
  → explicit reviewed apply only
  → Supabase research rows
  → Vercel /research
```

The legacy parser protects draft and non-live lifecycle rows and is not an unattended cron path.

## Discovery and syndication

- RSS selects `status` explicitly and then applies the public-feed/lifecycle filter.
- RSS excludes retired AI Tech and StockPulse detail paths and migrated Research detail paths.
- Sitemap excludes noindex hubs, retired details, migrated Research details, and the legacy `/lab` hub.
- Public search uses the same lifecycle boundary and must not return archived external Feed rows.
- `npm run audit:site` verifies RSS population, sitemap exclusions, route metadata, visible public safety, and current V1 Fixed publication targets.

## Runtime status

The active scheduler is the StockPulse V1 Fixed Morning/Evening lane plus separate operational/Agent Field Notes jobs. No active Hermes job was found for the legacy Blogger, Research, or Misc sync writers.

At the current verification point, these local services are stopped and their ports are unused:

- llama server: 8080
- Wiki embedding: 8082
- Wiki reranker: 8083
- ComfyUI: 8188
- Hindsight services: 18888/19999

The stopped state does not block the Vercel public application. Reactivation requires a separate infrastructure decision.

## Security boundary

- Supabase and OAuth credentials come from ignored environment files or platform secret storage.
- Tracked source must not contain key/token literals.
- Public content must not contain actual local paths, internal hosts/ports, credentials, raw prompts, execution logs, or internal operator context.
- The public-surface audit evaluates rendered production text, not only newly inserted rows.

## Historical architecture — superseded

The earlier Blogger-era flow used a scheduled market analysis, local Qwen title generation, direct Blogger/Supabase publication, and post-publication self-healing. That flow is retained in dated phase documents as historical evidence. It is not the current `/stock` or V1 Fixed operating contract.

The 2026-07-20 design also described `/lab` as the Lab hub and omitted the later `/labs`, `/benchmarks`, and `/data` projections. The current canonical route is `/labs`; `/lab` remains only as a compatibility redirect/detail namespace.

See [`docs/operations/`](operations/README.md) for current operating rules and [`docs/operations/history.md`](operations/history.md) for the sanitized timeline.
