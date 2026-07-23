-- 01_production_redesign.sql
-- Production database schema, RLS security policies, and product/order expansion for ONDE Studio

-- 1. Profiles Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Покупатель'),
    coalesce(new.raw_app_meta_data->>'role', new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role', '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$func$;

-- 2. Expand Products Table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text DEFAULT 'PLA-пластик';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '["Слоновая кость", "Антрацит"]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_grams integer DEFAULT 350;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_mm integer DEFAULT 150;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_mm integer DEFAULT 150;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_mm integer DEFAULT 180;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_separate_package boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fragile boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS made_to_order boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_days_min integer DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_days_max integer DEFAULT 3;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description text;

-- 3. Redesign Orders Table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS public_number text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_snapshot jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_provider_id text DEFAULT 'telegram_manual';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_provider_name text DEFAULT 'Согласование в Telegram';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_service_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_service_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_price numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_min_days integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_max_days integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_total numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- 4. Order Status History Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4b. Notification Outbox Table
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'order_created',
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  sent_at timestamp with time zone
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products
  FOR ALL USING (public.is_admin());

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Order Status History
DROP POLICY IF EXISTS "Users can view status history of own orders" ON public.order_status_history;
CREATE POLICY "Users can view status history of own orders" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Showcase Settings
DROP POLICY IF EXISTS "Public can view showcase settings" ON public.showcase_settings;
CREATE POLICY "Public can view showcase settings" ON public.showcase_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage showcase settings" ON public.showcase_settings;
CREATE POLICY "Admins can manage showcase settings" ON public.showcase_settings
  FOR ALL USING (public.is_admin());
