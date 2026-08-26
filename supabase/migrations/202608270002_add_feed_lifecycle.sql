-- Phase 1: separate automated Feed retention lifecycle from publication/editorial state.
-- Existing status/workflow_state semantics remain unchanged.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'live';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_lifecycle_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_lifecycle_status_check
  CHECK (lifecycle_status IN ('live', 'consolidated', 'archived', 'purge_candidate'));

CREATE INDEX IF NOT EXISTS idx_posts_feed_lifecycle
  ON public.posts (blog_id, lifecycle_status, published DESC);

COMMENT ON COLUMN public.posts.lifecycle_status IS
  'Retention lifecycle for Feed projections; distinct from publication status and editorial workflow_state.';
