import {genkit} from 'genkit';

// For now, we'll use a basic configuration
// The actual AI calls will be handled by our custom OpenRouter integration
export const ai = genkit({
  plugins: [],
  // We'll handle the model calls directly in our flows
});
