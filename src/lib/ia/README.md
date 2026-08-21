# DevSnack IA Foundation

This directory is the Phase 1 semantic sidecar for the DevSnack IA v1.

## Scope

- `ProjectProjection`: read-only projection of the legacy `experiments.ts` registry.
- `AssetRef`: primary information asset references for demos, curated findings, and legacy `posts` rows.
- `AssetRelation`: explicit cross-content relations without changing routes or database schema.
- `createIAFoundation()`: builds a future IA catalog from existing sources.
- `validateIAFoundation()`: checks duplicate IDs, missing project references, invalid types, and broken relation endpoints.

## Compatibility rules

- Existing `experiments.ts`, `demos.ts`, Supabase `posts`, `blog_id`, `labels`, routes, and UI are not modified by this sidecar.
- Existing content URLs are preserved through the current `postHref()` resolver.
- `finding` is an `AssetRole` on a `knowledge` asset, not a new `primary_type`, because the Phase 1 type list is fixed.
- Unknown or ambiguous legacy records are marked `classification: 'ambiguous'` instead of being silently guessed.
- `ai_generated` is explicit provenance for generated creative artifacts; it is separate from an automated publication pipeline.

## Run the standalone foundation test

```bash
node --experimental-strip-types src/lib/ia/ia-foundation.test.ts
```
