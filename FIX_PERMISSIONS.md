# Fix Admin & User Permissions

Run this SQL in your Supabase SQL Editor to fix the permissions:

```sql
-- =========================
-- DROP OLD POLICIES
-- =========================
DROP POLICY IF EXISTS "admins manage channels" ON channels;
DROP POLICY IF EXISTS "admins manage markets" ON markets;
DROP POLICY IF EXISTS "read own memberships" ON channel_members;
DROP POLICY IF EXISTS "read markets in joined channel" ON markets;


-- =========================
-- NEW POLICIES: CHANNELS
-- =========================

-- Anyone can read channels
CREATE POLICY "read channels"
ON channels FOR SELECT
USING (true);

-- Only check admin in API (policies allow all authenticated writes)
CREATE POLICY "authenticated users manage channels"
ON channels FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);


-- =========================
-- NEW POLICIES: CHANNEL MEMBERS
-- =========================

-- Users can see all memberships (to check who's in a channel)
CREATE POLICY "read all memberships"
ON channel_members FOR SELECT
USING (true);

-- Users can join channels
CREATE POLICY "users can join channels"
ON channel_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can leave channels
CREATE POLICY "users can leave channels"
ON channel_members FOR DELETE
USING (auth.uid() = user_id);


-- =========================
-- NEW POLICIES: MARKETS
-- =========================

-- Anyone can read all markets
CREATE POLICY "read all markets"
ON markets FOR SELECT
USING (true);

-- Only check admin in API (policies allow all authenticated writes)
CREATE POLICY "authenticated users manage markets"
ON markets FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);


-- =========================
-- POLICIES: BETS (unchanged)
-- =========================
-- These are already correct - users insert/read their own bets
```

**What this does:**

1. **Channels & Markets:**
   - Everyone can read
   - API checks if you're admin (via email) before allowing create/update/delete
   - Database just checks you're logged in

2. **Channel Members (joining):**
   - Users can join any channel
   - Users can leave channels they're in

3. **Bets:**
   - Already correct - users can only bet and see their own bets

**After running this:**
- You can create channels and markets (admin email check is in the API)
- Normal users can join channels and place bets
- No need to set `role = 'admin'` in the database anymore
