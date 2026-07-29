export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnailUrl: string;
  channelName: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  lastWatchedPosition?: number; // in seconds
  order: number;
  moduleId?: string; // optional — null means "uncategorized"
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface Note {
  id: string;
  courseId: string;
  videoId?: string;
  timestamp?: number; // in seconds
  timestampFormatted?: string;
  title: string;
  content: string; // Markdown / rich text
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface Bookmark {
  id: string;
  courseId: string;
  videoId: string;
  videoTitle: string;
  timestamp: number;
  timestampFormatted: string;
  label: string;
  note?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  category: string;
  tags: string[];
  videos: Video[];
  modules: Module[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  targetDays?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  isPublic?: boolean;
  shareId?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  followersCount?: number;
  rating?: number;
}

export interface UserProgress {
  totalHoursStudied: number;
  videosCompletedCount: number;
  coursesCompletedCount: number;
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyHistory: Record<string, number>; // date string -> seconds studied
}

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastStreakDate: string;
  unlockedBadges: Badge[];
  weeklyGoalMinutes: number;
  weeklyMinutesStudied: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'streak' | 'completion' | 'notes' | 'creation';
}

export interface UserSettings {
  darkMode: boolean;
  themeColor: 'orange' | 'cyan' | 'emerald' | 'purple';
  defaultPlaybackSpeed: number;
  autoAdvanceNextVideo: boolean;
  dailyGoalMinutes: number;
  syncWithSupabase: boolean;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  courseId: string;
  moduleId?: string;
  videoId?: string;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  questions: QuizQuestion[];
}

export interface CommunityTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  downloadsCount: number;
  followersCount: number;
  videosCount: number;
  courseData: Course;
}
