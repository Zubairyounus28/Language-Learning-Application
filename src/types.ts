
export type PracticeLanguage = 'english' | 'arabic';
export type NativeLanguage = 'urdu' | 'arabic' | 'english';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Feedback {
  grammar?: string;
  pronunciation?: string;
  suggestions?: string[];
  translation?: string;
}

export interface ChatSession {
  id: string;
  language: PracticeLanguage;
  messages: Message[];
  feedback: Record<string, Feedback>; // messageId -> feedback
}
