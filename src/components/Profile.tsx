import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Save, 
  Edit3,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { authService, type AuthUser } from '../services/supabase';
import { getSupabase } from '../services/supabase';
import type { Course, GamificationState, UserProgress } from '../types';

interface ProfileProps {
  courses: Course[];
  gamification: GamificationState;
  progress: UserProgress;
  onNavigate: (tab: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  courses,
  gamification,
  progress,
  onNavigate,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return authService.subscribe((u) => {
      setUser(u);
      if (u) {
        setName(u.name);
        // Fetch bio from profile table
        fetchProfileBio(u.id);
      }
    });
  }, []);

  const fetchProfileBio = async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('bio, avatar_url')
        .eq('id', userId)
        .single();
      
      if (data) {
        setBio(data.bio || '');
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.warn('Profile details fetch failed. Ensure migration is run in Supabase SQL editor:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const supabase = getSupabase();
      
      // Update custom profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          name: name,
          bio: bio,
          avatar_url: avatarUrl || user.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // Update Supabase auth metadata as well
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl || user.avatarUrl,
        }
      });

      if (authErr) throw authErr;

      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile. Ensure SQL migrations are run.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onNavigate('dashboard');
  };

  const completedCourses = courses.filter(c => 
    c.videos.length > 0 && c.videos.every(v => v.isCompleted)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-normal text-ink flex items-center gap-2.5">
            <UserIcon className="w-6 h-6 text-brand-orange" /> User Profile
          </h1>
          <p className="text-xs text-ink-muted">View your learning achievements and manage settings.</p>
        </div>
      </div>

      {user ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column - Card */}
          <div className="md:col-span-4 space-y-6">
            <div className="card-hairline p-6 text-center space-y-4 flex flex-col items-center">
              <img
                src={avatarUrl || user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full border border-hairline object-cover"
              />
              <div>
                <h2 className="text-lg font-semibold text-ink">{name || user.name}</h2>
                <p className="text-xs text-brand-orange font-mono font-semibold">Level {gamification.level} Learner</p>
              </div>

              {bio && <p className="text-xs text-ink-body italic px-2">{bio}</p>}

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{gamification.streakDays} Day Streak</span>
              </div>

              <div className="w-full pt-4 border-t border-hairline flex flex-col gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 rounded-md border border-hairline-strong text-xs font-semibold text-ink hover:bg-canvas-soft hover:border-ink transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full py-2 rounded-md border border-hairline text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full py-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="card-hairline p-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-orange" /> Stats Overview
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">XP Points:</span>
                  <span className="text-ink font-semibold">{gamification.xp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Hours Studied:</span>
                  <span className="text-ink font-semibold">{progress.totalHoursStudied}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Videos Completed:</span>
                  <span className="text-ink font-semibold">{progress.videosCompletedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Completed Courses:</span>
                  <span className="text-ink font-semibold">{completedCourses.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Editor or Course View */}
          <div className="md:col-span-8 space-y-6">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="card-hairline p-6 space-y-4">
                <h3 className="text-sm font-semibold text-ink">Edit Profile Details</h3>

                {error && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-mono">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 font-mono">
                    {message}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">Avatar Image URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your learning goals..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-active text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Account Details Box */}
                <div className="card-hairline p-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-orange" /> Account Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-canvas-soft border border-hairline rounded-md space-y-1">
                      <span className="text-[10px] text-ink-muted uppercase">Email Address</span>
                      <p className="text-ink truncate font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-brand-orange" /> {user.email}
                      </p>
                    </div>

                    <div className="p-3 bg-canvas-soft border border-hairline rounded-md space-y-1">
                      <span className="text-[10px] text-ink-muted uppercase">Auth Provider</span>
                      <p className="text-ink font-semibold uppercase">
                        {user.provider}
                      </p>
                    </div>
                  </div>
                </div>

                {/* My Active Roadmaps */}
                <div className="card-hairline p-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-orange" /> Active Roadmaps ({courses.length})
                  </h3>

                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div 
                        key={course.id}
                        onClick={() => onNavigate('dashboard')}
                        className="flex items-center justify-between p-3 rounded-lg border border-hairline hover:border-brand-orange bg-canvas-soft/60 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{course.title}</p>
                          <p className="text-[10px] text-ink-muted font-mono">{course.videos.length} videos • {course.category}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-muted" />
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <p className="text-xs text-ink-muted italic text-center py-4">No active courses yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card-hairline p-12 text-center space-y-4 max-w-md mx-auto">
          <UserIcon className="w-12 h-12 text-ink-muted mx-auto" />
          <h2 className="text-lg font-semibold text-ink">Sign In to view Profile</h2>
          <p className="text-xs text-ink-muted">To manage your display name, view learning achievements, and track active learning roadmaps, please authenticate.</p>
        </div>
      )}
    </div>
  );
};
