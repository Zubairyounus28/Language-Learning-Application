
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, Languages, Info, Mic, MicOff, Volume2, ChevronRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Message, PracticeLanguage, NativeLanguage, Feedback } from '../types';
import { chatWithAI, getFeedback } from '../services/gemini';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  practiceLanguage: PracticeLanguage;
  nativeLanguage: NativeLanguage;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onFeedback: (messageId: string, feedback: Feedback) => void;
  onNewUserMessage: (content: string, id: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ practiceLanguage, nativeLanguage, messages, setMessages, onFeedback, onNewUserMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = practiceLanguage === 'english' ? 'en-US' : 'ar-SA';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [practiceLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = practiceLanguage === 'english' ? 'en-US' : 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    onNewUserMessage(input, userMessage.id);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponseText = await chatWithAI(practiceLanguage, nativeLanguage, messages, input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Get feedback for user message in background
      getFeedback(practiceLanguage, nativeLanguage, input).then(feedback => {
        onFeedback(userMessage.id, feedback);
      });

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 pt-8" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback className={m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm relative group",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border rounded-tl-none text-card-foreground"
                  )} dir="auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full p-1.5 shadow-sm text-muted-foreground hover:text-primary z-10"
                        title="Copy rewrite"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.role === 'assistant' && (
                      <button 
                        onClick={() => speak(m.content)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 border animate-pulse">
                <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a sentence to rewrite..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="rounded-full px-6"
              disabled={isLoading}
            />
            <Button 
              variant="outline"
              size="icon" 
              className={cn("rounded-full shrink-0", isListening && "bg-red-500 text-white hover:bg-red-600")} 
              onClick={toggleListening}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button 
              size="icon" 
              className="rounded-full shrink-0" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
