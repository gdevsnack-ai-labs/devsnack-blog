-- Phase 4: locale-aware post translations.
-- Source posts remain canonical Korean records; translations are separate rows.
CREATE TABLE IF NOT EXISTS public.post_translations (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  slug TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  seo_desc TEXT,
  source_content_hash TEXT NOT NULL,
  translation_status TEXT NOT NULL DEFAULT 'candidate'
    CHECK (translation_status IN ('candidate', 'reviewed', 'published', 'stale')),
  translated_at TIMESTAMPTZ,
  translator_type TEXT NOT NULL DEFAULT 'ai_assisted'
    CHECK (translator_type IN ('human', 'ai_assisted', 'automated')),
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_post_translations_locale_status
  ON public.post_translations (locale, translation_status);

CREATE INDEX IF NOT EXISTS idx_post_translations_source_hash
  ON public.post_translations (source_content_hash);

ALTER TABLE public.post_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_published_post_translations" ON public.post_translations;
CREATE POLICY "anon_select_published_post_translations"
  ON public.post_translations
  FOR SELECT TO anon
  USING (translation_status = 'published');

COMMENT ON TABLE public.post_translations IS
  'Locale-specific translations keyed to canonical posts; source hashes expose stale translations without duplicating post columns.';
COMMENT ON COLUMN public.post_translations.source_content_hash IS
  'Hash of canonical source title/content/excerpt/SEO/labels at translation time.';
COMMENT ON COLUMN public.post_translations.translation_status IS
  'Workflow state: candidate, reviewed, published, or explicitly stale.';
