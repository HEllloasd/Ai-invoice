/*
  # Add UPDATE policy to reviews table

  1. Changes
    - Add policy to allow public update access to reviews table
    - This enables updating file_name and other fields after webhook creates the record
  
  2. Security
    - Allows public updates (needed for client-side updates after webhook response)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Allow public update access to reviews'
  ) THEN
    CREATE POLICY "Allow public update access to reviews"
      ON reviews
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;