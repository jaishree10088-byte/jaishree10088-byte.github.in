# WebForge — Product Requirements Document (PRD)

## What it is

WebForge is a free, static, multi-page website that gives visitors three
practical tools in one place:

1. A passive website security scanner (real checks, local backend only).
2. A bug finder and vulnerability reports dashboard (reads real saved scans).
3. An AI website builder (an honest template starter, not real AI generation).
4. A resume builder (professional DOCX-style format, in the browser).

Live site: `https://sandipk.qd.je/webforge/`
Test twin: `https://sandipk.qd.je/webforge-test/` (every change lands here
first, is browser-checked, and only then promoted to the live path).

## Target users

- Visitors who want a quick, free security check of a website they own or
  have permission to check.
- Visitors who want a professional resume without installing an app or
  paying for a template.
- Visitors who want a fast starting template for a simple website.

## Core features (by page)

### Home (`index.html`)

- Overview of all tools, navigation to every page.
- Sidebar "System" links (open in a new tab): Ration Card, Aadhaar Card,
  PM Kisan portals.
- Link to the Resume Maker from the main navigation.

### Security Scanner (`security-scanner.html`)

- Passive homepage header checks ONLY: HTTPS, HSTS, CSP, clickjacking
  protection, nosniff, Referrer-Policy, Permissions-Policy, cookie flags,
  Server / X-Powered-By disclosure, CORS header.
- Permission gate: the user must tick a permission box confirming they own
  the site or have written permission. Without it the backend returns 403.
- The public page on GitHub Pages shows a notice instead of scanning, because
  GitHub Pages cannot run the Python backend.
- Scan history is stored in the browser only (`localStorage` keys
  `realScannerHistory`, max 20 entries, and `realScannerLast`).

### Bug Finder (`bug-finder.html`) and Vulnerability Reports (`vulnerability-reports.html`)

- Read the real saved-scan history from `localStorage`; no demo or fake
  findings are ever shown.

### AI Website Builder (`ai-website-builder.html`)

- Prompt-based template starter: any prompt produces a single-file HTML
  starter with an HTML-escaped prompt, a keyword-matched extra section, and
  an honest "Template starter" footer.
- Design panel: 6 themes, 4 section checkboxes, optional logo upload
  (downscaled to max 480 px wide, embedded as a PNG data URL so the
  downloaded file is self-contained).
- Preview runs in a sandboxed iframe (`sandbox` attribute, no scripts in
  generated HTML). The builder never reads the iframe's content.
- Buttons: Code / Preview switch, Download .HTML, New Website (full reset,
  including the logo).

### Resume Builder (`resume-builder.html`)

- Professional DOCX-style format: navy `#16324F` header, `#E0EBF2`
  contact band, photo box (in-browser downscale, Remove Photo button).
- Sections shown only when filled: Education table (5 columns, + Add Row /
  Remove per row), Certifications, Personal Details, Skills, Projects.
- Actions: Download .HTML, Print / Save as PDF.
- No email, phone, education, or personal details are pre-filled unless the
  owner provides them. Placeholders (`[your email]`, `[your phone number]`)
  are used instead of invented data.

## Non-goals (honest limits)

- No live traffic telemetry, no Next.js / React builds.
- No real AI generation in the builder — it is a template starter.
- No server-side scanning on the public site — the Python backend runs on
  localhost only.
- No login, no database, no user accounts, no payments.
- No fake preview content, fake templates, or demo numbers anywhere.

## Success criteria

- Every page loads on GitHub Pages with no console errors.
- Every change is browser-checked on the test path before promotion.
- The scanner never runs without the permission tick.
- All shipped text is fully English (UI labels, buttons, messages, content).
- A ZIP of the local source (`public/downloads/webforge-website.zip`) is
  linked from every public page's banner and updated on every publish.
