-- Historical mining score snapshot table (2026-08-14).
CREATE TABLE IF NOT EXISTS public.mining_scores (
  id BIGSERIAL PRIMARY KEY,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hashrate_1m_ghs NUMERIC,
  hashrate_10m_ghs NUMERIC,
  hashrate_1h_ghs NUMERIC,
  chip_temp NUMERIC,
  vr_temp NUMERIC,
  fan_speed NUMERIC,
  power_w NUMERIC,
  error_pct NUMERIC,
  shares_accepted BIGINT,
  shares_rejected BIGINT,
  best_diff NUMERIC,
  best_session_diff NUMERIC,
  pool_hashrate_1m_ghs NUMERIC,
  pool_hashrate_1h_ghs NUMERIC,
  uptime_sec BIGINT,
  score NUMERIC,
  rank_at_insert INTEGER
);

CREATE INDEX IF NOT EXISTS idx_mining_scores_measured_at ON public.mining_scores (measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_mining_scores_score ON public.mining_scores (score DESC);

-- RLS: anon SELECT만 허용 (쓰기는 service_role만)
ALTER TABLE public.mining_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_mining_scores" ON public.mining_scores;
CREATE POLICY "anon_select_mining_scores" ON public.mining_scores FOR SELECT TO anon USING (true);

-- mining_scores에 풀 상태 컬럼 추가
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS lastshare_sec BIGINT;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_workers INTEGER;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_bestshare NUMERIC;
ALTER TABLE public.mining_scores ADD COLUMN IF NOT EXISTS pool_bestever NUMERIC;

-- 채굴 스코어보드 스냅샷 — 채굴기 /api/system/scoreboard의 베스트 공유 top 20을 수집 시점별로 저장
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
