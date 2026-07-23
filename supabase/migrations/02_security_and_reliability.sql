-- 02_security_and_reliability.sql
-- Corrective security migration: guest token hashing, rate limiting, idempotency,
-- notification_outbox processor columns, updated_at triggers, indexes, and complete RLS policies.
-- Safe to run incrementally on top of 01_production_redesign.sql

-- ============================================================
-- 1. ORDER ACCESS TOKENS TABLE (hash-only storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  token_hash text UNIQUE NOT NULL,  -- SHA-256 hex of raw token
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  last_used_at timestamp with time zone
);

-- ============================================================
-- 2. IDEMPOTENCY KEYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key uuid PRIMARY KEY,
  payload_hash text NOT NULL,        -- SHA-256 of normalized request payload
  order_id uuid,                     -- linked order (set after order created)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT idempotency_order_id_not_null CHECK (order_id IS NOT NULL)
);
-- Relax the NOT NULL constraint for insert-then-update pattern:
ALTER TABLE public.idempotency_keys DROP CONSTRAINT IF EXISTS idempotency_order_id_not_null;

-- ============================================================
-- 3. RATE LIMIT BUCKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,           -- HMAC-SHA256 of (ip + endpoint + window)
  endpoint text NOT NULL,
  window_start timestamp with time zone NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (bucket_key, window_start)
);

-- ============================================================
-- 4. EXPAND NOTIFICATION_OUTBOX (add missing processor columns)
-- ============================================================
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS aggregate_id text;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 5;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS next_attempt_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS locked_by text;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add dead_letter as valid status (status column already exists, just ensuring values are valid)
ALTER TABLE public.notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE public.notification_outbox ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'dead_letter', 'skipped'));

-- ============================================================
-- 5. ORDERS TABLE: add updated_at, remove raw access_token in favor of uuid id
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key_ref uuid REFERENCES public.idempotency_keys(key) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consent_terms boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consent_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'RUB';
-- NOTE: The old access_token (plain text) column remains for migration compatibility
-- New guest access uses order_access_tokens table exclusively

-- ============================================================
-- 6. CONSTRAINTS
-- ============================================================
-- Orders: delivery_price non-negative or null
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_price_non_negative;
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_price_non_negative
  CHECK (delivery_price IS NULL OR delivery_price >= 0);

-- Orders: subtotal non-negative
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_subtotal_non_negative;
ALTER TABLE public.orders ADD CONSTRAINT orders_subtotal_non_negative
  CHECK (subtotal >= 0);

-- Orders: valid status values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_public_number ON public.orders(public_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_next ON public.notification_outbox(status, next_attempt_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_order_access_tokens_order_id ON public.order_access_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_order_access_tokens_token_hash ON public.order_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_key ON public.rate_limit_buckets(bucket_key, window_start);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);

-- ============================================================
-- 8. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS notification_outbox_updated_at ON public.notification_outbox;
CREATE TRIGGER notification_outbox_updated_at
  BEFORE UPDATE ON public.notification_outbox
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rate_limit_buckets_updated_at ON public.rate_limit_buckets;
CREATE TRIGGER rate_limit_buckets_updated_at
  BEFORE UPDATE ON public.rate_limit_buckets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 9. RATE LIMIT ATOMIC FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket_key text,
  p_endpoint text,
  p_window_seconds integer DEFAULT 60,
  p_max_requests integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_window_start timestamp with time zone;
  v_count integer;
  v_allowed boolean;
  v_retry_after integer;
BEGIN
  -- Round down to window start
  v_window_start := date_trunc('minute', now()) + 
    (floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds - 
     floor(extract(epoch FROM date_trunc('minute', now()))) ) * interval '1 second';
  
  -- Use simpler window calculation
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  -- Atomic upsert
  INSERT INTO public.rate_limit_buckets (bucket_key, endpoint, window_start, request_count)
  VALUES (p_bucket_key, p_endpoint, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start) DO UPDATE
  SET request_count = rate_limit_buckets.request_count + 1,
      updated_at = timezone('utc'::text, now())
  RETURNING request_count INTO v_count;

  v_allowed := v_count <= p_max_requests;
  v_retry_after := CASE WHEN NOT v_allowed THEN
    p_window_seconds - (extract(epoch FROM now()) - extract(epoch FROM v_window_start))::integer
  ELSE 0 END;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'limit', p_max_requests,
    'retry_after', v_retry_after,
    'window_start', v_window_start
  );
