// client/src/components/AICopilotDrawer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export function AICopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello, Administrator! I am your **ExamOpt AI Scheduling Copilot**.\n\nI answer natural language questions about timetable feasibility, room bottlenecks, and emergency what-if simulations using verified mathematical outputs from the constraint engine.',
      isLLM: false,
      evidence: []
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const predefinedQuestions = [
    'Why could CS101 not be scheduled on Monday?',
    'What happens if Computer Lab L1 becomes unavailable?',
    'Which timetable has better room utilization?',
    'Which exams have room allocation problems?',
    'Explain the generated schedule in simple English.'
  ];

  const handleSend = async (questionText) => {
    const textToSend = questionText || query;
    if (!textToSend.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.ai.ask(textToSend);
      setMessages([
        ...newMessages,
        {
          sender: 'copilot',
          text: response.answer,
          isLLM: response.isLLMPowered,
          engine: response.engine,
          evidence: response.evidence || []
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'copilot',
          text: `⚠️ Query could not be processed: ${err.message}. Please verify the server connection.`,
          isLLM: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
        <span>AI Copilot</span>
      </button>

      {/* Slide-Over Copilot Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>AI Scheduling Copilot</span>
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-blue-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Ground truth: Constraint Engine</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            {predefinedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'copilot' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {m.sender === 'copilot' && m.engine && (
                    <div className="pt-2 border-t border-slate-200/60 text-[9px] text-slate-400 font-mono">
                      Verified by: {m.engine}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium text-slate-500 ml-1">Consulting constraint engine...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about timetable constraints or what-if..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1 text-[9px] text-center text-slate-400">
              Deterministic verifier prevents hallucinations. AI never overrides scheduling rules.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
