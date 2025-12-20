-- Add isRecommended column to stories table
-- Run this SQL directly in your database if migration doesn't work

ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "isRecommended" BOOLEAN NOT NULL DEFAULT false;

