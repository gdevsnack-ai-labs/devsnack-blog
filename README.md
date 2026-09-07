# DevSnack Blog

> 기술 콘텐츠, 공개 리서치, 실험 기록을 분리해 운영하는 Next.js 블로그.
> **Next.js + Supabase + Vercel** 구조이며, 현재 Production 상태를 기준으로 문서를 유지합니다.

## Current operating boundary

- **Production**: <https://devsnack-blog.vercel.app>
- **Canonical application repository**: <https://github.com/gdevsnack-ai-labs/devsnack-blog>
- **Published-data authority**: Supabase `posts` rows with explicit `blog_id`, `status`, and `lifecycle_status`
- **Deployment**: child repository push followed by Vercel deployment and production read-back
- **Current local execution boundary**: the public site does not require the local LLM, Hindsight, or ComfyUI services to be running. Their stopped/optional state is recorded in the Wiki infrastructure pages.

## Public information architecture

### Current public surfaces

- **Stories** — `/devsnack`: DevSnack Story snapshot and detail routes
- **Knowledge** — `/research`: public technical research and the Research Notebook links
- **Lab** — `/labs`: experiments, builds, creative tests, and verified project context
- **Benchmarks** — `/benchmarks`: curated benchmark releases
- **Data** — `/data`: archive/publication gateways and aggregate trackers
- **Showcase** — `/demos`: public interactive artifacts

### Archived or compatibility surfaces

- **StockPulse legacy archive** — `/stock`: `noindex, follow`; links to the paused `stockpulse-publication` archive
- **AI Tech v1 archive hub** — `/aitech`: indexable historical title/date index
- **AI Tech detail** — `/aitech/<slug>`: retired with HTTP 410 and `noindex`
- **Legacy Lab hub** — `/lab`: HTTP 308 redirect to canonical `/labs`

The Supabase store retains historical `aitech` and `stockpulse` rows for evidence and mapped external publication links. A `status=live` row is not by itself proof that the row is indexable: lifecycle, route policy, and publication mapping are evaluated separately.

## Content and operations

- **Current content writes**: reviewed direct publisher or an explicitly approved sync
- **Research source**: Hermes Wiki Research Backlog remains the single queue source until a separately verified migration
- **Current active experiment publication**: StockPulse V1 Fixed uses GitHub Pages for reader-facing reports and `/labs/stockpulse-v1-fixed` for the Vercel experiment projection
- **Legacy Blogger tools**: historical/DRAFT compatibility only; not the default LIVE path
- **Public safety**: internal paths, private hosts, credentials, raw prompts, execution logs, and private operator context are blocked before publication and checked again on the public surface

Canonical operating documents live in [`docs/operations/`](docs/operations/README.md):

- [Content publishing](docs/operations/content-publishing.md)
- [Research sync](docs/operations/research-sync.md)
- [Content inventory](docs/operations/content-inventory.md)
- [Management history](docs/operations/history.md)

## Repository structure

```text
src/app/                  # Next.js App Router routes
├── devsnack/             # Stories
├── research/             # Knowledge
├── labs/                 # Canonical Lab hub and projects
├── lab/                  # Legacy-compatible detail routes
├── benchmarks/           # Benchmark releases
├── data/                 # Data hub and trackers
├── demos/                # Showcase artifacts
├── aitech/               # AI Tech v1 archive hub and retired detail boundary
└── stock/                # StockPulse legacy archive and mapped external details
src/components/           # Shared UI and public projections
src/data/                 # Bounded static snapshots and experiment registry
src/lib/                  # Supabase access, IA, lifecycle, SEO, and projections
scripts/                  # Read-only audits, focused checks, and approved publishers
docs/operations/          # Current operating rules and history
docs/phase*/              # Dated historical implementation evidence
```

## Local development

```bash
npm install
cp .env.example .env.local
# .env.local에 Supabase 환경변수 설정
npm run dev
```

Do not commit `.env.local`, OAuth files, tokens, cookies, or service-role values. Supabase configuration is supplied through ignored environment files or the Vercel environment, not tracked source literals.

## Verification

From the repository root:

```bash
npm test
npm run lint
npm run build
SITE_URL=https://devsnack-blog.vercel.app npm run audit:site
npm run audit:links -- --base-url https://devsnack-blog.vercel.app
```

`npm test` includes the current StockPulse projection contract and Python public-surface/source-security tests. `audit:site` also checks RSS population, retired sitemap/RSS entries, public safety, and V1 Fixed publication links.

## Historical evidence

Dated `docs/phase*` documents preserve the state observed during earlier migrations. They are evidence, not current configuration. When an old result differs from Production, use the current route, DB, repository code, and active runtime as the source of truth, and keep the dated result under an explicit historical label.

## License

MIT for the application code. Blog articles, images, and publication content may have separate rights.
