-- 채굴 스코어보드 스냅샷 (2026-08-14) — 채굴기 /api/system/scoreboard의 베스트 공유 top 20을 수집 시점별로 저장
CREATE TABLE IF NOT EXISTS public.mining_scoreboard (
  id BIGSERIAL PRIMARY KEY,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rank INTEGER NOT NULL,
  difficulty NUMERIC,
  job_id TEXT,
  nonce TEXT,
  ntime BIGINT
);

CREATE INDEX IF NOT EXISTS idx_mining_scoreboard_measured_at ON public.mining_scoreboard (measured_at DESC);

ALTER TABLE public.mining_scoreboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_mining_scoreboard" ON public.mining_scoreboard;
CREATE POLICY "anon_select_mining_scoreboard" ON public.mining_scoreboard FOR SELECT TO anon USING (true);

-- mining_scores에 풀 상태 컬럼 추가
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS lastshare_sec BIGINT;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_workers INTEGER;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_bestshare NUMERIC;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_bestever NUMERIC;
