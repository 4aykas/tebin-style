export const tebin_classic = {
  "color": {
    "brand": "#DA291C",
    "grey": "#898D8D",
    "ink": "#1A1A1A",
    "topbar": "#FFFFFF",
    "maroon": "#B02954",
    "brick": "#A43F39",
    "salmon": "#EB807A",
    "orange": "#F38B4C",
    "yellow": "#FBD551",
    "teal": "#69B7C2",
    "grey-light": "#B3B4B6",
    "grey-lighter": "#CDCDCE"
  },
  "font": {
    "sans": [
      "Roboto",
      "Arial",
      "Helvetica",
      "sans-serif"
    ],
    "document": [
      "Arial",
      "Helvetica",
      "sans-serif"
    ]
  },
  "fontWeight": {
    "regular": 400,
    "medium": 500,
    "bold": 700,
    "black": 900
  }
} as const;

export type TebinClassicTheme = typeof tebin_classic;
