import * as functions from "firebase-functions";
import * as express from "express";
import {GoogleGenAI} from "@google/genai";

// The Gemini API key is automatically set by the environment.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

const app = express();
// FIX: Explicitly specify path for middleware to resolve TS overload issue.
app.use("/", express.json());

// A simple CORS middleware to allow requests from your web app
app.use((req, res, next) => {
  // In a production app, you would restrict this to your app's domain
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post("/journal/insight", async (req, res) => {
  const {entryText} = req.body;

  if (!entryText) {
    return res.status(400).json({error: "entryText is required"});
  }

  try {
    const prompt = `You are an insightful assistant. Read the following journal entry and provide a concise, single-sentence summary of its core sentiment and topic. Your response should be a single string, without any introductory text. For example: "The entry reflects on career challenges with a hopeful outlook." Journal Entry: "${entryText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.status(200).json({summary: response.text});
  } catch (error) {
    console.error("Error generating journal summary:", error);
    res.status(500).json({error: "Failed to generate insight from the server."});
  }
});

// Expose the Express API as a single Cloud Function called "api".
export const api = functions.https.onRequest(app);
