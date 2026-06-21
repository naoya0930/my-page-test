-- Test Data Insertion Script
-- This script inserts sample data for testing the Artist's Way application
-- Run with: docker-compose exec workers npx wrangler d1 execute ast_way_db --local --file=./migrations/test_data.sql

-- ============================================
-- 1. Test Users
-- ============================================

-- User 1: Active user created 14 days ago (Week 3)
INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at)
VALUES (
  'test-user-001',
  'supabase-test-001',
  'user1@test.com',
  datetime('now', '-14 days'),
  datetime('now')
);

-- User 2: New user created today (Week 1)
INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at)
VALUES (
  'test-user-002',
  'supabase-test-002',
  'user2@test.com',
  datetime('now'),
  datetime('now')
);

-- User 3: Advanced user created 60 days ago (Week 9)
INSERT INTO Users (id, supabase_user_id, email, created_at, last_active_at)
VALUES (
  'test-user-003',
  'supabase-test-003',
  'user3@test.com',
  datetime('now', '-60 days'),
  datetime('now', '-5 days')
);

-- ============================================
-- 2. Morning Pages (User 1 - 14 days worth)
-- ============================================

-- Week 1 (7 days ago - today)
INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at)
VALUES 
  ('test-user-001', date('now', '-7 days'), '今日から始めるモーニングページ。少し緊張しているけど、頑張ろう。', 33, datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('test-user-001', date('now', '-6 days'), '2日目。昨日よりも書くことが多い。思考が少しずつ整理されてきた気がする。', 38, datetime('now', '-6 days'), datetime('now', '-6 days')),
  ('test-user-001', date('now', '-5 days'), '3日目の朝。目覚めがよくなってきた。書くことで頭がスッキリする。', 34, datetime('now', '-5 days'), datetime('now', '-5 days')),
  ('test-user-001', date('now', '-4 days'), '4日目。習慣になってきた。朝の時間が充実している。', 28, datetime('now', '-4 days'), datetime('now', '-4 days')),
  ('test-user-001', date('now', '-3 days'), '5日目。書くネタが尽きないのが不思議。頭の中にこんなに考えがあったのか。', 38, datetime('now', '-3 days'), datetime('now', '-3 days')),
  ('test-user-001', date('now', '-2 days'), '6日目。週末が近づいてきた。モーニングページが楽しみになってきた。', 35, datetime('now', '-2 days'), datetime('now', '-2 days')),
  ('test-user-001', date('now', '-1 days'), '7日目。1週間続けられた！これは大きな進歩だ。', 26, datetime('now', '-1 days'), datetime('now', '-1 days'));

-- Week 2 (14 days ago - 8 days ago)
INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at)
VALUES 
  ('test-user-001', date('now', '-14 days'), '初日。アーティストデートって何をすればいいんだろう？', 28, datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('test-user-001', date('now', '-13 days'), '2日目。昨日は公園を散歩した。思ったより楽しかった。', 28, datetime('now', '-13 days'), datetime('now', '-13 days')),
  ('test-user-001', date('now', '-12 days'), '3日目。新しいカフェを発見。コーヒーがおいしかった。', 28, datetime('now', '-12 days'), datetime('now', '-12 days')),
  ('test-user-001', date('now', '-10 days'), '5日目。書店で新しい本を買った。', 18, datetime('now', '-10 days'), datetime('now', '-10 days')),
  ('test-user-001', date('now', '-9 days'), '6日目。映画館に行った。久しぶりの映画。', 22, datetime('now', '-9 days'), datetime('now', '-9 days')),
  ('test-user-001', date('now', '-8 days'), '7日目。今週は5日書けた。少しずつ習慣化している。', 28, datetime('now', '-8 days'), datetime('now', '-8 days'));

-- User 2: Only today
INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at)
VALUES 
  ('test-user-002', date('now'), '初めてのモーニングページ。これから12週間頑張ろう！', 28, datetime('now'), datetime('now'));

-- User 3: Sporadic entries
INSERT INTO MorningPages (user_id, entry_date, content, character_count, created_at, updated_at)
VALUES 
  ('test-user-003', date('now', '-60 days'), 'Week 1: 始まり', 13, datetime('now', '-60 days'), datetime('now', '-60 days')),
  ('test-user-003', date('now', '-30 days'), 'Week 5: 中間地点', 14, datetime('now', '-30 days'), datetime('now', '-30 days')),
  ('test-user-003', date('now', '-7 days'), 'Week 9: もうすぐ終わり', 17, datetime('now', '-7 days'), datetime('now', '-7 days'));

-- ============================================
-- 3. Artist Dates
-- ============================================

-- User 1: Multiple weeks
INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at)
VALUES 
  ('test-user-001', 1, 1, 0, datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('test-user-001', 2, 1, 1, datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('test-user-001', 3, 0, 0, datetime('now'), datetime('now'));

-- User 2: Only week 1, not yet done
INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at)
VALUES 
  ('test-user-002', 1, 0, 0, datetime('now'), datetime('now'));

-- User 3: Multiple weeks with excitement
INSERT INTO ArtistDates (user_id, week_number, went_out, excited, created_at, updated_at)
VALUES 
  ('test-user-003', 1, 1, 1, datetime('now', '-60 days'), datetime('now', '-60 days')),
  ('test-user-003', 2, 1, 0, datetime('now', '-53 days'), datetime('now', '-53 days')),
  ('test-user-003', 3, 1, 1, datetime('now', '-46 days'), datetime('now', '-46 days')),
  ('test-user-003', 5, 1, 1, datetime('now', '-32 days'), datetime('now', '-32 days')),
  ('test-user-003', 9, 1, 1, datetime('now', '-7 days'), datetime('now', '-7 days'));

-- ============================================
-- 4. Progress Records (for reference)
-- ============================================
-- Note: Progress is calculated dynamically via GET /api/progress
-- This table can be used for caching in the future

-- ============================================
-- Test Data Summary
-- ============================================
-- Users: 3 test users at different stages
-- Morning Pages: 
--   - User 1: 13 entries (good progress)
--   - User 2: 1 entry (just started)
--   - User 3: 3 entries (sporadic)
-- Artist Dates:
--   - User 1: 3 weeks recorded
--   - User 2: 1 week (not completed)
--   - User 3: 5 weeks recorded

-- ============================================
-- How to Test with this Data
-- ============================================
-- 1. Use JWT with sub='supabase-test-001' for User 1
-- 2. Use JWT with sub='supabase-test-002' for User 2
-- 3. Use JWT with sub='supabase-test-003' for User 3

-- Expected Progress Results:
-- User 1 (Week 3): 
--   - morning_pages_this_week: 7
--   - morning_page_done: true
--   - artist_date_done: false (went_out=0, excited=0)

-- User 2 (Week 1):
--   - morning_pages_this_week: 1
--   - morning_page_done: false
--   - artist_date_done: false

-- User 3 (Week 9):
--   - morning_pages_this_week: 0 (last entry was 7 days ago)
--   - morning_page_done: false
--   - artist_date_done: true (went_out=1, excited=1)
