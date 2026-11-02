# WebForge — Design

## Dashboard pages (home, scanner, bug finder, reports)

- Theme: dark dashboard. Background surfaces around `#0f131d`,
  `#171b26`, `#1c1f2a`; primary accent purple `#d0bcff` / `#a078ff`;
  secondary cyan `#4cd7f6`; success green `#4edea3`; error `#ffb4ab`.
- Typography: Inter for UI text (400 / 500 / 600 / 700), JetBrains Mono
  for telemetry and metric readouts. Icons: Material Symbols Outlined.
- Layout: sticky navigation, card-based sections, rounded corners
  (`0.125rem` default, `0.5rem` xl, `0.75rem` full), generous spacing
  (`0.25rem`–`2.5rem` scale). Scrollbars hidden on the dashboard shell.
- Copy: short, plain, fully English. Status is shown as text, never as a
  fake number or a demo chart.

## Resume builder (DOCX-style format)

- Header: navy `#16324F`, white bold name and title.
- Contact band: light blue-grey `#E0EBF2`.
- Photo box: right-aligned, in-browser downscale, Remove Photo button.
- Body: single-column sections, shown only when filled — Education table
  (5 columns, + Add Row / Remove per row), Certifications, Personal
  Details, Skills, Projects.
- Output: Download .HTML (self-contained) and Print / Save as PDF.
  Print styling must match the on-screen layout.

## AI website builder

- Panels: prompt input, Design panel (6 themes, 4 section checkboxes),
  optional logo upload with thumbnail preview and Remove button.
- Preview: sandboxed iframe; Code / Preview toggle; Download .HTML.
- Generated HTML: HTML-escaped prompt text, keyword-matched extra section,
  `[your email]` / `[your phone number]` placeholders, honest
  "Template starter" footer. No scripts in generated output.
- Logo: uploaded image downscaled to max 480 px wide, embedded as a PNG
  data URL in the generated header before the `<h1>`. No logo means the
  header is unchanged. New Website resets everything, including the logo.

## Public preview copies

- `build_public.py` adds a PUBLIC PREVIEW banner to public copies and
  replaces the public scanner with a notice (no live backend on Pages).
- The ZIP linked from every page's banner always contains the LOCAL
  source files, not the banner-modified public copies.

## Responsive and accessibility basics

- Mobile-first viewport meta on every page; vertical layouts collapse
  cleanly on narrow screens.
- Buttons carry real labels (no icon-only actions without text).
- Colour is never the only signal: errors and success states also use
  text (e.g. "Scan complete", "Permission required").
