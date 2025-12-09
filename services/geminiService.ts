
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const getAI = () => {
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
};

export const generateQuestions = async (topic: string, difficulty: string, language: string, count: number = 1): Promise<Question[]> => {
  const ai = getAI();
  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} technical interview questions for a coding assessment. 
      Topic: ${topic}. Difficulty: ${difficulty}. Language: ${language}.
      Include a title, a clear problem description, and starter code (in ${language}) if applicable.
      The id should be a unique random string.
      The output must be a valid JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
              category: { type: Type.STRING },
              starterCode: { type: Type.STRING }
            },
            required: ["id", "title", "description", "difficulty", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Question[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const gradeSubmission = async (question: Question, code: string): Promise<{ score: number; feedback: string }> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a strict technical interviewer. Grade this code submission.
      
      Problem: ${question.title}
      Description: ${question.description}
      
      Student Code:
      ${code}
      
      If the code is empty or clearly incomplete/wrong, give a low score.
      If it solves the problem efficiently, give a high score (90-100).
      
      Return JSON with:
      - score (integer 0-100)
      - feedback (concise string, max 2 sentences)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING }
            }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return { score: result.score || 0, feedback: result.feedback || "Unable to grade." };
  } catch (e) {
    console.error("Grading failed", e);
    return { score: 0, feedback: "Grading service unavailable." };
  }
};