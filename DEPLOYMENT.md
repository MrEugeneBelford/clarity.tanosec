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
