'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, Bot, User, Sparkles, Copy, Check } from 'lucide-react';
import { queryMemory, QueryResponse } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: string;
  ts: Date;
}

const SUGGESTIONS = [
  'What is this project about?',
  'Explain the architecture',
  'What APIs does this use?',
  'What are the known bugs?',
  'What tech stack is being used?',
  'What should be built next?',
];

export default function QueryPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: q, ts: new Date() }]);
    setLoading(true);
    try {
      const res: QueryResponse = await queryMemory(q);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: res.answer, sources: res.sources, confidence: res.confidence, ts: new Date(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `**Error**: ${err?.response?.data?.detail || err.message}`, ts: new Date(),
      }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const confClass = (c?: string) => c === 'high' ? 'conf-high' : c === 'medium' ? 'conf-medium' : 'conf-low';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {messages.length === 0 ? (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', minHeight: 300 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
              border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(59,130,246,0.12)',
            }}>
              <Sparkles size={28} style={{ color: '#60a5fa' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>
                Ask your Second Brain
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', maxWidth: 340 }}>
                Upload project files first, then ask anything — architecture, bugs, next steps, code explanations.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%', maxWidth: 520 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: '0.75rem',
                alignItems: 'flex-start',
                animation: 'fade-up 0.25s ease both',
              }}>
                {/* Avatar */}
                {msg.role === 'assistant'
                  ? <div className="avatar-ai"><Bot size={15} color="white" /></div>
                  : <div className="avatar-user"><User size={15} style={{ color: 'var(--text-3)' }} /></div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxWidth: msg.role === 'user' ? '70%' : '82%' }}>
                  {msg.role === 'user' ? (
                    <div className="bubble-user">{msg.content}</div>
                  ) : (
                    <div className="bubble-ai" style={{ position: 'relative' }}>
                      <div className="md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => copy(msg.content, msg.id)}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-4)', padding: 4, borderRadius: 6,
                          opacity: 0, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        className="copy-btn"
                      >
                        {copied === msg.id ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}

                  {/* Confidence + sources */}
                  {msg.confidence && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${confClass(msg.confidence)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {msg.confidence} confidence
                      </span>
                      {msg.sources && msg.sources.length > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }}>
                          ← {msg.sources.slice(0, 2).join(', ')}{msg.sources.length > 2 ? ` +${msg.sources.length - 2}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', animation: 'fade-up 0.2s ease' }}>
                <div className="avatar-ai"><Bot size={15} color="white" /></div>
                <div className="bubble-ai" style={{ padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {[0, 150, 300].map(delay => (
                      <div key={delay} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--blue)',
                        animation: `bounce-dot 1.2s ${delay}ms infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '1rem 2rem 1.5rem',
        borderTop: '1px solid var(--border-dim)',
        background: 'rgba(8,13,26,0.6)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your project..."
            rows={1}
            className="ai-input"
            style={{ flex: 1, minHeight: 48, maxHeight: 120 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary"
            style={{ padding: '0.75rem', borderRadius: 12, flexShrink: 0 }}
          >
            {loading
              ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={17} />}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-4)', marginTop: '0.5rem' }}>
          Shift+Enter for new line · Enter to send
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce-dot {
          0%,80%,100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bubble-ai:hover .copy-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
