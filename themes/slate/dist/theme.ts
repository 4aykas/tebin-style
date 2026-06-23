export const slate = {
  "color": {
    "brand": "#2563EB",
    "ink": "#0F172A",
    "muted": "#64748B",
    "topbar": "#F8FAFC",
    "surface": "#FFFFFF",
    "rule": "#E2E8F0"
  },
  "font": {
    "sans": [
      "Inter",
      "system-ui",
      "sans-serif"
    ],
    "mono": [
      "JetBrains Mono",
      "ui-monospace",
      "monospace"
    ]
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px"
  }
} as const;

export type SlateTheme = typeof slate;
