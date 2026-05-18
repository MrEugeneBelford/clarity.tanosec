# Clarity — Mission Pack 2
> Run these after the Gemini fix is deployed and working.
> Four focused missions. Run Mission A + Mission B in parallel, then C, then D.

---

## MISSION A — Soft gate: email required for full results

```
Implement a soft gate on the results page in this Next.js cybersecurity assessment app.
Read AGENTS.md for full project context.

CURRENT BEHAVIOUR:
- User completes assessment
- Email capture is optional
- Full results shown regardless

NEW BEHAVIOUR:
- User completes assessment
- A "preview" results screen shows: overall score percentage, risk band label and description, 
  and a single teaser line e.g. "We identified 4 key risks in your assessment."
- Email is REQUIRED to unlock the full breakdown (category scores, AI risks, AI strengths, 
  all recommendations)
- If the user already provided an email earlier in the flow, skip the gate entirely and 
  go straight to full results
- "Continue without email" is REMOVED — email is now required for full results
- The gate screen must not feel like a wall — frame it as "Enter your email to unlock 
  your full security report"

IMPLEMENTATION:

1. In /src/app/page.tsx add a new state: isPreviewResults (boolean, default false)

2. After the AI recommendations load, set isPreviewResults = true instead of isResults = true

3. Add a new preview results JSX section (isPreviewResults) that shows:
   - The Tanosec logo / branding at top
   - Large score number and risk band badge (same styling as full results)
   - The band description text (e.g. "Significant gaps exist. Several urgent actions needed.")
   - A locked section below with a blurred/dimmed placeholder representing the full report,
     with a lock icon (Lock from lucide-react) overlaid
   - Text: "Your full security report includes:" followed by these bullet points:
     • Category-by-category breakdown across 8 domains
     • Your top risks identified by AI
     • Your security strengths
     • 5–8 prioritised recommendations tailored to your business
     • A personalised consultation offer
   - Email input field with label "Unlock your full report"
   - Placeholder: "your@email.com"
   - Submit button: "Send My Full Report" (primary, full width)
   - Below the button, small muted text: 
     "By submitting, you consent to Tanosec Cybersecurity contacting you about your 
     security posture in accordance with our Privacy Policy (link to 
     https://tanosec.co.za/privacy-policy-2/). POPIA compliant. No spam, ever."
   - Below that in even smaller text: "support@tanosec.co.za · +27 621 234 244"

4. On submit:
   - Validate email format (basic regex, client side)
   - Call saveLeadCapture with email, score, scoreLabel, sector, companySize, worstCategory
   - Set isPreviewResults = false, isResults = true (show full results)
   - The email value is now available for the full results page CTA personalisation

5. On the full results page, update the dynamic CTA card contact details:
   - Phone: +27 621 234 244
   - Email: support@tanosec.co.za
   - These should appear as clickable links: tel: and mailto:

6. Search the entire codebase for any other hardcoded phone numbers or contact emails 
   and replace with +27 621 234 244 and support@tanosec.co.za respectively.

7. Run npm run build — fix all TypeScript errors before finishing.

Show me the complete preview results JSX and confirm the build passes.
```

---

## MISSION B — Add AI governance questions + rebalance categories

```
Add two new AI governance questions to the assessment in this Next.js app.
Read AGENTS.md for full project context.

TASK 1 — Add new category to /src/lib/questions.ts

Add 'ai_governance' to the questionCategories object:
  ai_governance: { name: "AI Governance & Risk", weight: 0.05 }

Reduce 'compliance' weight from 0.10 to 0.05 to keep total at 1.0

Verify all category weights sum to exactly 1.0:
  network: 0.15
  access: 0.20
  data: 0.15
  endpoint: 0.15
  training: 0.15
  incident: 0.10
  compliance: 0.05
  ai_governance: 0.05
  Total: 1.00 ✓

TASK 2 — Add these two questions to the questions array in /src/lib/questions.ts

Question 1:
{
  id: "q26",
  category: "ai_governance",
  text: "Do staff use AI tools (such as ChatGPT, Microsoft Copilot, or Gemini) for work tasks, and does your business have a policy governing what data may be shared with them?",
  options: [
    { 
      text: "Yes, we use AI tools and have a clear written policy on data sharing", 
      score: 10 
    },
    { 
      text: "Staff use AI tools informally but there is no formal policy", 
      score: 3 
    },
    { 
      text: "We do not use AI tools in our business", 
      score: 7 
    },
    { 
      text: "I am not sure whether staff are using AI tools", 
      score: 0 
    },
  ],
}

Question 2:
{
  id: "q27",
  category: "ai_governance",
  text: "Are AI-generated outputs (reports, advice, emails, documents) reviewed by a qualified person before being used in client-facing work or business decisions?",
  options: [
    { 
      text: "Yes, all AI outputs are reviewed before use", 
      score: 10 
    },
    { 
      text: "Sometimes, but not consistently", 
      score: 5 
    },
    { 
      text: "No, AI outputs are used directly without review", 
      score: 0 
    },
    { 
      text: "We do not use AI tools", 
      score: 8 
    },
  ],
}

TASK 3 — Update the AI system prompt in /src/ai/flows/generate-security-recommendations.ts

Add this paragraph to the systemPrompt after the existing threat landscape paragraph:

"You are also aware of the growing AI governance risk in SA SMEs: staff using public AI tools 
(ChatGPT, Copilot, Gemini) to process client data without authorisation, violating POPIA; 
AI-generated outputs being used in professional or legal contexts without human review; 
and businesses having no AI usage policy whatsoever. Where the assessment reveals AI 
governance gaps, flag these explicitly."

TASK 4 — Run npm run build and fix any TypeScript errors.

Confirm the total question count is now 27 and all category weights sum to 1.0.
```

