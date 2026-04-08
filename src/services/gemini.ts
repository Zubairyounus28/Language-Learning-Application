
import { GoogleGenAI } from "@google/genai";
import { Language, Message, Feedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTIONS = (language: Language) => `
You are a friendly, supportive language learning companion named "LingoFriend". 
Your goal is to help the user practice English in a natural, conversational way.

Persona:
- Talk like a real friend, not a robot. Be warm, encouraging, and curious.
- Keep your responses SHORT and CONCISE. Don't write long paragraphs.
- Use natural idioms and casual language.
- Share small "personal" anecdotes or opinions to feel more human.

Purely Conversational:
- DO NOT provide grammar corrections, suggestions, translations, or pronunciation tips in your chat messages.
- Even if the user makes a mistake, respond ONLY to the meaning of what they said as a friend would.
- All technical feedback (grammar, translation, etc.) is handled by a separate system in the sidebar. You should focus ONLY on the conversation.

Context:
- The user's native language is Urdu.
- DO NOT mention the "sidebar", "insights", or "feedback panel" in your conversation.
- Your primary job is to keep the conversation going in English.

Responsibilities:
1. Chat naturally in English. Respond to the user's input as a friend would.
2. DO NOT teach or correct the user in the chat. Just be a friend.
3. Ask short, open-ended questions to keep the user talking.

Output Format for Feedback (Internal Analysis):
When providing feedback, you will be asked to analyze a specific English message for the sidebar. 
You should return a JSON object with the following structure:
{
  "grammar": "Brief explanation of any grammar/spelling errors in English (explained in Urdu)",
  "pronunciation": "Tips on how to pronounce specific English words from the message (explained in Urdu)",
  "suggestions": ["Better ways to say the same thing in English"],
  "translation": "Translation of the user's English message into Urdu"
}
`;

export async function chatWithAI(language: Language, history: Message[], newMessage: string) {
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
      systemInstruction: SYSTEM_INSTRUCTIONS(language),
    }
  });

  return response.text || "I'm sorry, I couldn't process that.";
}

export async function getFeedback(language: Language, userMessage: string): Promise<Feedback> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following ${language} message from a language learner whose native language is Urdu:
    "${userMessage}"
    
    Provide feedback on grammar, spelling, and naturalness. 
    Crucially, provide "pronunciation" tips for the words in this specific message.
    Provide the feedback and explanation in Urdu.
    Also provide a translation into Urdu.
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
