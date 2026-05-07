'use client';

import React, { useState } from 'react';
import { CheckSquare, Loader2, RefreshCw, ChevronDown, ChevronUp, Zap, Square } from 'lucide-react';
import { getTodos, TodoItem } from '@/lib/api';

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Engineering:   { bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  Documentation: { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
  Testing:       { bg: 'rgba(16,185,129,0.1)', text: '#34d399', border: 'rgba(16,185,129,0.2)' },
  Design:        { bg: 'rgba(236,72,153,0.1)', text: '#f472b6', border: 'rgba(236,72,153,0.2)' },
  Architecture:  { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
  DevOps:        { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  Research:      { bg: 'rgba(251,191,36,0.1)', text: '#fde047', border: 'rgba(251,191,36,0.2)' },
};

export default function TodoPanel() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data.todos);
      setGenerated(true);
      setCompleted(new Set());
    } finally { setLoading(false); }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleComplete = (id: string) => {
    setCompleted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const byPriority = (p: string) => todos.filter(t => t.priority === p);
  const done = todos.filter(t => completed.has(t.id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <Zap size={18} style={{ color: '#fbbf24' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>AI-Generated TODOs</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Automatically detected from your project memory</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-ghost"
          style={{ flexShrink: 0, borderColor: 'rgba(245,158,11,0.25)', color: '#fbbf24' }}
        >
          {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> :
            <><RefreshCw size={13} /> {generated ? 'Regenerate' : 'Generate'}</>}
        </button>
      </div>

      {/* Stats row */}
      {todos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {[
            { label: 'Total',  val: todos.length, color: 'var(--text-1)', bg: 'var(--bg-surface)' },
            { label: 'High',   val: byPriority('high').length,   color: '#fb7185', bg: 'rgba(244,63,94,0.06)' },
            { label: 'Medium', val: byPriority('medium').length, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)' },
            { label: 'Done',   val: done, color: '#34d399', bg: 'rgba(16,185,129,0.06)' },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '0.875rem 0.5rem',
              borderRadius: 12, background: s.bg,
              border: '1px solid var(--border-dim)',
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!generated && !loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '1rem', padding: '3rem 2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckSquare size={24} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>No TODOs yet</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
              Upload project files, then click Generate to get AI-detected tasks
            </p>
          </div>
        </div>
      )}

      {/* TODO list */}
      {todos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(['high', 'medium', 'low'] as const).flatMap(priority =>
            byPriority(priority).map(todo => {
              const isDone = completed.has(todo.id);
              const isOpen = expanded.has(todo.id);
              const cat = CAT_COLORS[todo.category] || CAT_COLORS.Engineering;

              return (
                <div key={todo.id} className={`todo-card${isDone ? ' done' : ''}`}
                  style={{ animation: 'fade-up 0.25s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(todo.id)}
                      className={`check-box${isDone ? ' checked' : ''}`}
                      style={{ marginTop: 2 }}
                    >
                      {isDone && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginBottom: isOpen ? 8 : 0 }}>
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 600,
                          color: isDone ? 'var(--text-4)' : 'var(--text-1)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}>
                          {todo.title}
                        </span>
                        <span className={`badge priority-${todo.priority}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                          {todo.priority}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 5,
                          background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`,
                          fontWeight: 600,
                        }}>
                          {todo.category}
                        </span>
                      </div>
                      {isOpen && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.65 }}>
                          {todo.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(todo.id)}
                      style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, marginTop: 1 }}
                    >
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
