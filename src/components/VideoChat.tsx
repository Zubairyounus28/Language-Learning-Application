
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Bot, User, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Language, Feedback } from '../types';
import { chatWithAI, getFeedback } from '../services/gemini';
import { cn } from '../lib/utils';

interface VideoChatProps {
  language: Language;
  onFeedback: (messageId: string, feedback: Feedback) => void;
  onNewUserMessage: (content: string, id: string) => void;
  onClose: () => void;
}

export const VideoChat: React.FC<VideoChatProps> = ({ language, onFeedback, onNewUserMessage, onClose }) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSubtitle, setAiSubtitle] = useState('');
  const [showNextButton, setShowNextButton] = useState(false);
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setIsCameraOn(false);
      }
    }

    setupCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'english' ? 'en-US' : 'ar-SA';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          handleUserSpeech(finalTranscript);
        }
        setTranscript(interimTranscript || finalTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current?.start();
        }
      };
    }
  }, [language, isListening]);

  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;

    const messageId = Date.now().toString();
    onNewUserMessage(text, messageId);
    
    try {
      setIsAiTalking(true);
      setAiSubtitle('');
      setShowNextButton(false);
      
      const aiResponse = await chatWithAI(language, [], text);
      setAiSubtitle(aiResponse);
      
      // Speak AI response
      speak(aiResponse);
      
      // Get feedback
      getFeedback(language, text).then(f => onFeedback(messageId, f));
      
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsAiTalking(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'english' ? 'en-US' : 'ar-SA';
      
      utterance.onstart = () => setIsAiTalking(true);
      utterance.onend = () => {
        setIsAiTalking(false);
        setShowNextButton(true);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setShowNextButton(false);
    setAiSubtitle('');
    setTranscript('');
    // Optionally trigger something else here
  };

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
    
    if (isMicOn) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Robot Video / Avatar */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <motion.div 
          animate={{ 
            scale: isAiTalking ? [1, 1.02, 1] : 1,
            opacity: isAiTalking ? 1 : 0.8
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10"
        >
          <div className="w-64 h-64 md:w-96 md:h-96 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.3)]">
            <Bot className={cn(
              "w-32 h-32 md:w-48 md:h-48 text-primary transition-all duration-500",
              isAiTalking && "scale-110 drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]"
            )} />
            
            {/* Talking Waves */}
            {isAiTalking && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                    className="absolute w-full h-full rounded-full border-2 border-primary/50"
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Status & Subtitles */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 flex flex-col items-center gap-4 z-30">
          <AnimatePresence mode="wait">
            {aiSubtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-2xl text-center"
              >
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed">
                  {aiSubtitle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline" className="bg-slate-900/80 border-primary/50 text-primary px-4 py-1 backdrop-blur-md">
              {isAiTalking ? "LingoFriend is speaking..." : (showNextButton ? "Waiting for you..." : "LingoFriend is listening...")}
            </Badge>
            {transcript && !aiSubtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/60 text-sm max-w-md text-center px-4 italic"
              >
                "{transcript}"
              </motion.p>
            )}
          </div>

          <AnimatePresence>
            {showNextButton && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4"
              >
                <Button 
                  onClick={handleNext}
                  className="rounded-full px-8 py-6 text-lg gap-2 shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Video Overlay */}
      <motion.div 
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="absolute bottom-24 right-8 w-48 h-64 md:w-64 md:h-48 bg-slate-900 rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl cursor-move z-20"
      >
        {!isCameraOn ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <User className="w-12 h-12 text-slate-600" />
          </div>
        ) : (
          <video 
            ref={userVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror"
          />
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white backdrop-blur-sm">
          You
        </div>
      </motion.div>

      {/* Controls */}
      <div className="h-24 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-6 z-30">
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "w-12 h-12 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white",
            !isMicOn && "bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30"
          )}
          onClick={toggleMic}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "w-12 h-12 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white",
            !isCameraOn && "bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30"
          )}
          onClick={toggleCamera}
        >
          {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
        </Button>

        <Button 
          variant="destructive" 
          className="rounded-full px-8 h-12 gap-2 shadow-lg shadow-red-500/20"
          onClick={onClose}
        >
          <PhoneOff className="w-5 h-5" />
          End Session
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror {
          transform: scaleX(-1);
        }
      `}} />
    </div>
  );
};
