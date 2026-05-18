# Clarity — Antigravity Mission Prompts
> Drop AGENTS.md in the project root first. Then dispatch these missions.
> Antigravity works best with one clear mission per dispatch. Let the agent plan and execute.
> Use Manager View to run Mission 1 + Mission 2 in parallel — they don't touch the same files.

---

## BEFORE ANYTHING — Netlify env vars (do this manually, 2 minutes)

Log into Netlify → Site settings → Environment variables. Add these if missing:

```
GROQ_API_KEY=your_groq_key           ← THIS IS WHY THE AI IS BROKEN RIGHT NOW
WHAPI_TOKEN=your_whapi_token
WHAPI_TO_NUMBER=27621234244
RESEND_API_KEY=re_your_key
NOTIFICATION_EMAIL_TO=clarity@tanosec.co.za
NOTIFICATION_EMAIL_FROM=Clarity by Tanosec <clarity@tanosec.co.za>
```

After adding, trigger a redeploy. The AI error will disappear immediately once GROQ_API_KEY is set.

---

## MISSION 1 — Purge and secure (no UI changes)

**Dispatch to one agent. Takes ~3 minutes.**

```
Perform a security cleanup on this Next.js project. Read AGENTS.md first for full context.

Your tasks:
1. Delete these completely: /src/app/full-report/, /src/components/FullReport.tsx, /src/app/api/debug-groq/, /src/app/api/test-openrouter/, /src/app/api/test-assessment/, /src/ai/openrouter.ts, /src/ai/openrouter-direct.ts

2. Remove html2canvas and jspdf from package.json, then run npm install.

3. In /src/app/page.tsx: remove the storeReportPayload function, handleDownloadFullReportPDF function, the Download PDF button, and any imports related to them (FileText icon, full-report router.push calls).

4. In /src/ai/groq.ts: change the model to llama-3.3-70b-versatile and increase timeout to 25000ms.

5. Add security headers to netlify.toml:
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.groq.com; frame-ancestors 'none';"

6. Search the entire codebase for any remaining references to: html2canvas, jspdf, full-report, debug-groq, test-openrouter, storeReportPayload, clarity_full_report_payload. Remove every one found.

7. Run npm run build and fix any TypeScript errors before finishing.

Generate a summary artifact of everything removed and changed.
```

---

## MISSION 2 — Fix the AI brain (parallel with Mission 1)

**Dispatch simultaneously with Mission 1. Takes ~4 minutes.**

```
Upgrade the AI recommendation system in this Next.js cybersecurity assessment app. Read AGENTS.md first.

TASK 1 — Rewrite generate-security-recommendations.ts

Replace the systemPrompt with:

"You are a senior cybersecurity advisor specialising in South African small and medium enterprises (SMEs). You work for Tanosec Cybersecurity, a Bloemfontein-based firm whose tagline is 'Think Like a Hacker, Secure Like a Pro.'

Your role is to analyse a business's cybersecurity self-assessment and deliver sharp, practical, SA-specific recommendations. You understand the local threat landscape: SIM swap fraud, SASSA and SAPO phishing campaigns, load shedding impacts on UPS and backup reliability, POPIA compliance obligations under the Information Regulator, and the budget constraints of Free State and broader SA SMEs.

Your tone is direct, expert, and no-nonsense. Avoid generic global cybersecurity boilerplate. Make every recommendation specific, local, and immediately actionable.

CRITICAL: Respond with ONLY a valid JSON object. No markdown. No code fences. No text outside the JSON:
{
  \"risks\": [\"risk1\", \"risk2\", \"risk3\"],
  \"strengths\": [\"strength1\", \"strength2\"],
  \"recommendations\": [
    {
      \"recommendation\": \"specific actionable recommendation\",
      \"priority\": \"high\"
    }
  ]
}

Rules:
- risks: 3-5 items specific to their weak answers, not generic statements
- strengths: 2-4 genuine acknowledgments of what they do well
- recommendations: 5-8 items, mix of high/medium/low priority, concrete next actions
- priority must be exactly 'high', 'medium', or 'low'
- Reference POPIA, SA context, and locally available solutions where relevant"

Replace the userPrompt construction with one that:
- Lists each Q&A pair clearly
- Includes the overall score percentage
- Flags the weakest category by name

TASK 2 — Replace the fallback with proper content (not the current error strings)

Replace FALLBACK_RECOMMENDATIONS with meaningful content:
- risks: 3 real common SME risks (not "Unable to parse AI response")
- strengths: 2 genuine positives about taking the assessment
- recommendations: 5 SA-specific actionable items including POPIA, MFA, and staff awareness

TASK 3 — Add progress persistence via sessionStorage
- On mount: restore answers from sessionStorage key 'clarity_answers_draft'
- On each answer change: save to sessionStorage
- On restart: clear sessionStorage

Run npm run build and fix any type errors.
```

---

## MISSION 3 — Rebuild the questions (after Mission 1 + 2 complete)

