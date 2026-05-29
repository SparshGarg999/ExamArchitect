import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, BookOpen, Lightbulb, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_BASE } from '../config';

const escapeHtml = (unsafe) => {
  return (unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export default function WeaknessChatbot({ isOpen, onClose, question, onXpEarned }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleAskMentor = async (customQuestion = null) => {
    // 1) Verify user is logged in
    if (!currentUser) {
      const errorEntry = {
        question: customQuestion || 'Explain this question step by step',
        explanation: 'Please log in to access the AI Syllabus Mentor.',
        tips: [],
        xp: 0
      };
      setChatHistory(prev => [...prev, errorEntry]);
      return;
    }

    // 2) Verify user is PRO or admin. Otherwise, show the requested error message
    if (currentUser.role !== 'pro' && currentUser.role !== 'admin') {
      setLoading(true);
      // Wait a brief simulated latency of 600ms
      await new Promise(resolve => setTimeout(resolve, 600));
      const errorEntry = {
        question: customQuestion || 'Explain this question step by step',
        explanation: 'Failed to reach the AI Mentor. Please check your connection and try again.',
        tips: [],
        xp: 0
      };
      setChatHistory(prev => [...prev, errorEntry]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const body = {
      question_text: customQuestion || question?.question_text || '',
      correct_answer: question?.correct_answer || null,
      user_answer: question?.user_answer || null,
      topic_name: question?.topic_name || null
    };

    try {
      const res = await fetch(`${API_BASE}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      const newEntry = {
        question: customQuestion || 'Explain this question step by step',
        explanation: data.explanation,
        tips: data.tips,
        xp: data.xp_earned
      };

      setChatHistory(prev => [...prev, newEntry]);
      setResponse(data);

      if (data.xp_earned > 0 && onXpEarned) {
        onXpEarned(data.xp_earned);
      }
    } catch (err) {
      console.error('Mentor API error:', err);
      const errorEntry = {
        question: customQuestion || 'Explain this question step by step',
        explanation: 'Failed to reach the AI Mentor. Please check your connection and try again.',
        tips: [],
        xp: 0
      };
      setChatHistory(prev => [...prev, errorEntry]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = () => {
    if (!followUpQuestion.trim()) return;
    const q = followUpQuestion;
    setFollowUpQuestion('');
    handleAskMentor(`Follow-up about: "${question?.question_text?.slice(0, 80)}..."\n\nStudent's question: ${q}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f1219] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                AI Syllabus Mentor
                <Sparkles size={14} className="text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400">Powered by Gemini • +50 XP per interaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Question Context Card */}
          {question && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-indigo-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Question Context</span>
                {question.topic_name && (
                  <span className="text-[9px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                    {question.topic_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                {question.question_text}
              </p>
              {question.correct_answer && (
                <div className="mt-2 text-[10px] text-emerald-400 font-bold">
                  Correct Answer: {question.correct_answer}
                </div>
              )}
            </div>
          )}

          {/* Initial prompt if no history */}
          {chatHistory.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb size={28} className="text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Need help understanding this question?</h4>
              <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
                Click below and the AI Mentor will walk you through the solution step-by-step, explain key concepts, and give study tips.
              </p>
              <button
                onClick={() => handleAskMentor()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2 mx-auto shadow-lg shadow-indigo-500/20"
              >
                <Sparkles size={14} />
                Explain Step-by-Step (+50 XP)
              </button>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.map((entry, i) => (
            <div key={i} className="space-y-3">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className="bg-indigo-500/20 border border-indigo-500/20 rounded-xl px-4 py-2 max-w-[80%]">
                  <p className="text-xs text-indigo-300 font-medium">{entry.question}</p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-indigo-400" />
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex-grow">
                  <div
                    className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mentor-response"
                    dangerouslySetInnerHTML={{
                      __html: escapeHtml(entry.explanation)
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                  {entry.xp > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        ✨ +{entry.xp} XP Earned
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading spinner */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-indigo-400" />
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <Loader2 size={16} className="text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400">AI Mentor is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Follow-up Input */}
        {chatHistory.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={followUpQuestion}
                onChange={e => setFollowUpQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
                placeholder="Ask a follow-up question..."
                className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={handleFollowUp}
                disabled={loading || !followUpQuestion.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
