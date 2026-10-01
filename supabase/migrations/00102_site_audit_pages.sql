-- Multi-page public audits: a site-level audit row (parent) plus one child
-- row per audited page (home + up to 4 key pages). Each child is an ordinary
-- single-page audit with its own signal results; the parent holds the
-- rolled-up score, merged signals and recommendations the report shows.

ALTER TABLE site_audits
  ADD COLUMN IF NOT EXISTS parent_audit_id uuid REFERENCES site_audits(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS page_label text;

CREATE INDEX IF NOT EXISTS site_audits_parent_audit_id_idx ON site_audits (parent_audit_id)
  WHERE parent_audit_id IS NOT NULL;
