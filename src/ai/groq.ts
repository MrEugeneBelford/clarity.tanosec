export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateGroqResponse(
  messages: GroqMessage[],
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<GroqResponse> {
  // Check if API key is available
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set');
    return {
      content: '',
      success: false,
      error: 'Groq API key is not configured'
    };
  }

  try {
    console.log('Sending request to Groq API with messages:', messages.length);
    console.log('Using model: llama-3.1-8b-instant');
    
    const boundedTemperature = Math.max(0, Math.min(1, temperature));
    const boundedMaxTokens = Math.max(1, Math.min(4000, maxTokens));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await (async () => {
      try {
        return await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: boundedTemperature,
            max_tokens: boundedMaxTokens
          })
        });
      } finally {
        clearTimeout(timeout);
      }
    })();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', response.status, errorText);
      console.error('Request details:', {
        model: 'llama-3.1-8b-instant',
        messageCount: messages.length,
        temperature: boundedTemperature,
        maxTokens: boundedMaxTokens
      });
      return {
        content: '',
        success: false,
        error: `Groq API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    console.log('Groq API response received successfully');
    
    const content = data.choices?.[0]?.message?.content || '';
    return {
      content,
      success: true
    };
  } catch (error) {
    console.error('Groq API call failed:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
