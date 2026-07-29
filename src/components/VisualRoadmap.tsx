import React, { useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Lock, 
  Play,
  Layers,
  Inbox
} from 'lucide-react';
import type { Course, Video, Module } from '../types';

interface VisualRoadmapProps {
  courses: Course[];
  onSelectCourse: (courseId: string, videoId?: string) => void;
}

export const VisualRoadmap: React.FC<VisualRoadmapProps> = ({ courses, onSelectCourse }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (!selectedCourse) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-ink-muted">
        No course available to display roadmap. Create a course first!
      </div>
    );
  }

  // Get videos for specific module
  const getModuleVideos = (moduleId: string): Video[] =>
    selectedCourse.videos.filter((v) => v.moduleId === moduleId);

  // Get videos that have no assigned module
  const uncategorizedVideos = selectedCourse.videos.filter((v) => !v.moduleId);

  // Prepare modules list
  let modulesList: Array<{ id: string; title: string; description?: string; videos: Video[] }> = [];

  if (selectedCourse.modules && selectedCourse.modules.length > 0) {
    modulesList = selectedCourse.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      videos: getModuleVideos(m.id),
    }));

    if (uncategorizedVideos.length > 0) {
      modulesList.push({
        id: '__uncategorized__',
        title: 'Uncategorized Lessons',
        description: 'Lessons awaiting module assignment',
        videos: uncategorizedVideos,
      });
    }
  } else {
    modulesList = [
      {
        id: '__all__',
        title: 'Curriculum Roadmap',
        description: 'Complete step-by-step video sequence',
        videos: selectedCourse.videos,
      },
    ];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      
      {/* Header & Course Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold uppercase font-mono mb-2">
            <Compass className="w-3.5 h-3.5" /> Interactive Learning Path
          </div>
          <h1 className="text-2xl md:text-3xl font-normal text-ink">
            Visual Roadmap: {selectedCourse.title}
          </h1>
          <p className="text-xs text-ink-muted">
            Track module prerequisites, unlock node steps, and view your step-by-step progress across all {selectedCourse.videos.length} videos.
          </p>
        </div>

        {/* Course Selector Dropdown */}
        {courses.length > 1 && (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2 rounded-md border border-hairline-strong bg-canvas-card text-sm text-ink font-semibold focus:outline-none focus:border-brand-orange focus:ring-0"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Visual Roadmap Flowchart */}
      <div className="relative card-hairline p-6 md:p-10 overflow-x-auto space-y-10">
        <div className="relative z-10 space-y-10">
          {modulesList.map((mod, idx) => {
            const modVideos = mod.videos;
            const isCompleted = modVideos.length > 0 && modVideos.every((v: Video) => v.isCompleted);

            // Unlock logic: first node unlocked, subsequent unlocked if previous completed
            let isUnlocked = true;
            if (idx > 0) {
              const prevMod = modulesList[idx - 1];
              isUnlocked = prevMod.videos.length === 0 || prevMod.videos.every((v: Video) => v.isCompleted);
            }

            const completedCount = modVideos.filter((v: Video) => v.isCompleted).length;

            return (
              <div key={mod.id} className="relative flex flex-col md:flex-row items-start gap-6">
                
                {/* Node Milestone Circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold text-base transition-colors flex-shrink-0 mt-1 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isUnlocked
                      ? 'bg-brand-orange text-white border border-brand-orange/20'
                      : 'bg-canvas-strong text-ink-muted border border-hairline'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : isUnlocked ? (
                    <span className="font-mono">{idx + 1}</span>
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                {/* Milestone Details Card */}
                <div className="flex-1 card-hairline p-5 bg-canvas-card space-y-3 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline-soft pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-brand-orange flex items-center gap-1">
                        {mod.id === '__uncategorized__' ? <Inbox className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                        Module Node {idx + 1}
                      </span>
                      <h3 className="text-base font-semibold text-ink">{mod.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-canvas-soft text-xs font-mono text-ink-muted">
                        {completedCount}/{modVideos.length} Completed
                      </span>
                      <button
                        onClick={() => onSelectCourse(selectedCourse.id)}
                        disabled={!isUnlocked}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isUnlocked
                            ? 'bg-brand-orange text-white hover:bg-brand-orange-active'
                            : 'bg-canvas-strong text-ink-muted cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" /> {isCompleted ? 'Review Module' : 'Study Module'}
                      </button>
                    </div>
                  </div>

                  {mod.description && <p className="text-xs text-ink-body">{mod.description}</p>}

                  {/* Sub-node Video Pills */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {modVideos.map((vid: Video, vIdx: number) => (
                      <div
                        key={vid.id}
                        onClick={() => onSelectCourse(selectedCourse.id, vid.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 font-mono cursor-pointer transition-colors hover:border-brand-orange ${
                          vid.isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'bg-canvas-soft border-hairline text-ink'
                        }`}
                      >
                        <span>Step {idx + 1}.{vIdx + 1}: {vid.title}</span>
                        {vid.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    ))}
                    {modVideos.length === 0 && (
                      <p className="text-xs text-ink-muted italic">No videos in this module yet.</p>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
