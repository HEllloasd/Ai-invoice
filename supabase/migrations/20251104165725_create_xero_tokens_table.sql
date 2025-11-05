/*
  # Create Xero Tokens Table

  1. New Tables
    - `xero_tokens`
      - `id` (uuid, primary key) - Unique identifier for each token record
      - `access_token` (text) - Xero OAuth access token
      - `refresh_token` (text) - Token used to refresh the access token
      - `expires_at` (timestamptz) - When the access token expires
      - `tenant_id` (text) - Xero organization/tenant identifier
      - `token_type` (text) - Type of token (usually "Bearer")
      - `created_at` (timestamptz) - When this record was created
      - `updated_at` (timestamptz) - When this record was last updated

  2. Security
    - Enable RLS on `xero_tokens` table
    - Add policies for service role access only
    
  3. Notes
    - This table stores sensitive OAuth tokens for Xero API access
    - Access is restricted to service role only for security
    - Tokens should be refreshed before expiration
*/

CREATE TABLE IF NOT EXISTS xero_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  tenant_id text,
  token_type text DEFAULT 'Bearer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access tokens (for security)
CREATE POLICY "Service role can manage xero tokens"
  ON xero_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_xero_tokens_tenant_id ON xero_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_xero_tokens_expires_at ON xero_tokens(expires_at);