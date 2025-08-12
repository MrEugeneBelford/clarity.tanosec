import { NextRequest, NextResponse } from 'next/server';
import { generateOpenRouterResponse } from '@/ai/openrouter';
import { generateOpenRouterResponseDirect } from '@/ai/openrouter-direct';

export async function GET(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OPENROUTER_API_KEY is not set',
          message: 'Please configure the OPENROUTER_API_KEY environment variable in Netlify',
          debug: {
            envVars: Object.keys(process.env).filter(key => key.includes('OPENROUTER')),
            hasApiKey: false
          }
        },
        { status: 500 }
      );
    }

    // Test with a simple message that works with Google models
    const testMessages = [
      { role: 'user' as const, content: 'You are a helpful assistant. Say "Hello, OpenRouter is working!"' }
    ];

    console.log('Testing OpenRouter with API key:', apiKey.substring(0, 10) + '...');
    console.log('Using model: google/gemma-3n-e2b-it:free');

    // Try client library first
    let response = await generateOpenRouterResponse(testMessages, 0.7, 100);
    let method = 'client-library';

    // If client library fails, try direct API
    if (!response.success) {
      console.log('Client library failed, trying direct API...');
      response = await generateOpenRouterResponseDirect(testMessages, 0.7, 100);
      method = 'direct-api';
    }

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: 'OpenRouter API is working correctly',
        response: response.content,
        apiKeyConfigured: true,
        method: method,
        model: 'google/gemma-3n-e2b-it:free',
        debug: {
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'Both OpenRouter methods failed',
        apiKeyConfigured: true,
        method: method,
        model: 'google/gemma-3n-e2b-it:free',
        debug: {
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test OpenRouter error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test OpenRouter integration',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
