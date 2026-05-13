-- Stores the ORD database words that appear naturally in this article.
-- Used by the session builder to prefer articles that reinforce recently-practiced words.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_ord_words TEXT[] DEFAULT '{}';
