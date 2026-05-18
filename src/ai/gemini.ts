'use server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function callGemini(systemPrompt: string, userPrompt: string): Promise<{ content: string; success: boolean; error?: string }> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return { content: '', success: false, error: 'GOOGLE_GENERATIVE_AI_API_KEY not set' };
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000, responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(userPrompt);
    return { content: result.response.text(), success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Clarity] Gemini failed:', msg);
    return { content: '', success: false, error: msg };
  }
}