END;
$func$;

-- ============================================================
-- 10. OUTBOX PROCESSOR LOCK FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_outbox_events(
  p_worker_id text,
  p_batch_size integer DEFAULT 10
)
RETURNS SETOF public.notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  UPDATE public.notification_outbox
  SET
    status = 'processing',
    locked_at = timezone('utc'::text, now()),
    locked_by = p_worker_id,
    updated_at = timezone('utc'::text, now())
  WHERE id IN (
    SELECT id FROM public.notification_outbox
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= timezone('utc'::text, now())
      AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
    ORDER BY next_attempt_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$func$;

-- ============================================================
-- 11. IDEMPOTENCY ATOMIC FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_idempotency(
  p_key uuid,
  p_payload_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_existing public.idempotency_keys;
BEGIN
  -- Try to find existing key
  SELECT * INTO v_existing FROM public.idempotency_keys WHERE key = p_key;
  
  IF FOUND THEN
    IF v_existing.payload_hash != p_payload_hash THEN
      RETURN jsonb_build_object('status', 'conflict', 'order_id', null);
    END IF;
    RETURN jsonb_build_object('status', 'duplicate', 'order_id', v_existing.order_id);
  END IF;
  
  -- Insert new key (will fail if race condition - caller handles this)
  INSERT INTO public.idempotency_keys (key, payload_hash, order_id)
  VALUES (p_key, p_payload_hash, null)
  ON CONFLICT (key) DO NOTHING;
  
  RETURN jsonb_build_object('status', 'new', 'order_id', null);
END;
$func$;

-- ============================================================
-- 12. ENABLE RLS ON NEW TABLES
-- ============================================================
ALTER TABLE public.order_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. RLS POLICIES — COMPLETE COVERAGE
-- ============================================================

-- order_access_tokens: only service role / admin, never public
DROP POLICY IF EXISTS "No public access to access tokens" ON public.order_access_tokens;
CREATE POLICY "No public access to access tokens" ON public.order_access_tokens
  FOR ALL USING (false);

-- idempotency_keys: service role only
DROP POLICY IF EXISTS "No public access to idempotency keys" ON public.idempotency_keys;
CREATE POLICY "No public access to idempotency keys" ON public.idempotency_keys
  FOR ALL USING (false);

-- rate_limit_buckets: service role only
DROP POLICY IF EXISTS "No public access to rate limit buckets" ON public.rate_limit_buckets;
CREATE POLICY "No public access to rate limit buckets" ON public.rate_limit_buckets
  FOR ALL USING (false);

-- notification_outbox: service role / admin only
DROP POLICY IF EXISTS "No public access to outbox" ON public.notification_outbox;
CREATE POLICY "No public access to outbox" ON public.notification_outbox
  FOR ALL USING (public.is_admin());

-- Orders: customers can only SELECT their own, cannot UPDATE status/price
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Orders: prevent customers from updating sensitive fields
DROP POLICY IF EXISTS "Customers cannot update order financials" ON public.orders;
-- (no customer update policy = customers cannot UPDATE at all via RLS)

-- Profiles: users cannot change their own role via profile update
DROP POLICY IF EXISTS "Users can update own profile safe fields" ON public.profiles;
CREATE POLICY "Users can update own profile safe fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- ============================================================
-- 14. CLEANUP OLD RATE LIMIT BUCKETS FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_buckets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_limit_buckets
  WHERE window_start < now() - interval '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$func$;

-- ============================================================
-- 15. VERIFICATION QUERIES (run manually to check state)
-- ============================================================
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename, policyname;
