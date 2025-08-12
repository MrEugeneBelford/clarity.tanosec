import {OpenRouter} from 'openrouter-client';

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
  // Check if API key is available
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return {
      content: '',
      success: false,
      error: 'OpenRouter API key is not configured'
    };
  }

  try {
    // Initialize OpenRouter client with API key
    const openrouter = new OpenRouter(apiKey);
    
    console.log('Sending request to OpenRouter with messages:', messages.length);
    console.log('Using model: google/gemma-3n-e2b-it:free');
    
    const response = await openrouter.chat(messages, {
      model: 'google/gemma-3n-e2b-it:free', // Use the Google Gemma model
      temperature,
      max_tokens: maxTokens,
    });
    
    console.log('OpenRouter response received:', response.success);
    
    if (response.success) {
      const content = response.data.choices[0]?.message?.content || '';
      return {
        content,
        success: true
      };
    } else {
      // Handle different error response types
      const errorMessage = 'errorMessage' in response ? response.errorMessage : 
                          'error' in response ? String(response.error) : 
                          'Unknown OpenRouter API error';
      console.error('OpenRouter API error:', errorMessage);
      return {
        content: '',
        success: false,
        error: errorMessage
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
