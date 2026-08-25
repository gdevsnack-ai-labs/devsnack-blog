-- Phase 2: structured Feed provenance for new automated outputs.
-- Existing rows remain compatible through the empty-object fallback.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.posts.provenance IS
  'Public-safe provenance for automated Feed outputs; legacy rows use an empty object.';

CREATE INDEX IF NOT EXISTS idx_posts_provenance_kind
  ON public.posts ((provenance->>'kind'))
  WHERE provenance <> '{}'::jsonb;
