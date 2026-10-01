-- Public AI Readiness Audit (PRD v0.3, Phase 1).
--
-- A visitor with no account enters a site, proves they own it, and runs the
-- existing site-audit engine on it. A "claim" is that visitor's ownership
-- challenge for one domain: the token they publish (meta tag, DNS TXT or an
-- HTML file), whether it has been verified, and, once they sign up to save the
-- report, the user it belongs to.
--
-- Audits started from a claim are ordinary site_audits rows with no brand yet,
-- so brand_id becomes nullable and the row points at its claim instead. All
-- writes and reads go through the API server's service-role client; the claim
-- id is the capability a visitor holds, so the table has RLS on and no
-- policies (no direct client access).

CREATE TABLE IF NOT EXISTS public_site_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  site_url text NOT NULL,
  token text NOT NULL,
  verify_method text,               -- meta | dns | file
  verified_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  saved_at timestamptz,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_site_claims_domain_idx ON public_site_claims (domain, created_at DESC);
CREATE INDEX IF NOT EXISTS public_site_claims_user_idx ON public_site_claims (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public_site_claims ENABLE ROW LEVEL SECURITY;

ALTER TABLE site_audits ALTER COLUMN brand_id DROP NOT NULL;
ALTER TABLE site_audits
  ADD COLUMN IF NOT EXISTS claim_id uuid REFERENCES public_site_claims(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS site_audits_claim_id_idx ON site_audits (claim_id, created_at DESC)
  WHERE claim_id IS NOT NULL;
