import { GoogleGenAI } from "@google/genai";

// The Gemini API key should be configured as an environment variable in your Vercel project settings.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

/**
 * Vercel Serverless Function handler for journal insights.
 * This function replaces the original Firebase Function for a seamless Vercel deployment.
 * @param request The Vercel request object.
 * @param response The Vercel response object.
 */
export default async function handler(request, response) {
  // Set CORS headers to allow requests from your frontend domain.
  // In production, you should restrict this to your Vercel app's URL for security.
  response.setHeader('Access-Control-Allow-Origin', '*'); 
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight CORS requests.
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { entryText } = request.body;

  if (!entryText) {
    return response.status(400).json({ error: '`entryText` is required in the request body.' });
  }

  try {
    const prompt = `You are an insightful assistant. Read the following journal entry and provide a concise, single-sentence summary of its core sentiment and topic. Your response should be a single string, without any introductory text. For example: "The entry reflects on career challenges with a hopeful outlook." Journal Entry: "${entryText}"`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const summary = result.text;

    return response.status(200).json({ summary });
  } catch (error) {
    console.error('Error generating journal summary in Vercel function:', error);
    return response.status(500).json({ error: 'Failed to generate insight from the server.' });
  }
}
