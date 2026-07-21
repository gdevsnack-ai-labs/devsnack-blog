CREATE TABLE posts (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  excerpt     TEXT,
  labels      TEXT[],
  published   TIMESTAMPTZ,
  updated     TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'draft',
  seo_desc    TEXT,
  cover_image TEXT,
  blogger_id  TEXT,

  -- Full-Text Search
  fts         TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

CREATE INDEX idx_posts_fts ON posts USING GIN(fts);
CREATE INDEX idx_posts_labels ON posts USING GIN(labels);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published DESC);
