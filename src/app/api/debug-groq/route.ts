import { NextRequest, NextResponse } from 'next/server';
import { generateGroqResponse } from '@/ai/groq';

export async function POST(_request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY;
    
    return NextResponse.json({
      success: true,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test a simple Groq API call
    const messages = [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Say "Hello from Groq!"' }
    ];

    const response = await generateGroqResponse(messages, 0.7, 50);
    
    return NextResponse.json({
      success: response.success,
      content: response.content,
      error: response.error,
      hasApiKey: !!process.env.GROQ_API_KEY
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
