export const tebin = {
  "color": {
    "brand": "#DA291C",
    "brand-dark": "#B82217",
    "brand-on-dark": "#EA6359",
    "brand-on-light": "#C7251A",
    "charcoal": "#242424",
    "ink": "#292929",
    "muted": "#666666",
    "topbar": "#F9F9F9",
    "subtle": "#C1C1C1",
    "rule": "#ECECEC",
    "warning-on-light": "#8A5300",
    "warning-on-dark": "#F0B429",
    "success-on-light": "#1F6F43",
    "success-on-dark": "#5FCF8E",
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
  "role": {
    "primary": "#DA291C",
    "primary-on-dark": "#EA6359",
    "primary-on-light": "#C7251A",
    "surface": "#FCFBF8",
    "surface-inverse": "#242424",
    "on-surface": "#292929",
    "on-surface-muted": "#666666",
    "outline": "#ECECEC",
    "error-on-light": "#C7251A",
    "error-on-dark": "#EA6359",
    "warning-on-light": "#8A5300",
    "warning-on-dark": "#F0B429",
    "success-on-light": "#1F6F43",
    "success-on-dark": "#5FCF8E"
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
  "fontWeight": {
    "heading": 700
  },
  "lineHeight": {
    "heading": 1.35,
    "body": 1.7
  },
  "type": {
    "h1": "38px",
    "h2": "34px",
    "h3": "28px",
    "h4": "24px",
    "h5": "20px",
    "body": "16px",
    "label-sm": "9px",
    "label-md": "10px",
    "label-lg": "11px"
  },
  "spacing": {
    "gutter": "48px",
    "section-compact": "64px",
    "section-standard": "88px",
    "section-feature": "112px"
  },
  "layout": {
    "container-default": "1200px",
    "container-wide": "1400px",
    "container-reading": "760px"
  },
  "components": {
    "button-primary": {
      "backgroundColor": "#292929",
      "textColor": "#FCFBF8",
      "rounded": "4px",
      "padding": "14px",
      "height": "40px"
    },
    "button-primary-hover": {
      "backgroundColor": "#242424"
    },
    "button-commit": {
      "backgroundColor": "#DA291C",
      "textColor": "#FCFBF8",
      "rounded": "4px",
      "padding": "14px",
      "height": "40px"
    },
    "button-commit-hover": {
      "backgroundColor": "#B82217"
    },
    "button-quiet": {
      "backgroundColor": "#FCFBF8",
      "textColor": "#292929",
      "borderColor": "#ECECEC",
      "rounded": "4px",
      "padding": "14px",
      "height": "40px"
    },
    "button-danger": {
      "backgroundColor": "#FCFBF8",
      "textColor": "#C7251A",
      "borderColor": "#ECECEC",
      "rounded": "4px",
      "padding": "14px",
      "height": "40px"
    },
    "cta": {
      "backgroundColor": "#FCFBF8",
      "textColor": "#292929",
      "borderColor": "#292929",
      "rounded": "0px",
      "padding": "14px 28px"
    },
    "cta-hover": {
      "backgroundColor": "#292929",
      "textColor": "#FCFBF8"
    }
  },
  "radius": {
    "panel": "2px",
    "control": "4px",
    "card": "8px"
  }
} as const;

export type TebinTheme = typeof tebin;
