/*
  # Add download_type column to reviews table

  1. Changes
    - Add `download_type` column to store the upload source (e.g., 'dropbox')
    - Set default value to 'dropbox' for existing records
  
  2. Notes
    - This column will help track which integration was used for the upload
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'download_type'
  ) THEN
    ALTER TABLE reviews ADD COLUMN download_type text DEFAULT 'dropbox';
  END IF;
END $$;