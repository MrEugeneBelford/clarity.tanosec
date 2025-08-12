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

// Helper function to convert messages for Google models that don't support system messages
function convertMessagesForGoogleModel(messages: OpenRouterMessage[]): OpenRouterMessage[] {
  const convertedMessages: OpenRouterMessage[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    if (message.role === 'system') {
      // For Google models, convert system messages to user messages
      // and combine with the next user message if it exists
      if (i + 1 < messages.length && messages[i + 1].role === 'user') {
        convertedMessages.push({
          role: 'user',
          content: `${message.content}\n\n${messages[i + 1].content}`
        });
        i++; // Skip the next message since we combined it
      } else {
        convertedMessages.push({
          role: 'user',
          content: message.content
        });
      }
    } else {
      convertedMessages.push(message);
    }
  }
  
  return convertedMessages;
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
    
    // Convert messages for Google model compatibility
    const convertedMessages = convertMessagesForGoogleModel(messages);
    console.log('Converted messages for Google model:', convertedMessages.length);
    
    const response = await openrouter.chat(convertedMessages, {
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
