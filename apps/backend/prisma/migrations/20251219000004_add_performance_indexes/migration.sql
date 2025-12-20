-- Add composite indexes for performance optimization

-- Comments: Optimize story/chapter comment queries
CREATE INDEX IF NOT EXISTS "comments_story_deleted_created_idx" ON "comments"("storyId", "isDeleted", "createdAt" DESC) WHERE "storyId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "comments_chapter_deleted_created_idx" ON "comments"("chapterId", "isDeleted", "createdAt" DESC) WHERE "chapterId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "comments_parent_created_idx" ON "comments"("parentId", "createdAt" ASC) WHERE "parentId" IS NOT NULL;

-- Stories: Optimize homepage and listing queries
CREATE INDEX IF NOT EXISTS "stories_published_status_created_idx" ON "stories"("isPublished", status, "createdAt" DESC) WHERE "isPublished" = true AND status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "stories_published_rating_idx" ON "stories"("isPublished", rating DESC, "ratingCount" DESC) WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS "stories_published_likes_idx" ON "stories"("isPublished", "likeCount" DESC, "followCount" DESC) WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS "stories_recommended_published_created_idx" ON "stories"("isRecommended", "isPublished", "createdAt" DESC) WHERE "isRecommended" = true AND "isPublished" = true;

