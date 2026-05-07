import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

export interface UploadResult {
  file_name: string;
  file_type?: string;
  chunk_count?: number;
  summary?: string;
  status: 'success' | 'error' | 'skipped';
  reason?: string;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  created_at: string;
}

export interface TimelineEntry {
  file_name: string;
  file_type: string;
  timestamp: string;
  summary: string | null;
  chunk_count: number;
}

export interface ProjectStats {
  total_files: number;
  total_chunks: number;
  file_types: Record<string, number>;
  last_updated: string | null;
}

export const uploadFiles = async (files: File[]): Promise<{ results: UploadResult[] }> => {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const queryMemory = async (question: string, top_k = 6): Promise<QueryResponse> => {
  const res = await api.post('/query', { question, top_k });
  return res.data;
};

export const getTodos = async (): Promise<{ todos: TodoItem[] }> => {
  const res = await api.get('/todos');
  return res.data;
};

export const getTimeline = async (): Promise<{ timeline: TimelineEntry[] }> => {
  const res = await api.get('/timeline');
  return res.data;
};

export const getStats = async (): Promise<ProjectStats> => {
  const res = await api.get('/stats');
  return res.data;
};

export const getInconsistencies = async (): Promise<{ report: string }> => {
  const res = await api.get('/inconsistencies');
  return res.data;
};

export const getProgress = async (): Promise<{ summary: string }> => {
  const res = await api.get('/progress');
  return res.data;
};

export const deleteFile = async (fileName: string): Promise<void> => {
  await api.delete(`/file/${encodeURIComponent(fileName)}`);
};

export const resetMemory = async (): Promise<void> => {
  await api.delete('/reset');
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};
