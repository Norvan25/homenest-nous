-- =============================================
-- Migration: CSV Upload + Email Queue System
-- =============================================

-- 1. Add new columns to properties table for Vortex CSV data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vortex_id TEXT UNIQUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS expired_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS withdrawn_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS auctioned_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_agent TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_broker TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mls_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_remarks TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS subdivision TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_phone TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_sold_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS import_source TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS import_date TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS import_batch_id UUID;

-- 2. Add new columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_street TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_state TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mailing_zip TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_absentee_owner BOOLEAN DEFAULT FALSE;

-- 3. Create email_queue_settings table
CREATE TABLE IF NOT EXISTS email_queue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number INTEGER NOT NULL CHECK (queue_number BETWEEN 1 AND 4),
  queue_label TEXT,
  scenario_key TEXT,
  from_name TEXT DEFAULT 'Suzanna Saharyan',
  from_email TEXT DEFAULT 'suzanna@homenest.house',
  send_interval_seconds INTEGER DEFAULT 3,
  is_sending BOOLEAN DEFAULT FALSE,
  is_paused BOOLEAN DEFAULT FALSE,
  last_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(queue_number)
);

-- 4. Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number INTEGER NOT NULL CHECK (queue_number BETWEEN 1 AND 4),
  batch_id UUID,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  -- Snapshot fields (frozen at queue time)
  contact_name TEXT,
  contact_first_name TEXT,
  contact_email TEXT NOT NULL,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT DEFAULT 'CA',
  property_zip TEXT,
  property_price INTEGER,
  property_dom INTEGER,
  property_beds INTEGER,
  property_baths DECIMAL,
  property_sqft INTEGER,
  property_type TEXT,
  property_remarks TEXT,
  -- Enrichment snapshots
  estimated_equity TEXT,
  estimated_home_value TEXT,
  is_absentee_owner BOOLEAN DEFAULT FALSE,
  owner_estimated_age TEXT,
  length_of_residence TEXT,
  marital_status TEXT,
  has_children TEXT,
  -- Queue management
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_properties_vortex_id ON properties(vortex_id);
CREATE INDEX IF NOT EXISTS idx_properties_import_batch ON properties(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_queue_number ON email_queue(queue_number);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_batch_id ON email_queue(batch_id);

-- 6. Insert default email queue settings for queues 1-4
INSERT INTO email_queue_settings (queue_number, queue_label)
VALUES 
  (1, 'E1'),
  (2, 'E2'),
  (3, 'E3'),
  (4, 'E4')
ON CONFLICT (queue_number) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE email_queue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Allow all for authenticated users" ON email_queue_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON email_queue
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Helper function to clear all lead data (for Replace mode)
DROP FUNCTION IF EXISTS clear_all_lead_data();
CREATE OR REPLACE FUNCTION clear_all_lead_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in order: crm first, then children, then properties
  DELETE FROM email_queue;
  DELETE FROM crm_activities WHERE crm_lead_id IN (SELECT id FROM crm_leads);
  DELETE FROM crm_leads;
  DELETE FROM call_log;
  DELETE FROM emails;
  DELETE FROM phones;
  DELETE FROM contacts;
  DELETE FROM properties;
END;
$$;
