# TypingMasterProOnline Social API (Cloudflare Worker)

## Important status
This repository contains the API foundation, not a completed social publisher.
The Worker provides health/status routes and safe, explicit "not configured" responses.
It does not yet perform OAuth or upload videos. Never tell users a post succeeded unless
the relevant platform API confirms it.

## Deploy the Worker
1. Sign in to https://dash.cloudflare.com/
2. Open **Workers & Pages** and choose **Create application** > **Create Worker**.
3. Name it `typingmasterproonline-social-api`.
4. Open **Edit code** and replace the starter code with the contents of `worker.js`.
5. Deploy. Test the generated `https://<worker-name>.<account-subdomain>.workers.dev/health` URL.
6. In Worker **Settings > Variables and Secrets**, add a text variable:
   - `ALLOWED_ORIGIN` = `https://typingmasterproonline.com`
7. Keep `workers.dev` enabled for the first test.

## API routes
- `GET /health` — confirms the Worker is running.
- `GET /api/social/status` — reports which platform adapters are enabled.
- `GET /api/social/{facebook|youtube|instagram|tiktok}/start` — intentionally returns
  `501 OAUTH_NOT_CONFIGURED` until that platform's OAuth flow is implemented.
- `POST /api/social/publish` — intentionally returns `501 PUBLISHING_NOT_CONFIGURED`
  until real publishing adapters are implemented.

## Required before real publishing
Each provider needs its own developer app, OAuth consent, callback URL, permissions,
token storage, and upload implementation:
- Meta: Facebook Page publishing permissions; Instagram must be a supported Professional
  account connected to a Facebook Page.
- YouTube: Google Cloud project, YouTube Data API enabled, OAuth client and upload scope.
- TikTok: developer app and approved Content Posting API access; account authorization.
- Instagram: media publishing API requirements and supported media/account settings.

The next engineering stage is to implement and test OAuth one provider at a time, store
tokens in encrypted server-side storage (never in GitHub or browser localStorage), then
implement each platform's distinct video-upload protocol. TikTok/Meta/Google app review
or account eligibility may be required.

## Frontend connection
The existing GitHub Pages site currently calls relative `/api/social/...` URLs. GitHub
Pages cannot execute Worker code. After deployment, connect the frontend to the Worker URL
by setting its API base URL in the Social Publisher script, or route a custom domain path
to the Worker after DNS is safely configured. Do not point the live UI at a Worker until
the Worker is deployed and tested.

## Security
- Never commit app secrets, client secrets, access tokens, refresh tokens, or passwords.
- Add secrets only through Cloudflare's encrypted **Secrets** fields.
- Never paste secrets into ChatGPT, GitHub issues, source files, or browser code.
- Use HTTPS and restrict the allowed origin to the actual website origin.
