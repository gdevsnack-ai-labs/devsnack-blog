-- Research 관리자 공개 POC
-- 인증과 live 발행은 다음 페이즈에서 추가한다.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS workflow_state TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS topic_fingerprint TEXT;

UPDATE public.posts
SET workflow_state = CASE
  WHEN status = 'live' THEN 'published'
  ELSE 'draft'
END
WHERE workflow_state IS NULL OR workflow_state = '';

CREATE INDEX IF NOT EXISTS idx_posts_research_drafts
  ON public.posts (blog_id, status, workflow_state)
  WHERE blog_id = 'research' AND status = 'draft' AND workflow_state = 'research_draft';

CREATE TABLE IF NOT EXISTS public.research_candidates (
  id                  BIGSERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  kind                TEXT NOT NULL DEFAULT 'keyword'
                      CHECK (kind IN ('keyword', 'cardnews')),
  summary             TEXT NOT NULL DEFAULT '',
  keywords            TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  source_urls         TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  topic_fingerprint   TEXT NOT NULL UNIQUE,
  normalized_title    TEXT NOT NULL DEFAULT '',
  related_entities    TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  card_slides         JSONB,
  status              TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'reviewing', 'deferred', 'not_interested', 'promoted', 'discarded')),
  feedback            TEXT NOT NULL DEFAULT '',
  snooze_until        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_candidates_status
  ON public.research_candidates (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.research_suppressions (
  topic_fingerprint   TEXT PRIMARY KEY,
  normalized_title    TEXT NOT NULL DEFAULT '',
  keywords            TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  related_entities    TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  reason              TEXT NOT NULL DEFAULT 'not_interested',
  source_candidate_id BIGINT REFERENCES public.research_candidates(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_suppressions ENABLE ROW LEVEL SECURITY;

-- 공개 anon REST에서는 draft/candidate 데이터를 읽지 못하게 한다.
-- POC 페이지와 intake API는 서버 전용 service_role client를 사용한다.
DROP POLICY IF EXISTS "anon_select_posts" ON public.posts;
DROP POLICY IF EXISTS "anon_select_live_posts" ON public.posts;
CREATE POLICY "anon_select_live_posts"
  ON public.posts
  FOR SELECT TO anon
  USING (status = 'live');

-- draft cap은 애플리케이션 프롬프트가 아니라 DB transaction에서 보장한다.
CREATE OR REPLACE FUNCTION public.reserve_research_draft(
  p_slug              TEXT,
  p_title             TEXT,
  p_content           TEXT,
  p_excerpt           TEXT,
  p_labels            TEXT[],
  p_published         TIMESTAMPTZ,
  p_source_type       TEXT,
  p_topic_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_count INTEGER;
  inserted_id BIGINT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('devsnack-research-draft-cap-v1'));

  SELECT count(*)::INTEGER
    INTO draft_count
    FROM public.posts
   WHERE blog_id = 'research'
     AND status = 'draft'
     AND workflow_state = 'research_draft';

  IF draft_count >= 5 THEN
    RETURN jsonb_build_object(
      'accepted', false,
      'reason', 'draft_cap_reached',
      'draft_count', draft_count,
      'limit', 5
    );
  END IF;

  INSERT INTO public.posts (
    slug, title, content, excerpt, labels, published, updated, status,
    blog_id, source_type, topic_fingerprint, workflow_state
  ) VALUES (
    p_slug, p_title, p_content, p_excerpt, COALESCE(p_labels, '{}'::TEXT[]),
    COALESCE(p_published, NOW()), NOW(), 'draft', 'research',
    COALESCE(p_source_type, 'poc-agent'), p_topic_fingerprint, 'research_draft'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO inserted_id;

  IF inserted_id IS NULL THEN
    RETURN jsonb_build_object(
      'accepted', false,
      'reason', 'duplicate_slug',
      'draft_count', draft_count,
      'limit', 5
    );
  END IF;

  RETURN jsonb_build_object(
    'accepted', true,
    'reason', 'draft_created',
    'post_id', inserted_id,
    'draft_count', draft_count + 1,
    'limit', 5
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_research_draft(
  TEXT, TEXT, TEXT, TEXT, TEXT[], TIMESTAMPTZ, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_research_draft(
  TEXT, TEXT, TEXT, TEXT, TEXT[], TIMESTAMPTZ, TEXT, TEXT
) TO service_role;
