'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock, FileText, Code2, ImageIcon, FileArchive, Trash2, RefreshCw
} from 'lucide-react';
import { getTimeline, deleteFile, TimelineEntry } from '@/lib/api';

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  code:     { icon: <Code2 size={13} />,        color: '#60a5fa', bg: 'rgba(59,130,246,0.12)'  },
  markdown: { icon: <FileText size={13} />,     color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  pdf:      { icon: <FileText size={13} />,     color: '#fb7185', bg: 'rgba(244,63,94,0.12)'  },
  image:    { icon: <ImageIcon size={13} />,    color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  text:     { icon: <FileText size={13} />,     color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  docx:     { icon: <FileText size={13} />,     color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  unknown:  { icon: <FileArchive size={13} />,  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'  },
};

function timeAgo(iso: string) {
  const d = +new Date(iso), now = Date.now(), diff = (now - d) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Timeline({ refreshKey }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setEntries((await getTimeline()).timeline); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleDelete = async (name: string) => {
    if (!confirm(`Remove "${name}" from memory?`)) return;
    setDeleting(name);
    try { await deleteFile(name); setEntries(p => p.filter(e => e.file_name !== name)); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <Clock size={18} style={{ color: '#22d3ee' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>Project Memory</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            {entries.length} file{entries.length !== 1 ? 's' : ''} ingested into memory
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && !loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '0.75rem', padding: '3rem', textAlign: 'center',
        }}>
          <Clock size={30} style={{ color: 'var(--text-4)' }} />
          <p style={{ color: 'var(--text-4)', fontSize: '0.875rem' }}>No files ingested yet</p>
        </div>
      )}

      {/* Timeline list */}
      {entries.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div className="tl-line" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '2.5rem' }}>
            {entries.map((entry, idx) => {
              const meta = TYPE_META[entry.file_type] || TYPE_META.unknown;
              return (
                <div key={entry.file_name} style={{ display: 'flex', gap: '0', position: 'relative' }}>
                  {/* Dot on the left line */}
                  <div className={`tl-dot${idx === 0 ? ' first' : ''}`}
                    style={{
                      position: 'absolute', left: '-2.5rem',
                      color: meta.color, background: meta.bg,
                      borderColor: `${meta.color}33`,
                    }}>
                    {meta.icon}
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, padding: '0.875rem 1rem', borderRadius: 12,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
                    transition: 'all 0.2s ease',
                    animation: 'fade-up 0.2s ease both',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-base)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-dim)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.375rem', marginBottom: 4 }}>
                          <span style={{
                            fontSize: '0.8125rem', fontWeight: 600,
                            fontFamily: 'JetBrains Mono, monospace',
                            color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220,
                          }}>
                            {entry.file_name}
                          </span>
                          <span style={{
                            fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: 5,
                            background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`,
                            fontWeight: 600, flexShrink: 0,
                          }}>
                            {entry.file_type}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', flexShrink: 0 }}>
                            {entry.chunk_count} chunk{entry.chunk_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {entry.summary && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {entry.summary}
                          </p>
                        )}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-4)' }}>
                          {timeAgo(entry.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.file_name)}
                        disabled={deleting === entry.file_name}
                        style={{
                          padding: 6, borderRadius: 7, background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--text-4)', flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'none'; }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
