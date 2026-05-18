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
