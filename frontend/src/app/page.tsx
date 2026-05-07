'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain, Upload, MessageSquare, CheckSquare, Clock, BarChart2,
  Wifi, WifiOff, Database, Layers, GitBranch, Trash2, ChevronRight,
  Sparkles, Activity, Zap, Files
} from 'lucide-react';
import UploadZone from '@/components/UploadZone';
import QueryPanel from '@/components/QueryPanel';
import TodoPanel from '@/components/TodoPanel';
import Timeline from '@/components/Timeline';
import AnalysisPanel from '@/components/AnalysisPanel';
import { getStats, resetMemory, healthCheck, ProjectStats } from '@/lib/api';

type Tab = 'upload' | 'query' | 'todos' | 'timeline' | 'analysis';

const TABS: { id: Tab; label: string; sub: string; icon: React.ReactNode; accent: string }[] = [
  {
    id: 'upload', label: 'Ingest', sub: 'Add files',
    icon: <Upload size={15} />, accent: '#3b82f6',
  },
  {
    id: 'query', label: 'Ask', sub: 'Chat with project',
    icon: <MessageSquare size={15} />, accent: '#8b5cf6',
  },
  {
    id: 'todos', label: 'TODOs', sub: 'AI-detected tasks',
    icon: <CheckSquare size={15} />, accent: '#f59e0b',
  },
  {
    id: 'timeline', label: 'Memory', sub: 'File history',
    icon: <Clock size={15} />, accent: '#22d3ee',
  },
  {
    id: 'analysis', label: 'Insights', sub: 'Deep analysis',
    icon: <BarChart2 size={15} />, accent: '#10b981',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetting, setResetting] = useState(false);

  const loadStats = useCallback(async () => {
    try { setStats(await getStats()); } catch { setStats(null); }
  }, []);

  const checkHealth = useCallback(async () => {
    const alive = await healthCheck();
    setOnline(alive);
    if (alive) loadStats();
  }, [loadStats]);

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 30000);
    return () => clearInterval(t);
  }, [checkHealth]);

  const handleUploadSuccess = () => {
    setRefreshKey(k => k + 1);
    loadStats();
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL project memory? This cannot be undone.')) return;
    setResetting(true);
    try {
      await resetMemory();
      setStats(null);
      setRefreshKey(k => k + 1);
    } finally { setResetting(false); }
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ background: 'var(--bg-void)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '15%',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', left: '40%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ── Header ── */}
      <header className="app-header" style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 4px 20px rgba(59,130,246,0.3)',
            }}>
              <Brain size={18} color="white" />
            </div>
            {online === true && (
              <div style={{
                position: 'absolute', top: -2, right: -2,
                width: 10, height: 10,
                background: '#10b981', borderRadius: '50%',
                border: '2px solid var(--bg-void)',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, lineHeight: 1.2 }} className="gradient-text">
              Second Brain
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }}>
              AI Cofounder for Builders
            </div>
          </div>
        </div>

        {/* Center stats (only when data available) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          {stats && stats.total_files > 0 && (
            <>
              <HeaderStat icon={<Files size={12} />} label="files" value={stats.total_files} />
              <HeaderStat icon={<Layers size={12} />} label="chunks" value={stats.total_chunks} />
              <HeaderStat icon={<GitBranch size={12} />} label="types" value={Object.keys(stats.file_types).length} />
            </>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={online === true ? 'badge badge-green' : online === false ? 'badge badge-red' : 'badge badge-dim'}>
            {online === true ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online === true ? 'Connected' : online === false ? 'Offline' : '...'}
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset all memory"
            style={{
              padding: '0.4rem', borderRadius: 9,
              background: 'transparent', border: '1px solid var(--border-dim)',
              color: 'var(--text-3)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).closest('button')!.style.borderColor = 'rgba(244,63,94,0.35)';
              (e.target as HTMLElement).closest('button')!.style.color = '#fb7185';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).closest('button')!.style.borderColor = 'var(--border-dim)';
              (e.target as HTMLElement).closest('button')!.style.color = 'var(--text-3)';
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── Left Sidebar ── */}
        <nav style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--border-dim)',
          background: 'rgba(8,13,26,0.7)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          padding: '1.25rem 0.75rem',
          gap: 4,
        }}>
          <div className="section-label" style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>Navigation</div>

          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="nav-icon" style={activeTab === tab.id ? {
                background: `linear-gradient(135deg, ${tab.accent}, ${tab.accent}99)`,
                borderColor: 'transparent',
                boxShadow: `0 4px 12px ${tab.accent}44`,
              } : {}}>
                {tab.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{tab.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', lineHeight: 1.3 }}>{tab.sub}</div>
              </div>
              {activeTab === tab.id && <ChevronRight size={12} style={{ color: tab.accent, flexShrink: 0 }} />}
            </button>
          ))}

          {/* Bottom tech stack card */}
          <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-dim)' }}>
            <div style={{
              padding: '0.875rem',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
              border: '1px solid rgba(59,130,246,0.14)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Sparkles size={11} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em' }}>POWERED BY</span>
              </div>
              {['Groq LLaMA 3.3 70B', 'FAISS Vector DB', 'SentenceTransformers'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(59,130,246,0.5)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab page header */}
          <div style={{
            padding: '1.25rem 2rem 1rem',
            borderBottom: '1px solid var(--border-dim)',
            display: 'flex', alignItems: 'center', gap: '1rem',
            flexShrink: 0,
            background: 'rgba(8,13,26,0.4)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${activeTabMeta.accent}22, ${activeTabMeta.accent}11)`,
              border: `1px solid ${activeTabMeta.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: activeTabMeta.accent,
              flexShrink: 0,
            }}>
              {activeTabMeta.icon}
            </div>
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
                {activeTabMeta.label}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                {activeTabMeta.sub}
              </p>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'query' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <QueryPanel />
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              <div style={{ maxWidth: 780 }}>
                {activeTab === 'upload'   && <UploadZone onSuccess={handleUploadSuccess} />}
                {activeTab === 'todos'    && <TodoPanel />}
                {activeTab === 'timeline' && <Timeline refreshKey={refreshKey} />}
                {activeTab === 'analysis' && <AnalysisPanel />}
              </div>
            </div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside style={{
          width: 260, flexShrink: 0,
          borderLeft: '1px solid var(--border-dim)',
          background: 'rgba(8,13,26,0.7)',
          backdropFilter: 'blur(20px)',
          overflowY: 'auto',
          padding: '1.25rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
        }}>
          {/* Brain Status */}
          <div>
            <div className="section-label">Brain Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <StatCard
                icon={<Database size={15} />}
                iconBg="rgba(59,130,246,0.15)"
                iconColor="#60a5fa"
                label="Files Ingested"
                value={stats?.total_files ?? 0}
              />
              <StatCard
                icon={<Layers size={15} />}
                iconBg="rgba(139,92,246,0.15)"
                iconColor="#a78bfa"
                label="Memory Chunks"
                value={stats?.total_chunks ?? 0}
              />
              <StatCard
                icon={<Activity size={15} />}
                iconBg="rgba(34,211,238,0.15)"
                iconColor="#22d3ee"
                label="File Types"
                value={Object.keys(stats?.file_types ?? {}).length}
              />
            </div>
          </div>

          {/* File type breakdown */}
          {stats && Object.keys(stats.file_types).length > 0 && (
            <div>
              <div className="section-label">Type Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {Object.entries(stats.file_types).map(([type, count]) => {
                  const pct = Math.round((count / stats.total_files) * 100);
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{type}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>{count} · {pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Ask */}
          <div>
            <div className="section-label">Quick Ask</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                'Summarize project in 3 bullets',
                "What's the biggest risk?",
                'What should I build next?',
                'List all API endpoints',
              ].map(q => (
                <button key={q} className="quick-ask-btn" onClick={() => setActiveTab('query')}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Last updated */}
          {stats?.last_updated && (
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-4)', fontFamily: 'JetBrains Mono, monospace' }}>
                Last sync<br />
                <span style={{ color: 'var(--text-3)' }}>{new Date(stats.last_updated).toLocaleString()}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ color: 'var(--text-4)' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{label}</span>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{label}</div>
        <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, fontFamily: 'JetBrains Mono, monospace' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
