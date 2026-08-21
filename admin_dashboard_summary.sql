-- ==========================================================
-- PRIME NETWORK - ADMIN DASHBOARD SUMMARY & BALANCES RPC
-- Run this in Supabase SQL Editor
-- ==========================================================

CREATE OR REPLACE FUNCTION public.get_admin_users_summary()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  balance NUMERIC,
  kyc_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  referral_code TEXT,
  referred_by TEXT,
  total_deposits NUMERIC,
  total_withdrawals NUMERIC,
  total_earnings NUMERIC,
  total_investments NUMERIC,
  active_investments NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.full_name, ''),
    COALESCE(p.username, ''),
    COALESCE(p.email, ''),
    COALESCE(p.role, 'user'),
    COALESCE(p.status, 'active'),
    COALESCE(p.balance, 0) AS balance,
    COALESCE(p.kyc_verified, false),
    p.created_at,
    COALESCE(p.referral_code, ''),
    p.referred_by,
    COALESCE((
      SELECT SUM(t.amount) 
      FROM public.transactions t 
      WHERE t.user_id = p.id 
        AND t.type = 'deposit' 
        AND t.status IN ('completed', 'approved', 'credited', 'successful', 'success', 'paid', 'sandbox')
    ), 0) AS total_deposits,
    COALESCE((
      SELECT SUM(t.amount) 
      FROM public.transactions t 
      WHERE t.user_id = p.id 
        AND t.type = 'withdrawal' 
        AND t.status IN ('completed', 'approved')
    ), 0) AS total_withdrawals,
    COALESCE((
      SELECT SUM(t.amount) 
      FROM public.transactions t 
      WHERE t.user_id = p.id 
        AND t.type IN ('earning', 'referral_reward', 'bonus') 
        AND t.status IN ('completed', 'approved')
    ), 0) AS total_earnings,
    COALESCE((
      SELECT SUM(i.amount) 
      FROM public.investments i 
      WHERE i.user_id = p.id
    ), 0) AS total_investments,
    COALESCE((
      SELECT SUM(i.amount) 
      FROM public.investments i 
      WHERE i.user_id = p.id AND i.status = 'active'
    ), 0) AS active_investments
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated, anon;
