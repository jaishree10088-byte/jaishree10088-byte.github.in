# WebForge — Rules

Rules every change to this project must follow. If a request conflicts
with a rule, the rule wins and the conflict is reported to the owner.

## Language

1. ALL shipped text is fully English: UI labels, buttons, messages, page
   content, and generated output. Hinglish is for chat with the owner only,
   never inside a shipped page or file.

## Publishing

2. Test path first, always: `webforge-test/` → browser-check (cache-busting
   `?v=...` URL, reload once) → promote to `webforge/`. No change goes
   straight to the live path. (Reason: the first version went live
   untested and the owner found broken upload and a broken character.)
3. Verify with `gh.py sha` or `raw.githubusercontent.com`, not the live
   site alone. Pages deploys lag minutes; a same-minute browser check can
   show the stale previous deploy — re-check after a few minutes before
   concluding failure.
4. Never delete website content without the owner's explicit pick of what
   to remove. If the pick is unclear, nothing is deleted.
5. Every publish refreshes `public/downloads/webforge-website.zip`, linked
   from every public page's banner.

## Honesty

6. No fake data, ever: no demo numbers, no fake previews, no fake
   templates, no hotlinked images, no invented personal details.
7. The builder is labelled an honest template starter, never "real AI".
   Live traffic telemetry and Next.js / React builds are not claimed.
8. Placeholders (`[your email]`, `[your phone number]`) are used for
   missing personal data. The owner's real certifications, personal
   details, phone, and education are added only when he provides them.

## Scanner safety

9. Passive checks only, permission-gated. The permission tick is mandatory;
   without it the backend returns 403. No payloads, no injection attempts,
   no login attempts, no form submits, no port scans, no directory
   brute force, no Cloudflare bypass, no SMS outreach.
10. The localhost backend (`server.py`, port 8000, `127.0.0.1` only) is
    never deployed to GitHub Pages and never exposed publicly.

## Code style

11. Plain HTML + vanilla JavaScript. No new framework, no npm dependency,
    no build step without the owner's explicit approval.
12. Generated builder output contains no scripts; its preview iframe is
    always sandboxed, and the builder never reads iframe content.
13. Uploaded images (logo, photo) are downscaled in the browser and
    embedded as data URLs so downloaded files are self-contained.
14. No secrets in the repo or in these docs: tokens and keys live in the
    Secure Vault / inside apps only, never in chat, files, or URLs.

## Browser-task quirks

15. Browser file grants reject paths that pass through symlinks — grant a
    copy at a real path instead.
16. A browser check in the same minute as a commit can hit the stale
    deploy; wait and re-check before concluding failure.
