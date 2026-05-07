'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, CheckCircle2, AlertCircle, Loader2,
  FileText, Code2, ImageIcon, FileArchive, ChevronRight
} from 'lucide-react';
import { uploadFiles, UploadResult } from '@/lib/api';

interface Props { onSuccess?: () => void; }

const EXT_ICON = (ft: string) => {
  if (ft === 'code')     return <Code2 size={13} style={{ color: '#60a5fa' }} />;
  if (ft === 'markdown') return <FileText size={13} style={{ color: '#a78bfa' }} />;
  if (ft === 'pdf')      return <FileText size={13} style={{ color: '#fb7185' }} />;
  if (ft === 'image')    return <ImageIcon size={13} style={{ color: '#34d399' }} />;
  if (ft === 'docx')     return <FileText size={13} style={{ color: '#60a5fa' }} />;
  return <FileText size={13} style={{ color: '#fbbf24' }} />;
};

const FILE_TYPES = ['.py','.js','.ts','.md','.txt','.pdf','.png','.jpg','.docx','.json','.yaml','.env'];

export default function UploadZone({ onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...accepted.filter(f => !names.has(f.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true, maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (name: string) => setPendingFiles(prev => prev.filter(f => f.name !== name));

  const handleUpload = async () => {
    if (!pendingFiles.length) return;
    setUploading(true);
    setResults([]);
    try {
      const data = await uploadFiles(pendingFiles);
      setResults(data.results);
      setPendingFiles([]);
      onSuccess?.();
    } catch (err: any) {
      setResults([{ file_name: 'Upload Failed', status: 'error', reason: err?.response?.data?.detail || err.message }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
        style={{ cursor: 'pointer' }}
      >
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: isDragActive
              ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.2))'
              : 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
            border: `1px solid ${isDragActive ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s ease',
            boxShadow: isDragActive ? '0 0 30px rgba(59,130,246,0.2)' : 'none',
          }}>
            <Upload size={26} style={{ color: isDragActive ? '#60a5fa' : '#3b82f6', transition: 'all 0.25s' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
              {isDragActive ? 'Release to ingest files' : 'Drag & drop your project files'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
              Code, READMEs, notes, PDFs, diagrams, voice transcripts — anything
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center', maxWidth: 480 }}>
            {FILE_TYPES.map(ext => (
              <span key={ext} style={{
                fontSize: '0.6875rem', padding: '0.15rem 0.5rem', borderRadius: 6,
                background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.14)',
                color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace',
              }}>{ext}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 600 }}>
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} queued
            </span>
            <button
              onClick={() => setPendingFiles([])}
              style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 200, overflowY: 'auto' }}>
            {pendingFiles.map(file => (
              <div key={file.name} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem', borderRadius: 10,
                background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
              }}>
                <FileArchive size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-4)', flexShrink: 0 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button onClick={e => { e.stopPropagation(); removeFile(file.name); }}
                  style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {uploading ? (
              <><Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Ingesting into Brain...</>
            ) : (
              <><Upload size={16} /> Ingest {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="section-label">Upload Results</div>
          {results.map((r, i) => (
            <div key={i} style={{
              padding: '0.875rem', borderRadius: 12,
              background: r.status === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
              border: `1px solid ${r.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              {r.status === 'success'
                ? <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={16} style={{ color: '#fb7185', flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.file_name}
                </p>
                {r.summary && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>
                    {r.summary}
                  </p>
                )}
                {r.reason && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>{r.reason}</p>
                )}
                {r.chunk_count && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-4)', marginTop: 3 }}>
                    {r.chunk_count} chunks indexed
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {pendingFiles.length === 0 && results.length === 0 && (
        <div style={{
          padding: '1.25rem', borderRadius: 14,
          background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem' }}>
            💡 What to upload
          </div>
          {[
            ['Source code', 'Any language — .py, .js, .ts, .go…'],
            ['Documentation', 'README, architecture notes, specs'],
            ['Design files', 'Screenshots, diagrams, mockups'],
            ['Data & configs', 'JSON, YAML, .env files'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ChevronRight size={12} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>{title}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
