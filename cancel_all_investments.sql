-- ==========================================
-- PRIME NETWORK - CANCEL ALL INVESTMENTS
-- Run this ONCE in Supabase SQL Editor
-- ==========================================

-- 1. Cancel all active investments and refund balances
DO $$
DECLARE
  v_investment RECORD;
  v_refund_count BIGINT := 0;
BEGIN
  FOR v_investment IN
    SELECT id, user_id, amount, plan_name, status
    FROM public.investments
    WHERE status = 'active'
  LOOP
    -- Refund the investment amount to user balance
    PERFORM public.increment_balance(v_investment.user_id, v_investment.amount);

    -- Create refund transaction
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      status,
      provider,
      reference,
      created_at
    ) VALUES (
      v_investment.user_id,
      'refund',
      v_investment.amount,
      'completed',
      NULL,
      'CANCEL-ALL-' || v_investment.id,
      now()
    );

    -- Cancel the investment
    UPDATE public.investments
    SET status = 'cancelled'
    WHERE id = v_investment.id;

    v_refund_count := v_refund_count + 1;
  END LOOP;

  RAISE NOTICE 'Cancelled % investments and refunded balances', v_refund_count;
END;
$$;

-- 2. Clean up fake packages from users who never deposited
SELECT public.cleanup_fake_packages();

-- 3. Recalculate all balances based on real Marz deposits only
SELECT public.recalculate_all_balances();

-- 4. Show summary
SELECT
  'Total investments cancelled' AS metric,
  COUNT(*) AS count
FROM public.investments
WHERE status = 'cancelled'
  AND created_at > now() - INTERVAL '1 minute'
UNION ALL
SELECT
  'Active investments remaining' AS metric,
  COUNT(*) AS count
FROM public.investments
WHERE status = 'active'
UNION ALL
SELECT
  'Total refunds created' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'refund'
  AND reference LIKE 'CANCEL-ALL-%'
  AND created_at > now() - INTERVAL '1 minute';
