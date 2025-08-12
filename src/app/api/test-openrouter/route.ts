import { NextRequest, NextResponse } from 'next/server';
import { generateOpenRouterResponse } from '@/ai/openrouter';

export async function GET(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OPENROUTER_API_KEY is not set',
          message: 'Please configure the OPENROUTER_API_KEY environment variable in Netlify'
        },
        { status: 500 }
      );
    }

    // Test with a simple message
    const testMessages = [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Say "Hello, OpenRouter is working!"' }
    ];

    const response = await generateOpenRouterResponse(testMessages, 0.7, 100);

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: 'OpenRouter API is working correctly',
        response: response.content,
        apiKeyConfigured: true
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'OpenRouter API call failed',
        apiKeyConfigured: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test OpenRouter error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test OpenRouter integration'
    }, { status: 500 });
  }
}
