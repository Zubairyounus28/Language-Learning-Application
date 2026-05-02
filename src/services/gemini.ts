
import { GoogleGenAI } from "@google/genai";
import { PracticeLanguage, NativeLanguage, Message, Feedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTIONS = (practiceLanguage: PracticeLanguage, nativeLanguage: NativeLanguage) => `
You are an expert ${practiceLanguage} Grammar and Style Rewriter. 
Your goal is to help the user improve their sentences by rewriting them in a natural, native-like ${practiceLanguage} style.

Responsibilities:
1. When the user provides a sentence in ${practiceLanguage}, check it for grammar and spelling errors.
2. Retype the sentence in a polished, natural language style.
3. Provide the ${nativeLanguage} translation of the corrected sentence.

Output Format:
Your response should follow this exact format:
**Natural Style:** [Your polished version of the user's sentence]
**${nativeLanguage.charAt(0).toUpperCase() + nativeLanguage.slice(1)} Translation:** [The ${nativeLanguage} translation of the corrected sentence]

Context:
- The user's native language is ${nativeLanguage}.
- Be precise and professional. 
- Do not engage in casual chat unless the user specifically asks a question. 
- Focus on the quality of the rewrite.

Output Format for Feedback (Internal Analysis for sidebar):
{
  "grammar": "Brief explanation of the specific errors found (in ${nativeLanguage})",
  "pronunciation": "Tips on how to pronounce difficult words in the rewritten sentence (explained in ${nativeLanguage})",
  "suggestions": ["Alternative ways to express the same thought"],
  "translation": "Retyped ${nativeLanguage} translation"
}
`;

export async function chatWithAI(practiceLanguage: PracticeLanguage, nativeLanguage: NativeLanguage, history: Message[], newMessage: string) {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: newMessage }]
  });

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS(practiceLanguage, nativeLanguage),
    }
  });

  return response.text || "I'm sorry, I couldn't process that.";
}

export async function getFeedback(practiceLanguage: PracticeLanguage, nativeLanguage: NativeLanguage, userMessage: string): Promise<Feedback> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following ${practiceLanguage} message from a language learner whose native language is ${nativeLanguage}:
    "${userMessage}"
    
    Provide feedback on grammar, spelling, and naturalness. 
    Crucially, provide "pronunciation" tips for the words in this specific message.
    Provide the feedback and explanation in ${nativeLanguage}.
    Also provide a translation into ${nativeLanguage}.
    Return ONLY a JSON object with keys: grammar, pronunciation, suggestions (array), translation.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are a language expert. Return ONLY JSON.",
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse feedback JSON", e);
    return {};
  }
}
