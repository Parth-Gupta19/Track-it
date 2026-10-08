import React, { useState, useEffect, useRef } from 'react';
import { Activity, AIAgentMessage, LogEntry, MeasurementTool } from '../../types/trackit';
import { storage } from '../../utils/storage';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  FolderOpen,
  ArrowRight,
  HelpCircle,
  Volume2,
} from 'lucide-react';

interface AIAgentPageProps {
  activities: Activity[];
  tools: MeasurementTool[];
  entries: LogEntry[];
  onNavigateToActivities: () => void;
  onNavigateToReport: () => void;
}

export const AIAgentPage: React.FC<AIAgentPageProps> = ({
  activities,
  tools,
  entries,
  onNavigateToActivities,
  onNavigateToReport,
}) => {
  const [messages, setMessages] = useState<AIAgentMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Trackit Master AI Agent** powered by Google Gemini.\n\nI can manage your entire application autonomously:\n- **Voice & Text Logging**: Speak or type what you did and I'll log it directly into the right activity and tool.\n- **Statistical Discoveries**: Ask me for your **mode**, **growth percentage**, or mathematical trends.\n- **App Setup**: Ask me to create new activities or measurement tools on the fly.`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentTranscript);
        setInput(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    // Add user message
    const userMsg: AIAgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSpeechTranscript('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          activities,
          tools,
          entries,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || "I've processed your request.";
      const action = data.action;

      // Execute returned action locally in Trackit storage!
      if (action) {
        if (action.type === 'add_entry' && action.entryData) {
          storage.addEntry(action.entryData);
        } else if (action.type === 'create_activity' && action.activityData) {
          storage.addActivity(action.activityData);
        } else if (action.type === 'create_tool' && action.toolData) {
          storage.addTool(action.toolData);
        }
      }

      const assistantMsg: AIAgentMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        actionTaken: action
          ? {
              type: action.type,
              details: action.details || 'Executed action',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error in AI agent communication:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: 'assistant',
          content: `I encountered a communication issue. However, you can still log entries via the Report Entry page or inspect your folders directly.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Log 45m Upper Body and 25m Zone 2 Cardio for today in Fitness',
    'What is the growth percentage and mode in Workout Volume?',
    'What is the most frequent value (mode) recorded in my workouts?',
    'Log: Read 35 pages today in Reading',
    'Create an activity called Meditation & Mindfulness with a daily minutes line chart',
    'Analyze my overall activity balance this month',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            Gemini AI Agent & Voice Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous app manager with integrated voice input. Talk or type to log entries, build tools, or query mode & growth %.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium font-mono">Gemini 3.8 Flash Online</span>
        </div>
      </div>

      {/* Voice Status Banner if active */}
      {isListening && (
        <div className="p-3 bg-purple-950/60 border border-purple-800/80 rounded-xl flex items-center justify-between text-xs text-purple-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <span>Listening to your voice... Speak clearly (e.g. "Log 45 minutes cardio today")</span>
          </div>
          <span className="text-[11px] font-mono text-purple-300">
            {speechTranscript ? `"${speechTranscript}"` : 'Awaiting speech...'}
          </span>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg min-h-[460px] max-h-[560px] overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-medium">
                {msg.role === 'user' ? (
                  <span className="text-indigo-200">You (Voice / Command)</span>
                ) : (
                  <span className="text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Trackit AI
                  </span>
                )}
                <span>·</span>
                <span className="font-mono text-[9px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Content formatted */}
              <div className="whitespace-pre-line prose prose-invert prose-xs text-xs">
                {msg.content}
              </div>

              {/* Action Banner if action taken */}
              {msg.actionTaken && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Action Executed: <strong>{msg.actionTaken.details}</strong></span>
                  </div>
                  {msg.actionTaken.type === 'add_entry' && (
                    <button
                      onClick={onNavigateToActivities}
                      className="flex items-center gap-1 text-[10px] font-semibold text-white bg-emerald-700/80 hover:bg-emerald-600 rounded px-2 py-0.5 transition-colors shrink-0"
                    >
                      View Folder <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Gemini is analyzing records and executing actions...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Prompts */}
      <div>
        <div className="text-[11px] text-slate-500 font-medium mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500" />
          <span>Quick Inquiries & Management Commands:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form with Integrated Voice Mic */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2"
      >
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-xl border transition-all shrink-0 cursor-pointer ${
            isListening
              ? 'bg-rose-600 border-rose-500 text-white ring-4 ring-rose-500/30 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to speak (Voice Input)'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-purple-400" />}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to speech...'
                : 'Send information or ask findings (e.g. "Log 50m workout", "What is the mode of workouts?")...'
            }
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs pr-10 shadow-inner"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-colors shrink-0 cursor-pointer"
          title="Send command"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
