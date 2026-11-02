# WebForge — Tasks

Small, clear steps. Each step is one change, checked on the test path
before promotion (see RULES.md). Completed steps stay listed so the
project's history is visible.

## Done

- [x] Home dashboard with navigation and sidebar System links
      (Ration Card, Aadhaar Card, PM Kisan portals, new tab).
- [x] Real passive security scanner (localhost Python backend, permission
      gate, 403 without permission) + public-page notice for GitHub Pages.
- [x] Bug finder and vulnerability reports reading real saved-scan
      history (`localStorage`, max 20 entries).
- [x] AI website builder rebuilt: fake preview, fake templates, dice, and
      dead pickers removed; New Website reset; Design panel (6 themes,
      4 section checkboxes); any-prompt generator; honest "Template
      starter" footer.
- [x] Builder preview iframe sandboxed; builder never reads iframe content.
- [x] Builder logo option: optional upload, max 480 px PNG data URL in the
      generated header, Remove button, reset on New Website.
- [x] Resume builder in DOCX format: navy `#16324F` header, `#E0EBF2`
      contact band, photo upload + Remove Photo, Education table with
      + Add Row / Remove, Certifications + Personal Details sections,
      sections shown only when filled, Download .HTML, Print / Save as PDF.
- [x] Resume builder email prefill removed (field blank, placeholder
      "Add your email address"; EMAIL line shows only when filled).
- [x] Test-path-first publish flow (`webforge-test/` → browser check →
      `webforge/`) with ZIP refresh on every publish.
- [x] Homepage nav "Resume Maker" link; ZIP linked from every public
      page's banner.

## TODO (only when the owner provides the input)

- [ ] Fill the resume builder's real personal details — phone, education,
      certifications, father's name, date of birth — ONLY from details the
      owner sends. Never invent them.
- [ ] Any new page or feature the owner requests, as its own task below
      (one task per change, test path first).

## How to add a new task

1. Append one checkbox line under TODO describing a single change.
2. Implement it in the LOCAL source files.
3. Publish to `webforge-test/`, browser-check, then promote to `webforge/`.
4. Refresh the ZIP, verify with `gh.py sha`, move the checkbox to Done
   with the date and the commit noted.
