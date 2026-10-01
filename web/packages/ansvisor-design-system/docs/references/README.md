# Extraction evidence

| Item | Subject | Source | Kind | Captured | Extracted |
| --- | --- | --- | --- | --- | --- |
| `source/AuditTheme.tsx` | Audit dashboard | Workspace-selected mockup source | app-ui / code evidence | 2026-10-01 | Final effective color roles, font stacks, sizes, radii, native control states |
| `audit-dashboard.jpg` | Audit dashboard | Selected workspace preview | app-ui | 2026-10-01 | Rendered visual hierarchy and surfaces |
| `logos/ansvisor-mark.svg` | Brand mark | Source PetalMark and final `.ans-mark i` styles | brand-asset | 2026-10-01 | Four orange petals |

No external asset URLs, credentials, or backend data were retained.
The selected mockup provides visual foundations, not a separately exported
component catalog. The full template component set is themed; there are no
pending source-library chunks or pilot gates.

## Light mapping
Orange action fill `#d8753c` → primary. Navy `#18364b` → secondary / foreground.
Orange tint `#fff0e6` → accent / active navigation. White → background / card.
Muted slate `#607887` → mutedForeground. Cool border `#dfe8e8` → border.
Blue `#729db4`, orange `#d8753c`, coral `#d48a65`, gold `#f0bd61`, navy
`#18364b` → chart roles. Source radius is 6px for buttons and 8px for panels.
The system's 8px base derives 6px medium radii and a 4px base spacing unit.

## Deliberate differences
`primaryForeground` is contrast-adjusted deeper navy; source white-on-orange is
not sufficient for small-label AA. `mutedForeground` is deepened to `#587181`
for contrast on the soft neutral surface. Dark mode is derived and is not source evidence.
Stock components not visible in the source are reusable extensions, not claimed
pixel-exact source ports.