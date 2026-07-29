import React from 'react';
import { Calendar, Construction, Sparkles } from 'lucide-react';
import type { Course, UserProgress } from '../types';

interface LearningPlannerProps {
  courses: Course[];
  progress: UserProgress;
  onNavigate: (tab: string) => void;
}

export const LearningPlanner: React.FC<LearningPlannerProps> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in">
      <div className="card-hairline p-10 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20">
          <Construction className="w-10 h-10 text-brand-orange" />
        </div>

        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Under Active Development
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink">
            Smart Study Schedule & Target Planner
          </h1>
          <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
            AI-driven study pace recommendations, deadline tracking, and automated daily video targets are currently under active development.
          </p>
        </div>

        <div className="pt-4 border-t border-hairline w-full max-w-sm flex items-center justify-center gap-2 text-xs font-mono text-ink-muted">
          <Calendar className="w-4 h-4 text-brand-orange" /> Coming Soon to CourseForge
        </div>
      </div>
    </div>
  );
};
