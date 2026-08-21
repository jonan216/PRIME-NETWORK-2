-- ==========================================
-- PRIME NETWORK - FIX RECALCULATE ALL BALANCES
-- Run this in Supabase SQL Editor to fix the type mismatch error
-- caused by the VOID returning refresh_marz_verified_balance function.
-- ==========================================

CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS TABLE(user_id UUID, old_balance NUMERIC, new_balance NUMERIC) AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, balance FROM public.profiles LOOP
    -- Call the verification function using PERFORM to handle VOID return type
    PERFORM public.refresh_marz_verified_balance(r.id);
    
    user_id := r.id;
    old_balance := r.balance;
    -- Fetch the updated balance after recalculation
    SELECT balance INTO new_balance FROM public.profiles WHERE id = r.id;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.recalculate_all_balances() TO authenticated, anon;
