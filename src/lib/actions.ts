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
    const recommendations = await generateSecurityRecommendations(input);
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // In a real app, you might want to log this error to a monitoring service
    throw new Error("Failed to generate security recommendations.");
  }
}
