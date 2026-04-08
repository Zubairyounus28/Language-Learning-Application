
import React, { useState } from 'react';
import { Languages, Settings, MessageSquare, Sparkles, Github, Info, RefreshCw, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { ChatInterface } from './components/ChatInterface';
import { VideoChat } from './components/VideoChat';
import { FeedbackPanel } from './components/FeedbackPanel';
import { Language, Feedback, Message } from './types';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { TooltipProvider } from './components/ui/tooltip';

export default function App() {
  const [language, setLanguage] = useState<Language>('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'video'>('chat');

  const handleFeedback = (messageId: string, feedback: Feedback) => {
    setFeedbacks(prev => ({ ...prev, [messageId]: feedback }));
  };

  const handleNewUserMessage = (content: string, id: string) => {
    setLastUserMessage(content);
    setLastMessageId(id);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
      setFeedbacks({});
      setLastUserMessage(null);
      setLastMessageId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-[#fafafa] text-foreground font-sans overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-white flex flex-col hidden md:flex">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Languages className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">LingoFriend</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">AI Language Tutor</p>
            </div>
          </div>

          <div className="flex-1 px-4 py-2 space-y-8">
            <div className="space-y-3">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Native Language</h3>
              <div className="px-2">
                <Badge variant="secondary" className="gap-2 px-3 py-1 rounded-full">
                  <span className="text-sm">🇵🇰</span>
                  Urdu
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Practice Language</h3>
              <div className="grid grid-cols-1 gap-1">
                <Button 
                  variant="secondary" 
                  className="justify-start gap-3 h-11 px-4 rounded-lg cursor-default"
                >
                  <span className="text-lg">🇺🇸</span>
                  English
                  <Badge variant="outline" className="ml-auto bg-white">Active</Badge>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Progress</h3>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <div className="px-2 space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900">Day Streak!</p>
                    <p className="text-[10px] text-amber-700">Keep it up, friend!</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fluency</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Grammar</span>
                    <span className="font-medium">42%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[42%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <Info className="w-4 h-4" />
              Help Center
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white md:m-2 md:rounded-2xl md:border md:shadow-sm overflow-hidden">
          <header className="h-16 border-b flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="md:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Languages className="text-primary-foreground w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">Conversation Practice</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">LingoFriend is online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'video' ? 'secondary' : 'outline'} 
                size="sm" 
                className="rounded-full gap-2"
                onClick={() => setViewMode(viewMode === 'chat' ? 'video' : 'chat')}
              >
                <Video className="w-4 h-4" />
                {viewMode === 'chat' ? 'Video Mode' : 'Chat Mode'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2"
                onClick={clearChat}
              >
                <RefreshCw className="w-4 h-4" />
                Clear Chat
              </Button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              {viewMode === 'chat' ? (
                <ChatInterface 
                  language={language} 
                  messages={messages}
                  setMessages={setMessages}
                  onFeedback={(id, f) => {
                    handleFeedback(id, f);
                  }}
                  onNewUserMessage={handleNewUserMessage}
                />
              ) : (
                <VideoChat 
                  language={language}
                  onFeedback={(id, f) => {
                    handleFeedback(id, f);
                  }}
                  onNewUserMessage={handleNewUserMessage}
                  onClose={() => setViewMode('chat')}
                />
              )}
            </div>

            {/* Right Panel - Feedback */}
            <aside className="w-80 border-l bg-[#fafafa] hidden lg:block">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-white">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Insights
                  </h3>
                </div>
                <FeedbackPanel 
                  feedback={lastMessageId ? feedbacks[lastMessageId] : null} 
                  lastMessage={lastUserMessage} 
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
