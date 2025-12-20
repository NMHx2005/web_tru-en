-- Add GIN indexes for full-text search
-- Note: PostgreSQL full-text search uses to_tsvector for indexing

-- Create indexes for stories table
CREATE INDEX IF NOT EXISTS stories_title_gin_idx ON stories USING gin(to_tsvector('english', COALESCE(title, '')));
CREATE INDEX IF NOT EXISTS stories_description_gin_idx ON stories USING gin(to_tsvector('english', COALESCE(description, '')));

-- Create indexes for chapters table
CREATE INDEX IF NOT EXISTS chapters_title_gin_idx ON chapters USING gin(to_tsvector('english', COALESCE(title, '')));
CREATE INDEX IF NOT EXISTS chapters_content_gin_idx ON chapters USING gin(to_tsvector('english', COALESCE(content, '')));

-- Add composite indexes for common search queries
CREATE INDEX IF NOT EXISTS stories_search_composite_idx ON stories("isPublished", status, "createdAt" DESC) WHERE "isPublished" = true AND status = 'PUBLISHED';

