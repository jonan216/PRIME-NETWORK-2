-- ==========================================
-- PRIME NETWORK SUPABASE RLS FIX SCRIPT
-- Resolves error 42P17 (Infinite Recursion in Profiles Policy)
-- ==========================================

-- 1. Create SECURITY DEFINER helper functions to safely check admin role and lookup profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.email FROM public.profiles p
  WHERE p.username = lower(p_username)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.username_exists(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.username = lower(p_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Auto-create profile on auth.user insert
-- This runs as the table owner, so it bypasses RLS during signup.
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_referred_by TEXT;
BEGIN
  v_username := lower(NEW.raw_user_meta_data->>'username')
    WHERE NEW.raw_user_meta_data->>'username' IS NOT NULL;

  IF v_username IS NULL THEN
    v_username := 'user_' || substr(replace(NEW.id::text, '-', ''), -6);
  END IF;

  v_full_name := NEW.raw_user_meta_data->>'full_name';
  IF v_full_name IS NULL THEN
    v_full_name := '';
  END IF;

  v_referred_by := NEW.raw_user_meta_data->>'referred_by';
  IF v_referred_by IS NULL THEN
    v_referred_by := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, username, role, referred_by, balance, kyc_verified, status
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_username,
    CASE WHEN NEW.email = 'primeadministratorwealth@gmail.com' THEN 'admin' ELSE 'user' END,
    v_referred_by,
    0,
    false,
    'active'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 3. Drop existing policies on profiles table that cause recursion
DROP POLICY IF EXISTS "Allow user select" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin select" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by owner and admin" ON public.profiles;

-- 4. Create non-recursive policies for profiles
CREATE POLICY "Profiles view policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- 5. Ensure RLS is active on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 6. Non-recursive policies for transactions
DROP POLICY IF EXISTS "Transactions view policy" ON public.transactions;
DROP POLICY IF EXISTS "Transactions insert policy" ON public.transactions;
DROP POLICY IF EXISTS "Transactions update policy" ON public.transactions;

CREATE POLICY "Transactions view policy" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions insert policy" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions update policy" ON public.transactions
  FOR UPDATE USING (public.is_admin());

-- 7. Non-recursive policies for investments
DROP POLICY IF EXISTS "Investments view policy" ON public.investments;
DROP POLICY IF EXISTS "Investments insert policy" ON public.investments;
DROP POLICY IF EXISTS "Investments update policy" ON public.investments;

CREATE POLICY "Investments view policy" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments insert policy" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments update policy" ON public.investments
  FOR UPDATE USING (public.is_admin());

-- 8. Grant execute permission on helper functions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.username_exists(TEXT) TO authenticated, anon;
