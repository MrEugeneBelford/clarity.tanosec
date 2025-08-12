'use server';

/**
 * @fileOverview Generates personalized cybersecurity recommendations based on assessment responses.
 *
 * - generateSecurityRecommendations - A function that generates security recommendations.
 * - GenerateSecurityRecommendationsInput - The input type for the generateSecurityRecommendations function.
 * - GenerateSecurityRecommendationsOutput - The return type for the generateSecurityRecommendations function.
 */

import {z} from 'genkit';
import {generateOpenRouterResponse, OpenRouterMessage} from '@/ai/openrouter';

const GenerateSecurityRecommendationsInputSchema = z.object({
  assessmentResponses: z
    .record(z.string(), z.string())
    .describe('A record of assessment responses, where the key is the question ID and the value is the response.'),
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

export async function generateSecurityRecommendations(
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> {
  return generateSecurityRecommendationsFlow(input);
}

const generateSecurityRecommendationsFlow = async (
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> => {
  const systemPrompt = `You are an expert cybersecurity advisor for small and medium size enterprises (SMEs).
Based on the SME's responses to a cybersecurity self-assessment, you will provide personalized and actionable recommendations.

Your response should be simplified for smaller, non-enterprise companies.

Based on this user's cybersecurity assessment, identify their top risks and strengths. Then, recommend tailored actions for the business to take. Prioritize recommendations into high, medium, and low priority action items.

Return a JSON object with the following schema:
{
  "risks": ["risk1", "risk2", "risk3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendations": [
    {
      "recommendation": "specific actionable recommendation",
      "priority": "high|medium|low"
    }
  ]
}`;

  const userPrompt = `Assessment Responses:
${Object.entries(input.assessmentResponses)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Please analyze these responses and provide cybersecurity recommendations.`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await generateOpenRouterResponse(messages, 0.7, 2000);

  if (!response.success) {
    throw new Error(`OpenRouter API error: ${response.error}`);
  }

  try {
    const parsedResponse = JSON.parse(response.content);
    return GenerateSecurityRecommendationsOutputSchema.parse(parsedResponse);
  } catch (error) {
    console.error('Failed to parse OpenRouter response:', error);
    throw new Error('Failed to parse AI response');
  }
};
