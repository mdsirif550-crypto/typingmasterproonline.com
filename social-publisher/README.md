# Social Publisher integration

This directory adds the static dashboard at `/social-publisher/`.

## Current status
- Video selection and local preview work in the browser.
- Platform selection and caption fields are included.
- The dashboard expects a secure same-origin backend:
  - `GET /api/social/facebook/start`
  - `GET /api/social/youtube/start`
  - `GET /api/social/instagram/start`
  - `GET /api/social/tiktok/start`
  - `POST /api/social/publish` (multipart form: video, caption, platforms)
- The UI intentionally does not pretend to publish when the backend is absent.

## Required before real publishing
1. Deploy a server/API (GitHub Pages only serves static files; it cannot run OAuth callbacks or upload jobs).
2. Store provider client secrets only in server-side environment variables, never in this HTML or browser storage.
3. Implement OAuth authorization-code flows, callback validation/state, token encryption/refresh, user consent, and per-platform publish adapters.
4. Facebook: connect a Page and obtain the required Page publishing permissions and app review/advanced access as applicable.
5. YouTube: OAuth consent and YouTube Data API upload access; comply with quota and video visibility rules.
6. Instagram: eligible professional account linked to a Facebook Page and the required Instagram Graph API permissions.
7. TikTok: approved app and Content Posting API permissions; direct posting may require audit/approval and user consent flows.
8. Enforce upload size/type limits, malware scanning, rate limits, CSRF protection, access control, and clear per-platform job status.

Do not collect social passwords. Do not expose access tokens or client secrets in frontend code.
