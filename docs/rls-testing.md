# RLS Testing Guide

## Overview

Row Level Security (RLS) policies are tested via SQL verification queries in  
`tests/rls-verification.sql`. These require a live Supabase instance.

## How to Run

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Open `tests/rls-verification.sql`
4. Run each section individually

## What is Verified

| Check | Expected Result |
|---|---|
| RLS enabled on all public tables | All tables: `rls_enabled = true` |
| Policies exist per table | All critical tables have policies |
| anon has no write grants | 0 rows returned |
| `is_admin()` function exists | Present with SECURITY DEFINER |
| Required indexes exist | All `idx_*` indexes present |
| `updated_at` triggers exist | triggers on orders, outbox, rate_limit_buckets |
| CHECK constraints on orders | delivery_price_non_negative, subtotal_non_negative, status_check |
| `order_access_tokens` has hash column | `token_hash` present, NOT raw token |
| No orphaned rows | 0 orphaned status history or token records |

## Manual Role-Based Tests

To test RLS behavior as different roles, use the Supabase API with different JWT tokens:

### Test as anonymous (anon)
```bash
curl -X GET "https://<project>.supabase.co/rest/v1/orders" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
# Expected: 200 OK with empty array []
```

### Test as customer A (sees only own orders)
```bash
# Use customer A's JWT token
curl -X GET "https://<project>.supabase.co/rest/v1/orders" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <customer-A-jwt>"
# Expected: only orders where user_id = customer A's UUID
```

### Test admin access
```bash
# Admin must have app_metadata.role = "admin"
curl -X GET "https://<project>.supabase.co/rest/v1/orders" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <admin-jwt>"
# Expected: all orders visible
```

## Setting the First Admin

To grant admin access to a user:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Find the user by email
3. Click the user → **Edit** → **Custom Claims (app_metadata)**
4. Add: `{"role": "admin"}`
5. Save

OR via SQL (service role only):
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

> ⚠️ **Never use `user_metadata`** for admin roles — users can modify their own `user_metadata`.  
> Always use `app_metadata` which is server-controlled only.
