
import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Lightbulb, Languages, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Feedback } from '../types';
import { cn } from '../lib/utils';

interface FeedbackPanelProps {
  feedback: Feedback | null;
  lastMessage: string | null;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, lastMessage }) => {
  if (!lastMessage) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">No feedback yet</h3>
          <p className="text-sm text-muted-foreground">
            Start chatting to receive real-time grammar and pronunciation tips.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Message</h3>
        <p className="text-sm font-medium p-3 bg-muted rounded-lg italic">"{lastMessage}"</p>
      </div>

      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Analyzing your message...
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {feedback.translation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Languages className="w-4 h-4 text-blue-500" />
                  Translation
                </div>
                <p className={cn(
                  "text-sm text-muted-foreground bg-blue-500/5 p-3 rounded-lg border border-blue-500/10",
                  // Check if translation contains Arabic characters to apply RTL
                  /[\u0600-\u06FF]/.test(feedback.translation) && "text-right"
                )} dir="auto">
                  {feedback.translation}
                </p>
              </div>
            )}

            {feedback.grammar && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Grammar & Spelling
                </div>
                <p className="text-sm text-muted-foreground bg-amber-500/5 p-3 rounded-lg border border-amber-500/10" dir="auto">
                  {feedback.grammar}
                </p>
              </div>
            )}

            {feedback.pronunciation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Volume2 className="w-4 h-4 text-purple-500" />
                  Pronunciation Tips
                </div>
                <p className="text-sm text-muted-foreground bg-purple-500/5 p-3 rounded-lg border border-purple-500/10" dir="auto">
                  {feedback.pronunciation}
                </p>
              </div>
            )}

            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="w-4 h-4 text-green-500" />
                  Natural Alternatives
                </div>
                <div className="space-y-2">
                  {feedback.suggestions.map((s, i) => (
                    <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
