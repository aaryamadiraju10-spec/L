import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Lightbulb,
  Mic,
  MicOff,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MathView } from '../utils/katexRender';
import { useSpeechRecognition } from '../utils/speechRecognition';
import { recordVoiceQueryUsed } from '../utils/gamification';

interface ChatbotTutorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  userId?: string;
}

export const ChatbotTutor: React.FC<ChatbotTutorProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  userId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        "Hello! I am your AI Math Tutor. I can explain any step of your formula calculations, clarify mathematical concepts, or help you practice for your exams. What would you like to explore today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hands-free voice speech recognition
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Sync speech transcript into input text and award gamification XP
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        recordVoiceQueryUsed();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Map history for Gemini API
      const conversationHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: conversationHistory,
          userId: userId || 'guest',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get tutor response');
      }

      const botMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: "I apologize, but I encountered an issue connecting to the math engine. Please try asking again!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900 ${
        isMinimized ? 'h-14 w-80' : 'h-[540px] w-96 max-w-[calc(100vw-2rem)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">AI Math Helper &amp; Tutor</h3>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online • Personalized Guidance
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold dark:bg-indigo-950 dark:text-indigo-300">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === 'user' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>AI Tutor is formulating explanation...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-1 flex gap-1.5 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800/80 scrollbar-none">
            <button
              onClick={() => handleSendMessage('Can you explain the quadratic formula proof step-by-step?')}
              className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
            >
              Explain quadratic formula
            </button>
            <button
              onClick={() => handleSendMessage('How do I know when to use Integration by Parts vs Substitution?')}
              className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
            >
              Integration techniques
            </button>
          </div>

          {/* Voice status banner if listening */}
          {isListening && (
            <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 animate-pulse">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening hands-free... speak math questions</span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="text-[10px] font-bold underline cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {speechError && (
            <div className="px-3 py-1 bg-amber-50 text-[10px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              {speechError}
            </div>
          )}

          {/* Input box */}
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isListening) stopListening();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {isSpeechSupported && (
                <button
                  type="button"
                  id="btn-chatbot-voice"
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop listening' : 'Speak hands-free with AI Tutor'}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 animate-pulse'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
              )}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Ask tutor any math question..."}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
