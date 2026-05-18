'use server';

/**
 * @fileOverview Generates personalized cybersecurity recommendations based on assessment responses.
 *
 * - generateSecurityRecommendations - A function that generates security recommendations.
 * - GenerateSecurityRecommendationsInput - The input type for the generateSecurityRecommendations function.
 * - GenerateSecurityRecommendationsOutput - The return type for the generateSecurityRecommendations function.
 */

import {z} from 'genkit';
import {generateGeminiResponse} from '@/ai/gemini';

const GenerateSecurityRecommendationsInputSchema = z.object({
  assessmentResponses: z
    .record(z.string(), z.string())
    .describe('A record of assessment responses, where the key is the question ID and the value is the response.'),
  overallScorePercent: z.number().optional().describe('The calculated overall score as a percentage (0-100).'),
  categoryScores: z.record(
    z.string(),
    z.object({
      score: z.number(),
      maxScore: z.number(),
      percentage: z.number(),
    })
  ).optional().describe('Per-category score breakdown.'),
  sector: z.string().optional().describe('The business sector if provided.'),
  companySize: z.string().optional().describe('The company size band if provided.'),
});

export type GenerateSecurityRecommendationsInput = z.infer<
  typeof GenerateSecurityRecommendationsInputSchema
>;

const RecommendationSchema = z.object({
  recommendation: z.string().describe('A specific, actionable recommendation.'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .describe('The priority of the recommendation.'),
});

const GenerateSecurityRecommendationsOutputSchema = z.object({
  risks: z.array(z.string()).describe('A list of the top identified risks.'),
  strengths: z
    .array(z.string())
    .describe('A list of the top identified strengths.'),
  recommendations: z
    .array(RecommendationSchema)
    .describe('A list of tailored recommendations.'),
});

export type GenerateSecurityRecommendationsOutput = z.infer<
  typeof GenerateSecurityRecommendationsOutputSchema
>;

const MAX_ASSESSMENT_RESPONSES = 200;
const MAX_PROMPT_CHARS = 12000;

export async function generateSecurityRecommendations(
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> {
  return generateSecurityRecommendationsFlow(input);
}

const generateSecurityRecommendationsFlow = async (
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> => {
  const responseCount = Object.keys(input.assessmentResponses).length;
  console.log('Starting security recommendations flow with', responseCount, 'responses');
  if (responseCount > MAX_ASSESSMENT_RESPONSES) {
    throw new Error('Too many assessment responses submitted.');
  }
  
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

  const categoryBreakdown = Object.entries(input.categoryScores || {})
    .map(([cat, scores]) => `  ${cat}: ${scores.score}/${scores.maxScore} (${Math.round(scores.percentage)}%)`)
    .join('\n');

  const userPrompt = `CYBERSECURITY ASSESSMENT RESULTS

${Object.entries(input.assessmentResponses)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Analyse these responses and return your assessment as a JSON object. Be specific to this business's actual answers. Make every recommendation actionable and South Africa-relevant.`;

  if (userPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error('Assessment responses are too large to process safely.');
  }

  console.log('Calling Gemini API...');
  
  const response = await generateGeminiResponse(systemPrompt, userPrompt, 0.7, 2000);

  if (!response.success) {
    console.error('Gemini API failed:', response.error);
    throw new Error(`Gemini API error: ${response.error}`);
  }

  console.log('Gemini API succeeded, parsing response...');
  
  try {
    // Try to extract JSON from the response (in case there's extra text)
    let jsonContent = response.content.trim();
    
    // Find JSON object in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    const parsedResponse = JSON.parse(jsonContent);
    console.log('Response parsed successfully, validating schema...');
    
    const validatedResponse = GenerateSecurityRecommendationsOutputSchema.parse(parsedResponse);
    console.log('Response validated successfully');
    
    return validatedResponse;
  } catch (error) {
    console.error('Failed to parse or validate Gemini response:', error);
    
    // Return a fallback response if parsing fails
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
  }
};
