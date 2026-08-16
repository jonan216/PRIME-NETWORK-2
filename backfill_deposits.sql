-- ==========================================
-- PRIME NETWORK - BACKFILL DEPOSITS
-- Run this ONCE in Supabase SQL Editor
-- to fix existing deposits that may be stuck
-- in 'pending' status instead of 'pending_approval'
-- ==========================================

-- Update all existing deposits that are in 'pending' status to 'pending_approval'
-- This assumes all deposits that were initiated through the system should go through admin approval
UPDATE public.transactions
SET status = 'pending_approval'
WHERE type = 'deposit'
  AND status = 'pending';

-- Show summary
SELECT
  'Total deposits' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit'
UNION ALL
SELECT
  'Pending approval' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'pending_approval'
UNION ALL
SELECT
  'Pending (old)' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'pending'
UNION ALL
SELECT
  'Approved' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'approved'
UNION ALL
SELECT
  'Rejected' AS metric,
  COUNT(*) AS count
FROM public.transactions
WHERE type = 'deposit' AND status = 'rejected';