```
Replace the assessment questions in this cybersecurity app. Read AGENTS.md first.

Rewrite /src/lib/questions.ts completely with 25 questions across 7 categories:

Category weights:
- network: 0.15 (4 questions)
- access: 0.20 (5 questions)  
- data: 0.15 (4 questions)
- endpoint: 0.15 (4 questions)
- training: 0.15 (3 questions)
- incident: 0.10 (3 questions)
- compliance: 0.10 (2 questions)

Keep all existing questions that are good. Make these specific changes:

REMOVE: Any question about hidden SSID (security theatre — it rewards obscurity not security)

ADD these new questions:
1. (network) "During load shedding, are your critical systems protected by a UPS configured for safe shutdown?" — Yes/UPS+shutdown(10), UPS but no auto-shutdown(5), No UPS(0)
2. (compliance) "Do you have a nominated POPIA Information Officer responsible for data protection?" — Yes formal(10), Informal(4), No(0)
3. (training) "Are staff trained on SA-specific threats like SIM swap fraud, fake SARS emails, and CEO impersonation?" — Yes SA-specific(10), General phishing only(5), No training(0)
4. (access) "Do you control and audit what access third-party vendors or IT contractors have to your systems?" — Yes documented+audited(10), Access exists but unmanaged(3), Not tracked(0)
5. (data) "Are your Microsoft 365 or Google Workspace accounts secured with MFA and reviewed for suspicious activity?" — Yes MFA+review(10), MFA only(6), Neither(0)

Replace the score interpretation function with 5 bands:
- 0-24%: "Critical Risk" 
- 25-49%: "High Risk"
- 50-69%: "Moderate Risk"
- 70-84%: "Low Risk"
- 85-100%: "Strong Posture"

Add a description string to each band (e.g. "Your business is highly exposed. Immediate action required.")

Run npm run build after.
```

---

## MISSION 4 — Assessment flow improvements

```
Add new features to the assessment flow in this Next.js app. Read AGENTS.md first. Do not change any styling yet — that comes in Mission 5.

FEATURE 1 — Sector and company size selects on the landing screen
Add two optional select inputs to the start card, above the Start Assessment button:

Sector options: "Legal & Compliance", "Healthcare & Medical", "Finance & Accounting", "Retail & E-commerce", "Construction & Engineering", "Professional Services", "Hospitality & Tourism", "Education", "Technology", "Other"

Company size options: "1–5 employees", "6–20 employees", "21–50 employees", "51–200 employees", "200+ employees"

Store in state: sector and companySize. Pass both to the AI recommendation call and to saveLeadCapture.

FEATURE 2 — Dynamic CTA on results page
After results load, compute the worst-performing category (lowest score/maxScore ratio).
Update the "Ready to take the next step?" card to use dynamic copy:
- Title: "Your biggest gap is [Category Name] — let's fix it." (or generic fallback if no category)
- Description: "Our experts have seen this pattern before. A focused [Category] review with Tanosec typically takes one session and gives you a clear remediation roadmap."

FEATURE 3 — POPIA consent on email capture
Replace the current CardDescription on the email step with:
"Enter your email to receive a follow-up from the Tanosec team. By submitting, you consent to Tanosec Cybersecurity processing your information in accordance with our Privacy Policy (link to https://tanosec.co.za/privacy-policy-2/) (POPIA compliant). Your data will not be sold or shared with third parties."

FEATURE 4 — Rotating loading messages
Replace the static spinner text with rotating messages cycling every 2.2 seconds:
"Analysing your responses...", "Identifying your risk profile...", "Consulting the SA threat landscape...", "Crafting your recommendations...", "Almost there..."

FEATURE 5 — Fix the phone number
Search the entire codebase for any hardcoded phone numbers and replace with +27621234244.

Run npm run build after.
```

---

## MISSION 5 — Notification system (after Mission 4 complete)

```
Build a dual notification system for this Next.js app. Read AGENTS.md for full context on the notification requirements.

TASK 1 — Install resend package: npm install resend

TASK 2 — Create /src/lib/notifications.ts (server-side, 'use server') with:

A sendWhatsAppNotification function that:
- POSTs to https://gate.whapi.cloud/messages/text
- Uses Bearer token from process.env.WHAPI_TOKEN
- Sends to process.env.WHAPI_TO_NUMBER
- Message format (WhatsApp markdown):
  🦞 *New Clarity Assessment*
  
  [score emoji] *Score:* {score}% — {scoreLabel}
  📧 *Email:* {email or "Not provided"}
  🏢 *Sector:* {sector if provided}
  👥 *Size:* {companySize if provided}
  ⚠️ *Biggest gap:* {worstCategory if provided}
  📰 *Newsletter:* Yes/No
  
  🕒 {timestamp in SAST}
  
  Score emoji: 🟢 ≥75%, 🟡 ≥50%, 🟠 ≥25%, 🔴 <25%
- Wrap in try/catch, never throw to caller

A sendEmailNotification function that:
- Uses Resend API (https://api.resend.com/emails) with RESEND_API_KEY
- From: process.env.NOTIFICATION_EMAIL_FROM
- To: process.env.NOTIFICATION_EMAIL_TO
- Subject: "[score emoji] Clarity Lead — {score}% ({scoreLabel}) · {email if provided}"
- HTML email with dark theme (#0f0f0f background, #1a1a1a card):
  - Header: "🦞 New Clarity Lead" 
  - Large score number in colour (same emoji colour logic)
  - Clean table with: Email, Sector, Company size, Biggest gap (in orange if present), Newsletter opt-in, Timestamp
  - Footer: "Clarity by Tanosec · clarity.tanosec.co.za"
- Wrap in try/catch, never throw to caller

Export notifyNewAssessment(payload) that fires both via Promise.allSettled

TASK 3 — Update /src/lib/actions.ts
Create/update saveLeadCapture server action that:
- Accepts: email?, newsletterOptIn?, score, scoreLabel, sector?, companySize?, worstCategory?
- Validates email format if provided
- Calls notifyNewAssessment with all fields + SAST timestamp
- Returns { success: boolean, error?: string }
- Never throws to the client

TASK 4 — Wire into page.tsx
In handleShowReport(), call saveLeadCapture with all available context including worstCategory.

TASK 5 — Create .env.local.example in project root with all required env vars documented.

Run npm run build after.
```

