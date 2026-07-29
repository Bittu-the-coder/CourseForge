import React, { useState, useEffect } from 'react';
import type { Course, Note, Bookmark, GamificationState, UserProgress, UserSettings } from '../types';
import { 
  getLocalCourses, saveLocalCourses, 
  getLocalNotes, saveLocalNotes, 
  getLocalBookmarks, saveLocalBookmarks,
  getLocalGamification, saveLocalGamification,
  getLocalProgress, saveLocalProgress,
  getLocalSettings, saveLocalSettings
} from '../services/storage';
import { authService, type AuthUser } from '../services/supabase';
import * as api from '../services/api';

import { Navbar } from './Navbar';
import { Dashboard } from './Dashboard';
import { CourseBuilder } from './CourseBuilder';
import { CourseWorkspace } from './CourseWorkspace';
import { VisualRoadmap } from './VisualRoadmap';
import { RevisionMode } from './RevisionMode';
import { LearningPlanner } from './LearningPlanner';
import { CommunityHub } from './CommunityHub';
import { GlobalSearch } from './GlobalSearch';
import { Settings } from './Settings';
import { Profile } from './Profile';

export const AppHub: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(() => getLocalGamification());
  const [progress, setProgress] = useState<UserProgress>(() => getLocalProgress());
  const [settings, setSettings] = useState<UserSettings>(() => getLocalSettings());

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // 1. Subscribe to Auth Change
  useEffect(() => {
    return authService.subscribe((u) => {
      setUser(u);
    });
  }, []);

  // 2. Fetch/hydrate data depending on logged-in state
  useEffect(() => {
    async function loadData() {
      const localCourses = getLocalCourses();
      const localNotes = getLocalNotes();
      const localBookmarks = getLocalBookmarks();

      if (user) {
        // Authenticated user: load user's own courses from Supabase & merge local storage cache
        try {
          const myCourses = await api.fetchMyCourses();
          const myNotes = await api.fetchMyNotes();
          const myBookmarks = await api.fetchMyBookmarks();
          
          // Deduplicate courses
          const courseMap = new Map<string, Course>();
          myCourses.forEach((c) => courseMap.set(c.id, c));
          localCourses.forEach((c) => {
            if (!courseMap.has(c.id)) courseMap.set(c.id, c);
          });
          const mergedCourses = Array.from(courseMap.values());

          // Deduplicate notes
          const noteMap = new Map<string, Note>();
          myNotes.forEach((n) => noteMap.set(n.id, n));
          localNotes.forEach((n) => {
            if (!noteMap.has(n.id)) noteMap.set(n.id, n);
          });
          const mergedNotes = Array.from(noteMap.values());

          // Deduplicate bookmarks
          const bookmarkMap = new Map<string, Bookmark>();
          myBookmarks.forEach((b) => bookmarkMap.set(b.id, b));
          localBookmarks.forEach((b) => {
            if (!bookmarkMap.has(b.id)) bookmarkMap.set(b.id, b);
          });
          const mergedBookmarks = Array.from(bookmarkMap.values());

          setCourses(mergedCourses);
          setNotes(mergedNotes);
          setBookmarks(mergedBookmarks);
        } catch (err) {
          console.warn('Failed to load data from Supabase:', err);
          setCourses(localCourses);
          setNotes(localNotes);
          setBookmarks(localBookmarks);
        }
      } else {
        // Unauthenticated guest user: load default sample courses
        setCourses(localCourses);
        setNotes(localNotes);
        setBookmarks(localBookmarks);
      }
    }

    loadData();
  }, [user]);

  // Initial settings load
  useEffect(() => {
    const localSettings = getLocalSettings();
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('theme')) {
      localSettings.darkMode = true;
      saveLocalSettings(localSettings);
    }
    setSettings(localSettings);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for data updates
  const handleSaveCourse = async (newCourse: Course) => {
    let savedCourse = newCourse;

    if (user) {
      try {
        const saved = await api.createCourse(newCourse);
        if (saved) {
          savedCourse = saved;
        }
      } catch (err) {
        console.warn("Supabase course creation error, saving to local state:", err);
      }
    }

    const updated = [savedCourse, ...courses];
    setCourses(updated);
    if (!user) saveLocalCourses(updated);

    handleGrantXP(100);
    setActiveCourseId(savedCourse.id);
    setCurrentTab('workspace');
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    const updated = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
    setCourses(updated);
    saveLocalCourses(updated);

    if (user) {
      try {
        await api.updateCourse(updatedCourse);
        for (const vid of updatedCourse.videos) {
          api.saveVideoProgress(updatedCourse.id, vid.id, !!vid.isCompleted);
        }
      } catch (err) {
        console.warn('Supabase update course warning:', err);
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    saveLocalCourses(updated);

    if (user) {
      try {
        await api.deleteCourse(courseId);
      } catch (err) {
        console.warn('Supabase delete course warning:', err);
      }
    }

    if (activeCourseId === courseId) {
      setActiveCourseId(updated[0]?.id || null);
      if (updated.length === 0) {
        setCurrentTab('dashboard');
      }
    }
  };

  const handleAddNote = async (newNote: Note) => {
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveLocalNotes(updated);

    if (user) {
      try {
        await api.createNote(newNote);
      } catch (err) {
        console.warn('Supabase create note warning:', err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveLocalNotes(updated);

    if (user) {
      try {
        await api.deleteNote(noteId);
      } catch (err) {
        console.warn('Supabase delete note warning:', err);
      }
    }
  };

  const handleAddBookmark = async (newBm: Bookmark) => {
    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    saveLocalBookmarks(updated);

    if (user) {
      try {
        await api.createBookmark(newBm);
      } catch (err) {
        console.warn('Supabase create bookmark warning:', err);
      }
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    const updated = bookmarks.filter((b) => b.id !== bookmarkId);
    setBookmarks(updated);
    saveLocalBookmarks(updated);

    if (user) {
      try {
        await api.deleteBookmark(bookmarkId);
      } catch (err) {
        console.warn('Supabase delete bookmark warning:', err);
      }
    }
  };

  const handleGrantXP = async (amount: number) => {
    if (user) {
      await api.grantXP(amount);
    }
    
    setGamification((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 200) + 1;
      const updated = { ...prev, xp: newXP, level: newLevel };
      saveLocalGamification(updated);
      return updated;
    });
  };

  // Synchronize dark mode class with settings state
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [settings.darkMode]);

  const handleToggleDarkMode = () => {
    const nextDark = !settings.darkMode;
    const updated = { ...settings, darkMode: nextDark };
    setSettings(updated);
    saveLocalSettings(updated);
  };

  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(undefined);

  const handleSelectCourse = (courseId: string, videoId?: string) => {
    setActiveCourseId(courseId);
    setSelectedVideoId(videoId);
    setCurrentTab('workspace');
  };

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink dark:bg-canvas dark:text-canvas pb-0">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        gamification={gamification}
        settings={settings}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            courses={courses}
            notes={notes}
            gamification={gamification}
            progress={progress}
            onSelectCourse={handleSelectCourse}
            onDeleteCourse={handleDeleteCourse}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'builder' && (
          <CourseBuilder
            onSaveCourse={handleSaveCourse}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'workspace' && activeCourse && (
          <CourseWorkspace
            key={`${activeCourse.id}-${selectedVideoId || 'default'}`}
            course={activeCourse}
            notes={notes}
            initialVideoId={selectedVideoId}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onGrantXP={handleGrantXP}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'roadmap' && (
          <VisualRoadmap
            courses={courses}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {currentTab === 'revision' && (
          <RevisionMode
            courses={courses}
            notes={notes}
            bookmarks={bookmarks}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {currentTab === 'planner' && (
          <LearningPlanner
            courses={courses}
            progress={progress}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'community' && (
          <CommunityHub
            onDuplicateCourse={handleSaveCourse}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'profile' && (
          <Profile
            courses={courses}
            gamification={gamification}
            progress={progress}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'settings' && (
          <Settings
            settings={settings}
            courses={courses}
            onUpdateSettings={(s) => {
              setSettings(s);
              saveLocalSettings(s);
            }}
            onImportBackup={(jsonStr) => {
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.courses) {
                  setCourses(parsed.courses);
                  saveLocalCourses(parsed.courses);
                }
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}
      </main>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        courses={courses}
        notes={notes}
        bookmarks={bookmarks}
        onSelectCourse={handleSelectCourse}
      />

      {/* Footer */}
      <footer className="border-t border-hairline dark:border-hairline/20 py-8 px-4 text-center text-xs text-ink-muted space-y-2 mt-12">
        <p className="font-mono">CourseForge — Turn YouTube into a structured university.</p>
        <p className="text-[11px]">Built with Astro.js, React & Tailwind CSS • Offline-First Architecture</p>
      </footer>
    </div>
  );
};
