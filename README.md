# Clarity by Tanosec

Clarity is a contextual cybersecurity self-assessment tool for South African SMEs, built with Next.js and hosted on Netlify.

It uses deterministic, server-controlled reasoning to identify meaningful gaps, compound risks, and genuine strengths. AI is the explanation layer only, not the reasoning engine: it may make approved findings easier to understand, but it does not create findings, assign priorities, calculate scores, or choose recommendations.

The current production experience remains the v1 assessment while the isolated v2 reasoning foundation is developed under `src/lib/v2/`.

## Development

```bash
npm ci
npm run dev
```

The local site is available at `http://localhost:9002`.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

## Environment variables

Copy `.env.local.example` to `.env.local` for local development. Configure production values in Netlify under **Site configuration → Environment variables**.

| Variable | Required for | Description |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | AI explanations | Server-side Gemini 2.5 Flash explanation layer |
| `RESEND_API_KEY` | Email | Sends user reports and internal notifications |
| `NOTIFICATION_EMAIL_FROM` | Email | Verified sender address |
| `NOTIFICATION_EMAIL_TO` | Internal notifications | Tanosec notification recipient |
| `WHAPI_TOKEN` | WhatsApp notifications | Whapi API token |
| `WHAPI_TO_NUMBER` | WhatsApp notifications | Destination number |

Do not expose these values through `NEXT_PUBLIC_` variables.

## Deployment

Netlify reads the build settings and security headers from `netlify.toml`. See `DEPLOYMENT.md` for the deployment and verification checklist.
