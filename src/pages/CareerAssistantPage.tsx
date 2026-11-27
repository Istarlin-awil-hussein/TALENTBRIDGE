import React, { useState } from 'react';
import { Copy, Info, Send } from 'lucide-react';
import { apiRequest } from '../api';
import { UserProfile } from '../types';

interface CareerAssistantPageProps {
  user: UserProfile | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'live' | 'demo';
}

const QUICK_PROMPTS = [
  {
    label: 'Identify transferable skills',
    prompt:
      'Help me identify my most valuable transferable skills and translate them for international employers in my field.',
  },
  {
    label: 'Improve my CV summary',
    prompt:
      'Draft an outcome-driven professional CV summary and 4 strong experience bullets based on my background.',
  },
  {
    label: 'Draft a cover letter',
    prompt:
      'Write a concise, professional cover letter template I can tailor for roles in my target industry.',
  },
  {
    label: 'Interview preparation',
    prompt:
      'Give me 5 likely interview questions in my field and tips on addressing displacement career gaps confidently.',
  },
  {
    label: 'Skill gap & 90-day plan',
    prompt:
      'Identify common skill gaps for international roles in my profession and suggest a structured 90-day development plan.',
  },
];

export const CareerAssistantPage: React.FC<CareerAssistantPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: user
        ? `Hello ${user.full_name}. I am your SkillBridge Career Assistant. I can help you highlight transferable skills from ${user.professional_field}, refine your CV, draft cover letters, prepare for interviews, or plan a 90-day development roadmap.`
        : 'Hello. I am the SkillBridge AI Career Assistant. Ask me about translating international experience onto a CV, drafting cover letters, preparing for interviews, or planning skill development.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modeBadge, setModeBadge] = useState<'live' | 'demo' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;
    setError('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest<{ mode: 'live' | 'demo'; reply: string }>(
        '/api/ai/career-assistant',
        {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            history: nextMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      );
      setModeBadge(res.mode);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          mode: res.mode,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Unable to reach AI Career Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                Career Coaching & Preparation
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                SkillBridge AI Career Assistant
              </h1>
            </div>
            {modeBadge && (
              <span className="text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-md self-start sm:self-auto">
                {modeBadge === 'live'
                  ? 'Connected via Gemini API (Server Proxy)'
                  : 'Demo Mode (Offline Sample Coaching)'}
              </span>
            )}
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              The assistant helps translate transferable skills, refine CVs, draft cover letters, and prepare for interviews. It does not invent job openings, issue credential verifications, or give legal/immigration guarantees.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Prompt Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-slate-900">
                Suggested Coaching Prompts
              </h2>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={loading}
                    onClick={() => sendMessage(item.prompt)}
                    className="w-full text-left p-3 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-900">Active Profile Context</div>
                <div>Field: {user.professional_field}</div>
                <div>Experience: {user.years_experience} years</div>
                <div>Skills: {user.skills.slice(0, 6).join(', ')}</div>
              </div>
            )}
          </aside>

          {/* Chat Workspace */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {msg.mode === 'demo' && <span>Demo Mode Response</span>}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-xs text-slate-500">Generating career guidance...</div>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="p-4 border-t border-slate-200 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about CV bullets, cover letters, skill gaps, or interview answers..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
