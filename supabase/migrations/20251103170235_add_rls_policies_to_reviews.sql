/*
  # Add RLS policies to reviews table

  1. Changes
    - Add policy to allow anyone to read reviews (public access)
    - This enables the UploadHistory component to fetch data
  
  2. Security
    - Allow SELECT access to all users
    - Keep other operations restricted by default
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;

-- Allow anyone to read reviews
CREATE POLICY "Allow public read access to reviews"
  ON reviews
  FOR SELECT
  USING (true);