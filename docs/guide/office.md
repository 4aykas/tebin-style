# TEBIN style in Word, Excel, PowerPoint and Google Docs

Everything below uses the **TEBIN Classic** theme — the one that matches
printed TEBIN material. Its full reference is
[DESIGN.md](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/DESIGN.md);
every logo link in this guide is also there.

**Before anything else: the logo is a file.** Its letters are drawn outlines,
not a font. Typing “TEBIN” in Arial or Roboto gives you different letterforms,
not the logo, however close the face looks. Every step below inserts a picture.

## Word

- **Logo:** insert the
  [1024 px PNG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-1024.png?raw=1)
  (2048 px if the document will be printed). Insert → Pictures → This Device.
- **Font: Arial, not Roboto.** This is the 2017 brand book's own instruction —
  "in the Microsoft Office documents use the Arial font" — and Arial is
  installed everywhere, so the document renders the same on every machine.
- **Brand red for a heading or accent:** Font Color → More Colors → Custom, and
  type **Red 218, Green 41, Blue 28**.
- Keep clear space around the logo of at least the height of its "B" — do not
  crowd it with text or table borders.

## Excel

- Open
  [colors.csv](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/dist/colors.csv?raw=1)
  — every colour with its RGB in its own columns; use the `r`, `g`, `b` values
  in Fill Color → More Colors → Custom.
- Keep the logo **on the drawing layer, not in a cell** (Insert → Pictures →
  Place over Cells), so sorting and filtering cannot move it.
- Charts: brand red for the series that matters, greys for the rest. The
  secondary palette (maroon, salmon, yellow, teal…) is for category coding —
  never for the logo.

## PowerPoint

- Title slide: the
  [2048 px logo](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-2048.png?raw=1).
- Dark or red master: the white logo, already on the right tile —
  [white on red](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-brand.png?raw=1) ·
  [white on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-charcoal.png?raw=1).
- A photo slide: the
  [corner mark](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-256.png?raw=1)
  in the top-right corner marks TEBIN authorship without a full logo.

## Google Docs and Slides

- Same PNG files — download once, then Insert → Image → Upload from computer.
- Custom colours take the HEX directly: text color → Custom → `#DA291C`.
- Font: Arial, same reasoning as Word.

## What not to do

From the [brand rules](https://github.com/4aykas/tebin-style/blob/main/rules/dist/rules.md):

- **Never** place the two-color (red/grey) logo on a dark or red background;
  switch to the all-white logo instead.
- **Never** apply disproportional transforms to the logo or rescale its
  elements independently.
- **Never** add shadows or other effects to the logo.
- **Never** recolor the logo outside the approved palette (red, grey,
  all-white, all-black).
