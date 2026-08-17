-- ==========================================
-- REFERRAL REGISTRATION BONUS MIGRATION
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create registration bonus function
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

-- 2. Update trigger to call registration bonus
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

-- 3. Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.process_registration_bonus(UUID) TO authenticated, anon;
