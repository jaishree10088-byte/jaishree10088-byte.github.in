# WebForge — Memory

Project memory: decisions, bugs, and changes, so context is never lost
when work continues in a new session or with a new AI tool. (This is the
project's own memory file — it is separate from the assistant's memory.)

## Decisions

- 2026-11-02: Test-path-first publishing is mandatory. The first version
  of an earlier site went live without a browser test and the owner found
  broken upload and a broken built-in character. Since then: test path →
  browser check → promote, every time.
- 2026-11-02: The scanner is passive-only and permission-gated. An early
  request to scan any website and SMS the owner a threat-style message
  was declined; the owner dropped the SMS part and kept the passive,
  permission-gated checker.
- 2026-11-02: GitHub Pages cannot run the Python backend, so the public
  scanner page is a notice, not a scan. The real scanner runs on
  localhost (`server.py`, port 8000) only.
- 2026-11-02: The AI builder is an honest template starter, not real AI
  generation. Fake previews, fake templates, and demo content were
  removed on purpose.
- 2026-11-02: Builder preview iframe is sandboxed (`sandbox` attribute);
  generated HTML contains no scripts and the builder never reads iframe
  content.
- 2026-11-02: Builder logo is optional, downscaled to max 480 px, embedded
  as a PNG data URL so the downloaded file is self-contained.
- 2026-11-02: Resume builder email prefill removed on the owner's order
  ("mera email hat do"). The field is blank with an "Add your email
  address" placeholder; the EMAIL line renders only when filled.
- 2026-11-02: No website content is ever deleted without the owner's
  explicit pick. (A main-site logo was rejected by the owner; the
  Apna Akhbaar logo files exist locally but are not in the repo.)
- Standing: all shipped text is fully English. Hinglish is for chat only.
- Standing: the owner's real certifications, personal details, phone, and
  education are still unprovided — never invent them.

## Bugs and gotchas (fixed, recorded so they are not repeated)

- Pages deploys lag minutes. A browser check in the same minute as a
  commit can show the stale previous deploy — re-check after a few
  minutes before concluding failure. Verify repo truth with `gh.py sha`
  or `raw.githubusercontent.com`.
- Browser-task file grants reject paths through symlinks — grant a copy
  at a real path instead.
- The public ZIP must contain the LOCAL source files, not the
  banner-modified public copies.
- `localStorage` keys: `realScannerHistory` (max 20), `realScannerLast`.
  Clearing browser data wipes scan history; that is by design.

## Change log (short)

- 2026-11-02: Resume email removed; builder iframe sandboxed; builder
  logo option added; resume Certifications + Personal Details sections
  added; sidebar System links added; homepage "Resume Maker" link added.
- Earlier: builder rebuilt (fake parts removed); resume builder moved to
  DOCX format with Education table + Add Row; scanner, bug finder, and
  reports pages built on real saved-scan history.
