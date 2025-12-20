-- AlterTable: Change unique constraint from userId_chapterId to userId_storyId
-- Also make storyId required (NOT NULL)

-- Step 1: Delete old unique constraint
ALTER TABLE "reading_history" DROP CONSTRAINT IF EXISTS "reading_history_userId_chapterId_key";

-- Step 2: Merge duplicate entries (if any) - keep the one with latest lastRead
-- For each user-story pair, keep only the entry with the most recent lastRead
DELETE FROM "reading_history" rh1
WHERE EXISTS (
  SELECT 1 FROM "reading_history" rh2
  WHERE rh2."userId" = rh1."userId"
    AND rh2."storyId" = rh1."storyId"
    AND rh2."lastRead" > rh1."lastRead"
);

-- Step 3: Make storyId NOT NULL (update any null values first)
UPDATE "reading_history" 
SET "storyId" = (
  SELECT "storyId" FROM "chapters" 
  WHERE "chapters"."id" = "reading_history"."chapterId"
)
WHERE "storyId" IS NULL;

-- Step 4: Add NOT NULL constraint to storyId
ALTER TABLE "reading_history" ALTER COLUMN "storyId" SET NOT NULL;

-- Step 5: Add new unique constraint on userId_storyId
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_userId_storyId_key" UNIQUE ("userId", "storyId");

-- Step 6: Add foreign key constraint for story (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reading_history_storyId_fkey'
  ) THEN
    ALTER TABLE "reading_history" 
    ADD CONSTRAINT "reading_history_storyId_fkey" 
    FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE;
  END IF;
END $$;

