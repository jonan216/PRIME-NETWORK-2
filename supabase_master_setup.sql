-- ==========================================
-- PRIME NETWORK - MASTER DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- This replaces ALL previous SQL files
-- ==========================================

-- ==========================================
-- 1. DROP EXISTING OBJECTS (clean slate)
-- ==========================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;

-- Drop functions with CASCADE to remove dependent policies automatically
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_email_by_username(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.username_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_registration() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS public.increment_balance(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.process_referral_bonus(UUID, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_all_balances() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code_for_backfill(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code_trigger() CASCADE;

-- Drop policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles','transactions','investments'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop tables
DROP TABLE IF EXISTS public.investments;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.profiles;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance NUMERIC DEFAULT 0,
  kyc_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'earning', 'referral_reward')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'approved', 'rejected', 'completed')),
  provider TEXT DEFAULT NULL,
  reference TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  daily_roi NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_earning_at TIMESTAMPTZ
);

-- ==========================================
-- 3. CREATE INDEXES
-- ==========================================

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- ==========================================
-- 4. CREATE HELPER FUNCTIONS
-- ==========================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND email = 'primenetworkadministrator@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.email FROM public.profiles p
  WHERE p.username = lower(p_username)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if username exists
CREATE OR REPLACE FUNCTION public.username_exists(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.username = lower(p_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'PRIME-' || substr(replace(p_user_id::text, '-', ''), -6);
END;
$$ LANGUAGE plpgsql;

-- Increment balance atomically
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET balance = coalesce(balance, 0) + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process referral bonus (5% / 3% / 1%)
CREATE OR REPLACE FUNCTION public.process_referral_bonus(p_investor_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_level_2_id UUID;
  v_level_3_id UUID;
BEGIN
  IF p_amount <= 0 THEN RETURN; END IF;

  SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = p_investor_id;

  IF v_referrer_id IS NOT NULL THEN
    PERFORM public.increment_balance(v_referrer_id, p_amount * 0.05);
    INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
    VALUES (v_referrer_id, 'referral_reward', p_amount * 0.05, 'completed', NULL, 'REF-' || gen_random_uuid());

    SELECT referred_by INTO v_level_2_id FROM public.profiles WHERE id = v_referrer_id;

    IF v_level_2_id IS NOT NULL THEN
      PERFORM public.increment_balance(v_level_2_id, p_amount * 0.03);
      INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
      VALUES (v_level_2_id, 'referral_reward', p_amount * 0.03, 'completed', NULL, 'REF-' || gen_random_uuid());

      SELECT referred_by INTO v_level_3_id FROM public.profiles WHERE id = v_level_2_id;

      IF v_level_3_id IS NOT NULL THEN
        PERFORM public.increment_balance(v_level_3_id, p_amount * 0.01);
        INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
        VALUES (v_level_3_id, 'referral_reward', p_amount * 0.01, 'completed', NULL, 'REF-' || gen_random_uuid());
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process registration bonus (UGX 2,000 for referrer)
CREATE OR REPLACE FUNCTION public.process_registration_bonus(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus_amount NUMERIC := 200;
BEGIN
  SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;

  IF v_referrer_id IS NOT NULL THEN
    PERFORM public.increment_balance(v_referrer_id, v_bonus_amount);
    INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
    VALUES (v_referrer_id, 'referral_reward', v_bonus_amount, 'completed', NULL, 'REF-REG-' || gen_random_uuid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate single user balance from transactions
CREATE OR REPLACE FUNCTION public.recalculate_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC := 0;
BEGIN
  SELECT coalesce(sum(
    CASE
      WHEN type IN ('deposit', 'earning', 'referral_reward') AND status IN ('completed', 'approved') THEN amount
      WHEN type = 'withdrawal' AND status = 'approved' THEN -amount
      ELSE 0
    END
  ), 0) INTO v_new_balance
  FROM public.transactions
  WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh balance based ONLY on verified Marz Pay deposits and withdrawals.
-- If a user has never made a deposit through the system, their balance is forced to 0.
CREATE OR REPLACE FUNCTION public.refresh_marz_verified_balance(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_has_deposits BOOLEAN;
  v_new_balance NUMERIC := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.transactions
    WHERE user_id = p_user_id
      AND type = 'deposit'
      AND status IN ('completed', 'approved')
  ) INTO v_has_deposits;

  IF NOT v_has_deposits THEN
    UPDATE public.profiles
    SET balance = 0
    WHERE id = p_user_id;
    RETURN;
  END IF;

  SELECT coalesce(sum(
    CASE
      WHEN type = 'deposit' AND status IN ('completed', 'approved') THEN amount
      WHEN type = 'withdrawal' AND status IN ('completed', 'approved') THEN -amount
      WHEN type = 'investment' AND status = 'active' THEN -amount
      WHEN type = 'earning' AND status = 'completed' THEN amount
      WHEN type = 'referral_reward' AND status = 'completed' THEN amount
      WHEN type = 'refund' AND status = 'completed' THEN amount
      ELSE 0
    END
  ), 0) INTO v_new_balance
  FROM public.transactions
  WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process daily earnings for active investments (Mon-Fri only)
CREATE OR REPLACE FUNCTION public.process_daily_earnings()
RETURNS VOID AS $$
DECLARE
  v_investment RECORD;
  v_earning_amount NUMERIC;
  v_today INTEGER;
BEGIN
  v_today := EXTRACT(ISODOW FROM NOW());
  IF v_today NOT IN (1, 2, 3, 4, 5) THEN
    RETURN;
  END IF;

  FOR v_investment IN
    SELECT id, user_id, amount, daily_roi, last_earning_at
    FROM public.investments
    WHERE status = 'active'
  LOOP
    IF v_investment.last_earning_at IS NULL OR v_investment.last_earning_at < NOW() - INTERVAL '24 hours' THEN
      v_earning_amount := v_investment.amount * (v_investment.daily_roi / 100)

      PERFORM public.increment_balance(v_investment.user_id, v_earning_amount)

      INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
      VALUES (v_investment.user_id, 'earning', v_earning_amount, 'completed', NULL, 'EARN-' || gen_random_uuid());

      UPDATE public.investments
      SET last_earning_at = NOW()
      WHERE id = v_investment.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate all balances
CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS TABLE(user_id UUID, old_balance NUMERIC, new_balance NUMERIC) AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, balance FROM public.profiles LOOP
    RETURN QUERY
    SELECT r.id, r.balance, public.refresh_marz_verified_balance(r.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup fake packages from users who never deposited through Marz
CREATE OR REPLACE FUNCTION public.cleanup_fake_packages()
RETURNS TABLE(deleted_count BIGINT, user_count BIGINT) AS $$
DECLARE
  v_deleted_count BIGINT := 0;
  v_user_count BIGINT := 0;
  v_temp_count BIGINT := 0;
BEGIN
  DELETE FROM public.investments
  WHERE user_id IN (
    SELECT p.id
    FROM public.profiles p
    LEFT JOIN public.transactions t ON t.user_id = p.id AND t.type = 'deposit' AND t.status IN ('completed', 'approved')
    WHERE t.id IS NULL
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  SELECT COUNT(DISTINCT user_id) INTO v_user_count
  FROM public.investments
  WHERE user_id IN (
    SELECT p.id
    FROM public.profiles p
    LEFT JOIN public.transactions t ON t.user_id = p.id AND t.type = 'deposit' AND t.status IN ('completed', 'approved')
    WHERE t.id IS NULL
  );

  RETURN QUERY SELECT v_deleted_count, v_user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. CREATE TRIGGERS
-- ==========================================

-- Auto-create profile on auth.user insert
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_referred_by TEXT;
BEGIN
  v_username := lower(NEW.raw_user_meta_data->>'username');
  IF v_username IS NULL OR v_username = '' THEN
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
    CASE WHEN NEW.email = 'primenetworkadministrator@gmail.com' THEN 'admin' ELSE 'user' END,
    v_referred_by,
    0,
    false,
    'active'
  );

  IF v_referred_by IS NOT NULL THEN
    PERFORM public.process_registration_bonus(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- Auto-generate referral_code on profile insert
CREATE OR REPLACE FUNCTION public.generate_referral_code_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code_trigger();

-- ==========================================
-- 6. ENABLE RLS
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. CREATE RLS POLICIES
-- ==========================================

-- Profiles policies
CREATE POLICY "Profiles view policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Transactions policies
CREATE POLICY "Transactions view policy" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions insert policy" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Transactions update policy" ON public.transactions
  FOR UPDATE USING (public.is_admin());

-- Investments policies
CREATE POLICY "Investments view policy" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments insert policy" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Investments update policy" ON public.investments
  FOR UPDATE USING (public.is_admin());

-- ==========================================
-- 8. GRANT PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.username_exists(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_balance(UUID, NUMERIC) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_referral_bonus(UUID, NUMERIC) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_registration_bonus(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_balance(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.refresh_marz_verified_balance(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_daily_earnings() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_balances() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_fake_packages() TO authenticated, anon;

-- ==========================================
-- 9. BACKFILL MISSING PROFILES (one-time)
-- ==========================================

INSERT INTO public.profiles (
  id, email, full_name, username, role,
  balance, kyc_verified, status, referral_code, referred_by, created_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(LOWER(u.raw_user_meta_data->>'username'), 'user_' || substr(replace(u.id::text, '-', ''), -6)),
  CASE WHEN u.email = 'primenetworkadministrator@gmail.com' THEN 'admin' ELSE 'user' END,
  0, false, 'active',
  public.generate_referral_code(u.id),
  NULL,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
  AND u.email != '';

-- ==========================================
-- 10. VERIFICATION
-- ==========================================

SELECT
  'auth.users total' AS source,
  COUNT(*) AS count
FROM auth.users
UNION ALL
SELECT
  'profiles total' AS source,
  COUNT(*) AS count
FROM public.profiles
UNION ALL
SELECT
  'auth users missing profile' AS source,
  COUNT(*) AS count
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
