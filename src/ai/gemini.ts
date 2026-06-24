'use server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function callGemini(systemPrompt: string, userPrompt: string): Promise<{ content: string; success: boolean; error?: string }> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return { content: '', success: false, error: 'GOOGLE_GENERATIVE_AI_API_KEY not set in environment' };
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000, responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(userPrompt);
      
      // Check for safety filter blocks
      const promptFeedback = result.response.promptFeedback;
      if (promptFeedback?.blockReason) {
        return { content: '', success: false, error: 'Content blocked by safety filter: ' + promptFeedback.blockReason };
      }
      
      return { content: result.response.text(), success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isTransient = msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable');
      if (attempt === 1 && isTransient) {
        console.warn('[Clarity] Gemini 503 — retrying in 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      console.error('[Clarity] Gemini failed:', msg);
      return { content: '', success: false, error: msg };
    }
  }
  return { content: '', success: false, error: 'Unknown fallback failure' };
}