---

## MISSION C — Industry-specific question variants

```
Add industry-adaptive answer options to 6 key questions in this Next.js assessment app.
Read AGENTS.md for full project context.

The sector value is already stored in state from the landing page sector select.
Pass the sector value into the question rendering logic so answer options can vary by industry.

APPROACH:
- Do not change question IDs or question text
- For 6 specific questions, provide industry-specific answer option sets
- If no sector is selected, or the sector is "Other", use the default options
- The score values for equivalent answers must remain consistent across variants

TASK 1 — Update the Question type in /src/lib/questions.ts

Extend the options type to support industry variants:

type AnswerOption = {
  text: string;
  score: number;
};

type Question = {
  id: string;
  category: keyof typeof questionCategories;
  text: string;
  options: AnswerOption[];
  industryOptions?: Partial<Record<string, AnswerOption[]>>;
};

TASK 2 — Add industryOptions to these 6 questions:

Q on data backup (whichever question covers backups):
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, client files and matter data backed up daily with offsite copy", score: 10 },
    { text: "Backups run but client files are not specifically included", score: 4 },
    { text: "No reliable backup system in place", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, patient records backed up daily and encrypted, tested quarterly", score: 10 },
    { text: "Backups exist but patient records are not separately verified", score: 4 },
    { text: "No reliable backup for patient data", score: 0 },
  ],
  "Finance & Accounting": [
    { text: "Yes, financial data and client records backed up daily with offsite copy", score: 10 },
    { text: "Backups run but financial records not specifically verified", score: 4 },
    { text: "No reliable financial data backup", score: 0 },
  ],
  "Retail & E-commerce": [
    { text: "Yes, transaction data and inventory backed up daily", score: 10 },
    { text: "Backups exist but POS and transaction data not specifically covered", score: 4 },
    { text: "No reliable backup in place", score: 0 },
  ],
}

Q on staff security training:
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, including training on client confidentiality, phishing, and matter data handling", score: 10 },
    { text: "Basic security awareness only, no legal-specific scenarios", score: 5 },
    { text: "No formal security training", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, including patient data handling, POPIA, and medical record security", score: 10 },
    { text: "Basic awareness only, no healthcare-specific scenarios", score: 5 },
    { text: "No formal security training", score: 0 },
  ],
  "Finance & Accounting": [
    { text: "Yes, including financial fraud, social engineering, and client data protection", score: 10 },
    { text: "Basic awareness only, no finance-specific scenarios", score: 5 },
    { text: "No formal security training", score: 0 },
  ],
}

Q on POPIA / compliance (the Information Officer question):
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, we have a designated Information Officer and a compliant PAIA manual", score: 10 },
    { text: "Information Officer appointed but PAIA manual not current", score: 5 },
    { text: "No Information Officer appointed", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, Information Officer appointed and patient consent processes are documented", score: 10 },
    { text: "Informal compliance only, not fully documented", score: 4 },
    { text: "No formal POPIA compliance measures in place", score: 0 },
  ],
  "Finance & Accounting": [
    { text: "Yes, Information Officer appointed and client data retention policies documented", score: 10 },
    { text: "Some compliance measures but not formalised", score: 4 },
    { text: "No formal POPIA compliance in place", score: 0 },
  ],
}

Q on Microsoft 365 / Google Workspace security:
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, MFA enabled, activity reviewed, and legal documents access-controlled by matter", score: 10 },
    { text: "MFA enabled but document access not matter-specific", score: 5 },
    { text: "No specific security measures on cloud accounts", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, MFA enabled, patient data not stored in general cloud folders", score: 10 },
    { text: "MFA enabled but patient data storage not specifically controlled", score: 5 },
    { text: "No specific cloud account security", score: 0 },
  ],
}

Q on third-party vendor access:
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, IT contractors sign NDAs and access is matter-specific and time-limited", score: 10 },
    { text: "Vendors have access but no formal NDA or access controls", score: 3 },
    { text: "Vendor access is not tracked or controlled", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, vendors cannot access patient records and access is logged", score: 10 },
    { text: "Vendor access exists but patient data segregation not enforced", score: 3 },
    { text: "Vendor access is not controlled or monitored", score: 0 },
  ],
  "Finance & Accounting": [
    { text: "Yes, vendors sign NDAs, access is time-limited and does not include client financial data", score: 10 },
    { text: "Access exists but financial data is not specifically excluded", score: 3 },
    { text: "No vendor access controls in place", score: 0 },
  ],
}

Q on AI governance (q26 — the new AI policy question):
industryOptions: {
  "Legal & Compliance": [
    { text: "Yes, we have an AI policy that explicitly prohibits inputting client or privileged data into public AI tools", score: 10 },
    { text: "Staff use AI tools but there is no policy on client or privileged data", score: 2 },
    { text: "We do not use AI tools", score: 7 },
    { text: "I am not sure whether staff use AI tools", score: 0 },
  ],
  "Healthcare & Medical": [
    { text: "Yes, we have an AI policy that explicitly prohibits inputting patient data into public AI tools", score: 10 },
    { text: "Staff use AI tools but there is no policy on patient data", score: 2 },
    { text: "We do not use AI tools", score: 7 },
    { text: "I am not sure whether staff use AI tools", score: 0 },
  ],
  "Finance & Accounting": [
    { text: "Yes, we have an AI policy covering client financial data and regulatory requirements", score: 10 },
    { text: "Staff use AI tools but no policy covers client financial data", score: 2 },
    { text: "We do not use AI tools", score: 7 },
    { text: "I am not sure whether staff use AI tools", score: 0 },
  ],
}

TASK 3 — Update question rendering in /src/app/page.tsx

When rendering the current question's options, use this logic:

const currentOptions = (() => {
  const q = questions[currentQuestionIndex];
  if (sector && q.industryOptions && q.industryOptions[sector]) {
    return q.industryOptions[sector];
  }
  return q.options;
})();

Use currentOptions instead of questions[currentQuestionIndex].options when rendering answer buttons.

TASK 4 — Update the AI prompt to include sector context

In /src/ai/flows/generate-security-recommendations.ts, update the userPrompt to include sector if available:

const sectorLine = sector ? `Industry Sector: ${sector}` : '';
const userPrompt = `CYBERSECURITY ASSESSMENT RESULTS
${sectorLine}

