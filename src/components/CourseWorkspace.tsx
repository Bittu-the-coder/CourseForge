import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  FileText, 
  Plus, 
  BrainCircuit, 
  FolderPlus,
  GripVertical,
  FolderOpen,
  Inbox,
  Trash2,
  X,
  Globe,
  Construction,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Course, Note, Video, Module } from '../types';
import { YouTubePlayer, type YouTubePlayerHandle } from './YouTubePlayer';
import { togglePublishCourse } from '../services/api';

interface CourseWorkspaceProps {
  course: Course;
  notes: Note[];
  initialVideoId?: string;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onAddNote: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onGrantXP: (xp: number) => void;
  onNavigate: (tab: string) => void;
}

export const CourseWorkspace: React.FC<CourseWorkspaceProps> = ({
  course,
  notes,
  initialVideoId,
  onUpdateCourse,
  onDeleteCourse,
  onAddNote,
  onDeleteNote,
  onGrantXP,
  onNavigate,
}) => {
  const allVideos = course.videos;

  const getStartingVideoId = (): string => {
    if (initialVideoId && allVideos.some((v) => v.id === initialVideoId)) {
      return initialVideoId;
    }
    if (typeof localStorage !== 'undefined') {
      const lastVid = localStorage.getItem(`courseforge_last_vid_${course.id}`);
      if (lastVid && allVideos.some((v) => v.id === lastVid)) return lastVid;
    }
    const firstIncomplete = allVideos.find((v) => !v.isCompleted);
    if (firstIncomplete) return firstIncomplete.id;
    return allVideos[0]?.id || '';
  };

  const [activeVideoId, setActiveVideoId] = useState<string>(getStartingVideoId);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'notes' | 'ai'>(
    initialVideoId ? 'curriculum' : 'curriculum'
  );

  const activeVideo = allVideos.find((v) => v.id === activeVideoId) || allVideos[0];
  const activeIndex = allVideos.findIndex((v) => v.id === activeVideoId);

  // Player state
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const playerHandleRef = useRef<YouTubePlayerHandle>(null);

  const handleSelectVideo = (vidId: string) => {
    setActiveVideoId(vidId);
    setActiveTab('curriculum');
  };

  // Smart Notes form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Module management
  const [showModuleManager, setShowModuleManager] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);

  // Filter notes VIDEO-WISE (shows only notes for the currently active video)
  const videoNotes = notes.filter(
    (n) => n.courseId === course.id && (!n.videoId || n.videoId === activeVideo?.id)
  );

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const jumpToTimestamp = (seconds: number) => {
    setCurrentTimestamp(seconds);
    if (playerHandleRef.current) {
      playerHandleRef.current.seekTo(seconds);
    }
  };

  // Get exact current time from player for notes/bookmarks
  const getPlayerTime = (): number => {
    if (playerHandleRef.current) {
      return playerHandleRef.current.getCurrentTime();
    }
    return currentTimestamp;
  };

  // Auto-advance to next video
  const handleNextVideo = () => {
    if (activeIndex >= 0 && activeIndex < allVideos.length - 1) {
      const nextVid = allVideos[activeIndex + 1];
      setActiveVideoId(nextVid.id);
    }
  };

  const handlePreviousVideo = () => {
    if (activeIndex > 0) {
      const prevVid = allVideos[activeIndex - 1];
      setActiveVideoId(prevVid.id);
    }
  };

  // Listen to YouTube player state messages (State 0 = Ended -> Auto play next)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        
        // Handle all YouTube IFrame API event structures for ENDED state (playerState === 0 or info === 0 or state === 0)
        const isEnded = 
          (data?.event === 'infoDelivery' && data?.info?.playerState === 0) ||
          (data?.event === 'onStateChange' && (data?.info === 0 || data?.data === 0));

        if (isEnded && activeVideo) {
          handleToggleCompleteVideo(activeVideo.id, true);
        }
      } catch {
        // Ignored
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeVideoId, activeIndex, allVideos]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const ts = getPlayerTime();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      courseId: course.id,
      videoId: activeVideo?.id,
      timestamp: ts,
      timestampFormatted: formatTime(ts),
      title: noteTitle || `Note @ ${formatTime(ts)}`,
      content: noteContent,
      tags: noteTags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddNote(newNote);
    onGrantXP(15);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
  };

  // Mark Video Completed & Auto Advance
  const handleToggleCompleteVideo = (vidId: string, forceComplete: boolean = false) => {
    const targetVid = course.videos.find((v) => v.id === vidId);
    if (!targetVid) return;

    const newlyCompleted = forceComplete ? true : !targetVid.isCompleted;

    const updatedVideos = course.videos.map((v) => {
      if (v.id === vidId) {
        return { ...v, isCompleted: newlyCompleted, completedAt: newlyCompleted ? new Date().toISOString() : undefined };
      }
      return v;
    });

    onUpdateCourse({ ...course, videos: updatedVideos, lastOpenedAt: new Date().toISOString() });

    if (newlyCompleted && !targetVid.isCompleted) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      onGrantXP(50);
    }
  };

  // Publish/Unpublish course to community
  const handleTogglePublish = async () => {
    const newPublic = !course.isPublic;
    const msg = newPublic
      ? `Publish "${course.title}" to the community? Others will be able to see and follow this course.`
      : `Unpublish "${course.title}"? It will no longer be visible to the community.`;
    if (!confirm(msg)) return;
    await togglePublishCourse(course.id, newPublic);
    onUpdateCourse({ ...course, isPublic: newPublic });
  };

  // Module Management
  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: Module = {
      id: `mod-${Date.now()}`,
      title: newModuleTitle,
      order: (course.modules?.length || 0) + 1,
    };
    onUpdateCourse({
      ...course,
      modules: [...(course.modules || []), newModule],
    });
    setNewModuleTitle('');
  };

  const handleDeleteModule = (moduleId: string) => {
    const updatedVideos = course.videos.map((v) =>
      v.moduleId === moduleId ? { ...v, moduleId: undefined } : v
    );
    const updatedModules = (course.modules || []).filter((m) => m.id !== moduleId);
    onUpdateCourse({ ...course, videos: updatedVideos, modules: updatedModules });
  };

  const handleDropVideoOnModule = (moduleId: string | undefined) => {
    if (!draggedVideoId) return;
    const updatedVideos = course.videos.map((v) =>
      v.id === draggedVideoId ? { ...v, moduleId } : v
    );
    onUpdateCourse({ ...course, videos: updatedVideos });
    setDraggedVideoId(null);
  };

  const modules = course.modules || [];
  const uncategorizedVideos = allVideos.filter((v) => !v.moduleId);
  const getModuleVideos = (moduleId: string) => allVideos.filter((v) => v.moduleId === moduleId);

  const renderVideoRow = (vid: Video, draggable: boolean = false) => {
    const isActive = vid.id === activeVideo?.id;
    return (
      <div
        key={vid.id}
        draggable={draggable}
        onDragStart={(e) => {
          setDraggedVideoId(vid.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setDraggedVideoId(null)}
        onClick={() => handleSelectVideo(vid.id)}
        className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all ${
          isActive
            ? 'bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-semibold'
            : 'hover:bg-canvas-soft/60 text-ink-body'
        } ${draggedVideoId === vid.id ? 'opacity-40' : ''}`}
      >
        <div className="flex items-center gap-2 text-xs min-w-0">
          {draggable && <GripVertical className="w-3 h-3 text-ink-muted flex-shrink-0 cursor-grab" />}
          {vid.isCompleted ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <Play className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
          )}
          <span className="line-clamp-1">{vid.title}</span>
        </div>
        <span className="font-mono text-[10px] text-ink-muted flex-shrink-0 ml-2">{vid.durationFormatted}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6 animate-in fade-in">
      
      {/* Course Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted mb-1">
            <span className="px-2 py-0.5 rounded-sm bg-brand-orange/10 text-brand-orange font-semibold uppercase">{course.category}</span>
            <span>•</span>
            <span>Lesson {activeIndex + 1} of {allVideos.length}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-normal text-ink tracking-tight">
            {course.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModuleManager(!showModuleManager)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hairline-strong bg-canvas-card text-xs font-semibold text-ink hover:border-ink hover:bg-canvas-soft transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Manage Modules
          </button>

          <button
            onClick={handleTogglePublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
              course.isPublic
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                : 'border-hairline-strong bg-canvas-card text-ink hover:border-ink hover:bg-canvas-soft'
            }`}
            title={course.isPublic ? 'Unpublish from Community' : 'Publish to Community'}
          >
            <Globe className="w-3.5 h-3.5" /> {course.isPublic ? 'Published ✓' : 'Publish'}
          </button>

          <button
            onClick={() => onNavigate('roadmap')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-semibold hover:bg-brand-orange/20 transition-colors"
          >
            <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain rounded-sm" /> View Roadmap
          </button>

          {onDeleteCourse && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
                  onDeleteCourse(course.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-600 text-xs font-semibold hover:bg-red-500/20 transition-colors"
              title="Delete Course"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Module Manager Drawer */}
      {showModuleManager && (
        <div className="card-hairline p-5 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-brand-orange" /> Module Organization
            </h3>
            <button onClick={() => setShowModuleManager(false)} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-ink-muted">
            Create modules and drag videos into them to structure your curriculum.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
              placeholder="New module name..."
              className="flex-1 px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
            />
            <button
              onClick={handleCreateModule}
              disabled={!newModuleTitle.trim()}
              className="px-4 py-2 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={() => handleDropVideoOnModule(mod.id)}
                className="p-3 rounded-lg border border-dashed border-hairline-strong bg-canvas-soft space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-brand-orange" /> {mod.title}
                  </span>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="text-ink-muted hover:text-red-500 transition-colors"
                    title="Delete module"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {getModuleVideos(mod.id).map((v) => renderVideoRow(v, true))}
                  {getModuleVideos(mod.id).length === 0 && (
                    <p className="text-[10px] text-ink-muted italic py-2 text-center">Drop videos here</p>
                  )}
                </div>
              </div>
            ))}

            <div
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={() => handleDropVideoOnModule(undefined)}
              className="p-3 rounded-lg border border-dashed border-hairline bg-canvas space-y-2"
            >
              <span className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5" /> Uncategorized
              </span>
              <div className="space-y-1">
                {uncategorizedVideos.map((v) => renderVideoRow(v, true))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Udemy-Style Main View (Player Left, Internal Scroll Sidebar Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Custom Video Player */}
        <div className="lg:col-span-7 space-y-4">
          {activeVideo ? (
            <YouTubePlayer
              ref={playerHandleRef}
              key={activeVideo.id}
              video={activeVideo}
              courseId={course.id}
              onVideoEnded={() => {
                handleToggleCompleteVideo(activeVideo.id, true);
                handleNextVideo();
              }}
              onToggleComplete={() => handleToggleCompleteVideo(activeVideo.id)}
              onTimeUpdate={(t) => setCurrentTimestamp(t)}
              onNext={handleNextVideo}
              onPrevious={handlePreviousVideo}
              hasNext={activeIndex < allVideos.length - 1}
              hasPrevious={activeIndex > 0}
            />
          ) : (
            <div className="card-hairline w-full aspect-video bg-black rounded-xl flex items-center justify-center text-white text-sm">
              Select a video lesson to begin playback
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Udemy-Style Internal Scroll Curriculum & Workspace Tabs */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tab Selector */}
          <div className="flex border border-hairline bg-canvas-soft rounded-xl overflow-hidden p-1 gap-1">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-canvas-card text-brand-orange font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Curriculum
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'notes'
                  ? 'bg-canvas-card text-brand-orange font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Notes ({videoNotes.length})
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-canvas-card text-brand-orange font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" /> AI
            </button>
          </div>

          {/* TAB 0: Udemy-Style Internal Scroll Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="card-hairline p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-xs font-semibold font-mono uppercase text-ink">Course Content</span>
                <span className="text-[11px] text-ink-muted font-mono">
                  {allVideos.filter((v) => v.isCompleted).length}/{allVideos.length} Completed
                </span>
              </div>

              {/* Scrollable Container so entire page doesn't scroll */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {modules.map((mod) => {
                  const modVideos = getModuleVideos(mod.id);
                  if (modVideos.length === 0) return null;
                  return (
                    <div key={mod.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-ink border-b border-hairline/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="w-3 h-3 text-brand-orange" /> {mod.title}
                        </span>
                        <span className="text-ink-muted font-mono text-[10px]">{modVideos.length} videos</span>
                      </div>
                      <div className="space-y-1">
                        {modVideos.map((vid) => renderVideoRow(vid))}
                      </div>
                    </div>
                  );
                })}

                {uncategorizedVideos.length > 0 && (
                  <div className="space-y-1.5">
                    {modules.length > 0 && (
                      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted border-b border-hairline/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <Inbox className="w-3 h-3" /> Uncategorized
                        </span>
                        <span className="font-mono text-[10px]">{uncategorizedVideos.length} videos</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {uncategorizedVideos.map((vid) => renderVideoRow(vid))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: Smart Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveNote} className="card-hairline p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono tracking-wider text-brand-orange flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Note @ {formatTime(currentTimestamp)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNoteContent((prev) => prev + `\n⏱ [${formatTime(currentTimestamp)}] `)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20"
                  >
                    + Timestamp
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Note Title (optional)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-hairline bg-canvas text-xs text-ink focus:outline-none focus:border-brand-orange"
                />

                <textarea
                  rows={3}
                  required
                  placeholder="Type markdown note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-hairline bg-canvas text-xs font-mono text-ink focus:outline-none focus:border-brand-orange resize-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Tags (e.g. flexbox, syntax)"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    className="px-2.5 py-1 rounded border border-hairline bg-canvas text-[11px] font-mono text-ink flex-1"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {videoNotes.length === 0 ? (
                  <div className="card-hairline p-6 text-center text-xs text-ink-muted italic">
                    No notes taken for this video yet.
                  </div>
                ) : (
                  videoNotes.map((n) => (
                    <div key={n.id} className="card-hairline p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-ink">{n.title}</h4>
                        <div className="flex items-center gap-2">
                          {n.timestampFormatted && (
                            <button
                              onClick={() => jumpToTimestamp(n.timestamp || 0)}
                              className="px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-mono text-[10px] hover:bg-brand-orange/20 font-semibold"
                            >
                              ⏱ {n.timestampFormatted}
                            </button>
                          )}
                          {onDeleteNote && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this note?')) {
                                  onDeleteNote(n.id);
                                }
                              }}
                              className="text-ink-muted hover:text-red-500 transition-colors p-1"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-ink-body whitespace-pre-wrap font-mono bg-canvas-soft/60 p-2.5 rounded border border-hairline/45">
                        {n.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI — Under Development */}
          {activeTab === 'ai' && (
            <div className="card-hairline p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px]">
              <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                <Construction className="w-8 h-8 text-brand-orange" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-ink">AI Study Coach</h3>
                <p className="text-xs text-ink-muted max-w-[280px]">
                  AI-powered quizzes, explanations, and study assistance are currently under development. Stay tuned!
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-semibold">
                <BrainCircuit className="w-3.5 h-3.5" /> Coming Soon
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
