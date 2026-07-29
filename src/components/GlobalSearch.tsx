import React, { useState } from 'react';
import { Search, BookOpen, Bookmark, X } from 'lucide-react';
import type { Course, Note, Bookmark as BookmarkType } from '../types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  notes: Note[];
  bookmarks: BookmarkType[];
  onSelectCourse: (courseId: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  courses,
  notes,
  bookmarks,
  onSelectCourse,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const matchedCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchedNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
  );

  const matchedBookmarks = bookmarks.filter((b) =>
    b.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20 animate-in fade-in">
      <div className="bg-canvas-card border border-hairline dark:border-hairline/20 rounded-xl max-w-2xl w-full overflow-hidden relative space-y-4 p-4">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-hairline pb-3">
          <Search className="w-5 h-5 text-brand-orange absolute left-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search across courses, videos, notes, bookmarks, & tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2 bg-transparent text-sm text-ink focus:outline-none font-mono"
          />
          <button onClick={onClose} className="absolute right-3 text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* Courses */}
          {matchedCourses.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase text-ink-muted">Courses</span>
              {matchedCourses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCourse(c.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-canvas-soft cursor-pointer border border-hairline/45"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-orange" />
                    <span className="font-semibold text-ink">{c.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-muted">{c.category}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {matchedNotes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase text-ink-muted">Notes</span>
              {matchedNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    onSelectCourse(n.courseId);
                    onClose();
                  }}
                  className="p-2.5 rounded-md hover:bg-canvas-soft cursor-pointer border border-hairline/45 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{n.title}</span>
                    {n.timestampFormatted && <span className="font-mono text-[10px] text-brand-orange">⏱ {n.timestampFormatted}</span>}
                  </div>
                  <p className="line-clamp-1 font-mono text-ink-muted">{n.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bookmarks */}
          {matchedBookmarks.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase text-ink-muted">Bookmarks</span>
              {matchedBookmarks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectCourse(b.courseId);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-canvas-soft cursor-pointer border border-hairline/45"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-ink">{b.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-500 font-semibold">⏱ {b.timestampFormatted}</span>
                </div>
              ))}
            </div>
          )}

          {query.trim() !== '' && matchedCourses.length === 0 && matchedNotes.length === 0 && matchedBookmarks.length === 0 && (
            <div className="p-8 text-center text-ink-muted italic font-mono">
              No matching results found for "{query}".
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
