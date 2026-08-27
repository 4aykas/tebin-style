export const slate = {
  "color": {
    "brand": "#2563EB",
    "ink": "#0F172A",
    "muted": "#64748B",
    "topbar": "#F8FAFC",
    "surface": "#FFFFFF",
    "error": "#C7251A",
    "warning": "#8A5300",
    "success": "#1F6F43",
    "rule": "#E2E8F0"
  },
  "role": {
    "primary": "#2563EB",
    "surface": "#FFFFFF",
    "on-surface": "#0F172A",
    "on-surface-muted": "#64748B",
    "outline": "#E2E8F0",
    "error": "#C7251A",
    "warning": "#8A5300",
    "success": "#1F6F43"
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
