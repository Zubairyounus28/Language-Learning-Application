
import { GoogleGenAI } from "@google/genai";
import { Language, Message, Feedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTIONS = (language: Language) => `
You are a friendly, supportive language learning companion named "LingoFriend". 
Your goal is to help the user practice ${language} in a natural, conversational way.

Persona:
- Talk like a real friend, not a robot. Be warm, encouraging, and curious.
- Keep your responses SHORT and CONCISE. Don't write long paragraphs.
- Use natural idioms and casual language.
- Share small "personal" anecdotes or opinions to feel more human.

Teacher-Friend Role:
- If the user makes a mistake, respond to their meaning first, then gently suggest the correct way to say it.
- Example: User says "How are your?", You say "I'm doing great, thanks! By the way, it's more natural to say 'How are you?' or 'How's it going?'"
- Be a "cool teacher" who is also a best friend.

Context:
- The user's native language is Urdu.
- DO NOT mention the "sidebar", "insights", or "feedback panel" in your conversation. The user sees those separately.
- Your primary job is to keep the conversation going.

Responsibilities:
1. Chat naturally. Respond to the user's input as a friend would.
2. Provide gentle, immediate corrections for obvious mistakes within the chat flow.
3. Ask short, open-ended questions to keep the user talking.

Output Format for Feedback (Internal Analysis):
When providing feedback, you will be asked to analyze a specific message for the sidebar. 
You should return a JSON object with the following structure:
{
  "grammar": "Brief explanation of any grammar/spelling errors (in Urdu)",
  "pronunciation": "Tips on how to pronounce specific words from the message (in Urdu)",
  "suggestions": ["Better ways to say the same thing"],
  "translation": "Translation of the user's message into Urdu"
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
