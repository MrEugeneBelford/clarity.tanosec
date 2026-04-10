import { NextRequest, NextResponse } from 'next/server';
import { generateGroqResponse } from '@/ai/groq';

export async function POST(_request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GROQ_API_KEY is not set'
        },
        { status: 500 }
      );
    }

    // Simulate the exact assessment flow
    const systemPrompt = `You are an expert cybersecurity advisor for small and medium size enterprises (SMEs).
Based on the SME's responses to a cybersecurity self-assessment, you will provide personalized and actionable recommendations.

Your response should be simplified for smaller, non-enterprise companies.

Based on this user's cybersecurity assessment, identify their top risks and strengths. Then, recommend tailored actions for the business to take. Prioritize recommendations into high, medium, and low priority action items.

Return a JSON object with the following schema:
{
  "risks": ["risk1", "risk2", "risk3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "recommendations": [
    {
      "recommendation": "specific actionable recommendation",
      "priority": "high|medium|low"
    }
  ]
}`;

    const userPrompt = `Assessment Responses:
Do you have a firewall in place?: Yes
Do you regularly update your software?: No
Do you use strong passwords?: Sometimes

Please analyze these responses and provide cybersecurity recommendations.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    console.log('Testing assessment flow with Groq...');

    // Call Groq API
    const response = await generateGroqResponse(messages, 0.7, 2000);
    const method = 'groq-api';

    if (response.success) {
      console.log('Groq API succeeded, attempting to parse response...');
      
      try {
        const parsedResponse = JSON.parse(response.content);
        console.log('Response parsed successfully');
        
        return NextResponse.json({
          success: true,
          message: 'Assessment flow test successful',
          parsedResponse: parsedResponse,
          rawResponse: response.content,
          method: method,
          model: 'llama3-8b-8192'
        });
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse AI response',
          rawResponse: response.content,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          method: method
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: response.error,
        message: 'Groq API call failed',
        method: method
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test assessment error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test assessment flow'
    }, { status: 500 });
  }
}
