# Clarity — Mission: Switch AI from Groq to Gemini 2.5 Flash

> Run this BEFORE all other missions. It's the most critical fix.
> The app has been broken from day one because GROQ_API_KEY was never configured.
> We're switching to Gemini 2.5 Flash — already paid for, smarter, faster to fix.

---

## STEP 1 — Netlify environment variables (do this manually first)

Log into Netlify → Site settings → Environment variables.

**Remove:** GROQ_API_KEY (no longer needed)

**Add:**
```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

Your Gemini API key is the same one used in OpenClaw — grab it from there.
After saving, trigger a manual redeploy in Netlify → Deploys → Trigger deploy.

Also create /src/.env.local in the project root locally with:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

---

## STEP 2 — Antigravity mission prompt (paste this)

```
Switch the AI provider in this Next.js cybersecurity assessment app from Groq to Google Gemini 2.5 Flash. Read AGENTS.md for full project context.

The current setup uses a custom Groq fetch wrapper in /src/ai/groq.ts. Replace the entire AI layer with the official Google Generative AI SDK.

TASK 1 — Install the SDK
Run: npm install @google/generative-ai

TASK 2 — Create /src/ai/gemini.ts
Create a clean Gemini client module:

'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export interface GeminiResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateGeminiResponse(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.error('[Clarity] GOOGLE_GENERATIVE_AI_API_KEY is not set');
    return { content: '', success: false, error: 'Gemini API key is not configured' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    });

    console.log('[Clarity] Calling Gemini 2.5 Flash...');
    const result = await model.generateContent(userPrompt);
    const content = result.response.text();
    console.log('[Clarity] Gemini response received');

    return { content, success: true };
  } catch (error) {
    console.error('[Clarity] Gemini API call failed:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Gemini error',
    };
  }
}

TASK 3 — Update /src/ai/flows/generate-security-recommendations.ts

Replace the Groq import with the Gemini import:
- Remove: import { generateGroqResponse, GroqMessage } from '@/ai/groq';
- Add: import { generateGeminiResponse } from '@/ai/gemini';

Replace the systemPrompt with:

const systemPrompt = `You are a senior cybersecurity advisor specialising in South African small and medium enterprises (SMEs). You work for Tanosec Cybersecurity, a Bloemfontein-based firm whose tagline is "Think Like a Hacker, Secure Like a Pro."

Your role is to analyse a business's cybersecurity self-assessment and deliver sharp, practical, SA-specific recommendations. You understand the local threat landscape: SIM swap fraud, SASSA and SAPO phishing campaigns, load shedding impacts on UPS and backup reliability, POPIA compliance obligations under the Information Regulator, and the real budget constraints of Free State and broader SA SMEs.

Your tone is direct, expert, and no-nonsense — like a trusted advisor who knows the local context, not a corporate drone reading from a global playbook.

You must respond with ONLY a valid JSON object in this exact structure:
{
  "risks": ["risk1", "risk2", "risk3"],
  "strengths": ["strength1", "strength2"],
  "recommendations": [
    {
      "recommendation": "specific actionable recommendation",
      "priority": "high"
    }
  ]
}

Rules:
- risks: 3-5 items. Specific to their actual weak answers. No generic boilerplate.
- strengths: 2-4 genuine acknowledgments of what they are doing well.
- recommendations: 5-8 items. Mix of high/medium/low priority. Each must be a concrete next action. Reference POPIA, SA context, or locally available solutions where relevant.
- priority must be exactly "high", "medium", or "low".`;

Replace the userPrompt construction with:

const userPrompt = `CYBERSECURITY ASSESSMENT RESULTS

${Object.entries(input.assessmentResponses)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Analyse these responses and return your assessment as a JSON object. Be specific to this business's actual answers. Make every recommendation actionable and South Africa-relevant.`;

Replace the Groq call:
- Remove: const response = await generateGroqResponse(messages, 0.7, 2000);
- Add: const response = await generateGeminiResponse(systemPrompt, userPrompt, 0.7, 2000);

Note: because we set responseMimeType to 'application/json' in the Gemini config, the response will already be clean JSON — the regex JSON extraction fallback is less critical but keep it for safety.

Replace the fallback with meaningful content (not error strings):

return {
  risks: [
    "No formal incident response plan — your business won't know what to do when a breach occurs",
    "Employee security awareness is likely your largest unmanaged risk right now",
    "Unpatched systems and reused passwords remain the top entry point for attackers targeting SA SMEs",
  ],
  strengths: [
    "You've completed this assessment — most South African SMEs never take this step",
    "Awareness of your security posture is the foundation of meaningful improvement",
  ],
  recommendations: [
    {
      recommendation: "Enable Multi-Factor Authentication on all email accounts immediately — this single step blocks over 90% of credential-based attacks targeting SA businesses.",
      priority: "high",
    },
    {
      recommendation: "Ensure business data is backed up daily to an offsite or cloud location. Test restoring a backup quarterly — an untested backup is not a backup.",
      priority: "high",
    },
    {
      recommendation: "Run a staff awareness session covering phishing, SIM swap fraud, and SARS/SAPO impersonation scams — the most common vectors targeting South African SMEs right now.",
      priority: "high",
    },
    {
      recommendation: "Appoint a POPIA Information Officer and document what personal data your business holds, why you hold it, and who has access.",
      priority: "medium",
    },
    {
      recommendation: "Book a free consultation with Tanosec to get a prioritised remediation roadmap specific to your business size and sector.",
      priority: "medium",
    },
  ],
};

TASK 4 — Delete the old Groq file
Delete /src/ai/groq.ts — it is no longer used.

TASK 5 — Update AGENTS.md
In the Key files table, replace the groq.ts row with:
| `/src/ai/gemini.ts` | Gemini 2.5 Flash client config |

Update the "Critical rules" section model line to:
"The AI model is Gemini 2.5 Flash via Google Generative AI SDK. Do not revert to Groq or any OpenRouter model."

TASK 6 — Run npm run build
Fix every TypeScript error before finishing. Confirm the build passes cleanly.

Generate a summary of all changes made.
```

---

## Why Gemini 2.5 Flash over Groq

| | Groq (llama-3.1-8b-instant) | Gemini 2.5 Flash |
|---|---|---|
| Cost | Free (rate limited) | Already paying |
| Model size | 8B params — small | Full multimodal model |
| Quality | Generic, thin reasoning | Deep, nuanced recommendations |
| JSON mode | Manual prompt instruction | Native responseMimeType support |
| Context window | 128K | 1M tokens |
| SA context | None trained in | Better world knowledge |
| Speed | Very fast | Fast enough (~3-5s) |
| Single provider | No (separate from OpenClaw) | Yes (same key as OpenClaw) |

One API key. One bill. Better output. Already paid for. No brainer.
