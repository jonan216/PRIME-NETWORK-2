-- ==========================================================
-- PRIME NETWORK - AUTOMATIC TRANSACTION BALANCE TRIGGER & RUN
-- Run this in Supabase SQL Editor to enable automatic
-- balance recalculation and update all historical deposits.
-- ==========================================================

-- 1. Drop existing triggers to avoid duplication
DROP TRIGGER IF EXISTS on_transaction_approved ON public.transactions;
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;

-- 2. Create the update/insert/delete trigger handler
CREATE OR REPLACE FUNCTION public.handle_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_marz_verified_balance(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.refresh_marz_verified_balance(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the new transaction change trigger
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_change();

-- 4. Fix recalculate_all_balances function type mismatch
CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS TABLE(user_id UUID, old_balance NUMERIC, new_balance NUMERIC) AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, balance FROM public.profiles LOOP
    -- Call verification using PERFORM to handle VOID return type of refresh_marz_verified_balance
    PERFORM public.refresh_marz_verified_balance(r.id);
    
    user_id := r.id;
    old_balance := r.balance;
    -- Select the newly calculated and saved balance
    SELECT balance INTO new_balance FROM public.profiles WHERE id = r.id;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-grant execute permissions for functions
GRANT EXECUTE ON FUNCTION public.handle_transaction_change() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_balances() TO authenticated, anon;

-- 6. Immediately trigger balance recalculation for every user to backfill
SELECT * FROM public.recalculate_all_balances();
