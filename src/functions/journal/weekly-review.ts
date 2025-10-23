import { GoogleGenAI } from "@google/genai";

// The Gemini API key should be configured as an environment variable in your Vercel project settings.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

/**
 * Vercel Serverless Function handler for the AI Weekly Review.
 * @param request The Vercel request object.
 * @param response The Vercel response object.
 */
export default async function handler(request, response) {
  // Set CORS headers for Vercel environment
  response.setHeader('Access-Control-Allow-Origin', '*'); 
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { tasks, journalEntries, moods, habits } = request.body;

  if (!tasks || !journalEntries || !moods || !habits) {
    return response.status(400).json({ error: 'Missing required weekly data in the request body.' });
  }

  try {
    const prompt = `
      You are an insightful and encouraging personal coach named "Aura" for the Life Sync app.
      Analyze the user's data from the past 7 days provided below and generate a "Weekly Review".
      Your tone should be supportive, reflective, and forward-looking.
      The output MUST be in Markdown format.

      Here is the user's data:
      ---
      COMPLETED TASKS:
      ${tasks.length > 0 ? tasks.map(t => `- ${t.text}`).join('\n') : "No tasks completed."}
      ---
      JOURNAL ENTRIES AND MOODS:
      ${journalEntries.length > 0 ? journalEntries.map(j => `- On ${j.date}, mood was '${j.mood || 'not logged'}'. Entry summary: ${j.entryText.substring(0, 150)}...`).join('\n') : "No journal entries."}
      ---
      HABIT PERFORMANCE:
      ${habits.length > 0 ? habits.map(h => `- ${h.name}: Completed on ${h.completedDays} out of ${h.totalDays} scheduled days.`).join('\n') : "No habits tracked."}
      ---

      Based on this data, generate a response with the following Markdown structure:

      ## - 🌟 Weekly Highlight -
      Identify the single most positive achievement or pattern from the week. Be specific and celebrate it.

      ## - 💡 Key Insight -
      Find an interesting connection or pattern in the data. For example, connect mood to task completion, or habit consistency to journal themes.

      ## - 🌱 Opportunity for Growth -
      Based on the data, suggest ONE specific, actionable area for improvement for the upcoming week. Frame it positively.

      ## - ✨ A Look Ahead -
      Provide a brief, inspiring, and forward-looking closing statement to motivate the user for the next week.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    const weeklyReview = result.text;

    return response.status(200).json({ weeklyReview });
  } catch (error) {
    console.error('Error generating weekly review in Vercel function:', error);
    return response.status(500).json({ error: 'Failed to generate weekly review from the server.' });
  }
}
