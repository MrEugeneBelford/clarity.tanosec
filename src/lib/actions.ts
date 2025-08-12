"use server";

import { generateSecurityRecommendations } from "@/ai/flows/generate-security-recommendations";
import type {
  GenerateSecurityRecommendationsInput,
  GenerateSecurityRecommendationsOutput,
} from "@/ai/flows/generate-security-recommendations";

export async function getRecommendations(
  input: GenerateSecurityRecommendationsInput
): Promise<GenerateSecurityRecommendationsOutput> {
  // Add a delay for development to simulate network latency
  // await new Promise(resolve => setTimeout(resolve, 1500));
  
  try {
    console.log('Starting recommendation generation with input:', Object.keys(input.assessmentResponses).length, 'responses');
    
    const recommendations = await generateSecurityRecommendations(input);
    
    console.log('Successfully generated recommendations');
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OpenRouter API key')) {
        throw new Error("OpenRouter API key is not configured. Please check your environment variables.");
      } else if (error.message.includes('Failed to parse AI response')) {
        throw new Error("AI response format was invalid. Please try again.");
      } else if (error.message.includes('OpenRouter API error')) {
        throw new Error("OpenRouter API error. Please check your API key and try again.");
      }
    }
    
    // In a real app, you might want to log this error to a monitoring service
    throw new Error("Failed to generate security recommendations. Please try again.");
  }
}
