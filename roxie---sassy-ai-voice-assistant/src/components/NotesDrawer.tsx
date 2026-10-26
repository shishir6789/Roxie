import React, { useState, useEffect } from 'react';
import { StickyNote, X, Trash2, Copy, Plus, Check } from 'lucide-react';
import { ThemeConfig } from '../types/assistant';

export interface NoteItem {
  id: string;
  title?: string;
  text: string;
  timestamp: number;
}

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onDeleteNote: (id: string) => void;
  onAddNote: (text: string, title?: string) => void;
  theme: ThemeConfig;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onDeleteNote,
  onAddNote,
  theme,
}) => {
  const [newText, setNewText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddNote(newText.trim(), 'Quick Note');
    setNewText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-neutral-900/95 border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white max-h-[85vh] flex flex-col"
        style={{ boxShadow: `0 0 50px -10px ${theme.glow}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">Roxie Scratchpad & Memos</h2>
              <p className="text-xs text-white/50">{notes.length} note(s) saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar min-h-[160px]">
          {notes.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No notes yet!</p>
              <p className="mt-1">Say: &ldquo;রক্সি, একটা নোট লিখে রাখো...&rdquo;</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 font-mono">
                    {note.title || 'Memo'}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleCopy(note.text, note.id)}
                      className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white"
                      title="Copy text"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed font-sans">{note.text}</p>
                <span className="text-[10px] text-white/40 block font-mono">
                  {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Quick Add input */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type a quick memo..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
