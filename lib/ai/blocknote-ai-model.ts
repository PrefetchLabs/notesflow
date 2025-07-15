import { createOpenAI } from '@ai-sdk/openai';

// Create a custom AI model that uses our API proxy endpoint
export function createCustomAIModel() {
  const baseURL = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/ai/proxy/v1`
    : 'http://localhost:3000/api/ai/proxy/v1';
  
  const openai = createOpenAI({
    // Use a dummy API key since auth is handled server-side
    apiKey: 'sk-dummy-key-handled-server-side',
    // Use our proxy endpoint that adds the real API key
    baseURL,
  });

  return openai('gpt-4o-mini');
}