---

## MISSION 6 — Full UI modernisation (dispatch last, biggest visual change)

```
Modernise the entire visual design of this cybersecurity assessment app. Read AGENTS.md first — particularly the UI principles section.

This is a complete visual overhaul. The goal: make it look like a premium, dark-mode cybersecurity tool. Think dark terminal aesthetic meets modern SaaS. Not generic AI blue. Not light mode. Sharp, confident, professional.

LANDING PAGE
- Deep background: zinc-950 or slate-950
- Large, bold headline with subtle gradient or glow on "Clarity"
- Tagline: "Think Like a Hacker, Secure Like a Pro." — use a muted/secondary colour
- Start button: high contrast, not generic blue — consider a cyber-green (#22c55e) or accent white
- Sector/size selects: minimal, styled to match dark theme
- Subtle animated background element (scanline, grid, or particle — keep it tasteful, not distracting)
- Tanosec branding: logo prominent, copyright footer minimal

QUESTION CARDS
- Dark card background with subtle border
- Progress bar: thin, accent coloured, smooth animation
- Category label shown above question (e.g. "Network Security — Question 3 of 4")
- Answer options as full-width clickable cards, not radio buttons — highlight on hover, bold highlight on selected
- Smooth slide transition between questions (not jarring)
- Question counter: "Question 8 of 25" — subtle, top right

EMAIL CAPTURE
- Feels intentional, not like a popup gate
- Clear value prop copy above the form
- Email input: dark-styled, matching the card aesthetic
- POPIA consent: small, muted, link to privacy policy
- "Continue without email" is clearly available but visually secondary

LOADING
- Centered, minimal
- Rotating text messages (already implemented) with a subtle pulse or fade
- A Tanosec/security themed icon or animation — not a generic spinner

RESULTS PAGE
- Score circle or large number — prominent, colour-coded by band
- Score label badge below with band description text
- Category breakdown as a visual bar chart or card grid — not a list of text
- AI Risks section: each risk as a distinct card with a warning icon
- AI Strengths section: each strength with a checkmark/shield icon, green accent
- Recommendations: cards with priority badge (high=red, medium=amber, low=green), numbered, clear action text
- Dynamic CTA card at bottom: high contrast, the worst category name in accent colour
- "Book a Free Consultation" button: prominent, links to https://calendly.com/tanosec (use whatever Calendly link exists in the current code)
- "Start Over" button: secondary, minimal

GENERAL
- Font: keep existing or use Inter — clean, readable
- Icons: lucide-react (already installed)
- Mobile-first: every element must work on 375px width
- Smooth page-level transitions between assessment steps
- No light mode — this is a dark-first product

After completing the visual overhaul, run npm run build and verify no errors. Use the built-in Antigravity browser to visually verify the result on both desktop and mobile viewport sizes. Take screenshots as artifacts for review.
```

---

## After all missions — final checklist

Run this as a final cleanup dispatch:

```
Final pre-launch audit for this Next.js app. Read AGENTS.md.

1. Run npm run build — fix every error and warning
2. Search for console.log statements — remove any that expose sensitive data (emails, API responses)
3. Verify .env.local is in .gitignore
4. Verify .env.local.example exists with all required vars documented
5. Check that no API keys are hardcoded anywhere in the source
6. Run a search for "todo", "fixme", "hack", "temp" comments — report any found
7. Verify the Netlify build command and publish directory in netlify.toml match the Next.js output
8. Generate a final report artifact: what was changed, what files exist, what env vars are needed for production
```

---

## Manager View tip

Missions 1 + 2 can run in parallel (different files).  
Missions 3 + 4 can run in parallel once 1 + 2 are done.  
Mission 5 runs after 4 (depends on state variables from Mission 4).  
Mission 6 runs last — it's purely visual and touches everything.
