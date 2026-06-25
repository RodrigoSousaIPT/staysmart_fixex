-- supabase/migrations/20260628000000_wa_greet.sql
-- Adds persistence for the WhatsApp display number captured after a successful scan,
-- and relaxes property_clients so that phone-less associations still succeed while
-- a (latency-tolerant) greeting message is dispatched out-of-band.

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS wa_display_number TEXT,
  ADD COLUMN IF NOT EXISTS wa_connected_at     TIMESTAMPTZ;

-- A client row can exist without a phone (admin types only the email). When the
-- phone arrives (or admin types it directly), the wa-greet function does the
-- real validation.
ALTER TABLE property_clients
  ALTER COLUMN phone DROP NOT NULL;

-- Optional, idempotent: viewer-role users can list their own property_clients.
-- The existing UPDATE/INSERT policies on `property_clients` should already cover
-- the manager-flow; only add a SELECT policy if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'property_clients'
      AND policyname = 'property_clients_self_select'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY property_clients_self_select ON property_clients
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
    $POLICY$;
  END IF;
END $$;

-- Convenience view for the dashboard (not strictly required)
CREATE OR REPLACE VIEW v_property_clients_with_phone AS
SELECT
  pc.id            AS client_link_id,
  pc.property_id,
  pc.user_id,
  pc.phone         AS client_phone,
  pc.access_expires_at,
  pc.is_active,
  u.full_name      AS client_name,
  u.email          AS client_email,
  p.name           AS property_name,
  p.wa_instance_name
FROM property_clients pc
LEFT JOIN users        u ON u.id = pc.user_id
LEFT JOIN properties   p ON p.id = pc.property_id;

COMMIT;

NOTIFY pgrst, 'reload schema';
