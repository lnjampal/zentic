# Ansvisor visual language

## Source and scope
Extracted from the selected Audit dashboard mockup at
`artifacts/mockup-sandbox/src/components/mockups/ansvisor/AuditTheme.tsx`.
The effective final CSS, not the earlier superseded style layers, is authoritative.
The mockup has no exported reusable component library: its visual foundations
theme the stock reusable primitives. Screen-specific report tables, navigation,
sample values, trend data, and state stay in their consuming screens.

## Observed design and composition
- White page and card backgrounds; thin cool borders separate dense report sections.
- Deep-blue text establishes hierarchy; the emphasized readiness-score card is navy.
- Warm orange distinguishes action buttons, the brand mark, and active navigation accents.
- Manrope supplies headings and large numbers; DM Sans supplies controls and body text;
  DM Mono supplies compact uppercase metadata.
- Compact 6–8px corner treatments and 9–13px report labels characterize the dashboard.
- Sample reports carry an explicit fictional-data/prototype disclosure.
- Charts use muted blue for the main series, with orange, coral, and gold supporting accents.

## Derived decisions
Dark mode is derived; the source only supports light mode.
Small white text on the source orange action fill has approximately 3.22:1 contrast.
The system retains that orange but uses deeper navy labels to exceed 4.5:1.
No existing mockup is changed by this adjustment.
Muted text is similarly deepened from `#607887` to `#587181` so it remains
legible on the system's soft neutral surface.

## Consumption
Read `docs/AGENTS.md`, then the platform consumption guide.
Import the package theme and primitives, never copy token values or component code.
Do not migrate any existing screen without the user's approval. Approved canvas
mockups must be rebuilt under this design system's sandbox entry and all referring
frames repointed, as required by the mockup-sandbox skill.