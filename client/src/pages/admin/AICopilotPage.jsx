// client/src/pages/admin/AICopilotPage.jsx
// Dedicated Full-Page Intelligent Examination Scheduling Copilot

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp,
  Cpu,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';

export function AICopilotPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your **ExamOpt AI Scheduling Copilot**.

I analyze your university examination schedules, enrollment graphs, physical venue capacities, and institutional constraints in real-time.

**How I can assist you today:**
1. **Explain Unscheduling**: *"Why could CS101 not be scheduled on Monday?"*
2. **Disruption Simulation**: *"What happens if Computer Lab L1 becomes unavailable?"*
3. **Algorithmic Benchmarking**: *"Which timetable has better room utilization?"*
4. **Student Clash Prevention**: *"Explain how cross-department enrollments are validated."*

Feel free to pick any sample prompt below or type your inquiry!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatBottomRef = useRef(null);

  const samplePrompts = [
    "Why could CS101 not be scheduled on Monday?",
    "What happens if Computer Lab L1 becomes unavailable?",
    "Which timetable has better room utilization?",
    "Compare First-Fit vs Smart Backtracking algorithms.",
    "Verify STU101 cross-department enrollment clash protection."
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryToSend) => {
    const query = queryToSend || input;
    if (!query.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', content: query.trim() }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.ask(query.trim());
      setMessages([...newMsgs, { role: 'assistant', content: res.response || res.message || 'No response from assistant.' }]);
    } catch (err) {
      setMessages([...newMsgs, { 
        role: 'assistant', 
        content: `⚠️ **Diagnostic Error**: Failed to retrieve AI analysis.\n\n*Details*: ${err.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation cleared. What examination or scheduling constraint would you like to analyze next?`
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Scheduling Copilot</h1>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Diagnostic Assistant</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time constraint explanation, what-if disruption scenarios, and algorithm optimization recommendations.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Suggested Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Queries:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 rounded-xl whitespace-nowrap text-[11px] font-medium transition shadow-xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 overflow-y-auto space-y-5">
        {messages.map((m, idx) => {
          const isBot = m.role === 'assistant';
          return (
            <div
              key={idx}
              className={`flex gap-3.5 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isBot ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-2 relative group leading-relaxed ${
                  isBot
                    ? 'bg-slate-50 text-slate-800 border border-slate-100'
                    : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {m.content}
                </div>

                {isBot && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-md opacity-0 group-hover:opacity-100 transition"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 mr-auto">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>Analyzing schedule constraints and running optimization inference...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a scheduling question or disruption scenario..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
        >
          <span>Ask Copilot</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
