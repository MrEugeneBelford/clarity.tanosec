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


## Deployment

Configured for Netlify. Build command: `npm run build`. Publish directory: `.next`.
