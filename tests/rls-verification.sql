-- tests/rls-verification.sql
-- RLS Policy Verification Queries
-- Run these in Supabase SQL Editor or psql to verify RLS policies are correct.
-- These are READ-ONLY verification queries — they do not modify data.

-- ============================================================
-- 1. Verify RLS is enabled on all tables
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: ALL tables show rls_enabled = true
-- If any show false: run ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. List all policies per table
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Expected tables with policies:
-- products, orders, profiles, order_status_history, showcase_settings,
-- notification_outbox, order_access_tokens, idempotency_keys, rate_limit_buckets

-- ============================================================
-- 3. Verify no unsafe public grants
-- ============================================================
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY table_name;

-- Expected: 0 rows (anon should have no write privileges on any table)

-- ============================================================
-- 4. Verify is_admin() function exists and is SECURITY DEFINER
-- ============================================================
SELECT
  routine_name,
  security_type,
  routine_definition IS NOT NULL AS has_body
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'check_rate_limit', 'claim_outbox_events', 'check_idempotency', 'set_updated_at')
ORDER BY routine_name;

-- Expected: all 5 functions present with security_type = 'DEFINER' where applicable

-- ============================================================
-- 5. Verify indexes exist
-- ============================================================
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected indexes: idx_orders_user_id, idx_orders_status, idx_orders_created_at,
-- idx_orders_public_number, idx_notification_outbox_status_next, etc.

-- ============================================================
-- 6. Verify updated_at triggers
-- ============================================================
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY table_name;

-- ============================================================
-- 7. Verify constraints on orders
-- ============================================================
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY constraint_type, constraint_name;

-- Expected: orders_delivery_price_non_negative, orders_subtotal_non_negative,
-- orders_status_check CHECK constraints

-- ============================================================
-- 8. RLS Behavior Test (run as different roles)
-- NOTE: These require role switching, best done via Supabase API test or pgTAP
-- ============================================================

-- Test as anon: should return 0 orders
-- SET LOCAL ROLE anon;
-- SELECT COUNT(*) FROM orders; -- Expected: 0
-- RESET ROLE;

-- Test as authenticated user A: should see only their own orders
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub": "<user-A-uuid>", "role": "authenticated"}';
-- SELECT COUNT(*) FROM orders WHERE user_id != '<user-A-uuid>'; -- Expected: 0
-- RESET ROLE;

-- ============================================================
-- 9. Verify no raw access tokens in orders table
-- ============================================================
-- The old access_token column may still exist for legacy reasons,
-- new tokens go to order_access_tokens (hash only).
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_access_tokens'
ORDER BY ordinal_position;

-- Expected columns: id, order_id, token_hash (NOT raw token), created_at, expires_at, revoked_at, last_used_at

-- ============================================================
-- 10. Check for orphaned rows
-- ============================================================
SELECT COUNT(*) AS orphaned_order_items
FROM order_status_history osh
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = osh.order_id);

SELECT COUNT(*) AS orphaned_tokens
FROM order_access_tokens oat
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id::text = oat.order_id::text);

-- Expected: 0 orphaned rows
