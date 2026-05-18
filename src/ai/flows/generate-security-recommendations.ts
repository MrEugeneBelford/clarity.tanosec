'use server';
import { z } from 'zod';
import { callGemini } from '@/ai/gemini';

const RecommendationSchema = z.object({
  recommendation: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

const OutputSchema = z.object({
  risks: z.array(z.string()),
  strengths: z.array(z.string()),
  recommendations: z.array(RecommendationSchema),
});

export type GenerateSecurityRecommendationsInput = {
  assessmentResponses: Record<string, string>;
  overallScorePercent?: number;
  categoryScores?: Record<string, { score: number; maxScore: number; percentage: number }>;
  sector?: string;
  companySize?: string;
};

export type GenerateSecurityRecommendationsOutput = z.infer<typeof OutputSchema>;

const FALLBACK: GenerateSecurityRecommendationsOutput = {
  risks: [
    "No formal incident response plan — your business won't know what to do when a breach occurs",
    "Employee security awareness is likely your largest unmanaged risk right now",
    "Unpatched systems and reused passwords are the top entry point for attackers targeting SA SMEs",
  ],
  strengths: [
    "You completed this assessment — most South African SMEs never take this step",
    "Awareness of your security posture is the foundation of meaningful improvement",
  ],
  recommendations: [
    { recommendation: "Enable Multi-Factor Authentication on all email accounts immediately — this blocks over 90% of credential-based attacks targeting SA businesses.", priority: "high" },
    { recommendation: "Ensure business data is backed up daily to an offsite or cloud location and test restoring a backup quarterly.", priority: "high" },
    { recommendation: "Run a staff awareness session on SIM swap fraud, fake SARS emails, and CEO impersonation scams — the top vectors hitting SA SMEs right now.", priority: "high" },
    { recommendation: "Appoint a POPIA Information Officer and document what personal data your business holds and who can access it.", priority: "medium" },
    { recommendation: "Book a free consultation with Tanosec for a prioritised remediation roadmap specific to your business.", priority: "medium" },
  ],
};

const systemPrompt = `You are a senior cybersecurity advisor specialising in South African SMEs. You work for Tanosec Cybersecurity (Bloemfontein). Tagline: "Think Like a Hacker, Secure Like a Pro."

Your role is to analyse a business's cybersecurity self-assessment and deliver sharp, practical, SA-specific recommendations. You understand the local threat landscape: SIM swap fraud, SASSA and SAPO phishing campaigns, load shedding impacts on UPS and backup reliability, POPIA compliance obligations, and the budget constraints of Free State and broader SA SMEs.

Your tone is direct, expert, and no-nonsense.

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
- risks: 3-5 items. Specific to their actual weak answers.
- strengths: 2-4 genuine acknowledgments of what they are doing well.
- recommendations: 5-8 items. Mix of high/medium/low priority. Each must be a concrete next action. Reference POPIA, SA context, or locally available solutions where relevant.
- priority must be exactly "high", "medium", or "low".`;

export async function generateSecurityRecommendations(
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> {
  const responseCount = Object.keys(input.assessmentResponses).length;
  console.log('Starting recommendations flow with', responseCount, 'responses');
  
  if (responseCount > 200) {
    throw new Error('Too many assessment responses submitted.');
  }

  const categoryBreakdown = Object.entries(input.categoryScores || {})
    .map(([cat, scores]) => `  ${cat}: ${scores.score}/${scores.maxScore} (${Math.round(scores.percentage)}%)`)
    .join('\n');

  const detailedResponses = Object.entries(input.assessmentResponses)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n');

  const weakestCategory = Object.entries(input.categoryScores || {})
    .filter(([, s]) => s.maxScore > 0)
    .sort(([, a], [, b]) => a.percentage - b.percentage)[0]?.[0] || 'Unknown';

  const userPrompt = `
BUSINESS CONTEXT:
Sector: ${input.sector || 'Not specified'}
Size: ${input.companySize || 'Not specified'}

ASSESSMENT METRICS:
Overall Score: ${input.overallScorePercent ? Math.round(input.overallScorePercent) : 0}%
Weakest Category: ${weakestCategory}

CATEGORY SCORES:
${categoryBreakdown}

DETAILED RESPONSES:
${detailedResponses}

Generate the JSON report now.`;

  try {
    const { content, success, error } = await callGemini(systemPrompt, userPrompt);
    
    if (!success) {
      console.error('[Clarity] AI call failed:', error);
      return FALLBACK;
    }

    try {
      const parsed = JSON.parse(content);
      const validated = OutputSchema.parse(parsed);
      return validated;
    } catch (parseError) {
      console.error('[Clarity] Schema validation failed. Returning fallback.', parseError);
      return FALLBACK;
    }
  } catch (err) {
    console.error('[Clarity] Unexpected error in flow:', err);
    return FALLBACK;
  }
}
