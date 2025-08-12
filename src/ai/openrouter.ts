import {OpenRouter} from 'openrouter-client';

// Initialize OpenRouter client
const openrouter = new OpenRouter(process.env.OPENROUTER_API_KEY!);

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateOpenRouterResponse(
  messages: OpenRouterMessage[],
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<OpenRouterResponse> {
  try {
    const response = await openrouter.chat(messages, {
      model: 'gpt-4o-mini',
      temperature,
      max_tokens: maxTokens,
    });
    
    if (response.success) {
      const content = response.data.choices[0]?.message?.content || '';
      return {
        content,
        success: true
      };
    } else {
      return {
        content: '',
        success: false,
        error: response.errorMessage || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
