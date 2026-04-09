-- Fix RLS for reviews table
-- This script allows any user (or authenticated user) to insert reviews.

-- 1. Check if policy exists and drop it to ensure clean apply
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;

-- 2. Create the insert policy
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- 3. Ensure SELECT policy is also present
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
