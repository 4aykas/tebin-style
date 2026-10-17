# Output formats

Each theme generates four token files plus `colors.csv` in `themes/<id>/dist/`:

| File | Use when target is | How to apply |
|------|--------------------|--------------|
| `tokens.css` | any project that can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React / CSS-in-JS / TypeScript | import the exported `as const` object; use the exported type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed into the tool that consumes DTCG |
| `shadcn.json` (web themes only) | a shadcn/ui project | `npx shadcn@latest add <raw URL of the file>`; light colours, radius, fonts and easing only |

Prefer the format that matches the target's existing styling approach. Do not
mix competing token sources in one target. The colour CSV and design guide can accompany any token format.

Note: `tokens.css` and `tailwind.css` carry the transformed values (hex
lowercased, font families joined into a CSS string). `tokens.dtcg.json` and
`theme.ts` keep the canonical source values (original hex case, font arrays).
DTCG retains descriptions and print/fluid extensions; TypeScript resolves
aliases and emits fluid ceilings.

Tailwind adds utility namespaces while keeping existing variables:
`type.h1` → `text-h1`, `role.surface` → `bg-role-surface`, and
`lineHeight.body` → `leading-body`, `motion.easing.enter` → `ease-enter` when
those tokens exist in the theme. Motion durations and springs are plain
variables (`--motion-duration-base`, `--motion-spring-ui-stiffness`).
For Office and print colours, use `colors.csv` or MCP
`get_theme({ id, format: "colors-csv" })`.

## Office documents from code

For a Word, PowerPoint or Excel file built with python-docx, python-pptx or
openpyxl. Use `tebin-classic` unless the user chose another theme. People
editing by hand follow `docs/guide/office.md`.

**Colours.** Read `dist/colors.csv` (or MCP `get_theme({ id, format:
"colors-csv" })`). Use the `r`, `g`, `b` columns, and resolve a role to its
colour first: on Classic `role.primary` is `color.brand` and `role.on-surface`
is `color.ink`. Do not convert a missing Pantone or CMYK cell from RGB.

**Font.** Arial in every Office file, for both themes (rule
`brand-font-roboto-arial`). Arial is installed everywhere, so the file renders
the same for the recipient.

```python
# python-docx and python-pptx share the same colour type
from docx.shared import RGBColor       # pptx: from pptx.dml.color import RGBColor
run.font.name = "Arial"
run.font.color.rgb = RGBColor(218, 41, 28)   # color.brand

# openpyxl takes hex without "#"
from openpyxl.styles import Font, PatternFill
cell.font = Font(name="Arial", color="DA291C")
cell.fill = PatternFill(fill_type="solid", fgColor="DA291C")
```

**Logo.** Insert a PNG from `assets/png/`; never type the name. Set the width
only, so the height follows the aspect ratio (rule `brand-logo-no-distort`):

- python-docx: `doc.add_picture(path, width=Cm(5))`
- python-pptx: `slide.shapes.add_picture(path, left, top, width=Cm(5))`
- openpyxl: `img = Image(path)`, scale `img.width` and `img.height` by the
  same factor, then `ws.add_image(img, "B2")`. It needs Pillow.

Pick the PNG by background, as `assets/png/manifest.json` records:

- Light background: `logo-full-*.png`, transparent, with no clear space
  built in. Leave at least the height of the "B" free on every side.
- Red or dark background: `logo-full-white-*-on-brand.png` or
  `-on-charcoal.png`. The tile carries its own background and clear space,
  so place it on a fill of the same colour (`#DA291C` or `#1A1A1A`).

Use the 2048 px file for slides and print, 1024 px for documents.
`docs/guide/print.md` gives physical sizes.

**Check.** Open the file, or convert it to PDF, and look at it before you
report. Say so if you could not.
