import React from 'react';
import { 
  Plus, 
  Play, 
  CheckCircle, 
  BookOpen, 
  TrendingUp,
  FileText,
  Trash2
} from 'lucide-react';
import type { Course, Note, GamificationState, UserProgress } from '../types';

interface DashboardProps {
  courses: Course[];
  notes: Note[];
  gamification: GamificationState;
  progress: UserProgress;
  onSelectCourse: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  courses,
  notes,
  onSelectCourse,
  onDeleteCourse,
  onNavigate,
}) => {
  const activeCourses = courses.filter((c) => !c.isArchived);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* Hero Welcome Band */}
      <div className="relative overflow-hidden rounded-xl border border-hairline bg-canvas-soft p-8 md:p-12">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold uppercase tracking-wider font-mono">
            <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain rounded-sm" /> CourseForge Studio
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-normal tracking-tight md:tracking-tighter leading-tight text-ink">
            Turn YouTube into a structured university.
          </h1>
          <p className="text-sm md:text-base text-ink-body font-normal max-w-2xl leading-relaxed">
            Build personal courses, organize chapters, take timestamped markdown notes, and track your step-by-step progress.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('builder')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Create New Course
            </button>

            <button
              onClick={() => onNavigate('roadmap')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-hairline-strong bg-canvas-card text-xs font-semibold text-ink hover:border-ink hover:bg-canvas-soft transition-colors active:scale-[0.98]"
            >
              <TrendingUp className="w-4 h-4 text-brand-orange" /> View Learning Roadmap
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Active Courses & Sidebar Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2-cols: Active Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <div>
              <h2 className="text-2xl font-normal text-ink tracking-tight">Active Courses</h2>
              <p className="text-xs text-ink-muted">Pick up right where you left off</p>
            </div>

            <button
              onClick={() => onNavigate('builder')}
              className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
            >
              + Add Video/Playlist
            </button>
          </div>

          {activeCourses.length === 0 ? (
            <div className="card-hairline p-12 text-center space-y-4 bg-canvas-soft">
              <div className="w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-normal text-ink">No active courses yet</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Paste any YouTube video or playlist URL to automatically generate your first structured course.
              </p>
              <button
                onClick={() => onNavigate('builder')}
                className="px-5 py-2.5 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors"
              >
                Build Your First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCourses.map((course) => {
                const totalCourseVideos = course.videos.length;
                const completedCourseVideos = course.videos.filter((v) => v.isCompleted).length;
                const percent = totalCourseVideos > 0 ? Math.round((completedCourseVideos / totalCourseVideos) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                    className="card-hairline overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200"
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div className="relative h-44 w-full bg-black overflow-hidden group/thumb">
                        <img
                          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-sm bg-black/70 text-white font-mono text-[10px] uppercase font-semibold border border-white/10">
                            {course.category}
                          </span>
                        </div>

                        {onDeleteCourse && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete course "${course.title}"?`)) {
                                onDeleteCourse(course.id);
                              }
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-md bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                          <span className="text-xs font-mono text-white/80">
                            {completedCourseVideos} / {totalCourseVideos} Lessons
                          </span>
                          <span className="text-xs font-mono font-semibold text-brand-orange">
                            {percent}%
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h3 className="font-semibold text-base text-ink line-clamp-2 leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-ink-muted line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer progress bar */}
                    <div className="p-5 pt-0 space-y-3">
                      <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                        <span className="text-ink-muted font-mono">{course.channelName}</span>
                        <span className="font-semibold text-brand-orange flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <Play className="w-3.5 h-3.5" /> Resume Lesson
                        </span>
                      </div>

                      <div className="w-full h-1 bg-canvas-strong dark:bg-canvas-strong/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1-col: Recent Notes */}
        <div className="space-y-6">
          
          {/* Recent Smart Notes */}
          <div className="card-hairline p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-orange" /> Recent Notes
              </h3>
              <span className="text-[10px] font-mono text-ink-muted">{notes.length} total</span>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-ink-muted italic">No notes saved yet. Add timestamped notes while watching lessons.</p>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onSelectCourse(n.courseId)}
                    className="p-3.5 rounded-lg border border-hairline/80 hover:border-brand-orange/40 bg-canvas-soft/40 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink line-clamp-1">{n.title}</span>
                      {n.timestampFormatted && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-mono text-[10px]">
                          ⏱ {n.timestampFormatted}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted line-clamp-2 font-mono">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
