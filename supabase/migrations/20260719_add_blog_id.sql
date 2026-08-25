ALTER TABLE posts ADD COLUMN blog_id TEXT NOT NULL DEFAULT 'devsnack';
CREATE INDEX idx_posts_blog_id ON posts(blog_id);

-- 기존 DevSnack 글 업데이트
UPDATE posts SET blog_id = 'devsnack' WHERE blog_id = 'devsnack';

-- Historical schema addition: view counter for public posts.
ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_posts_views ON posts(views DESC);
