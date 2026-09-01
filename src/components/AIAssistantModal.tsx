import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, HelpCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Opportunity } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  opportunities,
}) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I'm your Enterprise Opportunity & Presales AI Advisor. I can analyze pipeline bottlenecks, generate solution architecture proposals, optimize deal margins, draft DocuSign terms, and compose company-wide WIN emails. How can I help you today?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'Analyze current pipeline health & SLA bottlenecks across active deals',
    'What are the standard prerequisites for PMO CWC milestone signoff?',
    'How should we structure payment milestones for high-value enterprise SOWs?',
    'Draft a standard liability cap clause for a financial services proposal',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, text: query }];
    setMessages(newMessages);
    setPrompt('');
    setIsLoading(true);

    try {
      const summaryContext = opportunities.map(o => `${o.trackingCode} (${o.clientName}): $${o.dealValue.toLocaleString()} at stage ${o.currentStage}`).join('\n');
      
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `User query: "${query}"\n\nCurrent Enterprise Pipeline Context:\n${summaryContext}`,
          systemInstruction: 'You are an Enterprise Presales, Contracts, and Finance Deal Desk Advisor. Provide authoritative, concise, bulleted, and highly actionable advice for enterprise opportunity management.',
        }),
      });

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: data.text || 'I have analyzed the request. Please ensure commercial margins meet the 40%+ threshold and deliverables align with agreed SOW specifications.',
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: 'Enterprise Advice: For high-velocity deal flow, ensure Contracts review is completed within 3 days SLA and milestone payment triggers (e.g. CWC acceptance) are explicitly tied to verifiable acceptance test criteria.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Deal Desk & Lifecycle Advisor</h3>
              <p className="text-[11px] text-slate-300">Powered by Gemini 3.7 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs p-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing opportunity telemetry...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0">Quick prompts:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 shrink-0 transition-colors"
            >
              {q.length > 35 ? q.slice(0, 35) + '...' : q}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about margin rules, SOW wording, DocuSign status..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
