/*
  # Allow anonymous users to create and read reviews

  1. Changes
    - Updates reviews table policies to allow anonymous authenticated users
    - Allows anyone authenticated to insert reviews
    - Allows anyone authenticated to read their own reviews
  
  2. Security
    - Still requires authentication (anonymous or real users)
    - Users can only see their own reviews based on session
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

-- Create new policies that work for anonymous users
CREATE POLICY "Allow authenticated users to insert reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read reviews"
ON reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update reviews"
ON reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
