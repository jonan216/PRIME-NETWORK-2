-- ==========================================
-- PRIME NETWORK - BACKFILL DEPOSITS
-- Run this ONCE in Supabase SQL Editor
-- to fix existing deposits for the new
-- auto-complete behavior
-- ==========================================

-- Convert old pending_approval deposits back to pending
-- so the sync endpoint can auto-complete them if Marz confirms
UPDATE public.transactions
SET status = 'pending'
WHERE type = 'deposit'
  AND status = 'pending_approval';

-- Show summary
SELECT
  'Total deposits' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit'
UNION ALL
SELECT
  'Pending' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'pending'
UNION ALL
SELECT
  'Completed' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'completed'
UNION ALL
SELECT
  'Rejected' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'rejected';
