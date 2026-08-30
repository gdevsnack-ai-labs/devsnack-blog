-- Public aggregate-only Hermes usage report.
-- The local collector is the only writer; the blog uses anon SELECT.

CREATE TABLE IF NOT EXISTS public.hermes_usage_snapshots (
  id             TEXT PRIMARY KEY,
  captured_at    TIMESTAMPTZ NOT NULL,
  report_version TEXT NOT NULL,
  scope          TEXT NOT NULL,
  report_hash    TEXT NOT NULL,
  report         JSONB NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hermes_usage_snapshots_captured_at
  ON public.hermes_usage_snapshots (captured_at DESC);

ALTER TABLE public.hermes_usage_snapshots ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.hermes_usage_snapshots TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_hermes_usage_snapshots" ON public.hermes_usage_snapshots;
CREATE POLICY "public_read_hermes_usage_snapshots"
  ON public.hermes_usage_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (true);
