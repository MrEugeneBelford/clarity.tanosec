# Clarity by Tanosec — Agent Context

## What this project is
Clarity is an AI-powered cybersecurity self-assessment tool for South African SMEs, built by Tanosec Cybersecurity (Bloemfontein). It is the company's primary lead generation tool. Users complete a 25-question assessment and receive an AI-generated security posture report with risks, strengths, and recommendations.

**Live URL:** https://clarity.tanosec.co.za  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Groq API (llama-3.3-70b-versatile), deployed on Netlify  
**Company tagline:** "Think Like a Hacker, Secure Like a Pro"

---

## Critical rules — never violate these

1. **No PDF download.** There is no PDF export, no html2canvas, no jsPDF. The full-report route does not exist. If you see references to these, delete them.
2. **No localStorage for report data.** Assessment results are never written to localStorage.
3. **No debug API routes in production.** Routes like /api/debug-groq, /api/test-openrouter, /api/test-assessment must not exist.
4. **Email is optional, never blocking.** Users can always continue without providing an email.
5. **POPIA consent copy must appear** adjacent to the email input field at all times.
6. **The AI model is Gemini 2.5 Flash via Google Generative AI SDK.** Do not revert to Groq or any OpenRouter model.
7. **Local Context Rule:** All AI recommendations must be South Africa-specific. No generic global cybersecurity boilerplate. Reference POPIA, SIM swap fraud, load shedding, SA threat landscape.

---

## Notification system

When a user completes an assessment, two notifications fire in parallel:

**WhatsApp** via Whapi.cloud → Tanosec dedicated business number (+27621234244)  
**Email** via Resend → clarity@tanosec.co.za  

Environment variables required:
```
GROQ_API_KEY
WHAPI_TOKEN
WHAPI_TO_NUMBER=27621234244
RESEND_API_KEY
NOTIFICATION_EMAIL_TO=clarity@tanosec.co.za
NOTIFICATION_EMAIL_FROM=Clarity by Tanosec <clarity@tanosec.co.za>
```

Notification fires from `/src/lib/notifications.ts` (server-side only, 'use server').  
Called from `saveLeadCapture()` in `/src/lib/actions.ts`.

---

## Assessment structure

**25 questions** across 7 categories with these weights:
- network (15%) — 4 questions including UPS/load shedding question
- access (20%) — includes MFA, password policy, vendor access, M365/Google Workspace
- data (15%) — backups, encryption, cloud service security
- endpoint (15%) — AV, patching, device management
- training (15%) — phishing, SA-specific scams (SIM swap, SARS phishing, CEO impersonation)
- incident (10%) — incident response plan, breach detection
- compliance (10%) — POPIA Information Officer, risk register

**No SSID hiding question.** It was removed because it rewards security theatre.

---

## Scoring

Score is calculated as a weighted percentage across categories.  
5-band interpretation:
- 0–24%: Critical Risk (red)
- 25–49%: High Risk (orange)
- 50–69%: Moderate Risk (yellow)
- 70–84%: Low Risk (green)
- 85–100%: Strong Posture (emerald)

---

## UI/UX principles

- **Dark, modern aesthetic.** Think cybersecurity tool, not generic SaaS. Deep backgrounds, subtle gradients, sharp typography.
- **No generic AI aesthetics.** No light mode defaults, no Tailwind blue-500 everywhere.
- **Tanosec brand colours:** Use CSS variables, prefer dark slate/zinc backgrounds with accent colours for scores and CTAs.
- **No excessive animations.** Subtle transitions only.
- **Mobile-first.** Most SA SME owners will open this on their phone.

---

## Assessment flow (in order)

1. **Landing** — logo, tagline, start button, sector select (optional), company size select (optional)
2. **Questions** — one at a time, progress bar, answer saved to sessionStorage as user goes
3. **Email capture** — optional email + newsletter opt-in + POPIA consent copy + privacy policy link
4. **Loading** — rotating status messages while Groq generates recommendations
5. **Results** — score, 5-band label, category breakdown, AI risks, AI strengths, AI recommendations, dynamic CTA based on worst category, "Book a consultation" Calendly link

---

## Key files

| File | Purpose |
|------|---------|
| `/src/app/page.tsx` | Entire assessment flow UI and state |
| `/src/lib/questions.ts` | All 25 questions and category definitions |
| `/src/ai/flows/generate-security-recommendations.ts` | AI prompt and Gemini call |
| `/src/ai/gemini.ts` | Gemini 2.5 Flash client config |
| `/src/lib/actions.ts` | Server actions including saveLeadCapture |
| `/src/lib/notifications.ts` | WhatsApp + Email notification logic |
| `/src/app/layout.tsx` | Root layout, metadata |
| `/netlify.toml` | Netlify config + security headers |

---

## What has been intentionally removed

- `/src/app/full-report/` — deleted
- `/src/components/FullReport.tsx` — deleted
- `/src/app/api/debug-groq/` — deleted
- `/src/app/api/test-openrouter/` — deleted
- `/src/app/api/test-assessment/` — deleted
- `/src/ai/openrouter.ts` — deleted
- `/src/ai/openrouter-direct.ts` — deleted
- `html2canvas` and `jspdf` — removed from package.json
