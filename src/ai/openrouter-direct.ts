export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateOpenRouterResponseDirect(
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
    console.log('Sending direct request to OpenRouter API with google/gemma-3n-e2b-it:free...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.netlify.app',
        'X-Title': 'Clarity by Tanosec'
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e2b-it:free',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', response.status, errorText);
      return {
        content: '',
        success: false,
        error: `OpenRouter API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    console.log('OpenRouter API response received successfully');
    
    const content = data.choices?.[0]?.message?.content || '';
    return {
      content,
      success: true
    };
  } catch (error) {
    console.error('OpenRouter direct API call failed:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
