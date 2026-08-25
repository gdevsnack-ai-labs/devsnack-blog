-- Phase 4: measurement ledger for Korean/English SEO/GEO comparison.
-- This stores observations, not automated Search Console or Analytics credentials.
CREATE TABLE IF NOT EXISTS public.locale_experiment_measurements (
  id BIGSERIAL PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('ko', 'en')),
  path TEXT NOT NULL,
  measured_on DATE NOT NULL,
  index_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (index_status IN ('unknown', 'indexed', 'not_indexed', 'excluded')),
  impressions INTEGER CHECK (impressions IS NULL OR impressions >= 0),
  clicks INTEGER CHECK (clicks IS NULL OR clicks >= 0),
  ctr NUMERIC(8, 6) CHECK (ctr IS NULL OR (ctr >= 0 AND ctr <= 1)),
  query_language TEXT,
  organic_sessions INTEGER CHECK (organic_sessions IS NULL OR organic_sessions >= 0),
  geo_citations INTEGER CHECK (geo_citations IS NULL OR geo_citations >= 0),
  translation_error_count INTEGER NOT NULL DEFAULT 0 CHECK (translation_error_count >= 0),
  stale_translation BOOLEAN NOT NULL DEFAULT FALSE,
  source_system TEXT NOT NULL CHECK (source_system IN ('search_console', 'analytics', 'llm_citation_review', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (locale, path, measured_on, source_system)
);

CREATE INDEX IF NOT EXISTS idx_locale_measurements_path_date
  ON public.locale_experiment_measurements (path, measured_on DESC);

CREATE INDEX IF NOT EXISTS idx_locale_measurements_locale_date
  ON public.locale_experiment_measurements (locale, measured_on DESC);

ALTER TABLE public.locale_experiment_measurements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.locale_experiment_measurements IS
  'Internal observation ledger for comparing Korean and English SEO/GEO outcomes; service_role only until a reviewed dashboard exists.';
