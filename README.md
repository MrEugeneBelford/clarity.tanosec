# Clarity by Tanosec

An AI-powered cybersecurity self-assessment tool for South African SMEs, built with Next.js and hosted on Netlify.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.local` and fill in the values before running locally. For Netlify, set these in **Site settings → Environment variables**.

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | API key from [console.groq.com](https://console.groq.com) — powers AI recommendations |
| `TELEGRAM_BOT_TOKEN` | ⚠️ Recommended | Telegram bot token from [@BotFather](https://t.me/botfather) — sends lead capture notifications to the configured chat ID |

> **Telegram setup:** Create a bot via @BotFather on Telegram, copy the token into `TELEGRAM_BOT_TOKEN`. The lead notification chat ID is hardcoded in `src/lib/leadActions.ts`. If `TELEGRAM_BOT_TOKEN` is not set, lead captures are silently skipped — no error is thrown to the user.

## Deployment

Configured for Netlify. Build command: `npm run build`. Publish directory: `.next`.
