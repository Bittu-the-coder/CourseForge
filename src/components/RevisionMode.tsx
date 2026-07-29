import React, { useState } from 'react';
import { 
  RotateCcw, 
  Bookmark, 
  FileText, 
  Play, 
  ArrowRight
} from 'lucide-react';
import type { Course, Note, Bookmark as BookmarkType } from '../types';

interface RevisionModeProps {
  courses: Course[];
  notes: Note[];
  bookmarks: BookmarkType[];
  onSelectCourse: (courseId: string) => void;
}

export const RevisionMode: React.FC<RevisionModeProps> = ({
  courses,
  notes,
  bookmarks,
  onSelectCourse,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'incomplete' | 'bookmarks' | 'notes'>('all');

  // Collect all incomplete videos across courses
  const incompleteLessons = courses.flatMap((c) =>
    c.videos.filter((v) => !v.isCompleted).map((v) => ({ ...v, courseTitle: c.title, courseId: c.id }))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="border-b border-hairline pb-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase font-mono">
          <RotateCcw className="w-3.5 h-3.5" /> High-Retention Revision Studio
        </div>
        <h1 className="text-2xl md:text-3xl font-normal text-ink">
          Focused Revision & Memory Practice
        </h1>
        <p className="text-xs text-ink-muted">
          Review your incomplete videos, timestamp bookmarks, and smart notes to solidify what you've learned.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All Revision Items (${incompleteLessons.length + bookmarks.length + notes.length})` },
          { id: 'incomplete', label: `Incomplete Lessons (${incompleteLessons.length})` },
          { id: 'bookmarks', label: `Timestamp Bookmarks (${bookmarks.length})` },
          { id: 'notes', label: `Important Notes (${notes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-md text-xs font-semibold font-mono transition-colors ${
              activeFilter === tab.id
                ? 'bg-brand-orange text-white'
                : 'bg-canvas-soft border border-hairline text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Render Incomplete Lessons */}
        {(activeFilter === 'all' || activeFilter === 'incomplete') &&
          incompleteLessons.slice(0, 6).map((vid) => (
            <div key={vid.id} className="card-hairline p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-sm bg-brand-orange/10 text-brand-orange text-[10px] font-mono font-semibold uppercase">
                    Incomplete Lesson
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">{vid.durationFormatted}</span>
                </div>
                <h3 className="font-semibold text-sm text-ink line-clamp-2">{vid.title}</h3>
                <p className="text-xs text-ink-muted line-clamp-1 mt-1 font-mono">{vid.courseTitle}</p>
              </div>

              <button
                onClick={() => onSelectCourse(vid.courseId)}
                className="w-full py-2 rounded-md bg-canvas-soft border border-hairline hover:border-brand-orange text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition-colors mt-4"
              >
                <Play className="w-3.5 h-3.5 text-brand-orange" /> Resume Video
              </button>
            </div>
          ))}

        {/* Render Bookmarks */}
        {(activeFilter === 'all' || activeFilter === 'bookmarks') &&
          bookmarks.map((bm) => (
            <div key={bm.id} className="card-hairline p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-semibold uppercase flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Timestamp Bookmark
                  </span>
                  <span className="px-2 py-0.5 rounded-sm bg-canvas-strong text-[10px] font-mono font-semibold text-ink">
                    ⏱ {bm.timestampFormatted}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-ink">{bm.label}</h3>
                <p className="text-xs text-ink-muted line-clamp-1 mt-1 font-mono">{bm.videoTitle}</p>
              </div>

              <button
                onClick={() => onSelectCourse(bm.courseId)}
                className="w-full py-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5 mt-4"
              >
                <Play className="w-3.5 h-3.5" /> Jump to Bookmark
              </button>
            </div>
          ))}

        {/* Render Smart Notes */}
        {(activeFilter === 'all' || activeFilter === 'notes') &&
          notes.map((n) => (
            <div key={n.id} className="card-hairline p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-500 text-[10px] font-mono font-semibold uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Smart Note
                  </span>
                  {n.timestampFormatted && (
                    <span className="text-[10px] font-mono text-ink-muted">⏱ {n.timestampFormatted}</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-ink">{n.title}</h3>
                <p className="text-xs text-ink-muted line-clamp-3 mt-1 font-mono bg-canvas-soft p-2 rounded-sm border border-hairline-soft">
                  {n.content}
                </p>
              </div>

              <button
                onClick={() => onSelectCourse(n.courseId)}
                className="w-full py-2 rounded-md bg-canvas-soft border border-hairline hover:border-brand-orange text-xs font-semibold text-ink flex items-center justify-center gap-1.5 transition-colors mt-4"
              >
                <ArrowRight className="w-3.5 h-3.5 text-brand-orange" /> Open Note Context
              </button>
            </div>
          ))}

      </div>

    </div>
  );
};
