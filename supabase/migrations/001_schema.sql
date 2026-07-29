-- CourseForge Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. Courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  channel_name TEXT DEFAULT '',
  category TEXT DEFAULT 'Development',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  target_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_opened_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. Modules (optional grouping, user creates these manually)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. Videos (flat list per course, optionally assigned to a module)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  duration_formatted TEXT DEFAULT '0:00',
  thumbnail_url TEXT DEFAULT '',
  channel_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. User Video Progress (per-user completion tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_watched_position INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- ============================================================================
-- 6. Notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  "timestamp" INTEGER,
  timestamp_formatted TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. Bookmarks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  video_title TEXT DEFAULT '',
  "timestamp" INTEGER NOT NULL DEFAULT 0,
  timestamp_formatted TEXT DEFAULT '',
  label TEXT DEFAULT '',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. Course Followers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================================================
-- 9. Course Ratings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================================================
-- 10. User Progress / Gamification (single row per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_streak_date DATE,
  weekly_goal_minutes INTEGER DEFAULT 180,
  weekly_minutes_studied INTEGER DEFAULT 0,
  total_hours_studied NUMERIC(10,2) DEFAULT 0,
  videos_completed_count INTEGER DEFAULT 0,
  courses_completed_count INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses: anyone reads public, owners read/write own
CREATE POLICY "Public courses are viewable" ON public.courses FOR SELECT USING (is_public = true OR author_id = auth.uid());
CREATE POLICY "Users can create courses" ON public.courses FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE USING (author_id = auth.uid());

-- Modules: same access as parent course
CREATE POLICY "Modules viewable with course" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND (courses.is_public = true OR courses.author_id = auth.uid()))
);
CREATE POLICY "Users can manage own modules" ON public.modules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.author_id = auth.uid())
);
CREATE POLICY "Users can update own modules" ON public.modules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.author_id = auth.uid())
);
CREATE POLICY "Users can delete own modules" ON public.modules FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.author_id = auth.uid())
);

-- Videos: same access as parent course
CREATE POLICY "Videos viewable with course" ON public.videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = videos.course_id AND (courses.is_public = true OR courses.author_id = auth.uid()))
);
CREATE POLICY "Users can manage own videos" ON public.videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = videos.course_id AND courses.author_id = auth.uid())
);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = videos.course_id AND courses.author_id = auth.uid())
);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = videos.course_id AND courses.author_id = auth.uid())
);

-- User progress: only own
CREATE POLICY "Users can view own progress" ON public.user_video_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON public.user_video_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.user_video_progress FOR UPDATE USING (user_id = auth.uid());

-- Notes: only own
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create notes" ON public.notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (user_id = auth.uid());

-- Bookmarks: only own
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (user_id = auth.uid());

-- Followers: users manage own, anyone can count
CREATE POLICY "Anyone can view followers" ON public.course_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.course_followers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.course_followers FOR DELETE USING (user_id = auth.uid());

-- Ratings: anyone reads, own writes
CREATE POLICY "Anyone can view ratings" ON public.course_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate" ON public.course_ratings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own rating" ON public.course_ratings FOR UPDATE USING (user_id = auth.uid());

-- User stats: only own
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_author ON public.courses(author_id);
CREATE INDEX IF NOT EXISTS idx_courses_public ON public.courses(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_videos_course ON public.videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_module ON public.videos(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_course ON public.notes(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_course ON public.bookmarks(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_course ON public.course_followers(course_id);
CREATE INDEX IF NOT EXISTS idx_ratings_course ON public.course_ratings(course_id);
