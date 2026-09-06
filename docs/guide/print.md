# Prepare TEBIN artwork for print

Start with **TEBIN Classic** unless the brief explicitly requests Modern.
Use its [design guide](../../themes/tebin-classic/DESIGN.md) and
[colour references](../../themes/tebin-classic/dist/colors.csv).

## Artwork and physical size

Use the supplied SVG logo in a layout tool that preserves vectors, then export
the printer's requested PDF format. Do not recreate the wordmark with a font.
The SVG is a vector asset, not a complete press-ready document.

If the workflow needs PNG, calculate the image width from the final placement:

`width in pixels = width in millimetres / 25.4 × required ppi`

At 300 ppi, 1024 px supports about 86.7 mm and 2048 px about 173.4 mm of image
width. This includes any padding in a coloured tile. Enlarging a PNG reduces
its effective resolution; changing only its resolution metadata adds no detail.
Use the printer's requested resolution for the actual medium and viewing distance.

## Colour and handoff

PNG and the supplied SVG colours are RGB. Pantone and CMYK values in the
palette are brand-book references; they do not automatically convert an RGB
file into a colour-managed print file.

For each job, record the trim size, bleed and safe area, printing process,
paper, colour profile, spot-colour versus process-colour choice, and required
PDF preset. Use the printer's specifications rather than assuming one bleed
or CMYK profile fits every job. Confirm Pantone-to-process substitutions with
the printer and review a proof when colour matching matters.

Use Arial for Classic Office documents. Ensure the final PDF embeds permitted
fonts or outlines text as the production workflow requires. The supplied logo
already contains drawn letterforms.

## Before delivery

- Inspect the exported file at its intended physical size, including small type.
- Check logo proportions, the height-of-B clear space, and the correct background variant.
- Confirm image resolution, page boxes, colour handling and fonts in the exported PDF.
- Record the theme id/version and approved proof with the delivered file.

This repository provides brand inputs and guidance. It does not yet provide
certified PDF/X output, ICC profiles, or editable stationery templates.
