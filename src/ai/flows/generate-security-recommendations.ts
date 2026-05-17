'use server';

/**
 * @fileOverview Generates personalized cybersecurity recommendations based on assessment responses.
 *
 * - generateSecurityRecommendations - A function that generates security recommendations.
 * - GenerateSecurityRecommendationsInput - The input type for the generateSecurityRecommendations function.
 * - GenerateSecurityRecommendationsOutput - The return type for the generateSecurityRecommendations function.
 */

import {z} from 'genkit';
import {generateGroqResponse, GroqMessage} from '@/ai/groq';

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

Your role is to analyse a business's cybersecurity self-assessment results and deliver sharp, practical, South Africa-specific recommendations. You understand the local threat landscape: SIM swap fraud, SASSA/SAPO phishing campaigns, load shedding impacts on UPS and backup systems, POPIA compliance obligations, and the resource constraints of Free State SMEs.

Your tone is direct, knowledgeable, and no-nonsense — like a trusted expert, not a corporate drone. Avoid generic global cybersecurity advice. Make it real, make it local, make it actionable.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no text before or after:
{
  "risks": ["risk1", "risk2", "risk3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendations": [
    {
      "recommendation": "specific actionable recommendation",
      "priority": "high"
    }
  ]
}

Rules:
- risks: 3-5 items. Be specific. Reference the actual weak areas from the scores, not generic statements.
- strengths: 2-4 items. Acknowledge what they're doing well. Be genuine.
- recommendations: 5-8 items total, mix of high/medium/low priority. Each must be a concrete action, not a vague suggestion. Where relevant, mention POPIA, South African context, or practical cost-effective solutions available locally.
- priority must be exactly "high", "medium", or "low"`;

  const categoryBreakdown = Object.entries(input.categoryScores || {})
    .map(([cat, scores]) => `  ${cat}: ${scores.score}/${scores.maxScore} (${Math.round(scores.percentage)}%)`)
    .join('\n');

  const userPrompt = `BUSINESS ASSESSMENT SUMMARY
Overall Score: ${input.overallScorePercent?.toFixed(0) ?? 'Unknown'}%
${input.sector ? `Sector: ${input.sector}` : ''}
${input.companySize ? `Company size: ${input.companySize}` : ''}

CATEGORY SCORES:
${categoryBreakdown}

DETAILED RESPONSES:
${Object.entries(input.assessmentResponses)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Analyse the above and provide your cybersecurity assessment in the required JSON format. Focus your recommendations on the weakest categories and be specific to this business's actual answers.`;

  if (userPrompt.length > MAX_PROMPT_CHARS) {
    throw new Error('Assessment responses are too large to process safely.');
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  console.log('Calling Groq API...');
  
  const response = await generateGroqResponse(messages, 0.7, 2000);

  if (!response.success) {
    console.error('Groq API failed:', response.error);
    throw new Error(`Groq API error: ${response.error}`);
  }

  console.log('Groq API succeeded, parsing response...');
  
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
    console.error('Failed to parse or validate Groq response:', error);
    
    // Return a fallback response if parsing fails
    return {
      risks: ["Unable to parse AI response"],
      strengths: ["Assessment completed successfully"],
      recommendations: [
        {
          recommendation: "Please contact support for detailed recommendations",
          priority: "high" as const
        }
      ]
    };
  }
};
