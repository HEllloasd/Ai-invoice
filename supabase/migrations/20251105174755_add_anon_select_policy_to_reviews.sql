/*
  # Add Anonymous User Select Policy

  1. Changes
    - Add policy to allow anonymous (anon) users to SELECT from reviews table
    - This enables the upload history to be visible to all users using the anon key
  
  2. Security
    - Only SELECT access is granted
    - All users can view all reviews (as per application requirements)
*/

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;

-- Add anon role specific SELECT policy
CREATE POLICY "Allow anon users to read reviews"
  ON reviews
  FOR SELECT
  TO anon
  USING (true);
