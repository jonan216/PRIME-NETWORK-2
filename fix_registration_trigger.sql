-- ==========================================================
-- PRIME NETWORK - FIX REGISTRATION TRIGGER & REFERRAL BONUS
-- Run this in Supabase SQL Editor to fix 500 registration error
-- ==========================================================

-- 1. Fix process_registration_bonus so it handles string referral codes gracefully
CREATE OR REPLACE FUNCTION public.process_registration_bonus(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referrer_ref TEXT;
  v_referrer_uuid UUID := NULL;
  v_bonus_amount NUMERIC := 200;
BEGIN
  SELECT referred_by INTO v_referrer_ref FROM public.profiles WHERE id = p_user_id;

  IF v_referrer_ref IS NOT NULL AND v_referrer_ref <> '' THEN
    -- Try resolving referrer profile by id, referral_code, or username
    SELECT id INTO v_referrer_uuid
    FROM public.profiles
    WHERE id::text = v_referrer_ref
       OR referral_code = v_referrer_ref
       OR lower(username) = lower(v_referrer_ref)
    LIMIT 1;

    IF v_referrer_uuid IS NOT NULL AND v_referrer_uuid <> p_user_id THEN
      PERFORM public.increment_balance(v_referrer_uuid, v_bonus_amount);
      INSERT INTO public.transactions (user_id, type, amount, status, provider, reference)
      VALUES (v_referrer_uuid, 'referral_reward', v_bonus_amount, 'completed', NULL, 'REF-REG-' || gen_random_uuid());
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'process_registration_bonus exception: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix handle_new_user_registration so auth.users insertion NEVER crashes
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_referred_input TEXT;
  v_referred_by TEXT := NULL;
BEGIN
  v_username := lower(NEW.raw_user_meta_data->>'username');
  IF v_username IS NULL OR v_username = '' THEN
    v_username := 'user_' || substr(replace(NEW.id::text, '-', ''), -6);
  END IF;

  v_full_name := NEW.raw_user_meta_data->>'full_name';
  IF v_full_name IS NULL THEN
    v_full_name := '';
  END IF;

  v_referred_input := NEW.raw_user_meta_data->>'referred_by';
  IF v_referred_input IS NOT NULL AND v_referred_input <> '' THEN
    v_referred_by := v_referred_input;
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
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    username = EXCLUDED.username;

  IF v_referred_by IS NOT NULL AND v_referred_by <> '' THEN
    BEGIN
      PERFORM public.process_registration_bonus(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'process_registration_bonus skipped: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'handle_new_user_registration outer error: %', SQLERRM;
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, username, role, balance, kyc_verified, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(v_full_name, ''),
      COALESCE(v_username, 'user_' || substr(replace(NEW.id::text, '-', ''), -6)),
      'user',
      0,
      false,
      'active'
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.process_registration_bonus(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user_registration() TO authenticated, anon;
