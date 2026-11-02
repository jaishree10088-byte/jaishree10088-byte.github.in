# WebForge — Architecture

## Stack

- Frontend: plain static HTML + CSS + vanilla JavaScript. No build step,
  no npm packages, no framework.
- Styling: Tailwind CSS via CDN (`cdn.tailwindcss.com`) on the WebForge
  pages. This is the only third-party script on these pages.
- Fonts: Inter (UI text) and JetBrains Mono (telemetry / metrics), loaded
  from Google Fonts. Icons: Material Symbols Outlined.
- Backend (local only): Python 3 standard library only — `server.py`
  (`http.server.ThreadingHTTPServer`). No dependencies to install.
- Hosting: GitHub Pages, repository `jaishree10088-byte.github.in`,
  branch `main`. Local master copy: `~/workspace/domain-site/` for the main
  site; WebForge source lives in `~/workspace/your_files/webforge-website/`
  (a symlink to the goal workspace).
- Deploy tool: `~/workspace/custom-connectors/custom.github/bin/gh.py`
  (`put` to publish, `sha` to verify what is actually in the repo).

## File map

| File | Role |
| --- | --- |
| `index.html` | Home / dashboard |
| `security-scanner.html` | Scanner UI (public page is notice-only) |
| `bug-finder.html` | Bug finder (reads saved scans) |
| `vulnerability-reports.html` | Reports dashboard (reads saved scans) |
| `ai-website-builder.html` | Template-starter builder |
| `resume-builder.html` | Resume builder |
| `server.py` | Localhost scanner backend (port 8000) |
| `build_public.py` | Builds `public/` copies (adds PUBLIC PREVIEW banner + scanner override) |
| `public/` | Public copies + `public/downloads/webforge-website.zip` (ZIP of LOCAL source) |
| `*.py` (add_*, apply_*, fix_*, rebuild_*, split_*, update_*) | One-off edit scripts used to change the pages; kept in the folder for repeatability |

## How the scanner works

```
Browser page --(URL + authorized=true)--> http://127.0.0.1:8000/api/scan
Server fetches ONLY the target homepage (15 s timeout, custom User-Agent)
Server checks response headers only --> JSON result
Browser stores result in localStorage (realScannerHistory, max 20)
```

- Without `authorized=true` the server returns 403.
- The server binds to `127.0.0.1` only; it is never exposed publicly.
- GitHub Pages cannot run this backend, so the public scanner page shows a
  notice and performs no scan.

## Data storage

- No server database. Scan history lives in the visitor's browser
  (`localStorage`): `realScannerHistory` (max 20 entries),
  `realScannerLast` (most recent scan).
- The resume builder and website builder keep everything in the page;
  nothing is uploaded to any server. File uploads (logo, photo) are read
  with `FileReader` in the browser only.

## Deploy pipeline (mandatory order)

1. Edit the LOCAL source files.
2. Publish to the test path `webforge-test/` via `gh.py put`.
3. Browser-check the test URL with a cache-busting query (`?v=...`) and
   one reload.
4. Only after the check passes, promote the same files to `webforge/`.
5. Rebuild the ZIP (`public/downloads/webforge-website.zip`) and publish it.
6. Verify with `gh.py sha` and/or `raw.githubusercontent.com` — never trust
   the live site alone, because Pages deploys lag by minutes and a check in
   the same minute as a commit can hit the stale previous deploy.

## Security boundaries

- No secrets in the repository, ever. The GitHub token lives in the Secure
  Vault only; Gemini keys live inside apps, never in chat or files.
- The scanner performs passive header checks only. It never sends payloads,
  never tries SQL injection or XSS, never attempts logins, never submits
  forms, never port-scans, never brute-forces directories, never bypasses
  Cloudflare, and never sends SMS.
- Active injection testing belongs only in authorised practice labs and
  bounty programs — never in this tool.
