import React from 'react';
import { Users, Construction, Sparkles } from 'lucide-react';
import type { Course } from '../types';

interface CommunityHubProps {
  onDuplicateCourse: (course: Course) => void;
  onNavigate: (tab: string) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = () => {
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
            Community Marketplace & Public Roadmaps
          </h1>
          <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
            We're building a global space where creators and learners can publish their custom course roadmaps, rate content, and duplicate public courses with 1 click.
          </p>
        </div>

        <div className="pt-4 border-t border-hairline w-full max-w-sm flex items-center justify-center gap-2 text-xs font-mono text-ink-muted">
          <Users className="w-4 h-4 text-brand-orange" /> Coming Soon to CourseForge
        </div>
      </div>
    </div>
  );
};
