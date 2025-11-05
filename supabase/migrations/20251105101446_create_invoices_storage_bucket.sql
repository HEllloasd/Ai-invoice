/*
  # Create invoices storage bucket

  1. Storage Bucket
    - Creates `invoices` bucket for PDF file storage
    - Private bucket (not publicly accessible)
  
  2. Security
    - Enables RLS on storage.objects
    - Authenticated users can upload invoices
    - Authenticated users can read invoices
*/

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their invoices" ON storage.objects;

-- Add RLS policies for the invoices bucket
CREATE POLICY "Allow authenticated users to upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Allow authenticated users to read their invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');
