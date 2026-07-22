export const tebin = {
  "color": {
    "brand": "#DA291C",
    "brand-dark": "#B82217",
    "charcoal": "#242424",
    "ink": "#292929",
    "muted": "#666666",
    "topbar": "#F9F9F9",
    "subtle": "#C1C1C1",
    "rule": "#ECECEC",
    "paper": "#FCFBF8"
  },
  "on-dark": {
    "1": "rgba(255,255,255,0.90)",
    "2": "rgba(255,255,255,0.82)",
    "3": "rgba(255,255,255,0.72)",
    "4": "rgba(255,255,255,0.62)",
    "5": "rgba(255,255,255,0.52)",
    "6": "rgba(255,255,255,0.48)",
    "7": "rgba(255,255,255,0.38)",
    "8": "rgba(255,255,255,0.32)",
    "9": "rgba(255,255,255,0.26)",
    "10": "rgba(255,255,255,0.20)"
  },
  "on-light": {
    "1": "rgba(0,0,0,0.82)",
    "2": "rgba(0,0,0,0.72)",
    "3": "rgba(0,0,0,0.62)",
    "4": "rgba(0,0,0,0.52)",
    "5": "rgba(0,0,0,0.45)",
    "6": "rgba(0,0,0,0.38)",
    "7": "rgba(0,0,0,0.30)"
  },
  "rule-dark": {
    "1": "rgba(255,255,255,0.13)",
    "2": "rgba(255,255,255,0.10)",
    "3": "rgba(255,255,255,0.08)",
    "4": "rgba(255,255,255,0.06)"
  },
  "rule-light": {
    "1": "rgba(0,0,0,0.20)",
    "2": "rgba(0,0,0,0.12)",
    "3": "rgba(0,0,0,0.06)"
  },
  "surface-dark": {
    "1": "rgba(255,255,255,0.05)",
    "2": "rgba(255,255,255,0.03)",
    "3": "rgba(255,255,255,0.02)"
  },
  "brand": {
    "a1": "rgba(218,41,28,0.88)",
    "a2": "rgba(218,41,28,0.72)",
    "a3": "rgba(218,41,28,0.55)",
    "a4": "rgba(218,41,28,0.40)",
    "a5": "rgba(218,41,28,0.28)",
    "a6": "rgba(218,41,28,0.14)",
    "a7": "rgba(218,41,28,0.06)"
  },
  "font": {
    "sans": [
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif"
    ],
    "condensed": [
      "Roboto Condensed",
      "Roboto",
      "sans-serif"
    ]
  },
  "radius": {
    "panel": "2px",
    "control": "4px",
    "card": "8px"
  }
} as const;

export type TebinTheme = typeof tebin;
