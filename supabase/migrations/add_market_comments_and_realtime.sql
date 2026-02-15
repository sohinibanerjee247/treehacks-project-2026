CREATE TABLE IF NOT EXISTS market_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_comments_market_id ON market_comments(market_id);

ALTER TABLE market_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read comments"
  ON market_comments FOR SELECT
  USING (true);

CREATE POLICY "authenticated users can insert comments"
  ON market_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE bets;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE markets;
ALTER PUBLICATION supabase_realtime ADD TABLE market_comments;
