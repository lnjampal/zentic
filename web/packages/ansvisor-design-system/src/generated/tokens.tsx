/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#ffffff",
      "foreground": "#18364b",
      "card": "#ffffff",
      "cardForeground": "#18364b",
      "popover": "#ffffff",
      "popoverForeground": "#18364b",
      "primary": "#d8753c",
      "primaryForeground": "#0b1e2a",
      "secondary": "#18364b",
      "secondaryForeground": "#ffffff",
      "muted": "#f2f6f6",
      "mutedForeground": "#587181",
      "accent": "#fff0e6",
      "accentForeground": "#a94c22",
      "destructive": "#a3543d",
      "destructiveForeground": "#ffffff",
      "border": "#dfe8e8",
      "input": "#dfe8e8",
      "ring": "#d8753c",
      "chart1": "#729db4",
      "chart2": "#d8753c",
      "chart3": "#d48a65",
      "chart4": "#f0bd61",
      "chart5": "#18364b",
      "sidebar": "#ffffff",
      "sidebarForeground": "#18364b",
      "sidebarBorder": "#dfe8e8",
      "sidebarPrimary": "#fff0e6",
      "sidebarPrimaryForeground": "#a94c22",
      "sidebarAccent": "#fff7f1",
      "sidebarAccentForeground": "#18364b",
      "sidebarRing": "#d8753c"
    },
    "dark": {
      "background": "#0b1e2a",
      "foreground": "#edf4f6",
      "card": "#18364b",
      "cardForeground": "#edf4f6",
      "popover": "#18364b",
      "popoverForeground": "#edf4f6",
      "primary": "#e9905e",
      "primaryForeground": "#0b1e2a",
      "secondary": "#244d62",
      "secondaryForeground": "#edf4f6",
      "muted": "#1c3e51",
      "mutedForeground": "#aec3cf",
      "accent": "#513326",
      "accentForeground": "#ffd5bb",
      "destructive": "#efb3a5",
      "destructiveForeground": "#361c17",
      "border": "#385669",
      "input": "#496a7d",
      "ring": "#e9905e",
      "chart1": "#8ab5cc",
      "chart2": "#e9905e",
      "chart3": "#efb3a5",
      "chart4": "#f0bd61",
      "chart5": "#c7dce8",
      "sidebar": "#112c3d",
      "sidebarForeground": "#edf4f6",
      "sidebarBorder": "#385669",
      "sidebarPrimary": "#513326",
      "sidebarPrimaryForeground": "#ffd5bb",
      "sidebarAccent": "#1c3e51",
      "sidebarAccentForeground": "#edf4f6",
      "sidebarRing": "#e9905e"
    }
  },
  "fontFamily": {
    "sans": [
      "DM Sans",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "DM Mono",
      "monospace"
    ],
    "heading": [
      "Manrope",
      "sans-serif"
    ]
  },
  "radius": "0.5rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
