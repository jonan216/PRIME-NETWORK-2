-- ==========================================
-- PRIME NETWORK SUPABASE SCHEMA
-- Run this in Supabase SQL Editor first,
-- then apply fix_supabase_rls.sql
-- ==========================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 2. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'earning', 'referral_reward')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  provider TEXT DEFAULT NULL,
  reference TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  daily_roi NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 5. Auto-generate referral_code on profile insert
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := 'PRIME-' || substr(replace(NEW.id::text, '-', ''), -6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- 6. Helper function to atomically increment balance
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET balance = coalesce(balance, 0) + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_balance(UUID, NUMERIC) TO authenticated, anon;

-- 7. Instant referral bonus processor
-- Call this after an investment is created to credit referrers immediately
CREATE OR REPLACE FUNCTION public.process_referral_bonus(p_investor_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_level_2_id UUID;
  v_level_3_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RETURN;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.process_referral_bonus(UUID, NUMERIC) TO authenticated, anon;
