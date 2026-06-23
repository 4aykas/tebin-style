export const tebin = {
  "color": {
    "brand": "#DA291C",
    "brand-dark": "#B82217",
    "charcoal": "#242424",
    "ink": "#292929",
    "muted": "#666666",
    "topbar": "#F9F9F9",
    "subtle": "#C1C1C1",
    "rule": "#ECECEC"
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
