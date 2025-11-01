-- Change ID columns from UUID to TEXT to support app's timestamp-based IDs
-- The app uses Date.now() to generate IDs like "1761807390257"

-- Drop foreign key constraints first
ALTER TABLE timeline_items DROP CONSTRAINT IF EXISTS timeline_items_feature_id_fkey;
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_source_item_id_fkey;
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_target_item_id_fkey;

-- Change features.id to TEXT
ALTER TABLE features ALTER COLUMN id DROP DEFAULT;
ALTER TABLE features ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Change timeline_items columns to TEXT
ALTER TABLE timeline_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE timeline_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE timeline_items ALTER COLUMN feature_id TYPE TEXT USING feature_id::TEXT;

-- Change linked_items columns to TEXT
ALTER TABLE linked_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE linked_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE linked_items ALTER COLUMN source_item_id TYPE TEXT USING source_item_id::TEXT;
ALTER TABLE linked_items ALTER COLUMN target_item_id TYPE TEXT USING target_item_id::TEXT;

-- Re-add foreign key constraints with TEXT type
ALTER TABLE timeline_items
  ADD CONSTRAINT timeline_items_feature_id_fkey
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE;

ALTER TABLE linked_items
  ADD CONSTRAINT linked_items_source_item_id_fkey
  FOREIGN KEY (source_item_id) REFERENCES timeline_items(id) ON DELETE CASCADE;

ALTER TABLE linked_items
  ADD CONSTRAINT linked_items_target_item_id_fkey
  FOREIGN KEY (target_item_id) REFERENCES timeline_items(id) ON DELETE CASCADE;

-- Recreate indexes
DROP INDEX IF EXISTS idx_features_user_id;
DROP INDEX IF EXISTS idx_features_created_at;
DROP INDEX IF EXISTS idx_timeline_items_feature_id;
DROP INDEX IF EXISTS idx_timeline_items_user_id;
DROP INDEX IF EXISTS idx_linked_items_source;
DROP INDEX IF EXISTS idx_linked_items_target;
DROP INDEX IF EXISTS idx_linked_items_user_id;

CREATE INDEX idx_features_user_id ON features(user_id);
CREATE INDEX idx_features_created_at ON features(created_at DESC);
CREATE INDEX idx_timeline_items_feature_id ON timeline_items(feature_id);
CREATE INDEX idx_timeline_items_user_id ON timeline_items(user_id);
CREATE INDEX idx_linked_items_source ON linked_items(source_item_id);
CREATE INDEX idx_linked_items_target ON linked_items(target_item_id);
CREATE INDEX idx_linked_items_user_id ON linked_items(user_id);

-- Drop unique constraint on linked_items if it exists
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_source_item_id_target_item_id_key;

-- Re-add unique constraint
ALTER TABLE linked_items
  ADD CONSTRAINT linked_items_source_item_id_target_item_id_key
  UNIQUE(source_item_id, target_item_id);
