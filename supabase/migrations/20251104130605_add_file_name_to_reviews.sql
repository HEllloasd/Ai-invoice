/*
  # Add file_name column to reviews table

  1. Changes
    - Add `file_name` column to store the original PDF filename
    - Set default value to 'Untitled' for existing records
  
  2. Notes
    - This column will help identify uploads by their original filename
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE reviews ADD COLUMN file_name text DEFAULT 'Untitled';
  END IF;
END $$;