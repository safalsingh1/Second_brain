'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TrendingUp, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { getInconsistencies, getProgress } from '@/lib/api';

type Mode = 'progress' | 'inconsistencies';

export default function AnalysisPanel() {
  const [mode, setMode] = useState<Mode>('progress');
  const [progressText, setProgressText] = useState('');
  const [inconsText, setInconsText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingIncons, setLoadingIncons] = useState(false);

  const fetchProgress = async () => {
    setLoadingProgress(true);
    try { setProgressText((await getProgress()).summary); }
    catch (e: any) { setProgressText(`Error: ${e.message}`); }
    finally { setLoadingProgress(false); }
  };

  const fetchIncons = async () => {
    setLoadingIncons(true);
    try { setInconsText((await getInconsistencies()).report); }
    catch (e: any) { setInconsText(`Error: ${e.message}`); }
    finally { setLoadingIncons(false); }
  };

  const TABS = [
    { id: 'progress' as Mode,        label: 'Progress Report',    icon: <TrendingUp size={13} />,  color: '#60a5fa', accent: 'rgba(59,130,246,0.12)'  },
    { id: 'inconsistencies' as Mode, label: 'Inconsistencies',    icon: <AlertTriangle size={13} />, color: '#fbbf24', accent: 'rgba(245,158,11,0.12)' },
  ];

  const isLoading = mode === 'progress' ? loadingProgress : loadingIncons;
  const text      = mode === 'progress' ? progressText    : inconsText;
  const active    = TABS.find(t => t.id === mode)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Tab switcher */}
      <div className="tab-switch" style={{ maxWidth: 420 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`tab-switch-btn${mode === tab.id ? ' active' : ''}`}
            style={mode === tab.id ? { color: tab.color } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <span style={{ color: active.color }}>{active.icon}</span>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>{active.label}</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            {mode === 'progress'
              ? 'AI analysis of your project\'s current state and next steps'
              : 'Contradictions, naming issues, and missing components across files'}
          </p>
        </div>
        <button
          onClick={mode === 'progress' ? fetchProgress : fetchIncons}
          disabled={isLoading}
          className="btn-ghost"
          style={{ flexShrink: 0, borderColor: `${active.color}33`, color: active.color }}
        >
          {isLoading
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
            : <><RefreshCw size={13} /> {text ? 'Refresh' : 'Run'}</>}
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div style={{
          padding: '1.5rem', borderRadius: 14,
          background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
          display: 'flex', flexDirection: 'column', gap: '0.625rem',
        }}>
          {[100, 85, 70, 90, 60].map((w, i) => (
            <div key={i} className="shimmer-bar" style={{ height: 14, width: `${w}%` }} />
          ))}
        </div>
      )}

      {text && !isLoading && (
        <div style={{
          padding: '1.5rem', borderRadius: 14,
          background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
        }}>
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        </div>
      )}

      {!text && !isLoading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '1rem', padding: '3rem 2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: active.accent, border: `1px solid ${active.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active.color,
          }}>
            {mode === 'progress' ? <TrendingUp size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
              {mode === 'progress' ? 'No progress report yet' : 'No scan run yet'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
              Upload files first, then click Run to generate the {mode === 'progress' ? 'progress report' : 'inconsistency scan'}
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
