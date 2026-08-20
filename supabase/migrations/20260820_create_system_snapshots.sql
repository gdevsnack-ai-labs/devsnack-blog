-- DGX Spark 운영 현황판 스냅샷
-- 로컬 수집기만 service_role로 insert하고, 공개 페이지는 anon SELECT만 사용한다.

CREATE TABLE IF NOT EXISTS public.system_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  captured_at  TIMESTAMPTZ NOT NULL,
  source       TEXT NOT NULL DEFAULT 'dgx-spark',
  host         TEXT NOT NULL DEFAULT 'DGX Spark GB10',
  snapshot     JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_snapshots_captured_at
  ON public.system_snapshots (captured_at DESC);

ALTER TABLE public.system_snapshots ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.system_snapshots TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_system_snapshots" ON public.system_snapshots;
CREATE POLICY "public_read_system_snapshots"
  ON public.system_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (true);
