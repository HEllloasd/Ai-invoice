/*
  # Fix storage policies for anonymous users

  1. Changes
    - Updates storage policies to allow anonymous authenticated users
    - Allows anyone who is authenticated (including anonymous) to upload
    - Allows anyone who is authenticated to read files
  
  2. Security
    - Still requires authentication (anonymous or real users)
    - Protects against completely unauthenticated access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their invoices" ON storage.objects;

-- Create new policies that allow anonymous authenticated users
CREATE POLICY "Allow authenticated users to upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to read invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
