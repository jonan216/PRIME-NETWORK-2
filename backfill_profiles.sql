-- ==========================================
-- PRIME NETWORK BACKFILL MISSING PROFILES
-- Run this ONCE in Supabase SQL Editor
-- ==========================================

-- 1. Ensure the referral_code generation function exists
CREATE OR REPLACE FUNCTION public.generate_referral_code_for_backfill(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'PRIME-' || substr(replace(p_user_id::text, '-', ''), -6);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.generate_referral_code_for_backfill(UUID) TO authenticated, anon;

-- 2. Backfill missing profiles from auth.users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  username,
  role,
  balance,
  kyc_verified,
  status,
  referral_code,
  referred_by,
  created_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(LOWER(u.raw_user_meta_data->>'username'), 'user_' || substr(replace(u.id::text, '-', ''), -6)),
  CASE WHEN u.email = 'primenetworkadministrator@gmail.com' THEN 'admin' ELSE 'user' END,
  0,
  false,
  'active',
  public.generate_referral_code_for_backfill(u.id),
  NULL,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
  AND u.email != '';

-- 3. Verify results
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
