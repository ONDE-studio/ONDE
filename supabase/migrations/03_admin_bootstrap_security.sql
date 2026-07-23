-- 03_admin_bootstrap_security.sql
-- Corrective security migration:
-- 1. Strictly default handle_new_user() trigger to role = 'customer' (never trust raw_user_meta_data)
-- 2. Add CHECK constraint on profiles.role (customer, admin)
-- 3. Create admin_audit_log table with RLS
-- 4. Update is_admin() helper with SECURITY DEFINER and search_path = public
-- 5. Restrict profiles UPDATE RLS to prevent users from mutating their own role

-- 1. Fix handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Покупатель'),
    'customer' -- ALWAYS customer by default, never take role from registration metadata
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$func$;

-- 2. Update is_admin() function to be STABLE, SECURITY DEFINER with search_path = public
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$func$;

-- 3. Add CHECK constraint on profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin'));

-- 4. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "No public insert to audit log" ON public.admin_audit_log;
CREATE POLICY "No public insert to audit log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (false);

-- 5. Restrict profiles UPDATE RLS policy (users cannot change their own role)
DROP POLICY IF EXISTS "Users can update own profile safe fields" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile safe fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
