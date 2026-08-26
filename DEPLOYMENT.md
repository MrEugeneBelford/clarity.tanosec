# Netlify deployment

Clarity is a Next.js 15 application deployed from GitHub to Netlify. The active application uses Next.js server actions for AI, email, and internal notifications; there are no standalone legacy Netlify functions.

## Prerequisites

- Node.js 20
- npm 10
- A Netlify site connected to this repository
- A Google Generative AI key if Gemini explanations are enabled
- Resend and Whapi credentials for the notification features you intend to enable

## Build settings

`netlify.toml` defines the `npm run build` command, `.next` publish directory, runtime versions, caching, and security headers. Do not add a second set of Netlify UI build settings unless intentionally overriding the repository configuration.

## Environment variables

Configure only the integrations in use:

```text
GOOGLE_GENERATIVE_AI_API_KEY=
RESEND_API_KEY=
NOTIFICATION_EMAIL_FROM=
NOTIFICATION_EMAIL_TO=
WHAPI_TOKEN=
WHAPI_TO_NUMBER=
```

All values are server-side secrets. Do not prefix them with `NEXT_PUBLIC_` and do not commit `.env.local`.

## Deploy

1. Push the reviewed branch to GitHub.
2. Open the Netlify deploy preview and confirm the build succeeds.
3. Run the assessment once without optional contact details and once with email consent.
4. Confirm the Gemini fallback remains usable when the AI key is absent or the provider is unavailable.
5. Confirm email and WhatsApp delivery only when their environment variables are configured.
6. Promote the reviewed deploy to production.

## Release hardening checks

- Verify the assessment remains useful with the Gemini key temporarily removed.
- Submit malformed and repeated requests; confirm validation and rate-limit messages are calm and reveal no internals.
- Confirm Resend and Whapi time out cleanly without blocking the on-screen snapshot.
- Test the full flow at 375px and 1440px, using keyboard-only navigation at least once.
- Open the email in Gmail and Outlook and download the PDF in each supported browser.
- Confirm Netlify response headers include CSP, HSTS, `nosniff`, frame denial, referrer policy, and permissions policy.
- Review production logs for provider status only; emails, answers, findings, and generated explanations must not appear in logs.
- Confirm no report content is written to localStorage, sessionStorage, a database, or analytics.

Rate limits are intentionally best-effort in-process guards. Netlify or an edge/WAF rate limit should also be enabled before a high-traffic campaign because serverless instances do not share memory.

## Local verification

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The development server runs at `http://localhost:9002` with `npm run dev`.

## Troubleshooting

- **Build failure:** reproduce with `npm run build` using Node.js 20 and inspect the first error.
- **Gemini unavailable:** verify `GOOGLE_GENERATIVE_AI_API_KEY`; the application should still return deterministic fallback content.
- **Email unavailable:** verify the Resend key and that `NOTIFICATION_EMAIL_FROM` is a verified sender.
- **WhatsApp unavailable:** verify the Whapi token and destination number.
- **Content blocked in production:** compare the requested host with the Content Security Policy in `netlify.toml`.

There are deliberately no public debug endpoints for provider or assessment testing.
