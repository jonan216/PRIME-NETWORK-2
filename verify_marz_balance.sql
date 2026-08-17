-- ==========================================
-- PRIME NETWORK - MARZ PAY BALANCE VERIFICATION
-- Run this in Supabase SQL Editor
-- ==========================================

-- Create the balance verification function
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
      WHEN type = 'withdrawal' AND status IN ('completed', 'approved', 'pending_approval') THEN -amount
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

-- Update recalculate_all_balances to use the new verification function
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_marz_verified_balance(UUID) TO authenticated, anon;

-- ==========================================
-- BACKFILL: Zero out fake balances for users with no real deposits
-- ==========================================

UPDATE public.profiles
SET balance = 0
WHERE id NOT IN (
  SELECT DISTINCT user_id
  FROM public.transactions
  WHERE type = 'deposit'
    AND status IN ('completed', 'approved')
);

-- Show summary
SELECT
  'Users with zero balance (no deposits)' AS metric,
  COUNT(*) AS count
FROM public.profiles
WHERE balance = 0
  AND id NOT IN (
    SELECT DISTINCT user_id
    FROM public.transactions
    WHERE type = 'deposit'
      AND status IN ('completed', 'approved')
  )
UNION ALL
SELECT
  'Users with real deposits' AS metric,
  COUNT(*) AS count
FROM public.profiles
WHERE id IN (
  SELECT DISTINCT user_id
  FROM public.transactions
  WHERE type = 'deposit'
    AND status IN ('completed', 'approved')
);