${Object.entries(input.assessmentResponses)
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join('\n\n')}

Analyse these and return your JSON assessment. Tailor risks and recommendations 
to this specific industry where relevant.`;

This requires passing sector through the input type — add sector?: string to 
GenerateSecurityRecommendationsInput and pass it from the getRecommendations 
call in actions.ts.

TASK 5 — Run npm run build and fix all TypeScript errors.

Confirm industry variants render correctly for Legal & Compliance sector in dev server.
```

---

## MISSION D — Contact details sweep

```
Update all contact details throughout this Next.js project.
Read AGENTS.md for full context.

Search the entire codebase (all .ts, .tsx, .js files and any .md files in /src or /public) for:
- Any phone number (patterns like 062, +27, 0621, tel:)
- Any email address containing "tanosec"

Replace ALL occurrences with:
- Phone: +27 621 234 244 (display format) and tel:+27621234244 (href format)
- Support email: support@tanosec.co.za (display and mailto:support@tanosec.co.za for hrefs)
- Notification email stays as: clarity@tanosec.co.za (this is internal, do not change)
- From email stays as: clarity@tanosec.co.za (internal, do not change)

Specifically update:
1. The preview results screen (Mission A) contact line
2. The full results page dynamic CTA card — phone and email as clickable links
3. The footer of the landing page if any contact details appear there
4. AGENTS.md — update the phone number reference to +27 621 234 244

Also add these as clickable links on the full results CTA card:
<a href="tel:+27621234244">+27 621 234 244</a>
<a href="mailto:support@tanosec.co.za">support@tanosec.co.za</a>

Style both links in the accent/primary colour to stand out.

Run npm run build after. List every file changed and every instance replaced.
```

---

## Execution order

| Mission | What | Parallel? |
|---------|------|-----------|
| A | Soft email gate | Yes — with B |
| B | AI governance questions | Yes — with A |
| C | Industry-specific variants | After A + B done |
| D | Contact details sweep | After C done |

## After all missions — push and deploy

```bash
git add -A
git status   # confirm .env.local is NOT listed
git commit -m "feat: soft email gate, AI governance questions, industry variants, contact details"
git push
```

Then verify on clarity.tanosec.co.za:
1. Score and risk band show without email
2. Full report requires email entry
3. AI governance questions appear in assessment
4. Legal sector shows legal-specific answer options
5. Phone +27 621 234 244 and support@tanosec.co.za appear correctly on results CTA
