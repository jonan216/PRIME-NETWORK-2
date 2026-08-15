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

-- 2. Drop existing policies on profiles table that cause recursion
DROP POLICY IF EXISTS "Allow user select" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin select" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by owner and admin" ON public.profiles;

-- 3. Create non-recursive policies for profiles
CREATE POLICY "Profiles view policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- 4. Ensure RLS is active on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 5. Non-recursive policies for transactions
DROP POLICY IF EXISTS "Transactions view policy" ON public.transactions;
DROP POLICY IF EXISTS "Transactions insert policy" ON public.transactions;
DROP POLICY IF EXISTS "Transactions update policy" ON public.transactions;

CREATE POLICY "Transactions view policy" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions insert policy" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions update policy" ON public.transactions
  FOR UPDATE USING (public.is_admin());

-- 6. Non-recursive policies for investments
DROP POLICY IF EXISTS "Investments view policy" ON public.investments;
DROP POLICY IF EXISTS "Investments insert policy" ON public.investments;
DROP POLICY IF EXISTS "Investments update policy" ON public.investments;

CREATE POLICY "Investments view policy" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments insert policy" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments update policy" ON public.investments
  FOR UPDATE USING (public.is_admin());

-- 7. Grant execute permission on helper functions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.username_exists(TEXT) TO authenticated, anon;
