ALTER TABLE posts ADD COLUMN blog_id TEXT NOT NULL DEFAULT 'devsnack';
CREATE INDEX idx_posts_blog_id ON posts(blog_id);

-- 기존 DevSnack 글 업데이트
UPDATE posts SET blog_id = 'devsnack' WHERE blog_id = 'devsnack';
