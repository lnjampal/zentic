-- Saved public audits belong to a Zentic account: keep who saved the report
-- (email and name at save time), their organisation, and the brand whose
-- domain matches the audited site, so the report also shows in that brand's
-- dashboard audit history.

ALTER TABLE public_site_claims
  ADD COLUMN IF NOT EXISTS owner_email text,
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS public_site_claims_org_idx ON public_site_claims (organization_id)
  WHERE organization_id IS NOT NULL;
